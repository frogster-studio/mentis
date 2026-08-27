import { judgeAnswer } from "@mentis/answer-matching";
import { type AppCompetitionFinalizeInput, COMPETITION_POINTS } from "@mentis/contracts/app";
import { QuizAnswerModeEnum, UserAnswerMatchedViaEnum } from "@mentis/contracts/enums";
import { BadRequestException } from "@nestjs/common";
import type { JudgeableQuestion } from "../types/judgeable-question";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";

export function judgeAttempt(
  attemptId: string,
  questions: JudgeableQuestion[],
  batch: AppCompetitionFinalizeInput,
): NewCompetitionAnswer[] {
  return questions.map((question, position) => {
    const submitted = batch.answers[position];

    if (submitted === undefined) {
      return {
        attemptId,
        position,
        questionId: question.id,
        mode: QuizAnswerModeEnum.NONE,
        rawInput: null,
        correct: false,
        points: 0,
        matchedVia: null,
        clientElapsedMs: null,
      };
    }

    if (submitted.questionId !== question.id) {
      throw new BadRequestException({
        code: "ANSWER_NOT_SERVED",
        message: `Answer ${position} targets ${submitted.questionId}, not the Question served there`,
      });
    }

    if (submitted.mode === QuizAnswerModeEnum.SQUARE) {
      // The Canonical Answer sits among the served choices, so an exact match is the whole verdict.
      const correct = submitted.rawInput !== "" && submitted.rawInput === question.answer;
      return {
        attemptId,
        position,
        questionId: question.id,
        mode: QuizAnswerModeEnum.SQUARE,
        rawInput: submitted.rawInput,
        clientElapsedMs: submitted.clientElapsedMs,
        correct,
        points: correct ? COMPETITION_POINTS.square : 0,
        matchedVia: correct ? UserAnswerMatchedViaEnum.CHOICE : null,
      };
    }

    const matchedVia = judgeAnswer(submitted.rawInput, question);

    return {
      attemptId,
      position,
      questionId: question.id,
      mode: QuizAnswerModeEnum.CASH,
      rawInput: submitted.rawInput,
      clientElapsedMs: submitted.clientElapsedMs,
      correct: matchedVia !== null,
      points: matchedVia !== null ? COMPETITION_POINTS.cash : 0,
      matchedVia,
    };
  });
}
