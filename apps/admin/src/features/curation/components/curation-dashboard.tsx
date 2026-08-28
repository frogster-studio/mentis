"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useCategories, useThemeQuestions, useThemes } from "../api";
import {
  NO_SELECTION,
  readSelection,
  resolveSelection,
  type Selection,
  selectCategory,
  selectionQuery,
  selectQuestion,
  selectTheme,
  visibleCategoryIds,
} from "../selection";
import { publishedLabel, readyLabel, visibleLabel } from "../staging-labels";
import type { Authoring, Category, Question } from "../types";
import { Badge } from "./badge";
import { Column } from "./column";
import { DetailPane } from "./detail-pane";
import { Row } from "./row";

export const CurationDashboard = () => {
  const searchParams = useSearchParams();
  const [authoring, setAuthoring] = useState<Authoring>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const categories = useCategories();
  const themes = useThemes();

  const linkedSelection = readSelection(new URLSearchParams(searchParams.toString()));
  const selection = resolveSelection(linkedSelection, {
    categories: categories.data,
    themes: themes.data,
  });

  const questions = useThemeQuestions(selection.themeId);

  // Shallow routing: the URL is the selection's home, so refresh and deep links land on the same rows.
  const navigate = (next: Selection) => {
    window.history.pushState(null, "", `${window.location.pathname}${selectionQuery(next)}`);
  };

  const mayLeaveForm = (): boolean =>
    !isFormDirty || window.confirm("This form has unsaved changes. Leave anyway?");

  const goTo = (next: Selection) => {
    if (!mayLeaveForm()) {
      return;
    }
    setAuthoring(null);
    navigate(next);
  };

  const startCreatingQuestion = () => {
    if (!mayLeaveForm()) {
      return;
    }
    setAuthoring("question");
    navigate({ ...selection, questionId: null });
  };

  const startCreatingCategory = () => {
    if (!mayLeaveForm()) {
      return;
    }
    setAuthoring("category");
    navigate(NO_SELECTION);
  };

  const onQuestionSaved = (saved: Question) => {
    setIsFormDirty(false);
    setAuthoring(null);
    const theme = themes.data?.find(({ id }) => id === saved.themeId);
    navigate({
      categoryId: theme?.categoryId ?? selection.categoryId,
      themeId: saved.themeId,
      questionId: saved.id,
    });
  };

  const onQuestionDeleted = () => {
    setIsFormDirty(false);
    navigate({ ...selection, questionId: null });
  };

  const onCategorySaved = (saved: Category) => {
    setIsFormDirty(false);
    setAuthoring(null);
    navigate(selectCategory(saved.id));
  };

  const onCategoryDeleted = () => {
    setIsFormDirty(false);
    setAuthoring(null);
    navigate(NO_SELECTION);
  };

  const linkedQuery = selectionQuery(linkedSelection);
  const resolvedQuery = selectionQuery(selection);

  // A deep link outlives the rows it names, so the URL follows the pruning rather than re-sharing dead ids.
  useEffect(() => {
    if (linkedQuery !== resolvedQuery) {
      window.history.replaceState(null, "", `${window.location.pathname}${resolvedQuery}`);
    }
  }, [linkedQuery, resolvedQuery]);

  // Back walks the selection history, so an authoring pane opened over the old one must close with it.
  useEffect(() => {
    const closeAuthoring = () => setAuthoring(null);
    window.addEventListener("popstate", closeAuthoring);
    return () => window.removeEventListener("popstate", closeAuthoring);
  }, []);

  // The browser's own leave prompt: shallow routing never sees a tab closing or a typed URL.
  useEffect(() => {
    if (!isFormDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  }, [isFormDirty]);

  const visibleCategories = useMemo(() => visibleCategoryIds(themes.data ?? []), [themes.data]);
  const themesOfCategory = (themes.data ?? []).filter(
    ({ categoryId }) => categoryId === selection.categoryId,
  );

  const selectedCategory = categories.data?.find(({ id }) => id === selection.categoryId);
  const selectedTheme = themes.data?.find(({ id }) => id === selection.themeId);
  const selectedQuestion = questions.data?.find(({ id }) => id === selection.questionId);

  const error = categories.error ?? themes.error ?? questions.error;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error ? (
        <p
          role="alert"
          className="shrink-0 border-red-200 border-b bg-red-50 px-6 py-2 text-red-700 text-sm"
        >
          {error.message}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="grid h-full min-w-[78.5rem] grid-cols-[13rem_19.5rem_26rem_minmax(20rem,1fr)] divide-x divide-zinc-200">
          <Column
            title="Categories"
            isLoading={categories.isPending || themes.isPending}
            isEmpty={(categories.data ?? []).length === 0}
            emptyLabel="No Category yet."
            create={{ label: "New Category", onSelect: startCreatingCategory }}
          >
            {(categories.data ?? []).map((category) => (
              <Row
                key={category.id}
                isSelected={category.id === selection.categoryId}
                onSelect={() => goTo(selectCategory(category.id))}
              >
                <span
                  className="size-3 shrink-0 rounded-full border border-zinc-200"
                  style={{ backgroundColor: category.color }}
                />
                <span className="flex-1 truncate">{category.name}</span>
                <Badge isOn={visibleCategories.has(category.id)}>
                  {visibleLabel(visibleCategories.has(category.id))}
                </Badge>
              </Row>
            ))}
          </Column>

          <Column
            title="Themes"
            isLoading={themes.isPending}
            isEmpty={themesOfCategory.length === 0}
            emptyLabel={selection.categoryId ? "No Theme in this Category." : "Select a Category."}
            // Themes are seeded, never authored here: the API publishes no create route yet.
            create={{ label: "New Theme", onSelect: () => {} }}
          >
            {themesOfCategory.map((theme) => (
              <Row
                key={theme.id}
                isSelected={theme.id === selection.themeId}
                onSelect={() => goTo(selectTheme(selection, theme.id))}
              >
                <span className="flex-1 truncate">{theme.name}</span>
                <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                  {theme.readyQuestionCount}/{theme.questionCount}
                </span>
                <Badge isOn={theme.published}>{publishedLabel(theme.published)}</Badge>
              </Row>
            ))}
          </Column>

          <Column
            title="Questions"
            isLoading={questions.isPending && selection.themeId !== null}
            isEmpty={(questions.data ?? []).length === 0}
            emptyLabel={selection.themeId ? "No Question in this Theme." : "Select a Theme."}
            create={{ label: "New Question", onSelect: startCreatingQuestion }}
          >
            {(questions.data ?? []).map((question) => (
              <Row
                key={question.id}
                isSelected={question.id === selection.questionId}
                onSelect={() => goTo(selectQuestion(selection, question.id))}
              >
                <span className="flex-1 truncate">{question.text}</span>
                {question.readyToBePublished ? <Badge isOn>{readyLabel(true)}</Badge> : null}
              </Row>
            ))}
          </Column>

          <DetailPane
            category={selectedCategory}
            theme={selectedTheme}
            question={selectedQuestion}
            themes={themes.data ?? []}
            isCategoryVisible={
              selectedCategory ? visibleCategories.has(selectedCategory.id) : false
            }
            categoryThemeCount={themes.data === undefined ? null : themesOfCategory.length}
            authoring={authoring}
            onDirtyChange={setIsFormDirty}
            onCategorySaved={onCategorySaved}
            onCategoryDeleted={onCategoryDeleted}
            onQuestionSaved={onQuestionSaved}
            onQuestionDeleted={onQuestionDeleted}
          />
        </div>
      </div>
    </div>
  );
};
