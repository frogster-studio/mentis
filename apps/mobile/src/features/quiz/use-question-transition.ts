import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, LayoutAnimation, Platform, UIManager } from "react-native";

const COLLAPSE_MS = 350;
const EXPAND_MS = 350;

// Android's LayoutAnimation is opt-in; without this the height reflow snaps instead of easing.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface QuestionTransitionInput {
  question: string;
  position: number;
}

export interface QuestionTransitionOutput {
  question: string;
  position: number;
  collapsed: boolean;
  opacity: Animated.Value;
  countdownFrozen: boolean;
}

// The between-question beat: collapse the question wrapper, swap step + counter + text at the peak,
// expand back down while the new text fades in — all with the Countdown pinned at its max, dimmed.
export function useQuestionTransition({
  question,
  position,
}: QuestionTransitionInput): QuestionTransitionOutput {
  const [visibleQuestion, setVisibleQuestion] = useState(question);
  const [visiblePosition, setVisiblePosition] = useState(position);
  const [collapsed, setCollapsed] = useState(false);
  const [countdownFrozen, setCountdownFrozen] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const previousQuestion = useRef(question);
  const reducedMotion = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) {
        reducedMotion.current = enabled;
      }
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      reducedMotion.current = enabled;
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (question === previousQuestion.current) {
      return;
    }
    previousQuestion.current = question;
    if (reducedMotion.current) {
      setVisibleQuestion(question);
      setVisiblePosition(position);
      return;
    }

    setCountdownFrozen(true);
    LayoutAnimation.configureNext({
      duration: COLLAPSE_MS,
      update: { type: "easeInEaseOut" },
    });
    setCollapsed(true);

    const peakTimer = setTimeout(() => {
      setVisibleQuestion(question);
      setVisiblePosition(position);
      opacity.setValue(0);
      LayoutAnimation.configureNext({
        duration: EXPAND_MS,
        update: { type: "easeInEaseOut" },
      });
      setCollapsed(false);
      Animated.timing(opacity, {
        toValue: 1,
        duration: EXPAND_MS,
        useNativeDriver: true,
      }).start();
    }, COLLAPSE_MS);

    const landingTimer = setTimeout(() => {
      setCountdownFrozen(false);
    }, COLLAPSE_MS + EXPAND_MS);

    return () => {
      clearTimeout(peakTimer);
      clearTimeout(landingTimer);
    };
  }, [question, position, opacity]);

  return {
    question: visibleQuestion,
    position: visiblePosition,
    collapsed,
    opacity,
    countdownFrozen,
  };
}
