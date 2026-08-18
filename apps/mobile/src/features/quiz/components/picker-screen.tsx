import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useThemes } from "@/features/quiz/api";
import { ThemeCard } from "@/features/quiz/components/theme-card";
import { PICKER_ERROR, PICKER_TITLE } from "@/features/quiz/constants";
import { drawThemes } from "@/features/quiz/draw";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export function PickerScreen() {
  const router = useRouter();
  const { data, isPending, isError, isFetching, refetch } = useThemes();
  // One Draw per visit: recomputed on every mount, stable while the screen stays up.
  const draw = useMemo(() => (data ? drawThemes(data, Math.random) : []), [data]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>{PICKER_TITLE}</Text>
      {/* A retry leaves the query in "error" until it lands, so the spinner stands in for it. */}
      {isPending || (isError && isFetching) ? (
        <ScreenLoading />
      ) : isError ? (
        <ScreenError message={PICKER_ERROR} onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {draw.map((theme) => (
            <ThemeCard
              key={theme.id}
              name={theme.name}
              onPress={() =>
                router.push({
                  pathname: "/session/[themeId]",
                  params: { themeId: theme.id, name: theme.name },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...TEXT.screenTitle,
    color: COLORS.ink,
    textAlign: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  list: {
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});
