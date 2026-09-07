import { StyleSheet, Text, View } from "react-native";
import {
  COMPETITION_BEST_OF_NOTE,
  COMPETITION_OTHER_ATTEMPT_LABEL,
} from "@/features/competition/constants";
import { ResultsHomeLink } from "@/features/quiz/components/results-home-link";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export interface OtherAttempt {
  score: number;
  onShow: () => void;
}

export interface OtherAttemptLinkProps {
  attempt: OtherAttempt;
}

export const OtherAttemptLink = ({ attempt }: OtherAttemptLinkProps) => {
  return (
    <View>
      <Text style={styles.note}>{COMPETITION_BEST_OF_NOTE}</Text>
      <ResultsHomeLink
        label={`${COMPETITION_OTHER_ATTEMPT_LABEL} · ${attempt.score} ${POINTS_UNIT}`}
        onPress={attempt.onShow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  note: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
