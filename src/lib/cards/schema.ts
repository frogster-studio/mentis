import { z } from "zod";

export const CARD_TYPES = [
  "quiz",
  "true-false",
  "anecdote",
  "did-you-know",
  "riddle",
] as const;

export type CardType = (typeof CARD_TYPES)[number];

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  quiz: "Quiz",
  "true-false": "True/False",
  anecdote: "Anecdote",
  "did-you-know": "Did You Know",
  riddle: "Riddle",
};

export const CARD_STATUSES = ["draft", "published"] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  draft: "Draft",
  published: "Published",
};

const cardImageSchema = z.object({
  path: z.string().min(1),
  order: z.number().int().min(0),
  caption: z.string().optional(),
});

// Tags are stored normalized so "Histoire" and "histoire " are the same Tag.
// The same rule applies to a Tag used as a list filter.
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

const tagsSchema = z
  .array(z.string())
  .default([])
  .transform((tags) => {
    const unique = new Set(tags.map(normalizeTag));
    unique.delete("");
    return [...unique];
  });

const sharedFields = {
  title: z.string().trim().min(1, "Title is required."),
  tags: tagsSchema,
  status: z.enum(CARD_STATUSES).default("draft"),
  images: z.array(cardImageSchema).max(3).default([]),
};

const anecdotePayloadSchema = z.object({
  body: z.string(),
});

const quizChoiceSchema = z.object({
  text: z.string().trim().min(1, "Every Choice needs text."),
  correct: z.boolean(),
});

const quizPayloadSchema = z
  .object({
    question: z.string(),
    choices: z
      .array(quizChoiceSchema)
      .length(4, "A Quiz needs exactly four Choices."),
    explanation: z.string(),
  })
  .refine(
    (payload) =>
      payload.choices.filter((choice) => choice.correct).length === 1,
    { message: "Mark exactly one Choice as correct.", path: ["choices"] },
  );

export type QuizPayload = z.output<typeof quizPayloadSchema>;

const trueFalsePayloadSchema = z.object({
  assertion: z.string(),
  answer: z.boolean("Choose True or False."),
  explanation: z.string().trim().min(1, "An Explanation is required."),
});

export type TrueFalsePayload = z.output<typeof trueFalsePayloadSchema>;

const riddlePayloadSchema = z.object({
  clues: z.string(),
  answer: z.string(),
  bonusInfo: z.string().optional(),
});

export type RiddlePayload = z.output<typeof riddlePayloadSchema>;

// The single source of truth for Card structure, shared between form and
// server. Did You Know shares the Anecdote payload shape on purpose — the
// distinct type value is editorial and matters downstream.
export const cardSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("anecdote"),
    ...sharedFields,
    payload: anecdotePayloadSchema,
  }),
  z.object({
    type: z.literal("quiz"),
    ...sharedFields,
    payload: quizPayloadSchema,
  }),
  z.object({
    type: z.literal("true-false"),
    ...sharedFields,
    payload: trueFalsePayloadSchema,
  }),
  z.object({
    type: z.literal("riddle"),
    ...sharedFields,
    payload: riddlePayloadSchema,
  }),
  z.object({
    type: z.literal("did-you-know"),
    ...sharedFields,
    payload: anecdotePayloadSchema,
  }),
]);

export type CardData = z.output<typeof cardSchema>;

export type Card = CardData & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
