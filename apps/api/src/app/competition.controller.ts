import { squareChoices } from "@mentis/answer-matching";
import {
  type AppCompetitionAttemptResponse,
  appCompetitionAttemptResponseSchema,
  COMPETITION_QUESTION_COUNT,
} from "@mentis/contracts/app";
import { Controller, HttpCode, HttpStatus, Inject, Post, Req, UseGuards } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type AuthedRequest, SupabaseUserGuard } from "../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../common/rate-limit.guard";
import { SUPABASE } from "../supabase";
import { competitionDay, daysBefore } from "./competition-day";
import { seededRng } from "./seeded-rng";
import { readThemesWithCounts } from "./theme-counts";

const ATTEMPT_SELECT =
  "id, day, kind, status, themeId:theme_id, themeName:theme_name, questionIds:question_ids";
const ROTATION_SELECT = "themeId:theme_id";
const SERVED_QUESTION_SELECT = "id, text, answer, wrongChoices:wrong_choices";

const ROTATION_LOOKBACK_DAYS = 2;

const UNIQUE_VIOLATION = "23505";

type AttemptRow = {
  id: string;
  day: string;
  kind: "initial" | "replay" | "catchup";
  status: "active" | "finalized";
  themeId: string;
  themeName: string;
  questionIds: string[];
};

type DrawnTheme = { id: string; name: string };

type ServedQuestion = { id: string; text: string; answer: string; wrongChoices: string[] };

@Controller("app/me/competition")
@UseGuards(SupabaseUserGuard, AuthenticatedThrottlerGuard)
export class CompetitionController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  // A Competition Day holds one initial Attempt, so asking twice reads the first back — never a 201.
  @Post("attempts")
  @HttpCode(HttpStatus.OK)
  async issueInitialAttempt(@Req() request: AuthedRequest): Promise<AppCompetitionAttemptResponse> {
    const owner = request.user.id;
    const day = competitionDay(new Date());
    const existing = await this.findInitialAttempt(owner, day);
    if (existing !== null) {
      return this.serveExistingAttempt(existing);
    }

    const theme = await this.drawTheme(owner, day);
    const questions = await this.drawQuestions(theme.id);
    const issued = await this.insertAttempt(owner, day, theme, questions);
    if (issued !== null) {
      return this.toAttemptResponse(issued, questions);
    }

    // Two devices asked at once: the insert that lost the unique constraint serves the winner's draw.
    const winner = await this.findInitialAttempt(owner, day);
    if (winner === null) {
      throw new Error("competition attempt disappeared after a unique violation");
    }
    return this.serveExistingAttempt(winner);
  }

  private toAttemptResponse(
    attempt: AttemptRow,
    questions: ServedQuestion[],
  ): AppCompetitionAttemptResponse {
    // Parsing through the contract is what keeps the answer material off the wire.
    return appCompetitionAttemptResponseSchema.parse({
      id: attempt.id,
      day: attempt.day,
      kind: attempt.kind,
      status: attempt.status,
      themeId: attempt.themeId,
      themeName: attempt.themeName,
      questions: questions.map((question) => ({
        id: question.id,
        text: question.text,
        squareChoices: squareChoices(question, seededRng(`${attempt.id}:${question.id}`)),
      })),
    });
  }

  private async serveExistingAttempt(attempt: AttemptRow): Promise<AppCompetitionAttemptResponse> {
    const { data, error } = await this.supabase
      .from("questions")
      .select(SERVED_QUESTION_SELECT)
      .in("id", attempt.questionIds);
    if (error) {
      throw new Error(`served question read failed: ${error.message}`);
    }
    const served = new Map((data as ServedQuestion[]).map((question) => [question.id, question]));
    // An Attempt is fixed at issuance, so the stored ids replay it in the order it was served.
    return this.toAttemptResponse(
      attempt,
      attempt.questionIds.map((id) => {
        const question = served.get(id);
        if (question === undefined) {
          throw new Error(`attempt ${attempt.id} lost its served question ${id}`);
        }
        return question;
      }),
    );
  }

  private async findInitialAttempt(owner: string, day: string): Promise<AttemptRow | null> {
    const { data, error } = await this.supabase
      .from("competition_attempts")
      .select(ATTEMPT_SELECT)
      .eq("owner", owner)
      .eq("day", day)
      .eq("kind", "initial")
      .maybeSingle();
    if (error) {
      throw new Error(`competition attempt read failed: ${error.message}`);
    }
    return (data as AttemptRow | null) ?? null;
  }

  private async drawTheme(owner: string, day: string): Promise<DrawnTheme> {
    const [eligible, played] = await Promise.all([
      this.eligibleThemes(),
      this.recentThemeIds(owner, day),
    ]);
    const rotated = eligible.filter((theme) => !played.has(theme.id));
    // A Theme pool no larger than the rotation window would otherwise leave the Player nothing.
    const pool = rotated.length > 0 ? rotated : eligible;
    const drawn = pool[Math.floor(Math.random() * pool.length)];
    if (drawn === undefined) {
      throw new Error("no Theme holds enough Questions for a competition draw");
    }
    return drawn;
  }

  private async eligibleThemes(): Promise<DrawnTheme[]> {
    const themes = await readThemesWithCounts(this.supabase);
    return themes
      .filter((theme) => theme.questionCount >= COMPETITION_QUESTION_COUNT)
      .map(({ id, name }) => ({ id, name }));
  }

  private async recentThemeIds(owner: string, day: string): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from("competition_attempts")
      .select(ROTATION_SELECT)
      .eq("owner", owner)
      .gte("day", daysBefore(day, ROTATION_LOOKBACK_DAYS))
      .lte("day", day);
    if (error) {
      throw new Error(`theme rotation read failed: ${error.message}`);
    }
    return new Set((data as { themeId: string }[]).map((row) => row.themeId));
  }

  private async drawQuestions(themeId: string): Promise<ServedQuestion[]> {
    const { data, error } = await this.supabase
      .rpc("get_random_questions", { theme_slug: themeId, n: COMPETITION_QUESTION_COUNT })
      .select(SERVED_QUESTION_SELECT);
    if (error) {
      throw new Error(`competition question draw failed: ${error.message}`);
    }
    return (data ?? []) as ServedQuestion[];
  }

  private async insertAttempt(
    owner: string,
    day: string,
    theme: DrawnTheme,
    questions: ServedQuestion[],
  ): Promise<AttemptRow | null> {
    const { data, error } = await this.supabase
      .from("competition_attempts")
      .insert({
        owner,
        day,
        kind: "initial",
        theme_id: theme.id,
        theme_name: theme.name,
        question_ids: questions.map((question) => question.id),
      })
      .select(ATTEMPT_SELECT)
      .single();
    if (error === null) {
      return data as AttemptRow;
    }
    if (error.code === UNIQUE_VIOLATION) {
      return null;
    }
    throw new Error(`competition attempt insert failed: ${error.message}`);
  }
}
