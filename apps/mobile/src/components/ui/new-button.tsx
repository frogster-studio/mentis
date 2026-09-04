import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";
import SquircleView from "react-native-fast-squircle";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, CONTROL_SQUARE_SIZE, RADIUS, SPACE } from "@/theme/tokens";

const PALETTES = {
  default: { face: COLORS.face, edge: COLORS.ink, content: COLORS.ink },
  primary: { face: COLORS.primary, edge: COLORS.ink, content: COLORS.ink },
  disabled: { face: COLORS.face, edge: COLORS.inkMuted, content: COLORS.inkMuted },
} as const;

export interface NewButtonProps {
  onPress: () => void;
  layout: "block" | "hug";
  shape: "rounded" | "full";
  tone: "default" | "primary";
  disabled: boolean;
  pending: boolean;
  icon: CommunityIconName | null;
  label: string | null;
  accessibilityLabel: string | null;
}

export const NewButton = ({
  onPress,
  layout,
  shape,
  tone,
  disabled,
  pending,
  icon,
  label,
  accessibilityLabel,
}: NewButtonProps) => {
  const { travel, pressIn, pressOut } = usePressSink();
  const isInert = disabled || pending;
  const palette = PALETTES[isInert ? "disabled" : tone];
  const radius = shape === "full" ? RADIUS.lg : 26;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={label ?? accessibilityLabel ?? undefined}
      style={[styles[layout], { height: CONTROL_SQUARE_SIZE + PRESS_DEPTH }]}
    >
      <Squircle
        radius={radius}
        corners="all"
        color={palette.edge}
        borderColor={null}
        borderWidth={null}
        style={styles.shadow}
      />
      <Animated.View style={{ transform: [{ translateY: travel }] }}>
        <SquircleView
          style={[
            styles.face,
            label === null && styles.iconOnlyFace,
            { borderRadius: radius, borderColor: palette.edge, backgroundColor: palette.face },
          ]}
        >
          {pending ? (
            <ActivityIndicator size="small" color={palette.content} />
          ) : (
            <>
              {icon ? (
                <MaterialCommunityIcons
                  name={icon}
                  size={CONTROL_ICON_SIZE}
                  color={palette.content}
                />
              ) : null}
              {label ? (
                <Text style={[styles.label, { color: palette.content }]}>{label}</Text>
              ) : null}
            </>
          )}
        </SquircleView>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  block: { alignSelf: "stretch" },
  hug: { alignSelf: "flex-start" },
  shadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTROL_SQUARE_SIZE,
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    borderWidth: 1,
    paddingHorizontal: SPACE.xl,
    height: CONTROL_SQUARE_SIZE,
  },
  iconOnlyFace: {
    width: CONTROL_SQUARE_SIZE,
    paddingHorizontal: 0,
  },
  label: {
    ...TEXT.label,
    userSelect: "none",
  },
});
