import type { AdminThemeResponse } from "@mentis/contracts/admin";

import type { Authoring, Category, Question, Theme } from "../types";
import { CategoryForm } from "./category-form";
import { Column } from "./column";
import { QuestionForm } from "./question-form";
import { ThemeForm } from "./theme-form";

interface DetailPaneProps {
  category?: Category;
  theme?: Theme;
  question?: Question;
  categories: Category[];
  themes: Theme[];
  isCategoryVisible: boolean;
  isCategoryLastPublishedTheme: boolean;
  categoryThemeCount: number | null;
  authoring: Authoring;
  onDirtyChange: (isDirty: boolean) => void;
  onCategorySaved: (category: Category) => void;
  onCategoryDeleted: () => void;
  onThemeSaved: (theme: AdminThemeResponse) => void;
  onThemeDeleted: () => void;
  onQuestionSaved: (question: Question) => void;
  onQuestionDeleted: () => void;
}

export const DetailPane = ({
  category,
  theme,
  question,
  categories,
  themes,
  isCategoryVisible,
  isCategoryLastPublishedTheme,
  categoryThemeCount,
  authoring,
  onDirtyChange,
  onCategorySaved,
  onCategoryDeleted,
  onThemeSaved,
  onThemeDeleted,
  onQuestionSaved,
  onQuestionDeleted,
}: DetailPaneProps) => {
  const showsQuestionForm = authoring === "question" || question !== undefined;
  const showsThemeForm =
    !showsQuestionForm && (authoring === "theme" || (authoring === null && theme !== undefined));
  const showsCategoryForm =
    !showsQuestionForm &&
    !showsThemeForm &&
    (authoring === "category" || (authoring === null && category !== undefined));

  return (
    <Column
      title="Details"
      isEmpty={!showsQuestionForm && !showsThemeForm && !showsCategoryForm}
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
        {showsThemeForm ? (
          <ThemeForm
            key={authoring === "theme" ? "new-theme" : theme?.id}
            theme={authoring === "theme" ? undefined : theme}
            categories={categories}
            selectedCategoryId={category?.id ?? null}
            isCategoryLastPublishedTheme={isCategoryLastPublishedTheme}
            onDirtyChange={onDirtyChange}
            onSaved={onThemeSaved}
            onDeleted={onThemeDeleted}
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
      </div>
    </Column>
  );
};
