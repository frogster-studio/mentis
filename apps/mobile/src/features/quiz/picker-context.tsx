import { createContext, useContext } from "react";
import type { ThemeWithCount } from "@/types/quiz";

type PickerContextValue = {
  selected: ThemeWithCount | null;
  select: (theme: ThemeWithCount) => void;
  leave: () => void;
};

// Both picker tabs read one selection, so the layout holds it and the tabs consume it here.
const PickerContext = createContext<PickerContextValue | null>(null);

export const PickerProvider = PickerContext.Provider;

export function usePicker(): PickerContextValue {
  const value = useContext(PickerContext);
  if (!value) {
    throw new Error("usePicker must be used inside a PickerProvider");
  }
  return value;
}
