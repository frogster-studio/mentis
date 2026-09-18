import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/theme/tokens";

// The mockup's drawing, at its own size: a short hand-drawn arrow curving up to the answer field.
export const CASH_HINT_ARROW_WIDTH = 22;
export const CASH_HINT_ARROW_HEIGHT = 66;
const VIEWBOX = "0 0 21.9937 65.3834";
const STROKE_WIDTH = 2;
const SHAFT = "M1.18132 65.2817C0.216273 55.8435 2.6289 30.03 19.9998 2.28173";
const HEAD = "M14.9998 2.78173L20.3331 1.28173L20.9998 7.28173";

export const CashHintArrow = () => {
  return (
    <Svg
      width={CASH_HINT_ARROW_WIDTH}
      height={CASH_HINT_ARROW_HEIGHT}
      viewBox={VIEWBOX}
      fill="none"
    >
      <Path d={SHAFT} stroke={COLORS.ink} strokeWidth={STROKE_WIDTH} />
      <Path d={HEAD} stroke={COLORS.ink} strokeWidth={STROKE_WIDTH} />
    </Svg>
  );
};
