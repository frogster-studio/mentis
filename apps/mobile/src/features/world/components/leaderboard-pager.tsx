import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon-name";
import {
  PAGER_FIRST_LABEL,
  PAGER_LAST_LABEL,
  PAGER_MY_PAGE_LABEL,
  PAGER_NEXT_LABEL,
  PAGER_PREVIOUS_LABEL,
} from "@/features/world/constants";
import { FIRST_PAGE } from "@/features/world/pager";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, SPACE } from "@/theme/tokens";

export interface LeaderboardPagerProps {
  page: number;
  pageCount: number;
  // The Standing's page while the caller is ranked, null otherwise.
  myPage: number | null;
  onPage: (page: number) => void;
}

export const LeaderboardPager = ({ page, pageCount, myPage, onPage }: LeaderboardPagerProps) => {
  const atFirst = page <= FIRST_PAGE;
  const atLast = page >= pageCount;

  return (
    <Card onPress={null}>
      <View style={styles.pager}>
        <View style={styles.steps}>
          <PagerStep
            label={PAGER_FIRST_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={atFirst}
            onPress={() => onPage(FIRST_PAGE)}
          />
          <PagerStep
            label={null}
            icon="chevron-left"
            accessibilityLabel={PAGER_PREVIOUS_LABEL}
            disabled={atFirst}
            onPress={() => onPage(page - 1)}
          />
          <Text style={styles.position}>{`${page} / ${pageCount}`}</Text>
          <PagerStep
            label={null}
            icon="chevron-right"
            accessibilityLabel={PAGER_NEXT_LABEL}
            disabled={atLast}
            onPress={() => onPage(page + 1)}
          />
          <PagerStep
            label={PAGER_LAST_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={atLast}
            onPress={() => onPage(pageCount)}
          />
        </View>

        {myPage !== null && myPage !== page ? (
          <View style={styles.myPage}>
            <PagerStep
              label={PAGER_MY_PAGE_LABEL}
              icon={null}
              accessibilityLabel={null}
              disabled={false}
              onPress={() => onPage(myPage)}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
};

interface PagerStepProps {
  label: string | null;
  icon: IconName | null;
  accessibilityLabel: string | null;
  disabled: boolean;
  onPress: () => void;
}

const PagerStep = ({ label, icon, accessibilityLabel, disabled, onPress }: PagerStepProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label ?? accessibilityLabel ?? undefined}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      {icon === null ? (
        <Text style={[styles.stepLabel, disabled && styles.inert]}>{label}</Text>
      ) : (
        <MaterialIcons
          name={icon}
          size={CONTROL_ICON_SIZE}
          color={disabled ? COLORS.neutral : COLORS.ink}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pager: {
    gap: SPACE.sm,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  step: {
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.xs,
  },
  pressed: PRESSED,
  stepLabel: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  inert: {
    color: COLORS.neutral,
  },
  position: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
  myPage: {
    alignItems: "center",
  },
});
