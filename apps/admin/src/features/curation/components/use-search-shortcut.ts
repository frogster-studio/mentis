import { type RefObject, useEffect } from "react";

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.matches("input, textarea, select"));

const isSearchShortcut = (event: KeyboardEvent) => {
  const isChord =
    event.key.toLowerCase() === "k" &&
    (navigator.userAgent.includes("Mac") ? event.metaKey : event.ctrlKey);
  return isChord || (event.key === "/" && !isTextField(event.target));
};

export const useSearchShortcut = (inputRef: RefObject<HTMLInputElement | null>) => {
  useEffect(() => {
    const focusOnShortcut = (event: KeyboardEvent) => {
      if (isSearchShortcut(event)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusOnShortcut);
    return () => window.removeEventListener("keydown", focusOnShortcut);
  }, [inputRef]);
};
