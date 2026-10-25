import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const EDGE_DROP = SPACE.xs;
const EDGE_INSET = SPACE.sm;

export interface QuickHomeQuestionStackProps {
  topColor: string;
  // Nearest first: the tile right under the top one leads.
  edgeColors: string[];
}

export const QuickHomeQuestionStack = ({
  children,
  topColor,
  edgeColors,
}: PropsWithChildren<QuickHomeQuestionStackProps>) => {
  const deepestFirst = edgeColors.map((color, index) => ({ color, depth: index + 1 })).reverse();

  return (
    <View style={{ marginBottom: edgeColors.length * EDGE_DROP }}>
      {deepestFirst.map(({ color, depth }) => (
        <FastSquircleView
          key={depth}
          style={[
            styles.tile,
            styles.edge,
            {
              top: depth * EDGE_DROP,
              bottom: -depth * EDGE_DROP,
              left: depth * EDGE_INSET,
              right: depth * EDGE_INSET,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      <FastSquircleView style={[styles.tile, styles.top, { backgroundColor: topColor }]}>
        {children}
      </FastSquircleView>
    </View>
  );
};

const styles = StyleSheet.create({
  // The stroke keeps two tiles of one colour apart.
  tile: { borderRadius: RADIUS.base, borderWidth: 1, borderColor: COLORS.stroke },
  edge: { position: "absolute" },
  top: { padding: SPACE.lg },
});
