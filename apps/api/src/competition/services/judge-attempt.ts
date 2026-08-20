import { judgeAnswer } from "@mentis/answer-matching";
import { type AppCompetitionFinalizeInput, COMPETITION_POINTS } from "@mentis/contracts/app";
import { BadRequestException } from "@nestjs/common";
import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";

type PlayedAnswer = AppCompetitionFinalizeInput["answers"][number];

export type JudgeableQuestion = {
  id: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
};

export const judgeAttempt = (
  attemptId: string,
  questions: JudgeableQuestion[],
  batch: AppCompetitionFinalizeInput,
): CompetitionAnswerEntity[] =>
  questions.map((question, position) => {
    const submitted = batch.answers[position];
    if (submitted === undefined) {
      return {
        attemptId,
        position,
        questionId: question.id,
        mode: "none",
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
    return {
      attemptId,
      position,
      questionId: question.id,
      rawInput: submitted.rawInput,
      clientElapsedMs: submitted.clientElapsedMs,
      ...verdict(submitted, question),
    };
  });

export const attemptScore = (answers: CompetitionAnswerEntity[]): number =>
  answers.reduce((total, answer) => total + answer.points, 0);

const verdict = (
  played: PlayedAnswer,
  question: JudgeableQuestion,
): Pick<CompetitionAnswerEntity, "mode" | "correct" | "points" | "matchedVia"> => {
  const { mode, rawInput } = played;
  if (mode === "square") {
    // The Canonical Answer sits among the served choices, so an exact match is the whole verdict.
    const correct = rawInput !== "" && rawInput === question.answer;
    return {
      mode,
      correct,
      points: correct ? COMPETITION_POINTS.square : 0,
      matchedVia: correct ? "choice" : null,
    };
  }
  const matchedVia = judgeAnswer(rawInput, question);
  return {
    mode,
    correct: matchedVia !== null,
    points: matchedVia !== null ? COMPETITION_POINTS.cash : 0,
    matchedVia,
  };
};
