import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

import { type Hsv, hexOf, hexOfHsv, hsvOf } from "../color";
import { iconGlyph } from "../icons";
import { CONTROL } from "./control";

interface ColorFieldProps {
  value: string;
  onChange: (color: string) => void;
  preview: ReactNode;
}

interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>;
}

const FALLBACK_HSV: Hsv = { hue: 0, saturation: 0, value: 0 };

const clamp = (ratio: number) => Math.min(1, Math.max(0, ratio));

export const ColorField = ({ value, onChange, preview }: ColorFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [picked, setPicked] = useState(() => ({
    source: value,
    hsv: hsvOf(value) ?? FALLBACK_HSV,
  }));
  const [isEyeDropperAvailable, setIsEyeDropperAvailable] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsEyeDropperAvailable("EyeDropper" in window);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onPointerDownOutside = (event: globalThis.PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDownOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  // A grey or black pick would lose its hue on the way through hex, so the picker keeps its own HSV.
  const hsv = picked.source === value ? picked.hsv : (hsvOf(value) ?? picked.hsv);

  const pick = (next: Hsv) => {
    const hex = hexOfHsv(next);
    setPicked({ source: hex, hsv: next });
    onChange(hex);
  };

  const trackPointer = (
    event: PointerEvent<HTMLDivElement>,
    onPosition: (x: number, y: number) => void,
  ) => {
    const surface = event.currentTarget;
    const read = (pointer: { clientX: number; clientY: number }) => {
      const box = surface.getBoundingClientRect();
      onPosition(
        clamp((pointer.clientX - box.left) / box.width),
        clamp((pointer.clientY - box.top) / box.height),
      );
    };
    surface.setPointerCapture(event.pointerId);
    read(event);
    const onMove = (move: globalThis.PointerEvent) => read(move);
    const onUp = () => {
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerup", onUp);
      surface.removeEventListener("pointercancel", onUp);
    };
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerup", onUp);
    surface.addEventListener("pointercancel", onUp);
  };

  const onHexChange = (text: string) => {
    setDraft(text);
    const hex = hexOf(text);
    if (hex !== null) {
      onChange(hex);
    }
  };

  const openEyeDropper = async () => {
    const eyeDropper = new (
      window as unknown as { EyeDropper: new () => EyeDropperApi }
    ).EyeDropper();
    try {
      const { sRGBHex } = await eyeDropper.open();
      const hex = hexOf(sRGBHex);
      if (hex !== null) {
        onChange(hex);
      }
    } catch {
      return;
    }
  };

  return (
    <div ref={popoverRef} className="relative flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Pick a color"
          aria-expanded={isOpen}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {preview}
        </button>
        <input
          type="text"
          value={draft ?? value}
          onChange={(event) => onHexChange(event.target.value)}
          onFocus={() => setDraft(value)}
          onBlur={() => setDraft(null)}
          spellCheck={false}
          aria-label="Color"
          className={`${CONTROL} font-mono`}
        />
      </div>

      {isOpen ? (
        <div className="absolute top-full left-0 z-10 mt-1 flex w-64 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          <div
            role="presentation"
            onPointerDown={(event) =>
              trackPointer(event, (x, y) => pick({ ...hsv, saturation: x, value: 1 - y }))
            }
            className="relative h-40 w-full cursor-crosshair touch-none rounded-lg"
            style={{
              backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.hue} 100% 50%))`,
            }}
          >
            <span
              className="pointer-events-none absolute size-3 rounded-full border-2 border-white shadow"
              style={{
                left: `calc(${hsv.saturation * 100}% - 6px)`,
                top: `calc(${(1 - hsv.value) * 100}% - 6px)`,
                backgroundColor: value,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {isEyeDropperAvailable ? (
              <button
                type="button"
                onClick={openEyeDropper}
                aria-label="Pick a color from the screen"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg font-icons text-lg text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                {iconGlyph("colorize")}
              </button>
            ) : null}
            <div
              role="presentation"
              onPointerDown={(event) => trackPointer(event, (x) => pick({ ...hsv, hue: x * 360 }))}
              className="relative h-3 flex-1 cursor-pointer touch-none rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }}
            >
              <span
                className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  left: `calc(${(hsv.hue / 360) * 100}% - 8px)`,
                  backgroundColor: `hsl(${hsv.hue} 100% 50%)`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
