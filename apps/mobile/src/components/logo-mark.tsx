import Svg, { Path } from "react-native-svg";
import {
  MARK_RAYS_PATH,
  MARK_STARBURST_PATH,
  MARK_VIEWBOX_SIZE,
} from "@/components/logo-mark-paths";

export type LogoMarkProps = {
  color: string;
  size: number;
};

export function LogoMark({ color, size }: LogoMarkProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_VIEWBOX_SIZE} ${MARK_VIEWBOX_SIZE}`}
      fill="none"
    >
      <Path fill={color} d={MARK_RAYS_PATH} />
      <Path fill={color} d={MARK_STARBURST_PATH} />
    </Svg>
  );
}
