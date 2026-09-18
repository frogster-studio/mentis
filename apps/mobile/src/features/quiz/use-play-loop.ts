import { type RefObject, useEffect, useRef, useState } from "react";
import type { TextInput } from "react-native";
import type { QuestionPlay } from "./question-play";
import { usePlayClock } from "./use-play-clock";
import { type QuestionTransitionOutput, useQuestionTransition } from "./use-question-transition";

export interface PlayLoopInput {
  play: (Pick<QuestionPlay, "endsAt"> & { answers: readonly unknown[]; status: string }) | null;
  // The Question on stage — one object for its whole turn, null outside an active play.
  question: { text: string } | null;
  // A held play shows its Question but neither ticks nor takes the keyboard until released.
  isHeld: boolean;
  expire: (now: number) => void;
  switchToSquare: () => void;
}

export interface PlayLoop {
  inputRef: RefObject<TextInput | null>;
  now: number;
  transition: QuestionTransitionOutput;
  isHeld: boolean;
  quitVisible: boolean;
  requestQuit: () => void;
  closeQuit: () => void;
  switchToSquare: () => void;
}

// The choreography every play shares: Countdown clock, question beat, keyboard focus, quit sheet.
export function usePlayLoop({
  play,
  question,
  isHeld,
  expire,
  switchToSquare,
}: PlayLoopInput): PlayLoop {
  const inputRef = useRef<TextInput>(null);
  const [quitVisible, setQuitVisible] = useState(false);
  const isActive = question !== null && !isHeld;
  const isFinished = play?.status === "finished";

  const now = usePlayClock(play?.endsAt ?? 0, isActive, expire);
  // Lags question + position through the collapse/expand beat so the swap lands at the peak.
  const transition = useQuestionTransition({
    question: question?.text ?? "",
    position: (play?.answers.length ?? 0) + 1,
  });

  // Every question starts with the keyboard open, except under the quit sheet or while held.
  useEffect(() => {
    if (question && !quitVisible && !isHeld) {
      inputRef.current?.focus();
    }
  }, [question, quitVisible, isHeld]);

  // The Countdown can finish the play behind the open sheet — the results take it down.
  useEffect(() => {
    if (isFinished) {
      setQuitVisible(false);
    }
  }, [isFinished]);

  return {
    inputRef,
    now,
    transition,
    isHeld,
    quitVisible,
    // The keyboard drops as the sheet rises, so the field lets go before it opens.
    requestQuit: () => {
      inputRef.current?.blur();
      setQuitVisible(true);
    },
    closeQuit: () => setQuitVisible(false),
    switchToSquare: () => {
      inputRef.current?.blur();
      switchToSquare();
    },
  };
}
