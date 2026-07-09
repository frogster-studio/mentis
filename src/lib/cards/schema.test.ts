import { describe, expect, it } from "vitest";

import { cardSchema } from "@/lib/cards/schema";

const validAnecdote = {
  type: "anecdote",
  title: "Mendès France et le lait",
  payload: { body: "À la cantine…" },
};

describe("cardSchema", () => {
  it("accepts a valid Anecdote and defaults status, tags, and images", () => {
    const result = cardSchema.parse(validAnecdote);
    expect(result).toEqual({
      type: "anecdote",
      title: "Mendès France et le lait",
      tags: [],
      status: "draft",
      images: [],
      payload: { body: "À la cantine…" },
    });
  });

  it("preserves line breaks in the body", () => {
    const body = "Première ligne.\n\nDeuxième ligne.\nTroisième.";
    const result = cardSchema.parse({
      ...validAnecdote,
      payload: { body },
    });
    expect(result.payload).toEqual({ body });
  });

  it("rejects a missing Title", () => {
    const { title: _title, ...withoutTitle } = validAnecdote;
    expect(cardSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it("rejects an empty or whitespace-only Title", () => {
    for (const title of ["", "   "]) {
      const result = cardSchema.safeParse({ ...validAnecdote, title });
      expect(result.success).toBe(false);
    }
  });

  it("trims whitespace around the Title", () => {
    const result = cardSchema.parse({
      ...validAnecdote,
      title: "  Mendès France  ",
    });
    expect(result.title).toBe("Mendès France");
  });

  it("rejects an unknown type value", () => {
    expect(
      cardSchema.safeParse({ ...validAnecdote, type: "haiku" }).success,
    ).toBe(false);
  });

  it("rejects a missing type", () => {
    const { type: _type, ...withoutType } = validAnecdote;
    expect(cardSchema.safeParse(withoutType).success).toBe(false);
  });

  it("rejects an unknown status value", () => {
    expect(
      cardSchema.safeParse({ ...validAnecdote, status: "archived" }).success,
    ).toBe(false);
  });

  it("rejects more than three images", () => {
    const images = [0, 1, 2, 3].map((order) => ({
      path: `cards/x-${order}.webp`,
      order,
    }));
    expect(cardSchema.safeParse({ ...validAnecdote, images }).success).toBe(
      false,
    );
  });
});

const validQuiz = {
  type: "quiz",
  title: "La prise de la Bastille",
  payload: {
    question: "En quelle année la Bastille a-t-elle été prise ?",
    choices: [
      { text: "1789", correct: true },
      { text: "1792", correct: false },
      { text: "1848 (belle année aussi)", correct: false },
      { text: "1815", correct: false },
    ],
    explanation: "Le 14 juillet 1789, jour devenu fête nationale.",
  },
};

function quizWithChoices(choices: { text: string; correct: boolean }[]) {
  return { ...validQuiz, payload: { ...validQuiz.payload, choices } };
}

describe("cardSchema — Quiz", () => {
  it("accepts a valid Quiz", () => {
    const result = cardSchema.parse(validQuiz);
    expect(result).toMatchObject({
      type: "quiz",
      title: "La prise de la Bastille",
      payload: validQuiz.payload,
    });
  });

  it("rejects three or five Choices", () => {
    for (const count of [3, 5]) {
      const choices = Array.from({ length: count }, (_, index) => ({
        text: `Choix ${index + 1}`,
        correct: index === 0,
      }));
      expect(cardSchema.safeParse(quizWithChoices(choices)).success).toBe(
        false,
      );
    }
  });

  it("rejects zero or two correct Choices", () => {
    for (const correctCount of [0, 2]) {
      const choices = validQuiz.payload.choices.map((choice, index) => ({
        ...choice,
        correct: index < correctCount,
      }));
      expect(cardSchema.safeParse(quizWithChoices(choices)).success).toBe(
        false,
      );
    }
  });

  it("rejects a Choice with empty text", () => {
    const choices = validQuiz.payload.choices.map((choice, index) =>
      index === 2 ? { ...choice, text: "   " } : choice,
    );
    expect(cardSchema.safeParse(quizWithChoices(choices)).success).toBe(false);
  });
});

const validTrueFalse = {
  type: "true-false",
  title: "Le vase de Soissons",
  payload: {
    assertion: "Clovis a brisé lui-même le vase de Soissons.",
    answer: false,
    explanation:
      "C'est un soldat qui l'a brisé ; Clovis s'est vengé un an après.",
  },
};

describe("cardSchema — True/False", () => {
  it("accepts a valid True/False", () => {
    const result = cardSchema.parse(validTrueFalse);
    expect(result).toMatchObject({
      type: "true-false",
      payload: validTrueFalse.payload,
    });
  });

  it("rejects a missing or non-boolean answer", () => {
    const { answer: _answer, ...withoutAnswer } = validTrueFalse.payload;
    for (const payload of [
      withoutAnswer,
      { ...validTrueFalse.payload, answer: "false" },
    ]) {
      expect(cardSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(
        false,
      );
    }
  });

  it("rejects a missing or empty Explanation", () => {
    const { explanation: _explanation, ...withoutExplanation } =
      validTrueFalse.payload;
    for (const payload of [
      withoutExplanation,
      { ...validTrueFalse.payload, explanation: "   " },
    ]) {
      expect(cardSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(
        false,
      );
    }
  });

  it("rejects a missing assertion", () => {
    const { assertion: _assertion, ...payload } = validTrueFalse.payload;
    expect(cardSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(
      false,
    );
  });
});

const validRiddle = {
  type: "riddle",
  title: "L'énigme du Sphinx",
  payload: {
    clues: "Le matin à quatre pattes,\nà midi sur deux,\nle soir sur trois.",
    answer: "L'homme",
    bonusInfo: "Œdipe l'a résolue devant Thèbes.",
  },
};

describe("cardSchema — Riddle", () => {
  it("accepts a Riddle with Bonus Info", () => {
    const result = cardSchema.parse(validRiddle);
    expect(result).toMatchObject({
      type: "riddle",
      payload: validRiddle.payload,
    });
  });

  it("accepts a Riddle without Bonus Info", () => {
    const { bonusInfo: _bonusInfo, ...payload } = validRiddle.payload;
    const result = cardSchema.parse({ ...validRiddle, payload });
    expect(result.payload).toEqual(payload);
  });

  it("rejects missing Clues or a missing Answer", () => {
    const { clues: _clues, ...withoutClues } = validRiddle.payload;
    const { answer: _answer, ...withoutAnswer } = validRiddle.payload;
    for (const payload of [withoutClues, withoutAnswer]) {
      expect(cardSchema.safeParse({ ...validRiddle, payload }).success).toBe(
        false,
      );
    }
  });
});

describe("cardSchema — Did You Know", () => {
  it("accepts a valid Did You Know under its own type value", () => {
    const result = cardSchema.parse({
      type: "did-you-know",
      title: "La tour Eiffel grandit",
      payload: { body: "La dilatation la fait grandir de 15 cm l'été." },
    });
    expect(result.type).toBe("did-you-know");
  });

  it("rejects a missing body", () => {
    const result = cardSchema.safeParse({
      type: "did-you-know",
      title: "Sans corps",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});
