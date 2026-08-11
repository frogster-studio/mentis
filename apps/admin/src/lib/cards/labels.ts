import type { CardType, Social } from "@mentis/contracts/admin";

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  quiz: "Quiz",
  "true-false": "True/False",
  anecdote: "Anecdote",
  "did-you-know": "Did You Know",
  riddle: "Riddle",
};

export const SOCIAL_LABELS: Record<Social, string> = {
  x: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
};
