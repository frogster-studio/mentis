import { type PropsWithChildren, type ReactNode, useId, useMemo, useState } from "react";

import { type Highlight, searchCatalog } from "../search-catalog";
import { publishedLabel } from "../staging-labels";
import type { Category, Question, Theme } from "../types";
import { Badge } from "./badge";
import { CategoryBadge } from "./category-badge";
import { CONTROL } from "./control";

interface CatalogSearchProps {
  categories: Category[] | undefined;
  themes: Theme[] | undefined;
  questions: Question[] | undefined;
}

const HINT = "px-4 py-2 text-sm text-zinc-400";

const Highlighted = ({ text, highlights }: { text: string; highlights: Highlight[] }) => {
  const pieces: ReactNode[] = [];
  let cursor = 0;
  for (const { start, end } of highlights) {
    pieces.push(text.slice(cursor, start));
    pieces.push(
      <mark key={start} className="bg-transparent font-medium text-sky-700">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  pieces.push(text.slice(cursor));
  return pieces;
};

const ResultGroupOf = ({ label, children }: PropsWithChildren<{ label: string }>) => {
  return (
    <fieldset>
      <legend className="px-4 pt-2 pb-1 text-xs text-zinc-500 uppercase tracking-wide">
        {label}
      </legend>
      {children}
    </fieldset>
  );
};

const Option = ({ children }: PropsWithChildren) => {
  return (
    <div
      role="option"
      aria-selected={false}
      tabIndex={-1}
      className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50"
    >
      {children}
    </div>
  );
};

export const CatalogSearch = ({ categories, themes, questions }: CatalogSearchProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const listboxId = useId();
  const search = useMemo(
    () =>
      searchCatalog(query, {
        categories: categories ?? [],
        themes: themes ?? [],
        questions: questions ?? [],
      }),
    [query, categories, themes, questions],
  );

  const isCorpusPending = questions === undefined;
  const isListOpen = isOpen && search !== null;
  const hasRows =
    search !== null &&
    (isCorpusPending || search.categories.total + search.themes.total + search.questions.total > 0);

  const categoryName = (categoryId: string) =>
    categories?.find(({ id }) => id === categoryId)?.name;
  const themeName = (themeId: string) => themes?.find(({ id }) => id === themeId)?.name;

  return (
    <div className="relative w-96">
      <input
        type="text"
        role="combobox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder="Search the Catalog"
        aria-label="Search the Catalog"
        aria-autocomplete="list"
        aria-expanded={isListOpen && hasRows}
        aria-controls={isListOpen && hasRows ? listboxId : undefined}
        className={CONTROL}
      />
      {isListOpen ? (
        <div className="absolute top-full left-1/2 mt-2 max-h-[70vh] w-[40rem] -translate-x-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-2 shadow-lg">
          {hasRows ? (
            <div role="listbox" id={listboxId} aria-label="Catalog search results">
              {search.categories.total > 0 ? (
                <ResultGroupOf label={`Categories · ${search.categories.total}`}>
                  {search.categories.results.map(({ item, nameHighlights }) => (
                    <Option key={item.id}>
                      <CategoryBadge
                        color={item.color}
                        icon={item.icon}
                        className="size-6 text-sm"
                      />
                      <span className="flex-1 truncate">
                        <Highlighted text={item.name} highlights={nameHighlights} />
                      </span>
                    </Option>
                  ))}
                </ResultGroupOf>
              ) : null}
              {search.themes.total > 0 ? (
                <ResultGroupOf label={`Themes · ${search.themes.total}`}>
                  {search.themes.results.map(({ item, nameHighlights }) => (
                    <Option key={item.id}>
                      <span className="flex-1 truncate">
                        <Highlighted text={item.name} highlights={nameHighlights} />
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {categoryName(item.categoryId)}
                      </span>
                      <Badge isOn={item.published}>{publishedLabel(item.published)}</Badge>
                    </Option>
                  ))}
                </ResultGroupOf>
              ) : null}
              {isCorpusPending ? (
                <ResultGroupOf label="Questions">
                  <p className={HINT}>Loading…</p>
                </ResultGroupOf>
              ) : null}
              {!isCorpusPending && search.questions.total > 0 ? (
                <ResultGroupOf label={`Questions · ${search.questions.total}`}>
                  {search.questions.results.map(
                    ({ item, textHighlights, answerHighlights, foundWrongChoices }) => (
                      <Option key={item.id}>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate">
                            <Highlighted text={item.text} highlights={textHighlights} />
                          </span>
                          <span className="truncate text-xs text-zinc-500">
                            <span className="text-zinc-700">
                              <Highlighted text={item.answer} highlights={answerHighlights} />
                            </span>
                            {foundWrongChoices.map(({ wrongChoice, highlights }) => (
                              <span key={wrongChoice}>
                                {" · "}
                                <Highlighted text={wrongChoice} highlights={highlights} />
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {themeName(item.themeId)}
                        </span>
                      </Option>
                    ),
                  )}
                </ResultGroupOf>
              ) : null}
            </div>
          ) : (
            <p className={HINT}>No results.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};
