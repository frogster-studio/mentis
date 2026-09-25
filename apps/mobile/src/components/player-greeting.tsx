import { Pressable, StyleSheet, Text, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { firstNameOf } from "@/features/account/user-metadata";
import { useStanding } from "@/features/competition/api";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const GREETING = "Salut";
const GREETING_SUFFIX = "!";

interface PlayerGreetingProps {
  isWorld: boolean;
  onPseudoPress: () => void;
}

export const PlayerGreeting = ({ isWorld, onPseudoPress }: PlayerGreetingProps) => {
  const user = useAuthStore((state) => state.session?.user);
  const playerId = user?.id;
  const profile = useProfile(playerId);
  const standing = useStanding(playerId);

  if (!isWorld) {
    return (
      <View style={styles.slot}>
        <Text style={styles.greeting}>{greetingFor(firstNameOf(user))}</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
      disabled={playerId === undefined}
      onPress={onPseudoPress}
    >
      {/* The Competition names the Player by pseudo, so the greeting has no place here. */}
      <Text style={styles.greeting} numberOfLines={1}>
        {profile.data?.pseudo ?? ""}
      </Text>
      {standing.data ? (
        <Squircle
          radius={RADIUS.sm}
          corners="all"
          color={COLORS.background}
          borderColor={null}
          borderWidth={null}
          style={styles.pointsBadge}
        >
          <Text style={styles.points}>
            {standing.data.seasonTotal} {POINTS_UNIT}
          </Text>
        </Squircle>
      ) : null}
    </Pressable>
  );
};

function greetingFor(firstName: string | undefined): string {
  return [GREETING, firstName, GREETING_SUFFIX].filter(Boolean).join(" ");
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    height: CONTROL_SQUARE_SIZE,
    justifyContent: "center",
    paddingHorizontal: SPACE.lg,
  },
  greeting: { ...TEXT.body, color: COLORS.ink },
  pointsBadge: { alignSelf: "flex-start", paddingHorizontal: SPACE.xs, paddingVertical: SPACE.xxs },
  points: { ...TEXT.captionStrong, color: COLORS.ink },
  pressed: PRESSED,
});
