import type { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileAvatar } from "@/components/profile-avatar";
import { NewButton } from "@/components/ui/new-button";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH } from "@/components/ui/use-press-sink";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";
const CARD_TOP_GAP = SPACE.xs;
const ROW_HEIGHT = CONTROL_SQUARE_SIZE + PRESS_DEPTH;
const DIVIDER_HEIGHT = 1;
const CARD_HEIGHT = CARD_TOP_GAP + SPACE.lg + ROW_HEIGHT + SPACE.md + DIVIDER_HEIGHT;

// The card reaches under the status bar, so content clears the inset as well as the card.
export function useAppHeaderHeight() {
  return useSafeAreaInsets().top + CARD_HEIGHT;
}

export function AppHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.session?.user);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay}>
      <View style={styles.band}>
        <Squircle
          radius={RADIUS.xl}
          corners="top"
          color={COLORS.card}
          style={[styles.card, { marginTop: insets.top + CARD_TOP_GAP }]}
        >
          <View style={styles.row}>
            <ProfileAvatar photoUrl={metadataString(user, "avatar_url")} />
            <View style={styles.greetingSlot}>
              <Text style={styles.greeting}>{greetingFor(firstNameOf(user))}</Text>
            </View>
            <NewButton
              layout="hug"
              shape="rounded"
              icon="menu"
              accessibilityLabel={ACCOUNT_TITLE}
              onPress={() => router.push("/account")}
            />
          </View>
          <View style={styles.divider} />
        </Squircle>
      </View>
    </View>
  );
}

function greetingFor(firstName: string | undefined): string {
  return [GREETING, firstName, GREETING_SUFFIX].filter(Boolean).join(" ");
}

function firstNameOf(user: User | undefined): string | undefined {
  return metadataString(user, "full_name")?.split(" ")[0];
}

// Supabase types user metadata as an open bag, so every read out of it is checked.
function metadataString(user: User | undefined, key: string): string | undefined {
  const value: unknown = user?.user_metadata[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  card: {
    paddingTop: SPACE.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  greetingSlot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  greeting: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  divider: {
    height: DIVIDER_HEIGHT,
    backgroundColor: COLORS.divider,
  },
});
