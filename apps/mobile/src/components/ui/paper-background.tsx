import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { COLORS } from "@/theme/tokens";

const CELL_WIDTH = 22;
const CELL_HEIGHT = 23.55;

export const PaperBackground = () => {
  // Both tab scenes stay mounted, so on web the two pattern ids must not collide.
  const patternId = `paper-grid-${useId().replace(/\W/g, "")}`;

  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <Pattern
          id={patternId}
          width={CELL_WIDTH}
          height={CELL_HEIGHT}
          patternUnits="userSpaceOnUse"
        >
          <Line x1={0.5} y1={0} x2={0.5} y2={CELL_HEIGHT} stroke={COLORS.grid} strokeWidth={1} />
          <Line x1={0} y1={0.5} x2={CELL_WIDTH} y2={0.5} stroke={COLORS.grid} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${patternId})`} />
    </Svg>
  );
};
