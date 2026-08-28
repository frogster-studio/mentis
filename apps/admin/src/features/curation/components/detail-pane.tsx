import type { Authoring, Category, Question, Theme } from "../types";
import { CategoryForm } from "./category-form";
import { Column } from "./column";
import { QuestionForm } from "./question-form";
import { ThemeDetail } from "./theme-detail";

interface DetailPaneProps {
  category?: Category;
  theme?: Theme;
  question?: Question;
  themes: Theme[];
  isCategoryVisible: boolean;
  categoryThemeCount: number | null;
  authoring: Authoring;
  onDirtyChange: (isDirty: boolean) => void;
  onCategorySaved: (category: Category) => void;
  onCategoryDeleted: () => void;
  onQuestionSaved: (question: Question) => void;
  onQuestionDeleted: () => void;
}

export const DetailPane = ({
  category,
  theme,
  question,
  themes,
  isCategoryVisible,
  categoryThemeCount,
  authoring,
  onDirtyChange,
  onCategorySaved,
  onCategoryDeleted,
  onQuestionSaved,
  onQuestionDeleted,
}: DetailPaneProps) => {
  const showsQuestionForm = authoring === "question" || question !== undefined;
  const showsCategoryForm =
    !showsQuestionForm && (authoring === "category" || (category !== undefined && !theme));
  const showsThemeDetail = !showsQuestionForm && !showsCategoryForm && theme !== undefined;

  return (
    <Column
      title="Details"
      isEmpty={!showsQuestionForm && !showsCategoryForm && !showsThemeDetail}
      emptyLabel="Select a Category, a Theme or a Question to see it here."
    >
      <div className="flex flex-col gap-5 p-4">
        {showsQuestionForm ? (
          <QuestionForm
            key={authoring === "question" ? "new-question" : question?.id}
            question={authoring === "question" ? undefined : question}
            themes={themes}
            selectedThemeId={theme?.id ?? null}
            onDirtyChange={onDirtyChange}
            onSaved={onQuestionSaved}
            onDeleted={onQuestionDeleted}
          />
        ) : null}
        {showsCategoryForm ? (
          <CategoryForm
            key={authoring === "category" ? "new-category" : category?.id}
            category={authoring === "category" ? undefined : category}
            isVisible={isCategoryVisible}
            themeCount={categoryThemeCount}
            onDirtyChange={onDirtyChange}
            onSaved={onCategorySaved}
            onDeleted={onCategoryDeleted}
          />
        ) : null}
        {showsThemeDetail ? <ThemeDetail theme={theme} category={category} /> : null}
      </div>
    </Column>
  );
};
