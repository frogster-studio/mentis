import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Squircle } from "@/components/ui/squircle";
import {
  POINTS_UNIT,
  RESULTS_ANSWER_LABEL,
  RESULTS_CANONICAL_LABEL,
  RESULTS_NO_ANSWER,
} from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, RADIUS, SPACE } from "@/theme/tokens";

const MENU_ICON_SIZE = 20;
const BADGE_HEIGHT = TEXT.label.lineHeight + SPACE.xs * 2;
// « # 10 / 10 » measures 50.5 beside the badge's own padding.
const RAIL_WIDTH = 72;
const RAIL_LINE_WIDTH = 1;

export interface ResultCardProps {
  position: number;
  total: number;
  questionText: string;
  canonicalAnswer: string;
  answerText: string;
  correct: boolean;
  points: number;
}

export const ResultCard = ({
  position,
  total,
  questionText,
  canonicalAnswer,
  answerText,
  correct,
  points,
}: ResultCardProps) => {
  const isEmpty = answerText.trim() === "";
  const accent = correct ? COLORS.success : COLORS.danger;

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        {/* A one-pixel window over a wider dashed box: Android only dashes a uniform border. */}
        <View style={styles.line}>
          <View style={styles.dash} />
        </View>
        <Squircle
          radius={RADIUS.sm}
          corners="all"
          color={accent}
          borderColor={null}
          borderWidth={null}
          style={styles.badge}
        >
          <Text style={styles.badgeLabel}>{`# ${position} / ${total}`}</Text>
        </Squircle>
      </View>
      <View style={styles.card}>
        <Card onPress={null}>
          <View style={styles.head}>
            <Text style={styles.question}>{questionText}</Text>
            <Pressable style={({ pressed }) => pressed && styles.pressed} hitSlop={8}>
              <MaterialIcons name="more-vert" size={MENU_ICON_SIZE} color={COLORS.ink} />
            </Pressable>
          </View>
          <Text style={styles.canonical}>
            {RESULTS_CANONICAL_LABEL} {canonicalAnswer}
          </Text>
          <View style={styles.divider} />
          <View style={styles.answerRow}>
            <Text style={[styles.answer, isEmpty ? styles.answerEmpty : { color: accent }]}>
              {isEmpty ? RESULTS_NO_ANSWER : `${RESULTS_ANSWER_LABEL} ${answerText}`}
            </Text>
            <Text style={[styles.points, { color: accent }]}>
              {points > 0 ? "+" : ""}
              {points} {POINTS_UNIT}
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.sm,
  },
  rail: {
    width: RAIL_WIDTH,
    alignSelf: "stretch",
  },
  // Runs into the gap under the row, so the spine reads as one line down the whole list.
  line: {
    position: "absolute",
    left: RAIL_WIDTH / 2,
    top: BADGE_HEIGHT,
    bottom: -SPACE.md,
    width: RAIL_LINE_WIDTH,
    overflow: "hidden",
  },
  dash: {
    flex: 1,
    width: RAIL_LINE_WIDTH * 2,
    borderWidth: RAIL_LINE_WIDTH,
    borderStyle: "dashed",
    borderColor: COLORS.neutral,
  },
  badge: {
    height: BADGE_HEIGHT,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: SPACE.sm,
  },
  badgeLabel: {
    ...TEXT.label,
    color: COLORS.card,
  },
  card: {
    flex: 1,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
  },
  question: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.inkMuted,
  },
  pressed: PRESSED,
  canonical: {
    ...TEXT.captionStrong,
    marginTop: SPACE.xxs,
    color: COLORS.ink,
  },
  // Bleeds past the card's padding, so the verdict half reads as its own row.
  divider: {
    height: 1,
    marginVertical: SPACE.md,
    marginHorizontal: -SPACE.lg,
    backgroundColor: COLORS.stroke,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  answer: {
    ...TEXT.caption,
    flex: 1,
  },
  answerEmpty: {
    color: COLORS.inkMuted,
  },
  points: {
    ...TEXT.captionStrong,
  },
});
