import { useFocusEffect } from "expo-router";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { TAB_TRANSITION_EASING, TAB_TRANSITION_MS } from "@/components/tab-transition";

const TabScrollContext = createContext<Animated.Value | null>(null);

interface ScrollYStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
  setY: (y: number) => void;
}

const ScrollYStoreContext = createContext<ScrollYStore | null>(null);

function createScrollYStore(): ScrollYStore {
  let y = 0;
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => y,
    setY: (next) => {
      const rounded = Math.round(next);
      if (rounded === y) return;
      y = rounded;
      for (const listener of listeners) listener();
    },
  };
}

// The MainHeader sits outside the scenes, so the focused tab publishes its scroll offset here.
export const TabScrollProvider = ({ children }: PropsWithChildren) => {
  const offset = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(createScrollYStore()).current;

  return (
    <TabScrollContext.Provider value={offset}>
      <ScrollYStoreContext.Provider value={scrollY}>{children}</ScrollYStoreContext.Provider>
    </TabScrollContext.Provider>
  );
};

export function useTabScrollOffset(): Animated.Value {
  const offset = useContext(TabScrollContext);
  if (!offset) {
    throw new Error("useTabScrollOffset must be used inside a TabScrollProvider");
  }
  return offset;
}

export function useTabScrollY(): number {
  const store = useContext(ScrollYStoreContext);
  if (!store) {
    throw new Error("useTabScrollY must be used inside a TabScrollProvider");
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// Every tab screen calls this; one that never scrolls simply drops the handler and rests at zero.
export function useTabScroll() {
  const offset = useTabScrollOffset();
  const store = useContext(ScrollYStoreContext);
  const restingOffset = useRef(0);
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      store?.setY(restingOffset.current);
      Animated.timing(offset, {
        toValue: restingOffset.current,
        duration: TAB_TRANSITION_MS,
        easing: TAB_TRANSITION_EASING,
        useNativeDriver: true,
      }).start();
      return () => setIsFocused(false);
    }, [offset, store]),
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], {
        useNativeDriver: false,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = event.nativeEvent.contentOffset.y;
          restingOffset.current = y;
          store?.setY(y);
        },
      }),
    [offset, store],
  );
  return isFocused ? onScroll : undefined;
}
