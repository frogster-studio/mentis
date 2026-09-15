import type { User } from "@supabase/supabase-js";

// Supabase types user metadata as an open bag, so every read out of it is checked.
export function userMetadataString(user: User | undefined, key: string): string | undefined {
  const value: unknown = user?.user_metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function fullNameOf(user: User | undefined): string | undefined {
  return userMetadataString(user, "full_name");
}

export function firstNameOf(user: User | undefined): string | undefined {
  return fullNameOf(user)?.split(" ")[0];
}

// Google fills it in; Apple never does, so the portrait falls back to the initial.
export function avatarUrlOf(user: User | undefined): string | undefined {
  return userMetadataString(user, "avatar_url");
}
