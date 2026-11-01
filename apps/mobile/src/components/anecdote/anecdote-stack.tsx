import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { AnecdoteSheet } from "@/components/anecdote/anecdote-sheet";
import { ANECDOTE_COUNT } from "@/features/anecdote/constants";
import { RADIUS, SPACE } from "@/theme/tokens";

const EDGE_DROP = SPACE.xs;
const EDGE_INSET = SPACE.sm;

// The slot keeps the full pile's depth, so the Practice card stays put as the pile thins.
export const ANECDOTE_PILE_DEPTH = (ANECDOTE_COUNT - 1) * EDGE_DROP;

export interface AnecdoteStackProps {
  // Top first: the top sheet's colour, then the edges beneath it, nearest first.
  colors: string[];
}

export const AnecdoteStack = ({ children, colors }: PropsWithChildren<AnecdoteStackProps>) => {
  const [topColor, ...edgeColors] = colors;
  const deepestFirst = edgeColors.map((color, index) => ({ color, depth: index + 1 })).reverse();

  return (
    <View>
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
