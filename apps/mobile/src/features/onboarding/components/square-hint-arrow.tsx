import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/theme/tokens";

// The mockup's drawing, at its own size: a long hand-drawn arrow curving up to the Carré switch.
export const SQUARE_HINT_ARROW_WIDTH = 24;
export const SQUARE_HINT_ARROW_HEIGHT = 150;
const VIEWBOX = "0 0 23.194 149.812";
const STROKE_WIDTH = 2;
const SHAFT = "M22.3177 149.33C-9.12257 92.1637 -1.0642 30.03 16.3067 2.28172";
const HEAD = "M11.3067 2.78173L16.64 1.28173L17.3067 7.28173";

export const SquareHintArrow = () => {
  return (
    <Svg
      width={SQUARE_HINT_ARROW_WIDTH}
      height={SQUARE_HINT_ARROW_HEIGHT}
      viewBox={VIEWBOX}
      fill="none"
    >
      <Path d={SHAFT} stroke={COLORS.ink} strokeWidth={STROKE_WIDTH} />
      <Path d={HEAD} stroke={COLORS.ink} strokeWidth={STROKE_WIDTH} />
    </Svg>
  );
};
