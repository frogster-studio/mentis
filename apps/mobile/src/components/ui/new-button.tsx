import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SquircleView } from "expo-squircle-view";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";
import type { IconName } from "@/components/ui/icon-name";
import { Squircle } from "@/components/ui/squircle";
import { PRESS_DEPTH, usePressSink } from "@/components/ui/use-press-sink";
import { TEXT } from "@/theme/text";
import {
  COLORS,
  CONTROL_HEIGHT,
  CONTROL_ICON_SIZE,
  CONTROL_SQUARE_SIZE,
  RADIUS,
  SPACE,
} from "@/theme/tokens";

const BORDER_WIDTH = 1;
const PADDING_HORIZONTAL = SPACE.xl;

const PALETTES = {
  default: { face: COLORS.face, edge: COLORS.ink, content: COLORS.ink },
  disabled: { face: COLORS.face, edge: COLORS.inkFaint, content: COLORS.inkFaint },
} as const;

type NewButtonBaseProps = {
  onPress: () => void;
  layout?: "block" | "hug";
  shape?: "rounded" | "full";
  disabled?: boolean;
  pending?: boolean;
};

export type NewButtonProps = NewButtonBaseProps &
  (
    | { label: string; icon?: IconName; accessibilityLabel?: undefined }
    | { label?: undefined; icon: IconName; accessibilityLabel: string }
  );

export function NewButton(props: NewButtonProps) {
  const { onPress, layout = "block", shape = "rounded", disabled = false, pending = false } = props;
  const { travel, pressIn, pressOut } = usePressSink();
  const isInert = disabled || pending;
  const palette = PALETTES[isInert ? "disabled" : "default"];
  const isIconOnly = props.label === undefined;
  const height = isIconOnly ? CONTROL_SQUARE_SIZE : CONTROL_HEIGHT;
  const radius = shape === "full" ? RADIUS.lg : 26;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={props.label ?? props.accessibilityLabel}
      style={[styles[layout], { height: height + PRESS_DEPTH }]}
    >
      <Squircle radius={radius} color={palette.edge} style={[styles.shadow, { height }]} />
      <Animated.View style={{ transform: [{ translateY: travel }] }}>
        <SquircleView
          backgroundColor={palette.face}
          borderRadius={radius}
          borderColor={palette.edge}
          borderWidth={BORDER_WIDTH}
          style={[styles.face, isIconOnly && styles.iconOnlyFace, { height }]}
        >
          {pending ? (
            <ActivityIndicator size="small" color={palette.content} />
          ) : (
            <>
              {props.icon ? (
                <MaterialIcons name={props.icon} size={CONTROL_ICON_SIZE} color={palette.content} />
              ) : null}
              {props.label ? (
                <Text style={[styles.label, { color: palette.content }]}>{props.label}</Text>
              ) : null}
            </>
          )}
        </SquircleView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: "stretch" },
  hug: { alignSelf: "flex-start" },
  shadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  face: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    paddingHorizontal: PADDING_HORIZONTAL,
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
