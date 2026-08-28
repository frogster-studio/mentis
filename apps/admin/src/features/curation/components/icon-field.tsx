import { useState } from "react";

import { iconGlyph, isIconName, suggestIcons } from "../icons";
import { CONTROL } from "./control";

interface IconFieldProps {
  value: string;
  onChange: (icon: string) => void;
}

export const IconField = ({ value, onChange }: IconFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const matches = suggestIcons(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 font-icons text-lg text-zinc-700">
          {iconGlyph(value)}
        </span>
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          placeholder="Search MaterialIcons names"
          aria-label="Icon"
          className={CONTROL}
        />
      </div>
      {isOpen && matches.length > 0 ? (
        <ul className="max-h-52 overflow-y-auto rounded-lg border border-zinc-200">
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                // Picking keeps the caret in the field, so the blur that would close the list never fires.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(name);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 border-zinc-100 border-b px-3 py-2 text-left text-sm text-zinc-700 transition-colors last:border-b-0 hover:bg-sky-50"
              >
                <span className="font-icons text-lg">{iconGlyph(name)}</span>
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value !== "" && !isIconName(value) ? (
        <p className="text-xs text-zinc-500">
          {matches.length === 0
            ? "No MaterialIcons glyph answers to that name."
            : "Not a MaterialIcons name yet — pick one from the list."}
        </p>
      ) : null}
    </div>
  );
};
