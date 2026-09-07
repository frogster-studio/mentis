import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionDayResponse,
  type AppCompetitionFinalizeInput,
  type AppCompetitionIssueInput,
  type AppCompetitionLeaderboardPageResponse,
  type AppCompetitionLeaderboardQuery,
  type AppCompetitionStandingResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionLeaderboardPageResponseSchema,
  appCompetitionStandingResponseSchema,
  COMPETITION_QUESTION_COUNT,
} from "@mentis/contracts/app";
import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { JWTPayload } from "jose";
import type {
  CompetitionAttemptEntity,
  CompetitionAttemptKind,
} from "../../_database/entities/competition-attempt.entity";
import type { DrawnQuestion } from "../../catalog/repositories/catalog.repository";
import { CatalogService } from "../../catalog/services/catalog.service";
import type { ThemeVisuals } from "../../catalog/types/theme-visuals";
import { ProfileService } from "../../player/services/profile.service";
import { PremiumService } from "../../premium/services/premium.service";
import {
  toAppCompetitionActiveAttemptResponse,
  toAppCompetitionAttemptResponse,
  toAppCompetitionDayResponse,
  toAppCompetitionTranscriptResponse,
} from "../mappers/competition.mapper";
import { CompetitionRepository } from "../repositories/competition.repository";
import type { Clock } from "../types/clock";
import type { DrawnTheme } from "../types/drawn-theme";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";
import type { ServedAttempt } from "../types/served-attempt";
import { CLOCK } from "../utils/clock";
import { competitionDay, daysBefore, seasonBounds, sharesSeason } from "../utils/competition-day";
import { offersCatchUp, offersReplay } from "../utils/day-offers";
import { judgeAttempt } from "../utils/judge-attempt";
import {
  leaderboardPage,
  leaderboardPageCount,
  positionFromRank,
  rankFromGreaterCount,
} from "../utils/leaderboard";

const ROTATION_LOOKBACK_DAYS = 2;

@Injectable()
export class CompetitionService {
  constructor(
    private readonly competitionRepository: CompetitionRepository,
    private readonly catalogService: CatalogService,
    private readonly premiumService: PremiumService,
    private readonly profileService: ProfileService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  // An Attempt is a future Leaderboard row, so the Account is named before it is ever drawn.
  async issueAttempt(
    owner: string,
    claims: JWTPayload,
    { kind }: AppCompetitionIssueInput,
  ): Promise<AppCompetitionAttemptResponse> {
    await this.profileService.ensureProfile(owner, claims);
    const today = this.today();
    const inPlay = await this.attemptsStillInPlay(owner, today);
    switch (kind) {
      case "initial":
        return this.issueInitialAttempt(owner, today, inPlay);
      case "replay":
        return this.issueReplay(owner, today, inPlay);
      case "catchup":
        return this.issueCatchUp(owner, today, inPlay);
    }
  }

  async readActiveAttempt(owner: string): Promise<AppCompetitionActiveAttemptResponse> {
    const [current] = await this.attemptsStillInPlay(owner, this.today());
    if (current === undefined) {
      return toAppCompetitionActiveAttemptResponse(null);
    }
    return toAppCompetitionActiveAttemptResponse(await this.servedAttempt(current));
  }

  async readDay(owner: string): Promise<AppCompetitionDayResponse> {
    const today = this.today();
    await this.attemptsStillInPlay(owner, today);
    const yesterday = daysBefore(today, 1);
    const [todays, yesterdays] = await Promise.all([
      this.competitionRepository.findAttemptsOnDay(owner, today),
      this.competitionRepository.findAttemptsOnDay(owner, yesterday),
    ]);
    return toAppCompetitionDayResponse(
      today,
      offersReplay(todays),
      offersCatchUp(yesterdays, sharesSeason(today, yesterday)),
      todays,
    );
  }

  // Premium was checked at issuance: a subscription lapsing mid-session never voids the Attempt.
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

    const { season } = seasonBounds(today);
    const { entity, greaterCount, precedingTieCount, rankedCount } =
      await this.competitionRepository.findStanding(owner, season);
    const rank = entity === null ? null : rankFromGreaterCount(greaterCount);
    return appCompetitionStandingResponseSchema.parse({
      season,
      seasonTotal: entity?.total ?? 0,
      rank,
      rankedCount,
      page: rank === null ? null : leaderboardPage(positionFromRank(rank, precedingTieCount)),
    });
  }

  // Public and Season-wide, so no Attempt is buried here: a page shows what finalizes already wrote.
  async readLeaderboardPage({
    page,
  }: AppCompetitionLeaderboardQuery): Promise<AppCompetitionLeaderboardPageResponse> {
    const { season } = seasonBounds(this.today());
    const { entries, rankedCount } = await this.competitionRepository.findLeaderboardPage(
      season,
      page,
    );
    return appCompetitionLeaderboardPageResponseSchema.parse({
      season,
      page,
      pageCount: leaderboardPageCount(rankedCount),
      entries: entries.map(({ rank, pseudo, total }) => ({ rank, pseudo, seasonTotal: total })),
    });
  }

  private async issueInitialAttempt(
    owner: string,
    day: string,
    inPlay: CompetitionAttemptEntity[],
  ): Promise<AppCompetitionAttemptResponse> {
    const existing = await this.competitionRepository.findAttempt(owner, day, "initial");
    if (existing !== null) {
      return this.serveExistingAttempt(existing);
    }
    this.refuseWhileInPlay(inPlay);
    return this.issueDrawn(owner, "initial", day, day);
  }

  // A Replay follows the day's judged initial Attempt, on a Theme the day has not seen.
  private async issueReplay(
    owner: string,
    day: string,
    inPlay: CompetitionAttemptEntity[],
  ): Promise<AppCompetitionAttemptResponse> {
    const existing = await this.competitionRepository.findAttempt(owner, day, "replay");
    if (existing !== null) {
      return this.serveExistingAttempt(existing);
    }
    const initial = await this.competitionRepository.findAttempt(owner, day, "initial");
    if (initial === null || initial.status !== "finalized") {
      throw new ConflictException({ message: "A Replay follows today's judged initial Attempt" });
    }
    this.refuseWhileInPlay(inPlay);
    await this.requirePremium(owner);
    return this.issueDrawn(owner, "replay", day, day);
  }

  // A Catch-up fills an empty yesterday of the same season, drawn around today's rotation window.
  private async issueCatchUp(
    owner: string,
    today: string,
    inPlay: CompetitionAttemptEntity[],
  ): Promise<AppCompetitionAttemptResponse> {
    const yesterday = daysBefore(today, 1);
    const existing = await this.competitionRepository.findAttempt(owner, yesterday, "catchup");
    if (existing !== null) {
      return this.serveExistingAttempt(existing);
    }
    if (!sharesSeason(today, yesterday)) {
      throw new ConflictException({ message: "A Catch-up never crosses a season edge" });
    }
    const yesterdays = await this.competitionRepository.findAttemptsOnDay(owner, yesterday);
    if (yesterdays.length > 0) {
      throw new ConflictException({
        message: `Competition Day ${yesterday} already holds an Attempt`,
      });
    }
    this.refuseWhileInPlay(inPlay);
    await this.requirePremium(owner);
    return this.issueDrawn(owner, "catchup", yesterday, today);
  }

  private async issueDrawn(
    owner: string,
    kind: CompetitionAttemptKind,
    day: string,
    rotationDay: string,
  ): Promise<AppCompetitionAttemptResponse> {
    const theme = await this.drawTheme(owner, rotationDay);
    const questions = await this.catalogService.drawFromTheme(theme.id, COMPETITION_QUESTION_COUNT);
    const issued = await this.competitionRepository.issue({
      owner,
      day,
      kind,
      themeId: theme.id,
      themeName: theme.name,
      questionIds: questions.map((question) => question.id),
    });
    if (issued !== null) {
      return toAppCompetitionAttemptResponse({ attempt: issued, theme, questions });
    }

    // Two devices asked at once: the insert the day's Attempt shut out serves the winner's draw.
    const winner = await this.competitionRepository.findAttempt(owner, day, kind);
    if (winner === null) {
      throw new Error("competition attempt disappeared after a lost issuance race");
    }
    return this.serveExistingAttempt(winner);
  }

  // One Attempt in play at a time: a second chance never starts over the one the Player is on.
  private refuseWhileInPlay(inPlay: CompetitionAttemptEntity[]): void {
    if (inPlay.length > 0) {
      throw new ConflictException({ message: "An Attempt is still in play" });
    }
  }

  private async requirePremium(owner: string): Promise<void> {
    if (!(await this.premiumService.isActive(owner))) {
      throw new ForbiddenException({
        code: "PREMIUM_REQUIRED",
        message: "Replay and Catch-up are Premium Attempts",
      });
    }
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
    // Alive until the Paris midnight after its issuance — a Catch-up is issued the day after its own.
    const isDead = (attempt: CompetitionAttemptEntity) => competitionDay(attempt.issuedAt) < day;
    await Promise.all(active.filter(isDead).map((attempt) => this.zeroFinalize(attempt)));
    return active.filter((attempt) => !isDead(attempt));
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

  // A Catch-up must dodge J-2 and today's Themes, which is today's own window: one draw serves every kind.
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
