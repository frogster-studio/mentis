import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";

// The pill's drag starts at the screen edge, so both OS back gestures are barred on this screen.
export function useBarredBackGestures(goBack: () => void) {
  const navigation = useNavigation();
  const leavingRef = useRef(false);

  // iOS: the edge swipe never starts. Android's system gesture lands as GO_BACK below.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        // A pop from a screen above (the session quitting home) must keep its way through.
        if (navigation.isFocused() && !leavingRef.current) {
          event.preventDefault();
        }
      }),
    [navigation],
  );

  return () => {
    leavingRef.current = true;
    goBack();
  };
}
