import { create } from "zustand";
import type { Question } from "@/types/quiz";
import {
  createSession,
  type SessionAction,
  type SessionState,
  sessionReducer,
} from "./session-reducer";

type QuizStore = {
  session: SessionState | null;
  startSession: (questions: Question[], now: number) => void;
  setInput: (value: string) => void;
  switchToSquare: (choices: string[]) => void;
  select: (index: number) => void;
  confirm: (now: number) => void;
  expire: (now: number) => void;
  clearSession: () => void;
};

export const useQuizStore = create<QuizStore>((set) => {
  const apply = (action: SessionAction) =>
    set((state) => (state.session ? { session: sessionReducer(state.session, action) } : {}));

  return {
    session: null,
    startSession: (questions, now) => set({ session: createSession(questions, now) }),
    setInput: (value) => apply({ type: "setInput", value }),
    switchToSquare: (choices) => apply({ type: "switchToSquare", choices }),
    select: (index) => apply({ type: "select", index }),
    confirm: (now) => apply({ type: "confirm", now }),
    expire: (now) => apply({ type: "expire", now }),
    clearSession: () => set({ session: null }),
  };
});
