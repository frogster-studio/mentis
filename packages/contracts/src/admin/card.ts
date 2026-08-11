import { z } from "zod";

export const CARD_TYPES = ["quiz", "true-false", "anecdote", "did-you-know", "riddle"] as const;
export type CardType = (typeof CARD_TYPES)[number];

// Canonical Social order — the toggles render in this order on every row.
export const SOCIALS = ["x", "linkedin", "facebook", "tiktok", "youtube", "instagram"] as const;
export type Social = (typeof SOCIALS)[number];

const socialSetSchema = z.array(z.enum(SOCIALS)).transform((socials) => [...new Set(socials)]);

// Posted marks are set only through their own route, so a content save can never touch them.
export const postedOnSchema = socialSetSchema.default([]);

export const MAX_CARD_IMAGES = 3;

const cardImageSchema = z.object({
  path: z.string().min(1),
  order: z.number().int().min(0),
  caption: z.string().optional(),
});

// Parsed Images always come out in display order, whatever order the row stored them in.
const imagesSchema = z
  .array(cardImageSchema)
  .max(MAX_CARD_IMAGES, "A Card carries at most three Images.")
  .default([])
  .transform((images) => [...images].sort((a, b) => a.order - b.order));

// Tags are normalized on the way in, so "Histoire", "histoire " and a filter on either are one Tag.
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
  images: imagesSchema,
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
    choices: z.array(quizChoiceSchema).length(4, "A Quiz needs exactly four Choices."),
    explanation: z.string(),
  })
  .refine((payload) => payload.choices.filter((choice) => choice.correct).length === 1, {
    message: "Mark exactly one Choice as correct.",
    path: ["choices"],
  });

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

// Did You Know shares the Anecdote payload shape on purpose: the distinct type value is editorial.
export const adminCardWriteInputSchema = z.discriminatedUnion("type", [
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
export type AdminCardWriteInput = z.output<typeof adminCardWriteInputSchema>;

export const adminCardIdSchema = z.uuid();

// What a stored Card carries on top of its authored content.
const cardIdentitySchema = z.object({
  id: adminCardIdSchema,
  postedOn: postedOnSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const adminCardResponseSchema = adminCardWriteInputSchema.and(cardIdentitySchema);
export type AdminCardResponse = z.output<typeof adminCardResponseSchema>;

export const adminCardListQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: z.enum(CARD_TYPES).optional(),
  tag: z.string().transform(normalizeTag).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminCardListQuery = z.output<typeof adminCardListQuerySchema>;

export const adminCardListResponseSchema = z.object({
  items: z.array(adminCardResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type AdminCardListResponse = z.output<typeof adminCardListResponseSchema>;

// The set is replaced whole, so an absent postedOn is a mistake rather than "clear every mark".
export const adminCardPostedInputSchema = z.object({ postedOn: socialSetSchema });
export type AdminCardPostedInput = z.output<typeof adminCardPostedInputSchema>;
