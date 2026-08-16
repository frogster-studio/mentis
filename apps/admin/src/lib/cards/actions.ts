"use server";

import type { AdminCardResponse, Social } from "@mentis/contracts/admin";
import { adminCardPostedInputSchema, adminCardWriteInputSchema } from "@mentis/contracts/admin";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  createCard as createCardOnApi,
  deleteCard as deleteCardOnApi,
  replaceCard,
  setCardPostedOn,
} from "@/lib/api/cards";
import { isApiError } from "@/lib/api/client";

// The Title field keeps its own message and everything else lands on the form-level alert.
type CardFormErrors = {
  title?: string;
  form?: string;
};

export type CreateCardState = {
  errors: CardFormErrors;
};

// Field names line up with the inputs in card-type-fields.tsx.
function payloadFromFormData(type: FormDataEntryValue | null, formData: FormData): unknown {
  if (type === "quiz") {
    const correctChoice = formData.get("correctChoice");
    return {
      question: String(formData.get("question") ?? ""),
      choices: [0, 1, 2, 3].map((index) => ({
        text: String(formData.get(`choice-${index}`) ?? ""),
        correct: correctChoice === String(index),
      })),
      explanation: String(formData.get("explanation") ?? ""),
    };
  }
  if (type === "true-false") {
    const answer = formData.get("answer");
    return {
      assertion: String(formData.get("assertion") ?? ""),
      // Left undefined when neither radio is picked so the schema rejects the save.
      answer: answer === null ? undefined : answer === "true",
      explanation: String(formData.get("explanation") ?? ""),
    };
  }
  if (type === "riddle") {
    const bonusInfo = String(formData.get("bonusInfo") ?? "");
    return {
      clues: String(formData.get("clues") ?? ""),
      answer: String(formData.get("answer") ?? ""),
      // A blank Bonus Info is stored as absent, not as an empty string.
      ...(bonusInfo.trim() === "" ? {} : { bonusInfo }),
    };
  }
  // Anecdote and Did You Know share the body-only payload.
  return { body: String(formData.get("body") ?? "") };
}

// The form always sends the full Image list, so an empty list means the Card has no Images.
function imagesFromFormData(
  formData: FormData,
): { path: string; order: number; caption?: string }[] {
  const paths = formData.getAll("imagePaths").map(String);
  const captions = formData.getAll("imageCaptions").map(String);
  return paths.map((path, index) => {
    const caption = (captions[index] ?? "").trim();
    // A blank Caption is stored as absent, not as an empty string.
    return { path, order: index, ...(caption === "" ? {} : { caption }) };
  });
}

// Shared so create and update can never drift in how they read the form.
function parseCardForm(formData: FormData) {
  const type = formData.get("type");
  return adminCardWriteInputSchema.safeParse({
    type,
    title: String(formData.get("title") ?? ""),
    tags: formData.getAll("tags").map(String),
    images: imagesFromFormData(formData),
    payload: payloadFromFormData(type, formData),
  });
}

// Typed structurally to stay off the schema library's issue types.
function cardFormErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): CardFormErrors {
  const errors: CardFormErrors = {};
  for (const issue of issues) {
    if (issue.path[0] === "title") {
      errors.title ??= issue.message;
    } else {
      errors.form ??= issue.message;
    }
  }
  return errors;
}

function saveErrorMessage(error: unknown): string {
  if (isApiError(error, "NOT_FOUND")) {
    return "This Card no longer exists.";
  }
  if (isApiError(error, "VALIDATION_FAILED")) {
    return error.message;
  }
  return "Saving the Card failed. Try again.";
}

export async function createCard(
  _previousState: CreateCardState | undefined,
  formData: FormData,
): Promise<CreateCardState> {
  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return { errors: cardFormErrors(parsed.error.issues) };
  }

  try {
    await createCardOnApi(parsed.data);
  } catch (error) {
    // The seam redirects on 401/403, and that travels as a thrown error.
    unstable_rethrow(error);
    return { errors: { form: saveErrorMessage(error) } };
  }

  revalidatePath("/");
  redirect("/");
}

export type UpdateCardState = {
  errors: CardFormErrors;
  savedAt?: string;
};

export async function updateCard(
  _previousState: UpdateCardState | undefined,
  formData: FormData,
): Promise<UpdateCardState> {
  const id = String(formData.get("id") ?? "");

  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return { errors: cardFormErrors(parsed.error.issues) };
  }

  let saved: AdminCardResponse;
  try {
    saved = await replaceCard(id, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    return { errors: { form: saveErrorMessage(error) } };
  }

  revalidatePath("/");
  revalidatePath(`/cards/${id}`);
  return { errors: {}, savedAt: saved.updatedAt };
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteCardOnApi(cardId);

  revalidatePath("/");
  redirect("/");
}

// Two editors marking at once clobber each other — accepted with the whole-set write.
export async function setCardPosted(cardId: string, postedOn: Social[]): Promise<void> {
  // Server Functions are reachable by direct POST, so the arguments are checked here too.
  const parsed = adminCardPostedInputSchema.safeParse({ postedOn });
  if (!parsed.success) {
    throw new Error("Invalid Posted marks.");
  }

  await setCardPostedOn(cardId, parsed.data.postedOn);

  revalidatePath("/");
  revalidatePath(`/cards/${cardId}`);
}
