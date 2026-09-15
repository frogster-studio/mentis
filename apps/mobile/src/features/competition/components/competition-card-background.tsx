import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { ClipPath, Defs, Image, LinearGradient, Rect, Stop } from "react-native-svg";
import { COLORS, RADIUS } from "@/theme/tokens";

export interface CompetitionCardBackgroundProps {
  color: string;
  isFinished: boolean;
}

export const CompetitionCardBackground = ({
  color,
  isFinished,
}: CompetitionCardBackgroundProps) => {
  const id = `competition-${useId().replace(/\W/g, "")}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <ClipPath id={`${id}-clip`}>
          <Rect width="100%" height="100%" rx={RADIUS.base} />
        </ClipPath>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={COLORS.background} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" rx={RADIUS.base} fill={`url(#${id})`} />
      {isFinished ? (
        <Image
          href={require("../../../../assets/images/competition/landscape.png")}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          opacity={0.13}
          clipPath={`url(#${id}-clip)`}
        />
      ) : null}
    </Svg>
  );
};
