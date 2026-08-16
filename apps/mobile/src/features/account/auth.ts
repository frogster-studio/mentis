import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  type SignInResponse,
  statusCodes,
  type User,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// webClientId sets the audience Supabase trusts; Android matches by package + SHA-1, needing no id.
if (Platform.OS !== "web") {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

// Apple offers the full name only at the very first authorization, so it is captured right away.
export async function signInWithApple(): Promise<void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    // « Annuler » on the Face ID sheet is not an error worth surfacing.
    if (isCanceled(error)) return;
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error("Apple sign-in returned no identity token");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;

  // Best-effort: a failed name write must never undo a successful sign-in.
  const fullName = formatFullName(credential.fullName);
  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => undefined);
  }
}

export async function signInWithGoogle(): Promise<void> {
  // Android will not open the sheet without Play Services; a no-op that resolves true on iOS.
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let response: SignInResponse;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    // Dismissing the sheet may surface as a thrown cancel on some platforms — not an error.
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return;
    throw error;
  }

  // On others the dismissal comes back as a cancelled response instead. Either way, nothing to do.
  if (!isSuccessResponse(response)) return;

  const { idToken, user } = response.data;
  if (!idToken) {
    throw new Error("Google sign-in returned no identity token");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;

  // Best-effort: a failed name write must never undo a successful sign-in.
  const fullName = formatGoogleName(user);
  if (fullName) {
    await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => undefined);
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

function isCanceled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "ERR_REQUEST_CANCELED"
  );
}

function formatFullName(
  name: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null {
  return name ? joinNameParts(name.givenName, name.familyName) : null;
}

function formatGoogleName(user: User["user"]): string | null {
  return user.name?.trim() || joinNameParts(user.givenName, user.familyName);
}

// Joins the non-empty given/family parts into one display name, or null if both are absent.
function joinNameParts(
  givenName: string | null | undefined,
  familyName: string | null | undefined,
): string | null {
  const parts = [givenName, familyName].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  return parts.length > 0 ? parts.join(" ") : null;
}
