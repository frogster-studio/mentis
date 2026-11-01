import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { AnecdoteSheet } from "@/components/anecdote/anecdote-sheet";
import { RADIUS, SPACE } from "@/theme/tokens";

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
      <AnecdoteSheet color={topColor}>{children}</AnecdoteSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  edge: { position: "absolute", borderRadius: RADIUS.base },
});
