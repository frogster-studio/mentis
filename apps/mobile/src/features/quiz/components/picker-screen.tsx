import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ui/screen-container";
import { useThemes } from "@/features/quiz/api";
import { ThemeCard } from "@/features/quiz/components/theme-card";
import { PICKER_ERROR, PICKER_TITLE } from "@/features/quiz/constants";
import { drawThemes } from "@/features/quiz/draw";
import { COLORS } from "@/theme/tokens";

export function PickerScreen() {
  const router = useRouter();
  const { data, isPending, isError } = useThemes();
  // One Draw per visit: recomputed on every mount, stable while the screen stays up.
  const draw = useMemo(() => (data ? drawThemes(data, Math.random) : []), [data]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>{PICKER_TITLE}</Text>
      {isPending || isError ? (
        <View style={styles.centered}>
          {isPending ? <ActivityIndicator color={COLORS.primary} size="large" /> : null}
          {isError ? <Text style={styles.error}>{PICKER_ERROR}</Text> : null}
        </View>
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
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  list: {
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  error: {
    color: COLORS.inkMuted,
    fontSize: 16,
    textAlign: "center",
  },
});
