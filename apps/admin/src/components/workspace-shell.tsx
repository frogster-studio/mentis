"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

const UnsavedChangesContext = createContext<(hasUnsavedChanges: boolean) => void>(() => undefined);

// A workspace holding a dirty form reports it, so the rail asks before leaving it behind.
export const useReportUnsavedChanges = (hasUnsavedChanges: boolean) => {
  const report = useContext(UnsavedChangesContext);

  useEffect(() => {
    report(hasUnsavedChanges);
    return () => report(false);
  }, [report, hasUnsavedChanges]);
};

const WORKSPACES = [
  {
    path: "/",
    label: "Questions",
    iconPath:
      "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z",
  },
  {
    path: "/anecdotes",
    label: "Anecdotes",
    iconPath:
      "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  },
];

export const WorkspaceShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leftQueryOf, setLeftQueryOf] = useState<Record<string, string>>({});

  // Each workspace keeps its state in its query, so coming back lands where the Editor left.
  const rememberLeftQuery = () =>
    setLeftQueryOf((known) => ({ ...known, [pathname]: window.location.search }));

  return (
    <div className="flex min-h-0 flex-1">
      <nav
        aria-label="Workspaces"
        className="flex w-14 shrink-0 flex-col items-center gap-2 border-zinc-200 border-r bg-white py-2"
      >
        {WORKSPACES.map(({ path, label, iconPath }) => {
          const isCurrent = path === pathname;
          return (
            <Link
              key={path}
              href={`${path}${leftQueryOf[path] ?? ""}`}
              title={label}
              aria-label={label}
              aria-current={isCurrent ? "page" : undefined}
              onNavigate={(event) => {
                if (isCurrent) {
                  event.preventDefault();
                } else if (
                  hasUnsavedChanges &&
                  !window.confirm("This form has unsaved changes. Leave anyway?")
                ) {
                  event.preventDefault();
                } else {
                  rememberLeftQuery();
                }
              }}
              className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
                isCurrent
                  ? "bg-sky-100 text-sky-600"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={iconPath} />
              </svg>
            </Link>
          );
        })}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-50">
        <UnsavedChangesContext value={setHasUnsavedChanges}>{children}</UnsavedChangesContext>
      </div>
    </div>
  );
};
