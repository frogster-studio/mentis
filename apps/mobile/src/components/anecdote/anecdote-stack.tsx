import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { AnecdoteSheet } from "@/components/anecdote/anecdote-sheet";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

const EDGE_DROP = SPACE.xs;
const EDGE_INSET = SPACE.sm;

export interface AnecdoteStackProps {
  // Top first: the top sheet's colour, then the edges beneath it, nearest first.
  colors: string[];
}

export const AnecdoteStack = ({ children, colors }: PropsWithChildren<AnecdoteStackProps>) => {
  const [topColor, ...edgeColors] = colors;
  const deepestFirst = edgeColors.map((color, index) => ({ color, depth: index + 1 })).reverse();

  return (
    <View style={{ marginBottom: edgeColors.length * EDGE_DROP }}>
      {deepestFirst.map(({ color, depth }) => (
        <FastSquircleView
          key={depth}
          style={[
            styles.sheet,
            styles.edge,
            {
              top: depth * EDGE_DROP,
              bottom: -depth * EDGE_DROP,
              left: depth * EDGE_INSET,
              right: depth * EDGE_INSET,
              ...gradient(`radial-gradient(farthest-corner at 50% 150%, ${color}, ${color})`),
            },
          ]}
        />
      ))}
      <AnecdoteSheet color={topColor}>{children}</AnecdoteSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  // The stroke keeps two sheets of one colour apart.
  sheet: { borderRadius: RADIUS.base, borderWidth: 1, borderColor: COLORS.stroke },
  edge: { position: "absolute" },
});
