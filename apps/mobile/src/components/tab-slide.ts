import type { BottomTabNavigationOptions } from "expo-router/js-tabs";
import { useWindowDimensions } from "react-native";
import {
  TAB_TRANSITION_EASING,
  TAB_TRANSITION_MS,
  watchTabProgress,
} from "@/components/tab-transition";

// Every tab pair rides one filmstrip: the outgoing screen leaves exactly as the incoming arrives.
export function useTabSlide(): Pick<
  BottomTabNavigationOptions,
  "lazy" | "transitionSpec" | "sceneStyleInterpolator"
> {
  const { width } = useWindowDimensions();

  return {
    transitionSpec: {
      animation: "timing",
      config: { duration: TAB_TRANSITION_MS, easing: TAB_TRANSITION_EASING },
    },
    sceneStyleInterpolator: ({ current }) => ({
      sceneStyle: {
        transform: [
          {
            translateX: watchTabProgress(current.progress).interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-width, 0, width],
            }),
          },
        ],
      },
    }),
  };
}
