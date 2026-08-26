import { Easing } from "react-native";

// The scene slide, the header title and the tab chip are one gesture, so they share its timing.
export const TAB_TRANSITION_MS = 250;
export const TAB_TRANSITION_EASING = Easing.out(Easing.cubic);
