import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionFinalizeInput,
  type AppCompetitionTranscriptResponse,
  COMPETITION_QUESTION_COUNT,
} from "@mentis/contracts/app";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { DrawnQuestion } from "../../catalog/repositories/catalog.repository";
import { CatalogService } from "../../catalog/services/catalog.service";
import {
  toAppCompetitionActiveAttemptResponse,
  toAppCompetitionAttemptResponse,
  toAppCompetitionTranscriptResponse,
} from "../mappers/competition.mapper";
import { CompetitionRepository } from "../repositories/competition.repository";
import { CLOCK, type Clock } from "./clock";
import { competitionDay, daysBefore } from "./competition-day";
import { attemptScore, judgeAttempt, unresolvedAnswer } from "./judge-attempt";

const ROTATION_LOOKBACK_DAYS = 2;

type DrawnTheme = { id: string; name: string };

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
      return toAppCompetitionAttemptResponse(issued, questions);
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
    return toAppCompetitionActiveAttemptResponse({
      attempt: current,
      questions: await this.servedQuestions(current),
    });
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

    const questions = await this.servedQuestions(attempt);
    const answers = judgeAttempt(attempt.id, questions, batch);
    const finalized = await this.competitionRepository.finalize(attempt.id, {
      // Positions the batch never reached are the Attempt the Player walked out of.
      reason: batch.answers.length === COMPETITION_QUESTION_COUNT ? "completed" : "quit",
      score: attemptScore(answers),
      answers,
    });
    if (finalized === null) {
      // Another device's finalize landed first, and the transcript it stored is the one that counts.
      const stored = await this.ownedAttempt(attemptId, owner);
      this.refuseExpired(stored);
      return this.storedTranscript(stored);
    }
    return toAppCompetitionTranscriptResponse(finalized, answers, questions);
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
    const answers = attempt.questionIds.map((questionId, position) =>
      unresolvedAnswer(attempt.id, position, questionId),
    );
    await this.competitionRepository.finalize(attempt.id, {
      reason: "expired",
      score: attemptScore(answers),
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
    const [questions, answers] = await Promise.all([
      this.servedQuestions(attempt),
      this.competitionRepository.findAnswers(attempt.id),
    ]);
    return toAppCompetitionTranscriptResponse(attempt, answers, questions);
  }

  private async serveExistingAttempt(
    attempt: CompetitionAttemptEntity,
  ): Promise<AppCompetitionAttemptResponse> {
    return toAppCompetitionAttemptResponse(attempt, await this.servedQuestions(attempt));
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
      .map(({ id, name }) => ({ id, name }));
  }
}
