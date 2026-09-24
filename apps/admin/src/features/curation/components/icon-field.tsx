import { useState } from "react";

import { iconGlyph, isIconName, suggestIcons } from "../icons";
import { CONTROL } from "./control";

interface IconFieldProps {
  value: string;
  color: string;
  onChange: (icon: string) => void;
}

// The app washes a selection in its Category's color at a quarter opacity.
const WASH_ALPHA = "40";

export const IconField = ({ value, color, onChange }: IconFieldProps) => {
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
        <ul className="grid h-[175px] grid-cols-[repeat(auto-fill,40px)] content-start gap-3 overflow-y-auto rounded-lg border border-zinc-200 p-3">
          {matches.map((name) => (
            <li key={name}>
              <button
                type="button"
                title={name}
                // Picking keeps the caret in the field, so the blur that would close the list never fires.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(name);
                  setIsOpen(false);
                }}
                style={name === value ? { backgroundColor: `${color}${WASH_ALPHA}` } : undefined}
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 font-icons text-xl text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                {iconGlyph(name)}
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
