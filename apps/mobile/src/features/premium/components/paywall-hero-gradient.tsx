import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { COLORS } from "@/theme/tokens";

// The premium hero is the app's only gradient, so its stops stay here rather than becoming roles.
const GRADIENT_STOPS = [
  { offset: "0", color: "#FFE798" },
  { offset: "0.5", color: "#FFCC7B" },
  { offset: "1", color: COLORS.primary },
] as const;

const GRADIENT_ID = "paywallHero";

export const PaywallHeroGradient = () => {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          {GRADIENT_STOPS.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
    </Svg>
  );
};
