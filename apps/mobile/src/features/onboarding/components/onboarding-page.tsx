import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export interface OnboardingPageProps {
  hero: ReactNode;
  caption: string;
  figure: ReactNode;
  title: string;
  action: ReactNode;
}

export const OnboardingPage = ({ hero, caption, figure, title, action }: OnboardingPageProps) => {
  return (
    <View style={styles.page}>
      {hero}
      <View style={styles.copy}>
        <Text style={styles.caption}>{caption}</Text>
        {figure}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: GUTTER,
    paddingTop: SPACE.xl,
  },
  copy: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.lg,
  },
  caption: {
    ...TEXT.body,
    color: COLORS.ink,
    textAlign: "center",
  },
  title: {
    ...TEXT.sectionTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  action: {
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
});
