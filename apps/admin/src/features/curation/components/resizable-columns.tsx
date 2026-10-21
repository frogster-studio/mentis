import {
  type KeyboardEvent,
  type PointerEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  boundaryOffset,
  DEFAULT_LIST_WIDTHS_REM,
  DETAILS_MIN_WIDTH_REM,
  fitToWidth,
  KEYBOARD_STEP_REM,
  maxWidthOf,
  minTotalWidth,
  minWidthOf,
  moveBoundary,
  readListWidths,
  storeListWidths,
} from "../resizable-columns";

const KEY_DIRECTIONS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

const remInPixels = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

interface ResizableColumnsProps extends PropsWithChildren {
  listNames: string[];
}

export const ResizableColumns = ({ listNames, children }: ResizableColumnsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [listWidths, setListWidths] = useState(DEFAULT_LIST_WIDTHS_REM);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [draggedHandle, setDraggedHandle] = useState<number | null>(null);

  useEffect(() => setListWidths(readListWidths()), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width / remInPixels()),
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const columnCount = listWidths.length + 1;
  const displayedWidths =
    availableWidth === null
      ? [...listWidths, DETAILS_MIN_WIDTH_REM]
      : fitToWidth(listWidths, availableWidth);

  const commit = (widths: number[]) => {
    const chosenListWidths = widths.slice(0, -1);
    setListWidths(chosenListWidths);
    storeListWidths(chosenListWidths);
  };

  const startDrag = (handle: number, event: PointerEvent<HTMLHRElement>) => {
    if (event.button !== 0) return;

    const separator = event.currentTarget;
    const startX = event.clientX;
    const startWidths = displayedWidths;
    const pixelsPerRem = remInPixels();
    let draggedWidths: number[] | null = null;

    const follow = (moveEvent: globalThis.PointerEvent) => {
      draggedWidths = moveBoundary(
        startWidths,
        handle,
        (moveEvent.clientX - startX) / pixelsPerRem,
      );
      setListWidths(draggedWidths.slice(0, -1));
    };
    const release = () => {
      separator.removeEventListener("pointermove", follow);
      separator.removeEventListener("pointerup", release);
      separator.removeEventListener("pointercancel", release);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      setDraggedHandle(null);
      if (draggedWidths) commit(draggedWidths);
    };

    separator.setPointerCapture(event.pointerId);
    separator.addEventListener("pointermove", follow);
    separator.addEventListener("pointerup", release);
    separator.addEventListener("pointercancel", release);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setDraggedHandle(handle);
  };

  const resetToDefault = (handle: number) =>
    commit(
      moveBoundary(
        displayedWidths,
        handle,
        DEFAULT_LIST_WIDTHS_REM[handle] - displayedWidths[handle],
      ),
    );

  const nudge = (handle: number, event: KeyboardEvent<HTMLHRElement>) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (direction === undefined) return;

    event.preventDefault();
    commit(moveBoundary(displayedWidths, handle, direction * KEYBOARD_STEP_REM));
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full"
      style={{ minWidth: `${minTotalWidth(columnCount)}rem` }}
    >
      <div
        className="grid h-full divide-x divide-zinc-200"
        style={{
          gridTemplateColumns: `${displayedWidths
            .slice(0, -1)
            .map((width) => `${width}rem`)
            .join(" ")} minmax(${DETAILS_MIN_WIDTH_REM}rem, 1fr)`,
        }}
      >
        {children}
      </div>
      {listNames.map((name, handle) => (
        <hr
          key={name}
          aria-orientation="vertical"
          aria-label={`Resize ${name}`}
          aria-valuenow={Math.round(displayedWidths[handle])}
          aria-valuemin={minWidthOf(handle, columnCount)}
          aria-valuemax={Math.round(maxWidthOf(displayedWidths, handle))}
          tabIndex={0}
          title="Drag to resize, double-click to reset"
          onPointerDown={(event) => startDrag(handle, event)}
          onDoubleClick={() => resetToDefault(handle)}
          onKeyDown={(event) => nudge(handle, event)}
          className={`absolute inset-y-0 z-10 m-0 h-auto w-2 -translate-x-1/2 cursor-col-resize border-0 outline-none before:absolute before:inset-y-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:transition-colors ${
            draggedHandle === handle
              ? "before:bg-sky-500"
              : "hover:before:bg-sky-500 focus-visible:before:bg-sky-500"
          }`}
          style={{ left: `${boundaryOffset(displayedWidths, handle)}rem` }}
        />
      ))}
    </div>
  );
};
