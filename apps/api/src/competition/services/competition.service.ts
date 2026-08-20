import {
  type AppCompetitionAttemptResponse,
  COMPETITION_QUESTION_COUNT,
} from "@mentis/contracts/app";
import { Injectable } from "@nestjs/common";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CatalogService } from "../../catalog/services/catalog.service";
import {
  type ServedQuestion,
  toAppCompetitionAttemptResponse,
} from "../mappers/competition.mapper";
import { CompetitionRepository } from "../repositories/competition.repository";
import { competitionDay, daysBefore } from "./competition-day";

const ROTATION_LOOKBACK_DAYS = 2;

type DrawnTheme = { id: string; name: string };

@Injectable()
export class CompetitionService {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly catalogService: CatalogService,
  ) {}

  async issueInitialAttempt(owner: string): Promise<AppCompetitionAttemptResponse> {
    const day = competitionDay(new Date());
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
      return toAppCompetitionAttemptResponse(issued, questions);
    }

    // Two devices asked at once: the insert the day's Attempt shut out serves the winner's draw.
    const winner = await this.competitionRepository.findAttempt(owner, day, "initial");
    if (winner === null) {
      throw new Error("competition attempt disappeared after a lost issuance race");
    }
    return this.serveExistingAttempt(winner);
  }

  private async serveExistingAttempt(
    attempt: CompetitionAttemptEntity,
  ): Promise<AppCompetitionAttemptResponse> {
    const drawn = await this.catalogService.questionsByIds(attempt.questionIds);
    const served = new Map<string, ServedQuestion>(
      drawn.map((question) => [question.id, question]),
    );
    // An Attempt is fixed at issuance, so the stored ids replay it in the order it was served.
    return toAppCompetitionAttemptResponse(
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
      .map(({ id, name }) => ({ id, name }));
  }
}
