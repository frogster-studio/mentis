"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useCategories, useThemeQuestions, useThemes } from "../api";
import {
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
import { Badge } from "./badge";
import { Column } from "./column";
import { DetailPane } from "./detail-pane";
import { Row } from "./row";

export const CurationDashboard = () => {
  const searchParams = useSearchParams();
  const categories = useCategories();
  const themes = useThemes();

  const linkedSelection = readSelection(new URLSearchParams(searchParams.toString()));
  const selection = resolveSelection(linkedSelection, {
    categories: categories.data,
    themes: themes.data,
  });

  const questions = useThemeQuestions(selection.themeId);

  // Shallow routing: the URL is the selection's home, so refresh and deep links land on the same rows.
  const goTo = (next: Selection) => {
    window.history.pushState(null, "", `${window.location.pathname}${selectionQuery(next)}`);
  };

  const linkedQuery = selectionQuery(linkedSelection);
  const resolvedQuery = selectionQuery(selection);

  // A deep link outlives the rows it names, so the URL follows the pruning rather than re-sharing dead ids.
  useEffect(() => {
    if (linkedQuery !== resolvedQuery) {
      window.history.replaceState(null, "", `${window.location.pathname}${resolvedQuery}`);
    }
  }, [linkedQuery, resolvedQuery]);

  const visibleCategories = useMemo(() => visibleCategoryIds(themes.data ?? []), [themes.data]);
  const themesOfCategory = (themes.data ?? []).filter(
    ({ categoryId }) => categoryId === selection.categoryId,
  );

  const selectedCategory = categories.data?.find(({ id }) => id === selection.categoryId);
  const selectedTheme = themes.data?.find(({ id }) => id === selection.themeId);
  const selectedQuestion = questions.data?.find(({ id }) => id === selection.questionId);

  const error = categories.error ?? themes.error ?? questions.error;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error.message}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="grid h-full min-w-[64rem] grid-cols-[1fr_1.5fr_1.8fr_1.4fr] gap-4">
          <Column
            title="Categories"
            isLoading={categories.isPending || themes.isPending}
            isEmpty={(categories.data ?? []).length === 0}
            emptyLabel="No Category yet."
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
            isCategoryVisible={
              selectedCategory ? visibleCategories.has(selectedCategory.id) : false
            }
          />
        </div>
      </div>
    </div>
  );
};
