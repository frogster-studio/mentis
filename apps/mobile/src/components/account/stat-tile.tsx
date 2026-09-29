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
    <View style={styles.tile}>
      <Card background={null} onPress={null}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {hasFlame ? (
            <Image source={FLAME_IMAGE} contentFit="contain" style={styles.flame} />
          ) : null}
        </View>
        <View style={styles.figures}>{children}</View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  title: { ...TEXT.caption, flexShrink: 1, color: COLORS.inkMuted },
  flame: { height: SPACE.lg, aspectRatio: 219 / 249 },
  figures: { marginTop: SPACE.xs, gap: SPACE.xxs },
});
