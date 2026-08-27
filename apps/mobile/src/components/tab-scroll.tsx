import { useFocusEffect } from "expo-router";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";

const TabScrollContext = createContext<Animated.Value | null>(null);

// The AppHeader sits outside the scenes, so the focused tab publishes its scroll offset here.
export const TabScrollProvider = ({ children }: PropsWithChildren) => {
  const offset = useRef(new Animated.Value(0)).current;

  return <TabScrollContext.Provider value={offset}>{children}</TabScrollContext.Provider>;
};

export function useTabScrollOffset(): Animated.Value {
  const offset = useContext(TabScrollContext);
  if (!offset) {
    throw new Error("useTabScrollOffset must be used inside a TabScrollProvider");
  }
  return offset;
}

// Every tab screen calls this; one that never scrolls simply drops the handler and rests at zero.
export function useTabScroll() {
  const offset = useTabScrollOffset();
  const restingOffset = useRef(0);

  useFocusEffect(
    useCallback(() => {
      Animated.timing(offset, {
        toValue: restingOffset.current,
        duration: TAB_TRANSITION_MS,
        easing: TAB_TRANSITION_EASING,
        useNativeDriver: true,
      }).start();
    }, [offset]),
  );

  return useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          restingOffset.current = event.nativeEvent.contentOffset.y;
        },
      }),
    [offset],
  );
}
