import { describe, expect, it } from "vitest";

import { adminCardWriteInputSchema, postedOnSchema } from "./card";

const validAnecdote = {
  type: "anecdote",
  title: "Mendès France et le lait",
  payload: { body: "À la cantine…" },
};

describe("adminCardWriteInputSchema", () => {
  it("accepts a valid Anecdote and defaults tags and images", () => {
    const result = adminCardWriteInputSchema.parse(validAnecdote);
    expect(result).toEqual({
      type: "anecdote",
      title: "Mendès France et le lait",
      tags: [],
      images: [],
      payload: { body: "À la cantine…" },
    });
  });

  it("preserves line breaks in the body", () => {
    const body = "Première ligne.\n\nDeuxième ligne.\nTroisième.";
    const result = adminCardWriteInputSchema.parse({
      ...validAnecdote,
      payload: { body },
    });
    expect(result.payload).toEqual({ body });
  });

  it("rejects a missing Title", () => {
    const { title: _title, ...withoutTitle } = validAnecdote;
    expect(adminCardWriteInputSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it("rejects an empty or whitespace-only Title", () => {
    for (const title of ["", "   "]) {
      const result = adminCardWriteInputSchema.safeParse({ ...validAnecdote, title });
      expect(result.success).toBe(false);
    }
  });

  it("trims whitespace around the Title", () => {
    const result = adminCardWriteInputSchema.parse({
      ...validAnecdote,
      title: "  Mendès France  ",
    });
    expect(result.title).toBe("Mendès France");
  });

  it("rejects an unknown type value", () => {
    expect(adminCardWriteInputSchema.safeParse({ ...validAnecdote, type: "haiku" }).success).toBe(
      false,
    );
  });

  it("rejects a missing type", () => {
    const { type: _type, ...withoutType } = validAnecdote;
    expect(adminCardWriteInputSchema.safeParse(withoutType).success).toBe(false);
  });

  it("rejects more than three images", () => {
    const images = [0, 1, 2, 3].map((order) => ({
      path: `cards/x-${order}.webp`,
      order,
    }));
    expect(adminCardWriteInputSchema.safeParse({ ...validAnecdote, images }).success).toBe(false);
  });
});

describe("adminCardWriteInputSchema — Images", () => {
  it("accepts three Images and keeps their optional Captions", () => {
    const images = [
      { path: "a.webp", order: 0, caption: "La une" },
      { path: "b.webp", order: 1 },
      { path: "c.webp", order: 2, caption: "La der" },
    ];
    const result = adminCardWriteInputSchema.parse({ ...validAnecdote, images });
    expect(result.images).toEqual(images);
  });

  it("returns Images sorted by order regardless of stored order", () => {
    const result = adminCardWriteInputSchema.parse({
      ...validAnecdote,
      images: [
        { path: "last.webp", order: 2 },
        { path: "first.webp", order: 0 },
        { path: "middle.webp", order: 1 },
      ],
    });
    expect(result.images.map((image) => image.path)).toEqual([
      "first.webp",
      "middle.webp",
      "last.webp",
    ]);
  });
});

describe("postedOnSchema", () => {
  it("defaults to no Posted marks", () => {
    expect(postedOnSchema.parse(undefined)).toEqual([]);
  });

  it("keeps known Socials and drops duplicates", () => {
    expect(postedOnSchema.parse(["linkedin", "x", "linkedin"])).toEqual(["linkedin", "x"]);
  });

  it("rejects an unknown Social", () => {
    expect(postedOnSchema.safeParse(["myspace"]).success).toBe(false);
  });
});

describe("adminCardWriteInputSchema — Tags", () => {
  it("normalizes Tags: trims, lowercases, and drops blanks and duplicates", () => {
    const result = adminCardWriteInputSchema.parse({
      ...validAnecdote,
      tags: [" Histoire ", "histoire", "GÉO", "   "],
    });
    expect(result.tags).toEqual(["histoire", "géo"]);
  });

  it("accepts a Card with zero Tags", () => {
    const result = adminCardWriteInputSchema.parse({ ...validAnecdote, tags: [] });
    expect(result.tags).toEqual([]);
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

describe("adminCardWriteInputSchema — Quiz", () => {
  it("accepts a valid Quiz", () => {
    const result = adminCardWriteInputSchema.parse(validQuiz);
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
      expect(adminCardWriteInputSchema.safeParse(quizWithChoices(choices)).success).toBe(false);
    }
  });

  it("rejects zero or two correct Choices", () => {
    for (const correctCount of [0, 2]) {
      const choices = validQuiz.payload.choices.map((choice, index) => ({
        ...choice,
        correct: index < correctCount,
      }));
      expect(adminCardWriteInputSchema.safeParse(quizWithChoices(choices)).success).toBe(false);
    }
  });

  it("rejects a Choice with empty text", () => {
    const choices = validQuiz.payload.choices.map((choice, index) =>
      index === 2 ? { ...choice, text: "   " } : choice,
    );
    expect(adminCardWriteInputSchema.safeParse(quizWithChoices(choices)).success).toBe(false);
  });
});

const validTrueFalse = {
  type: "true-false",
  title: "Le vase de Soissons",
  payload: {
    assertion: "Clovis a brisé lui-même le vase de Soissons.",
    answer: false,
    explanation: "C'est un soldat qui l'a brisé ; Clovis s'est vengé un an après.",
  },
};

describe("adminCardWriteInputSchema — True/False", () => {
  it("accepts a valid True/False", () => {
    const result = adminCardWriteInputSchema.parse(validTrueFalse);
    expect(result).toMatchObject({
      type: "true-false",
      payload: validTrueFalse.payload,
    });
  });

  it("rejects a missing or non-boolean answer", () => {
    const { answer: _answer, ...withoutAnswer } = validTrueFalse.payload;
    for (const payload of [withoutAnswer, { ...validTrueFalse.payload, answer: "false" }]) {
      expect(adminCardWriteInputSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(
        false,
      );
    }
  });

  it("rejects a missing or empty Explanation", () => {
    const { explanation: _explanation, ...withoutExplanation } = validTrueFalse.payload;
    for (const payload of [withoutExplanation, { ...validTrueFalse.payload, explanation: "   " }]) {
      expect(adminCardWriteInputSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(
        false,
      );
    }
  });

  it("rejects a missing assertion", () => {
    const { assertion: _assertion, ...payload } = validTrueFalse.payload;
    expect(adminCardWriteInputSchema.safeParse({ ...validTrueFalse, payload }).success).toBe(false);
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

describe("adminCardWriteInputSchema — Riddle", () => {
  it("accepts a Riddle with Bonus Info", () => {
    const result = adminCardWriteInputSchema.parse(validRiddle);
    expect(result).toMatchObject({
      type: "riddle",
      payload: validRiddle.payload,
    });
  });

  it("accepts a Riddle without Bonus Info", () => {
    const { bonusInfo: _bonusInfo, ...payload } = validRiddle.payload;
    const result = adminCardWriteInputSchema.parse({ ...validRiddle, payload });
    expect(result.payload).toEqual(payload);
  });

  it("rejects missing Clues or a missing Answer", () => {
    const { clues: _clues, ...withoutClues } = validRiddle.payload;
    const { answer: _answer, ...withoutAnswer } = validRiddle.payload;
    for (const payload of [withoutClues, withoutAnswer]) {
      expect(adminCardWriteInputSchema.safeParse({ ...validRiddle, payload }).success).toBe(false);
    }
  });
});

describe("adminCardWriteInputSchema — Did You Know", () => {
  it("accepts a valid Did You Know under its own type value", () => {
    const result = adminCardWriteInputSchema.parse({
      type: "did-you-know",
      title: "La tour Eiffel grandit",
      payload: { body: "La dilatation la fait grandir de 15 cm l'été." },
    });
    expect(result.type).toBe("did-you-know");
  });

  it("rejects a missing body", () => {
    const result = adminCardWriteInputSchema.safeParse({
      type: "did-you-know",
      title: "Sans corps",
      payload: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("adminCardWriteInputSchema — Card Type change", () => {
  it("rejects the old payload left under the new type", () => {
    // A type change must rebuild the payload; a stale Quiz payload does not validate as a Riddle.
    expect(adminCardWriteInputSchema.safeParse({ ...validQuiz, type: "riddle" }).success).toBe(
      false,
    );
  });
});
