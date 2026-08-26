import type { TextStyle } from "react-native";

const FACES = {
  heading: "EpundaSlab-Regular",
  emphasis: "InterTight-SemiBold",
  regular: "InterTight-Regular",
} as const;

export const TEXT = {
  caption: { fontFamily: FACES.regular, fontSize: 14, lineHeight: 19 },
  captionStrong: { fontFamily: FACES.emphasis, fontSize: 14, lineHeight: 19 },
  body: { fontFamily: FACES.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: FACES.emphasis, fontSize: 14, lineHeight: 20 },
  cardTitleSmall: { fontFamily: FACES.heading, fontSize: 14, lineHeight: 18 },
  cardTitle: { fontFamily: FACES.heading, fontSize: 18, lineHeight: 24 },
  rowTitle: { fontFamily: FACES.heading, fontSize: 25, lineHeight: 30, letterSpacing: -1 },
  screenTitle: { fontFamily: FACES.heading, fontSize: 22, lineHeight: 28 },
  question: { fontFamily: FACES.heading, fontSize: 30, lineHeight: 35, letterSpacing: -1.2 },
  sectionTitle: { fontFamily: FACES.heading, fontSize: 35, letterSpacing: -1.4 },
  display: { fontFamily: FACES.heading, fontSize: 50, lineHeight: 49, letterSpacing: -2 },
  statValue: { fontFamily: FACES.emphasis, fontSize: 26, lineHeight: 32 },
  heroScore: { fontFamily: FACES.emphasis, fontSize: 100, lineHeight: 116 },
  revealCount: { fontFamily: FACES.heading, fontSize: 300, lineHeight: 300, letterSpacing: -12 },
} as const satisfies Record<string, TextStyle>;
