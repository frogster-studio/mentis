import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryPill } from "@/components/category-pill";
import type { IconName } from "@/components/ui/icon-name";
import { SIGN_IN_TITLE } from "@/features/account/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const HERO = require("../../../../assets/images/sign-in/sign-in-image.webp");
const MENTIS_WORDMARK = require("../../../../assets/images/sign-in/mentis-wordmark.svg");
const PILL_BADGE_SHADE_ALPHA = "1A";

const SCATTERED_PILLS = [
  {
    icon: "palette",
    left: "66%",
    top: "43%",
    rotate: "-4.1deg",
    color: "#B7A3E9",
    bgColor: "#DCD7E9",
  },
  {
    icon: "park",
    left: "21%",
    top: "51%",
    rotate: "5.88deg",
    color: "#83D3AF",
    bgColor: "#BDEDD7",
  },
  {
    icon: "sports-soccer",
    left: "15%",
    top: "68%",
    rotate: "-3.73deg",
    color: "#FFAA82",
    bgColor: "#FFE4D7",
  },
  {
    icon: "public",
    left: "64%",
    top: "72%",
    rotate: "7.3deg",
    color: "#8AD0FF",
    bgColor: "#DAF0FF",
  },
] as const satisfies readonly {
  icon: IconName;
  left: string;
  top: string;
  rotate: string;
  color: string;
  bgColor: string;
}[];

export const SignInHero = () => {
  return (
    <View style={styles.hero}>
      {/* Image + Mentis */}
      <FastSquircleView style={styles.heroContent}>
        <Text style={styles.title}>{SIGN_IN_TITLE}</Text>

        <Image source={MENTIS_WORDMARK} style={styles.wordmark} contentFit="contain" />

        <Image source={HERO} style={styles.heroImage} contentFit="cover" />
      </FastSquircleView>

      {SCATTERED_PILLS.map((pill) => (
        <View
          key={pill.icon}
          style={[
            styles.pill,
            { left: pill.left, top: pill.top, transform: [{ rotate: pill.rotate }] },
          ]}
        >
          <CategoryPill icon={pill.icon} color={pill.bgColor} iconBg={pill.color} label={null} />
        </View>
      ))}
      <View style={styles.wordmarkSlot}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: { padding: SPACE.xs },
  heroContent: {
    overflow: "hidden",
    borderRadius: RADIUS.lg,
    borderBottomEndRadius: RADIUS.base,
    borderBottomStartRadius: RADIUS.base,
  },
  heroImage: { width: "100%", height: "100%" },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: SPACE.xl + SPACE.xs,
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
