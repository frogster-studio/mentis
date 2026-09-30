import { Image } from "expo-image";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

const FLAME_IMAGE = require("../../../assets/images/competition/flame.png");

export interface StatTileProps {
  title: string;
  hasFlame: boolean;
}

export const StatTile = ({ title, hasFlame, children }: PropsWithChildren<StatTileProps>) => {
  return (
    <View style={styles.container}>
      <Card background={null} onPress={null}>
        {hasFlame ? <Image source={FLAME_IMAGE} contentFit="contain" style={styles.flame} /> : null}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.figures}>{children}</View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  title: {
    ...TEXT.input,
    flex: 1,
    color: COLORS.ink,
    marginRight: SPACE.xs,
    paddingBottom: SPACE.xs,
  },
  flame: {
    position: "absolute",
    aspectRatio: 219 / 249,
    height: "100%",
    top: -SPACE.lg,
    right: -SPACE.lg,
    transform: [{ rotate: "6deg" }],
  },
  figures: {
    marginTop: SPACE.xs,
    gap: SPACE.md,
    flexDirection: "row",
    alignItems: "center",
  },
});
