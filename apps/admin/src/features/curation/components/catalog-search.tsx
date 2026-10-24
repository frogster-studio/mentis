import {
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { type Highlight, searchCatalog } from "../search-catalog";
import { type Selection, selectCategory } from "../selection";
import { publishedLabel } from "../staging-labels";
import type { Category, Question, Theme } from "../types";
import { Badge } from "./badge";
import { CategoryBadge } from "./category-badge";
import { CONTROL } from "./control";

interface CatalogSearchProps {
  categories: Category[] | undefined;
  themes: Theme[] | undefined;
  questions: Question[] | undefined;
  onSelect: (selection: Selection) => boolean;
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

interface OptionProps extends PropsWithChildren {
  id: string;
  isActive: boolean;
  onActivate: () => void;
  onSelect: () => void;
}

const Option = ({ id, isActive, onActivate, onSelect, children }: OptionProps) => {
  return (
    <button
      type="button"
      role="option"
      id={id}
      aria-selected={isActive}
      tabIndex={-1}
      // Picking keeps the caret in the bar, so the blur that would close the list never fires.
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onActivate}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-zinc-900 ${isActive ? "bg-zinc-50" : ""}`}
    >
      {children}
    </button>
  );
};

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches("input, textarea, select"));

const isSearchShortcut = (event: globalThis.KeyboardEvent) => {
  const isChord =
    event.key.toLowerCase() === "k" &&
    (navigator.userAgent.includes("Mac") ? event.metaKey : event.ctrlKey);
  return isChord || (event.key === "/" && !isTextField(event.target));
};

export const CatalogSearch = ({ categories, themes, questions, onSelect }: CatalogSearchProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
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
  const themeOf = (themeId: string) => themes?.find(({ id }) => id === themeId);

  const choices: Selection[] =
    search === null
      ? []
      : [
          ...search.categories.results.map(({ item }) => selectCategory(item.id)),
          ...search.themes.results.map(({ item }) => ({
            categoryId: item.categoryId,
            themeId: item.id,
            questionId: null,
          })),
          ...search.questions.results.map(({ item }) => ({
            categoryId: themeOf(item.themeId)?.categoryId ?? null,
            themeId: item.themeId,
            questionId: item.id,
          })),
        ];
  const themesOffset = search?.categories.results.length ?? 0;
  const questionsOffset = themesOffset + (search?.themes.results.length ?? 0);
  const activeChoice = isListOpen ? choices[activeIndex] : undefined;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  useEffect(() => {
    const focusOnShortcut = (event: globalThis.KeyboardEvent) => {
      if (isSearchShortcut(event)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusOnShortcut);
    return () => window.removeEventListener("keydown", focusOnShortcut);
  }, []);

  // A refused selection leaves the list open on the results the Editor was choosing from.
  const select = (selection: Selection) => {
    if (onSelect(selection)) inputRef.current?.blur();
  };

  const optionAt = (index: number) => ({
    id: optionId(index),
    isActive: index === activeIndex,
    onActivate: () => setActiveIndex(index),
    onSelect: () => select(choices[index]),
  });

  const moveActive = (step: number) => {
    const next = (activeIndex + step + choices.length) % choices.length;
    setActiveIndex(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
  };

  const driveByKeyboard = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (isListOpen) setIsOpen(false);
      else setQuery("");
      return;
    }
    if (activeChoice === undefined) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(activeChoice);
    }
  };

  return (
    <div className="relative w-96">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={driveByKeyboard}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder="Search the Catalog"
        aria-label="Search the Catalog"
        aria-autocomplete="list"
        aria-expanded={isListOpen && hasRows}
        aria-controls={isListOpen && hasRows ? listboxId : undefined}
        aria-activedescendant={activeChoice ? optionId(activeIndex) : undefined}
        className={CONTROL}
      />
      {isListOpen ? (
        <div className="absolute top-full left-1/2 mt-2 max-h-[70vh] w-[40rem] -translate-x-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-2 shadow-lg">
          {hasRows ? (
            <div role="listbox" id={listboxId} aria-label="Catalog search results">
              {search.categories.total > 0 ? (
                <ResultGroupOf label={`Categories · ${search.categories.total}`}>
                  {search.categories.results.map(({ item, nameHighlights }, index) => (
                    <Option key={item.id} {...optionAt(index)}>
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
                  {search.themes.results.map(({ item, nameHighlights }, index) => (
                    <Option key={item.id} {...optionAt(themesOffset + index)}>
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
                    ({ item, textHighlights, answerHighlights, foundWrongChoices }, index) => (
                      <Option key={item.id} {...optionAt(questionsOffset + index)}>
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
                          {themeOf(item.themeId)?.name}
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
