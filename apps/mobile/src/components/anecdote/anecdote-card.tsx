import { StyleSheet, View } from "react-native";
import { AnecdoteContent } from "@/components/anecdote/anecdote-content";
import { AnecdoteSkeleton } from "@/components/anecdote/anecdote-skeleton";
import { AnecdoteStack } from "@/components/anecdote/anecdote-stack";
import { useAnecdoteDaySet } from "@/features/anecdote/api";
import { ANECDOTE_COUNT } from "@/features/anecdote/constants";
import { pileColors, topAnecdote } from "@/features/anecdote/day-set";
import { useAnecdoteStore } from "@/features/anecdote/store";
import { GUTTER } from "@/theme/tokens";

const SKELETON_PILE_COLORS = pileColors(ANECDOTE_COUNT);

export const AnecdoteCard = () => {
  const { daySet, isPending } = useAnecdoteDaySet();
  const dismiss = useAnecdoteStore((state) => state.dismiss);

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
  if (daySet === null || anecdote === null) {
    return null;
  }

  return (
    <View style={styles.root}>
      <AnecdoteStack colors={pileColors(daySet.anecdotes.length - daySet.dismissedCount)}>
        <AnecdoteContent
          key={anecdote.id}
          anecdote={anecdote}
          position={daySet.dismissedCount}
          total={daySet.anecdotes.length}
          onDismiss={dismiss}
        />
      </AnecdoteStack>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { marginHorizontal: GUTTER, marginTop: GUTTER },
});
