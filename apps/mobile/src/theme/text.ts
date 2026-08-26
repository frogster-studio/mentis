import type { TextStyle } from "react-native";

const FACES = {
  heading: "Lexend-Bold",
  emphasis: "Poppins-SemiBold",
  regular: "Poppins-Regular",
} as const;

export const TEXT = {
  caption: { fontFamily: FACES.regular, fontSize: 14, lineHeight: 20 },
  captionStrong: { fontFamily: FACES.emphasis, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: FACES.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: FACES.emphasis, fontSize: 16, lineHeight: 20 },
  cardTitleSmall: { fontFamily: FACES.heading, fontSize: 14, lineHeight: 18 },
  cardTitle: { fontFamily: FACES.heading, fontSize: 18, lineHeight: 24 },
  screenTitle: { fontFamily: FACES.heading, fontSize: 22, lineHeight: 28 },
  question: { fontFamily: FACES.heading, fontSize: 26, lineHeight: 34 },
  revealTitle: { fontFamily: FACES.heading, fontSize: 34, lineHeight: 42 },
  statValue: { fontFamily: FACES.emphasis, fontSize: 26, lineHeight: 32 },
  heroScore: { fontFamily: FACES.emphasis, fontSize: 100, lineHeight: 116 },
  revealCount: { fontFamily: FACES.emphasis, fontSize: 160, lineHeight: 186 },
} as const satisfies Record<string, TextStyle>;
