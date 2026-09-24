import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { CategoryPill } from "@/components/category-pill";
import type { IconName } from "@/components/ui/icon-name";
import { SIGN_IN_TITLE } from "@/features/account/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const HERO = require("../../../../assets/images/sign-in-hero.jpg");
const MENTIS_WORDMARK = require("../../../../assets/images/sign-in/mentis-wordmark.svg");
const PILL_BADGE_SHADE_ALPHA = "1A";

const SCATTERED_PILLS = [
  { icon: "palette", left: "66%", top: "43%", rotate: "-4.1deg", color: COLORS.danger },
  {
    icon: "park",
    left: "21%",
    top: "51%",
    rotate: "5.88deg",
    color: COLORS.primary,
  },
  { icon: "sports-soccer", left: "15%", top: "68%", rotate: "-3.73deg", color: COLORS.neutral },
  { icon: "public", left: "64%", top: "72%", rotate: "7.3deg", color: COLORS.success },
] as const satisfies readonly {
  icon: IconName;
  left: string;
  top: string;
  rotate: string;
  color: string;
}[];

export const SignInHero = () => {
  return (
    <View style={styles.hero}>
      {/* Image + Mentis */}
      <View style={styles.heroContent}>
        <Text style={styles.title}>{SIGN_IN_TITLE}</Text>

        <Image source={MENTIS_WORDMARK} style={styles.wordmark} contentFit="contain" />

        <Image source={HERO} style={styles.heroImage} contentFit="cover" />
      </View>

      {SCATTERED_PILLS.map((pill) => (
        <View
          key={pill.icon}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <CategoryPill
            icon={pill.icon}
            color={pill.color}
            iconBg={`${COLORS.ink}${PILL_BADGE_SHADE_ALPHA}`}
            label={null}
          />
        </View>
      ))}
      <View style={styles.wordmarkSlot}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    flexShrink: 1,
  },
  heroContent: {
    overflow: "hidden",
    borderRadius: RADIUS.xl,
  },
  heroImage: { width: "100%", aspectRatio: 1230 / 1706 },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: SPACE.xl,
    position: "absolute",
    zIndex: 1,
    top: 0,
    alignSelf: "center",
  },
  pill: {
    position: "absolute",
  },
  wordmarkSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  wordmark: {
    aspectRatio: 357 / 100,
    width: "85%",
    position: "absolute",
    zIndex: 10,
    alignSelf: "center",
    bottom: 0,
  },
});
