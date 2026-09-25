import { useFocusEffect } from "expo-router";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

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
  const scrollY = useRef(createScrollYStore()).current;

  return <ScrollYStoreContext.Provider value={scrollY}>{children}</ScrollYStoreContext.Provider>;
};

function useScrollYStore(): ScrollYStore {
  const store = useContext(ScrollYStoreContext);
  if (!store) {
    throw new Error("Tab scroll hooks must be used inside a TabScrollProvider");
  }
  return store;
}

export function useTabScrollY(): number {
  const store = useScrollYStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

// Every tab screen calls this; one that never scrolls simply drops the handler and rests at zero.
export function useTabScroll() {
  const store = useScrollYStore();
  const restingOffset = useRef(0);
  // A ref, not state: re-rendering the whole screen on focus would stall the tab switch.
  const isFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      store.setY(restingOffset.current);
      return () => {
        isFocused.current = false;
      };
    }, [store]),
  );

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      restingOffset.current = event.nativeEvent.contentOffset.y;
      if (isFocused.current) store.setY(restingOffset.current);
    },
    [store],
  );
}
