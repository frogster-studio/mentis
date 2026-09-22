import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { SelectionWash, WASH_ALPHA } from "@/features/quiz/components/selection-wash";
import { usePicker } from "@/features/quiz/picker-context";
import { useColorCrossFade } from "@/features/quiz/use-color-cross-fade";

export const CustomPickerScreen = () => {
  const { selected } = usePicker();
  const wash = useColorCrossFade(selected ? `${selected.category.color}${WASH_ALPHA}` : null);

  return <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={<SelectionWash wash={wash} />} />;
};
