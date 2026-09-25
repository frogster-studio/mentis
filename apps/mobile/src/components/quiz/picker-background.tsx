import { usePicker } from "@/components/quiz/picker-provider";
import { PaperBackground } from "@/components/ui/paper-background";
import { SelectionWash } from "@/features/quiz/components/selection-wash";

export const PickerBackground = () => {
  const { wash } = usePicker();

  return (
    <>
      <PaperBackground isDark={false} />
      <SelectionWash wash={wash} />
    </>
  );
};
