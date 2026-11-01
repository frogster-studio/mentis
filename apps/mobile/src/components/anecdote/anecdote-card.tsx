import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AnecdoteCollapsingSlot } from "@/components/anecdote/anecdote-collapsing-slot";
import { AnecdoteContent } from "@/components/anecdote/anecdote-content";
import { AnecdotePeelingSheet } from "@/components/anecdote/anecdote-peeling-sheet";
import { AnecdoteSkeleton } from "@/components/anecdote/anecdote-skeleton";
import { ANECDOTE_PILE_DEPTH, AnecdoteStack } from "@/components/anecdote/anecdote-stack";
import { useAnecdoteDaySet } from "@/features/anecdote/api";
import {
  ANECDOTE_COLLAPSE_MS,
  ANECDOTE_COUNT,
  ANECDOTE_EXIT_MS,
} from "@/features/anecdote/constants";
import { type Anecdote, pileColors, topAnecdote } from "@/features/anecdote/day-set";
import { useAnecdoteStore } from "@/features/anecdote/store";
import { GUTTER } from "@/theme/tokens";

const SKELETON_PILE_COLORS = pileColors(ANECDOTE_COUNT);

type Peel = { anecdote: Anecdote; position: number; total: number };

export const AnecdoteCard = () => {
  const { daySet, isPending } = useAnecdoteDaySet();
  const [peel, setPeel] = useState<Peel | null>(null);
  const [collapsingHeight, setCollapsingHeight] = useState<number | null>(null);
  const slotHeight = useRef(0);

  useEffect(() => {
    if (peel === null) {
      return;
    }
    const timeout = setTimeout(() => {
      setPeel(null);
      if (peel.position === peel.total - 1) {
        setCollapsingHeight(slotHeight.current);
      }
    }, ANECDOTE_EXIT_MS);
    return () => clearTimeout(timeout);
  }, [peel]);

  useEffect(() => {
    if (collapsingHeight === null) {
      return;
    }
    const timeout = setTimeout(() => setCollapsingHeight(null), ANECDOTE_COLLAPSE_MS);
    return () => clearTimeout(timeout);
  }, [collapsingHeight]);

  if (isPending) {
    return (
      <View style={styles.root}>
        <AnecdoteStack colors={SKELETON_PILE_COLORS}>
          <AnecdoteSkeleton />
        </AnecdoteStack>
      </View>
    );
  }

  const anecdote = daySet === null ? null : topAnecdote(daySet);
  if (anecdote === null && peel === null) {
    return collapsingHeight === null ? null : <AnecdoteCollapsingSlot height={collapsingHeight} />;
  }

  // The store moves on at the tap; the dismissed Anecdote peels off over the next one.
  const dismiss = () => {
    if (daySet === null || anecdote === null) {
      return;
    }
    setPeel({ anecdote, position: daySet.dismissedCount, total: daySet.anecdotes.length });
    useAnecdoteStore.getState().dismiss();
  };

  return (
    <View
      style={[styles.root, peel !== null && styles.inert]}
      onLayout={(event) => {
        slotHeight.current = event.nativeEvent.layout.height;
      }}
    >
      {daySet === null || anecdote === null ? null : (
        <AnecdoteStack colors={pileColors(daySet.anecdotes.length - daySet.dismissedCount)}>
          <AnecdoteContent
            key={anecdote.id}
            anecdote={anecdote}
            position={daySet.dismissedCount}
            total={daySet.anecdotes.length}
            onDismiss={dismiss}
          />
        </AnecdoteStack>
      )}
      {peel === null ? null : (
        <AnecdotePeelingSheet key={peel.anecdote.id} coversNextSheet={anecdote !== null}>
          <AnecdoteContent
            anecdote={peel.anecdote}
            position={peel.position}
            total={peel.total}
            onDismiss={dismiss}
          />
        </AnecdotePeelingSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { marginHorizontal: GUTTER, marginTop: GUTTER, paddingBottom: ANECDOTE_PILE_DEPTH },
  inert: { pointerEvents: "none" },
});
