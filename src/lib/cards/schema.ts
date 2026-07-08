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

const sharedFields = {
  title: z.string().trim().min(1, "Title is required."),
  tags: z.array(z.string()).default([]),
  status: z.enum(CARD_STATUSES).default("draft"),
  images: z.array(cardImageSchema).max(3).default([]),
};

const anecdotePayloadSchema = z.object({
  body: z.string(),
});

// The single source of truth for Card structure, shared between form and
// server. Later slices add the other four Card Type members.
export const cardSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("anecdote"),
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
