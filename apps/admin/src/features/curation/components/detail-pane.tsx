import type { Category, Question, Theme } from "../types";
import { CategoryDetail } from "./category-detail";
import { Column } from "./column";
import { QuestionForm } from "./question-form";
import { ThemeDetail } from "./theme-detail";

interface DetailPaneProps {
  category?: Category;
  theme?: Theme;
  question?: Question;
  themes: Theme[];
  isCategoryVisible: boolean;
  isCreatingQuestion: boolean;
  onQuestionDirtyChange: (isDirty: boolean) => void;
  onQuestionSaved: (question: Question) => void;
  onQuestionDeleted: () => void;
}

export const DetailPane = ({
  category,
  theme,
  question,
  themes,
  isCategoryVisible,
  isCreatingQuestion,
  onQuestionDirtyChange,
  onQuestionSaved,
  onQuestionDeleted,
}: DetailPaneProps) => {
  const authored = isCreatingQuestion ? undefined : question;
  const isAuthoring = isCreatingQuestion || question !== undefined;
  const hasSelection = isAuthoring || Boolean(theme ?? category);

  return (
    <Column
      title="Details"
      isEmpty={!hasSelection}
      emptyLabel="Select a Category, a Theme or a Question to see it here."
    >
      <div className="flex flex-col gap-5 p-4">
        {isAuthoring ? (
          <QuestionForm
            key={authored?.id ?? "new-question"}
            question={authored}
            themes={themes}
            selectedThemeId={theme?.id ?? null}
            onDirtyChange={onQuestionDirtyChange}
            onSaved={onQuestionSaved}
            onDeleted={onQuestionDeleted}
          />
        ) : null}
        {!isAuthoring && theme ? <ThemeDetail theme={theme} category={category} /> : null}
        {!isAuthoring && !theme && category ? (
          <CategoryDetail category={category} isVisible={isCategoryVisible} />
        ) : null}
      </div>
    </Column>
  );
};
