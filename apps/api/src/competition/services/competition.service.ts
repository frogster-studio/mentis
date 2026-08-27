import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionFinalizeInput,
  type AppCompetitionStandingResponse,
  type AppCompetitionTranscriptResponse,
  COMPETITION_QUESTION_COUNT,
} from "@mentis/contracts/app";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { DrawnQuestion } from "../../catalog/repositories/catalog.repository";
import { CatalogService } from "../../catalog/services/catalog.service";
import type { ThemeVisuals } from "../../catalog/types/theme-visuals";
import {
  toAppCompetitionActiveAttemptResponse,
  toAppCompetitionAttemptResponse,
  toAppCompetitionStandingResponse,
  toAppCompetitionTranscriptResponse,
} from "../mappers/competition.mapper";
import { CompetitionRepository } from "../repositories/competition.repository";
import type { Clock } from "../types/clock";
import type { DrawnTheme } from "../types/drawn-theme";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";
import type { ServedAttempt } from "../types/served-attempt";
import { CLOCK } from "../utils/clock";
import {
  bestScorePerDay,
  competitionDay,
  daysBefore,
  seasonBounds,
} from "../utils/competition-day";
import { judgeAttempt } from "../utils/judge-attempt";

const ROTATION_LOOKBACK_DAYS = 2;

@Injectable()
export class CompetitionService {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly catalogService: CatalogService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async issueInitialAttempt(owner: string): Promise<AppCompetitionAttemptResponse> {
    const day = this.today();
    await this.attemptsStillInPlay(owner, day);
    const existing = await this.competitionRepository.findAttempt(owner, day, "initial");
    if (existing !== null) {
      return this.serveExistingAttempt(existing);
    }

    const theme = await this.drawTheme(owner, day);
    const questions = await this.catalogService.drawFromTheme(theme.id, COMPETITION_QUESTION_COUNT);
    const issued = await this.competitionRepository.issue({
      owner,
      day,
      kind: "initial",
      themeId: theme.id,
      themeName: theme.name,
      questionIds: questions.map((question) => question.id),
    });
    if (issued !== null) {
      return toAppCompetitionAttemptResponse({ attempt: issued, theme, questions });
    }

    // Two devices asked at once: the insert the day's Attempt shut out serves the winner's draw.
    const winner = await this.competitionRepository.findAttempt(owner, day, "initial");
    if (winner === null) {
      throw new Error("competition attempt disappeared after a lost issuance race");
    }
    return this.serveExistingAttempt(winner);
  }

  async readActiveAttempt(owner: string): Promise<AppCompetitionActiveAttemptResponse> {
    const [current] = await this.attemptsStillInPlay(owner, this.today());
    if (current === undefined) {
      return toAppCompetitionActiveAttemptResponse(null);
    }
    return toAppCompetitionActiveAttemptResponse(await this.servedAttempt(current));
  }

  async finalizeAttempt(
    owner: string,
    attemptId: string,
    batch: AppCompetitionFinalizeInput,
  ): Promise<AppCompetitionTranscriptResponse> {
    await this.attemptsStillInPlay(owner, this.today());
    const attempt = await this.ownedAttempt(attemptId, owner);
    this.refuseExpired(attempt);
    if (attempt.status === "finalized") {
      return this.storedTranscript(attempt);
    }

    const served = await this.servedAttempt(attempt);
    const answers = judgeAttempt(attempt.id, served.questions, batch);
    const finalized = await this.competitionRepository.finalize(attempt.id, {
      // Positions the batch never reached are the Attempt the Player walked out of.
      reason: batch.answers.length === COMPETITION_QUESTION_COUNT ? "completed" : "quit",
      score: answers.reduce((total, answer) => total + answer.points, 0),
      answers,
    });
    if (finalized === null) {
      // Another device's finalize landed first, and the transcript it stored is the one that counts.
      const stored = await this.ownedAttempt(attemptId, owner);
      this.refuseExpired(stored);
      return this.storedTranscript(stored);
    }
    return toAppCompetitionTranscriptResponse({ ...served, attempt: finalized }, answers);
  }

  async readStanding(owner: string): Promise<AppCompetitionStandingResponse> {
    const today = this.today();

    await this.attemptsStillInPlay(owner, today);

    const { season, from, to } = seasonBounds(today);
    const scores = await this.competitionRepository.findFinalizedDayScores(owner, from, to);

    const days = bestScorePerDay(scores);

    return toAppCompetitionStandingResponse(
      season,
      days.reduce((total, day) => total + day.score, 0),
      days,
    );
  }

  private today(): string {
    return competitionDay(this.clock());
  }

  // No sweep and no cron: a Player's dead days are buried wherever they next touch Competition.
  private async attemptsStillInPlay(
    owner: string,
    day: string,
  ): Promise<CompetitionAttemptEntity[]> {
    const active = await this.competitionRepository.findActiveAttempts(owner);
    await Promise.all(
      active.filter((attempt) => attempt.day < day).map((attempt) => this.zeroFinalize(attempt)),
    );
    return active.filter((attempt) => attempt.day >= day);
  }

  // Zeros need no answer material, so a Question the Catalog dropped can never block a burial.
  private async zeroFinalize(attempt: CompetitionAttemptEntity): Promise<void> {
    const answers = attempt.questionIds.map(
      (questionId, position): NewCompetitionAnswer => ({
        attemptId: attempt.id,
        position,
        questionId,
        mode: QuizAnswerModeEnum.NONE,
        rawInput: null,
        correct: false,
        points: 0,
        matchedVia: null,
        clientElapsedMs: null,
      }),
    );
    await this.competitionRepository.finalize(attempt.id, {
      reason: "expired",
      score: 0,
      answers,
    });
  }

  // The zeros a dead day stored are final: a late batch is refused, never allowed to overwrite them.
  private refuseExpired(attempt: CompetitionAttemptEntity): void {
    if (attempt.finalizeReason === "expired") {
      throw new ConflictException({
        code: "ATTEMPT_EXPIRED",
        message: `Attempt ${attempt.id} died with its Competition Day`,
      });
    }
  }

  private async ownedAttempt(attemptId: string, owner: string): Promise<CompetitionAttemptEntity> {
    const attempt = await this.competitionRepository.findOwnedAttempt(attemptId, owner);
    if (attempt === null) {
      throw new NotFoundException({ message: `Unknown attempt: ${attemptId}` });
    }
    return attempt;
  }

  private async storedTranscript(
    attempt: CompetitionAttemptEntity,
  ): Promise<AppCompetitionTranscriptResponse> {
    const [served, answers] = await Promise.all([
      this.servedAttempt(attempt),
      this.competitionRepository.findAnswers(attempt.id),
    ]);
    return toAppCompetitionTranscriptResponse(served, answers);
  }

  private async serveExistingAttempt(
    attempt: CompetitionAttemptEntity,
  ): Promise<AppCompetitionAttemptResponse> {
    return toAppCompetitionAttemptResponse(await this.servedAttempt(attempt));
  }

  private async servedAttempt(
    attempt: CompetitionAttemptEntity,
  ): Promise<ServedAttempt & { questions: DrawnQuestion[] }> {
    const [theme, questions] = await Promise.all([
      this.themeVisuals(attempt),
      this.servedQuestions(attempt),
    ]);
    return { attempt, theme, questions };
  }

  private async themeVisuals(attempt: CompetitionAttemptEntity): Promise<ThemeVisuals> {
    const theme = await this.catalogService.themeVisuals(attempt.themeId);
    if (theme === null) {
      throw new Error(`attempt ${attempt.id} lost its drawn theme ${attempt.themeId}`);
    }
    return theme;
  }

  // An Attempt is fixed at issuance, so the stored ids replay it in the order it was served.
  private async servedQuestions(attempt: CompetitionAttemptEntity): Promise<DrawnQuestion[]> {
    const drawn = await this.catalogService.questionsByIds(attempt.questionIds);
    const served = new Map(drawn.map((question) => [question.id, question]));
    return attempt.questionIds.map((id) => {
      const question = served.get(id);
      if (question === undefined) {
        throw new Error(`attempt ${attempt.id} lost its served question ${id}`);
      }
      return question;
    });
  }

  private async drawTheme(owner: string, day: string): Promise<DrawnTheme> {
    const [eligible, played] = await Promise.all([
      this.eligibleThemes(),
      this.competitionRepository.themeIdsPlayedBetween(
        owner,
        daysBefore(day, ROTATION_LOOKBACK_DAYS),
        day,
      ),
    ]);
    const recent = new Set(played);
    const rotated = eligible.filter((theme) => !recent.has(theme.id));
    // A Theme pool no larger than the rotation window would otherwise leave the Player nothing.
    const pool = rotated.length > 0 ? rotated : eligible;
    const drawn = pool[Math.floor(Math.random() * pool.length)];
    if (drawn === undefined) {
      throw new Error("no Theme holds enough Questions for a competition draw");
    }
    return drawn;
  }

  private async eligibleThemes(): Promise<DrawnTheme[]> {
    const themes = await this.catalogService.themesWithQuestionCounts();
    return themes
      .filter((theme) => theme.questionCount >= COMPETITION_QUESTION_COUNT)
      .map(({ id, name, imageUrl, category }) => ({ id, name, imageUrl, category }));
  }
}
