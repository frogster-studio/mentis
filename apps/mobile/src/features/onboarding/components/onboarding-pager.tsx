import { StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { useBottomChromeGap } from "@/components/ui/screen-container";
import { Squircle } from "@/components/ui/squircle";
import {
  ONBOARDING_BACK_LABEL,
  ONBOARDING_NEXT_LABEL,
  ONBOARDING_PAGE_SEPARATOR,
} from "@/features/onboarding/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS, SPACE } from "@/theme/tokens";

export interface OnboardingPagerProps {
  index: number;
  count: number;
  onBack: () => void;
  onNext: () => void;
}

export const OnboardingPager = ({ index, count, onBack, onNext }: OnboardingPagerProps) => {
  const bottomGap = useBottomChromeGap();
  const isFirst = index === 0;
  const isLast = index === count - 1;

  return (
    <View style={[styles.bar, { paddingBottom: bottomGap }]}>
      {/* The slots stay when empty, so the counter never drifts off centre on the first or last page. */}
      <View style={styles.slot}>
        {isFirst ? null : (
          <NewButton
            layout="hug"
            shape="full"
            tone="default"
            icon="arrow-left"
            label={null}
            accessibilityLabel={ONBOARDING_BACK_LABEL}
            onPress={onBack}
            disabled={false}
            pending={false}
          />
        )}
      </View>
      <Squircle
        radius={RADIUS.sm}
        corners="all"
        color={COLORS.ink}
        borderColor={null}
        borderWidth={null}
        style={styles.counter}
      >
        <Text style={styles.count}>{`${index + 1}${ONBOARDING_PAGE_SEPARATOR}${count}`}</Text>
      </Squircle>
      <View style={styles.slot}>
        {isLast ? null : (
          <NewButton
            layout="hug"
            shape="full"
            tone="default"
            icon="arrow-right"
            label={null}
            accessibilityLabel={ONBOARDING_NEXT_LABEL}
            onPress={onNext}
            disabled={false}
            pending={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xl,
  },
  slot: {
    width: CONTROL_SQUARE_SIZE,
  },
  counter: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xxs,
  },
  count: {
    ...TEXT.label,
    color: COLORS.face,
  },
});
