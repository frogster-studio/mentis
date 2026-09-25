import { useRouter } from "expo-router";
import { usePicker } from "@/components/quiz/picker-provider";
import { SwipableButton } from "@/features/quiz/components/swipable-button";

export const PickerStartButton = () => {
  const router = useRouter();
  const { selected } = usePicker();

  const onStart = () => {
    if (!selected) {
      return;
    }
    router.push({
      pathname: "/session/[themeId]",
      params: {
        themeId: selected.id,
        name: selected.name,
        imageUrl: selected.imageUrl,
        categoryId: selected.category.id,
        categoryName: selected.category.name,
        categoryColor: selected.category.color,
        categorySecondaryColor: selected.category.secondaryColor,
        categoryIcon: selected.category.icon,
      },
    });
  };

  return <SwipableButton color={selected?.category.color ?? null} start={onStart} />;
};
