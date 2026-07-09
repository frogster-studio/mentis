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

// Card Types creatable in the UI so far; later slices grow this until it
// matches CARD_TYPES.
export const ENABLED_CARD_TYPES = ["anecdote", "quiz"] as const;

export type EnabledCardType = (typeof ENABLED_CARD_TYPES)[number];

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

const sharedFields = {
  title: z.string().trim().min(1, "Title is required."),
  tags: z.array(z.string()).default([]),
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

// The single source of truth for Card structure, shared between form and
// server. Later slices add the other three Card Type members.
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
]);

export type CardData = z.output<typeof cardSchema>;

export type Card = CardData & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
