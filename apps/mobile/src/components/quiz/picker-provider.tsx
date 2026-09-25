import { useRouter } from "expo-router";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { WASH_ALPHA } from "@/features/quiz/components/selection-wash";
import { useBarredBackGestures } from "@/features/quiz/use-barred-back-gestures";
import { type ColorCrossFade, useColorCrossFade } from "@/features/quiz/use-color-cross-fade";
import type { ThemeWithCount } from "@/types/quiz";

type PickerContextValue = {
  selected: ThemeWithCount | null;
  select: (theme: ThemeWithCount) => void;
  leave: () => void;
  wash: ColorCrossFade;
};

// Both picker tabs read one selection, so the layout holds it and the tabs consume it here.
const PickerContext = createContext<PickerContextValue | null>(null);

export const PickerProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeWithCount | null>(null);
  const leave = useBarredBackGestures(() => router.back());
  const wash = useColorCrossFade(selected ? `${selected.category.color}${WASH_ALPHA}` : null);

  return (
    <PickerContext.Provider value={{ selected, select: setSelected, leave, wash }}>
      {children}
    </PickerContext.Provider>
  );
};

export function usePicker(): PickerContextValue {
  const value = useContext(PickerContext);
  if (!value) {
    throw new Error("usePicker must be used inside a PickerProvider");
  }
  return value;
}
