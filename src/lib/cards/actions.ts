"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import {
  deleteCard as deleteCardRow,
  getCard,
  insertCard,
  updateCard as updateCardRow,
} from "@/lib/cards/data";
import { cardSchema } from "@/lib/cards/schema";
import { createServiceClient } from "@/lib/supabase";

export type CreateCardState = {
  errors: {
    title?: string;
    form?: string;
  };
};

// Rebuilds the type-specific payload from its form fields. Field names line
// up with the inputs in card-type-fields.tsx; validation stays in the schema.
function payloadFromFormData(
  type: FormDataEntryValue | null,
  formData: FormData,
): unknown {
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
  return { body: String(formData.get("body") ?? "") };
}

// Server actions are reachable by direct POST, so the route guard in the
// proxy is not enough on its own.
async function requireSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token, {
    secret: process.env.SESSION_SECRET ?? "",
    now: Date.now(),
  });
  if (!session) {
    redirect("/login");
  }
}

export async function createCard(
  _previousState: CreateCardState | undefined,
  formData: FormData,
): Promise<CreateCardState> {
  await requireSession();

  const type = formData.get("type");
  const parsed = cardSchema.safeParse({
    type,
    title: String(formData.get("title") ?? ""),
    payload: payloadFromFormData(type, formData),
  });
  if (!parsed.success) {
    const errors: CreateCardState["errors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "title") {
        errors.title ??= issue.message;
      } else {
        errors.form ??= issue.message;
      }
    }
    return { errors };
  }

  try {
    await insertCard(createServiceClient(), parsed.data);
  } catch {
    return { errors: { form: "Saving the Card failed. Try again." } };
  }

  revalidatePath("/");
  redirect("/");
}

export type UpdateCardState = {
  errors: {
    title?: string;
    form?: string;
  };
  savedAt?: string;
};

export async function updateCard(
  _previousState: UpdateCardState | undefined,
  formData: FormData,
): Promise<UpdateCardState> {
  await requireSession();

  const id = String(formData.get("id") ?? "");
  const client = createServiceClient();

  // Tags and Images have no form fields yet; carry the stored values through
  // so this action keeps working untouched when later slices add them.
  let existing: Awaited<ReturnType<typeof getCard>>;
  try {
    existing = await getCard(client, id);
  } catch {
    return { errors: { form: "Saving the Card failed. Try again." } };
  }
  if (!existing) {
    return { errors: { form: "This Card no longer exists." } };
  }

  const type = formData.get("type");
  const parsed = cardSchema.safeParse({
    type,
    title: String(formData.get("title") ?? ""),
    status: formData.get("status") === "published" ? "published" : "draft",
    tags: existing.tags,
    images: existing.images,
    payload: payloadFromFormData(type, formData),
  });
  if (!parsed.success) {
    const errors: UpdateCardState["errors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "title") {
        errors.title ??= issue.message;
      } else {
        errors.form ??= issue.message;
      }
    }
    return { errors };
  }

  let saved: Awaited<ReturnType<typeof updateCardRow>>;
  try {
    saved = await updateCardRow(client, id, parsed.data);
  } catch {
    return { errors: { form: "Saving the Card failed. Try again." } };
  }

  revalidatePath("/");
  revalidatePath(`/cards/${id}`);
  return { errors: {}, savedAt: saved.updatedAt };
}

export async function deleteCard(cardId: string): Promise<void> {
  await requireSession();

  await deleteCardRow(createServiceClient(), cardId);

  revalidatePath("/");
  redirect("/");
}
