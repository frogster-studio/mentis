import type { TextStyle } from "react-native";

const FACES = {
  heading: "EpundaSlab-Regular",
  onboarding: "EpundaSlab-Medium",
  emphasis: "InterTight-SemiBold",
  regular: "InterTight-Regular",
} as const;

export const TEXT = {
  caption: { fontFamily: FACES.regular, fontSize: 14 },
  captionStrong: { fontFamily: FACES.emphasis, fontSize: 14, lineHeight: 19 },
  body: { fontFamily: FACES.regular, fontSize: 15, lineHeight: 24 },
  input: { fontFamily: FACES.regular, fontSize: 16 },
  competitionScore: { fontFamily: FACES.regular, fontSize: 80, lineHeight: 110 },
  premiumLabel: { fontFamily: FACES.emphasis, fontSize: 10, lineHeight: 12 },
  onboardingTitle: { fontFamily: FACES.onboarding, fontSize: 30, lineHeight: 40 },
  mainSubHeaderTitle: {
    fontFamily: FACES.heading,
    fontSize: 50,
    lineHeight: 50,
    letterSpacing: -2,
  },
  label: { fontFamily: FACES.emphasis, fontSize: 14, lineHeight: 20 },
  cardTitleSmall: { fontFamily: FACES.heading, fontSize: 14, lineHeight: 18 },
  cardTitle: { fontFamily: FACES.heading, fontSize: 18, lineHeight: 24 },
  sheetTitle: { fontFamily: FACES.onboarding, fontSize: 26, letterSpacing: -1 },
  sheetMessage: { fontFamily: FACES.regular, fontSize: 16, lineHeight: 22 },
  rowTitle: { fontFamily: FACES.heading, fontSize: 25, lineHeight: 30, letterSpacing: -1 },
  screenTitle: { fontFamily: FACES.heading, fontSize: 22, lineHeight: 28 },
  question: { fontFamily: FACES.heading, fontSize: 30, lineHeight: 35, letterSpacing: -1.2 },
  sectionTitle: { fontFamily: FACES.onboarding, fontSize: 35, letterSpacing: -1.5 },
  display: { fontFamily: FACES.heading, fontSize: 48, letterSpacing: -2 },
  profilePortraitInitial: { fontFamily: FACES.heading, fontSize: 48 },
  statValue: { fontFamily: FACES.emphasis, fontSize: 26, lineHeight: 32 },
  heroScore: { fontFamily: FACES.emphasis, fontSize: 100, lineHeight: 116 },
  revealCount: { fontFamily: FACES.heading, fontSize: 200, lineHeight: 300, letterSpacing: -12 },
  smallText: { fontFamily: FACES.regular, fontSize: 12 },
  smallTextStrong: { fontFamily: FACES.emphasis, fontSize: 12 },
} as const satisfies Record<string, TextStyle>;
