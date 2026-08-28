import type { Category, Question, Theme } from "../types";
import { CategoryDetail } from "./category-detail";
import { Column } from "./column";
import { QuestionDetail } from "./question-detail";
import { ThemeDetail } from "./theme-detail";

interface DetailPaneProps {
  category?: Category;
  theme?: Theme;
  question?: Question;
  isCategoryVisible: boolean;
}

export const DetailPane = ({ category, theme, question, isCategoryVisible }: DetailPaneProps) => {
  const hasSelection = Boolean(question ?? theme ?? category);

  return (
    <Column
      title="Details"
      isEmpty={!hasSelection}
      emptyLabel="Select a Category, a Theme or a Question to see it here."
    >
      <div className="flex flex-col gap-5 p-4">
        {question ? <QuestionDetail question={question} theme={theme} /> : null}
        {!question && theme ? <ThemeDetail theme={theme} category={category} /> : null}
        {!question && !theme && category ? (
          <CategoryDetail category={category} isVisible={isCategoryVisible} />
        ) : null}
      </div>
    </Column>
  );
};
