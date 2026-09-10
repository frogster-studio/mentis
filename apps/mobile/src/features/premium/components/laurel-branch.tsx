import Svg, { Path } from "react-native-svg";
import {
  LAUREL_BRANCH_PATH,
  LAUREL_VIEWBOX_HEIGHT,
  LAUREL_VIEWBOX_WIDTH,
} from "@/features/premium/components/laurel-branch-paths";

export interface LaurelBranchProps {
  color: string;
  width: number;
  height: number;
}

export const LaurelBranch = ({ color, width, height }: LaurelBranchProps) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${LAUREL_VIEWBOX_WIDTH} ${LAUREL_VIEWBOX_HEIGHT}`}
      fill="none"
    >
      <Path fill={color} d={LAUREL_BRANCH_PATH} />
    </Svg>
  );
};
