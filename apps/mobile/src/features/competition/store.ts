import type { AppCompetitionAttemptResponse } from "@mentis/contracts/app";
import { create } from "zustand";
import {
  type AttemptAction,
  type AttemptState,
  attemptReducer,
  createAttempt,
} from "./attempt-reducer";

type CompetitionStore = {
  attempt: AttemptState | null;
  startAttempt: (attempt: AppCompetitionAttemptResponse, now: number) => void;
  setInput: (value: string) => void;
  switchToSquare: () => void;
  select: (index: number) => void;
  confirm: (now: number) => void;
  expire: (now: number) => void;
  clearAttempt: (id: string) => void;
};

export const useCompetitionStore = create<CompetitionStore>((set) => {
  const apply = (action: AttemptAction) =>
    set((state) => (state.attempt ? { attempt: attemptReducer(state.attempt, action) } : {}));

  return {
    attempt: null,
    // Idempotent on the id: a re-render must never restart the Attempt the Player is playing.
    startAttempt: (attempt, now) =>
      set((state) =>
        state.attempt?.id === attempt.id ? {} : { attempt: createAttempt(attempt, now) },
      ),
    setInput: (value) => apply({ type: "setInput", value }),
    switchToSquare: () => apply({ type: "switchToSquare" }),
    select: (index) => apply({ type: "select", index }),
    confirm: (now) => apply({ type: "confirm", now }),
    expire: (now) => apply({ type: "expire", now }),
    // Scoped to one id: the screen that leaves must not wipe the Replay the next one started.
    clearAttempt: (id) => set((state) => (state.attempt?.id === id ? { attempt: null } : {})),
  };
});
