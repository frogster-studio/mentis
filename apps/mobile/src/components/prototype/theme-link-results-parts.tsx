// PROTOTYPE (ticket 94): shared bits of the Theme Link results variants — throwaway, never merged.
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { NewButton } from "@/components/ui/new-button";
import { showToast } from "@/components/ui/toast";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal-links";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";
import type { Question } from "@/types/quiz";
import type { SessionAnswer } from "@/features/quiz/session-reducer";

export type Device = "desktop" | "ios" | "android";
export type CopyOption = "1" | "2" | "3";

export const APP_URL = "https://frogster-studio.com/mentis/app";
export const APP_STORE_URL = "https://apps.apple.com/app/mentis";
export const WAITLIST_URL = "https://frogster-studio.com/mentis/app#android";
export const THEME_LINK = "https://jouer.frogster-studio.com/animaux-de-la-ferme";

// Live from GET /app/themes on 2026-11-20: 23 Themes, 463 Questions.
const LIVE_THEMES = 23;
const LIVE_QUESTIONS = 463;

// Rounded down to one significant figure: 23 → 20, 463 → 400, 1 280 → 1 000.
const floorToLead = (n: number) => {
  const step = 10 ** (String(n).length - 1);
  return Math.floor(n / step) * step;
};
const X = floorToLead(LIVE_THEMES).toLocaleString("fr-FR");
const Y = floorToLead(LIVE_QUESTIONS).toLocaleString("fr-FR");
export const CTA_COUNTS = { themes: X, questions: Y };

export const CTA_SENTENCES: Record<CopyOption, string> = {
  "1": `Plus de ${X} thèmes et ${Y} questions t'attendent sur l'app iOS, avec une Compétition chaque jour et son Classement du mois.`,
  "2": `Continue sur l'app iOS : plus de ${X} thèmes, ${Y} questions, et une Compétition chaque jour pour grimper au Classement du mois.`,
  "3": `Sur iPhone, c'est plus de ${X} thèmes et ${Y} questions, plus une Compétition quotidienne et son Classement mensuel.`,
};

export const shareLine = (copy: CopyOption, score: number, themeName: string) =>
  ({
    "1": `J'ai fait ${score}/50 sur « ${themeName} » dans Mentis. À toi de jouer !`,
    "2": `${score}/50 sur « ${themeName} ». Tu fais mieux ?`,
    "3": `Je viens de faire ${score}/50 au quiz « ${themeName} ». Ton tour !`,
  })[copy];

export const detectDevice = (): Device => {
  if (Platform.OS !== "web") return "ios";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
};

export const share = async (device: Device, text: string) => {
  if (device !== "desktop" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text, url: THEME_LINK });
      return;
    } catch {
      // Dismissed sheet — nothing to do.
    }
  }
  await navigator.clipboard?.writeText(`${text} ${THEME_LINK}`);
  showToast("Lien copié", "link-variant", "bottom-center");
};

interface DownloadControlProps {
  device: Device;
  qrSize: number;
  qrCaption: string;
}

export const DownloadControl = ({ device, qrSize, qrCaption }: DownloadControlProps) => {
  if (device === "desktop") {
    return (
      <View style={styles.qrRow}>
        <View style={styles.qrFrame}>
          <QRCode value={APP_URL} size={qrSize} color={COLORS.ink} backgroundColor={COLORS.face} />
        </View>
        {qrCaption ? <Text style={styles.qrCaption}>{qrCaption}</Text> : null}
      </View>
    );
  }
  const isIos = device === "ios";
  return (
    <NewButton
      layout="block"
      shape="full"
      tone="gradient-primary"
      icon={isIos ? "apple" : "bell-outline"}
      label={isIos ? "Télécharger sur l'App Store" : "Me prévenir de la sortie Android"}
      accessibilityLabel={null}
      onPress={() => void Linking.openURL(isIos ? APP_STORE_URL : WAITLIST_URL)}
      disabled={false}
      pending={false}
    />
  );
};

export const LegalLinks = () => (
  <View style={styles.legal}>
    <Pressable onPress={() => void Linking.openURL(TERMS_URL)}>
      {({ pressed }) => <Text style={[styles.legalText, pressed && PRESSED]}>CGU</Text>}
    </Pressable>
    <Text style={styles.legalText}>·</Text>
    <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)}>
      {({ pressed }) => (
        <Text style={[styles.legalText, pressed && PRESSED]}>Confidentialité</Text>
      )}
    </Pressable>
  </View>
);

export const MOCK_THEME = "Animaux de la ferme";

export const MOCK_QUESTIONS: Question[] = Array.from({ length: 10 }, (_, index) => ({
  id: `q${index}`,
  themeId: "t",
  themeName: MOCK_THEME,
  text: [
    "Comment appelle-t-on la mise bas chez la vache ?",
    "Combien d'estomacs compte une vache ?",
    "Quel est le petit de la chèvre ?",
    "Quelle race de poule est originaire de la Bresse ?",
    "Comment s'appelle le mâle de la cane ?",
    "Combien de doigts compte le sabot du cochon ?",
    "Quel animal produit le lait du roquefort ?",
    "Comment appelle-t-on le cri de l'âne ?",
    "Quelle est la femelle du verrat ?",
    "Combien de temps dure la gestation d'une jument ?",
  ][index],
  answer: ["Le vêlage", "Quatre", "Le chevreau", "La Bresse-Gauloise", "Le canard", "Quatre", "La brebis", "Le braiment", "La truie", "Onze mois"][index],
  aliases: [],
  misspellings: [],
  wrongChoices: [],
  explanation: null,
}));

export const MOCK_ANSWERS: SessionAnswer[] = [
  { input: "vêlage", correct: true, points: 5, mode: "cash" },
  { input: "4", correct: true, points: 5, mode: "cash" },
  { input: "Le chevreau", correct: true, points: 2, mode: "square" },
  { input: "", correct: false, points: 0, mode: "cash" },
  { input: "Le canard", correct: true, points: 5, mode: "cash" },
  { input: "Deux", correct: false, points: 0, mode: "square" },
  { input: "brebis", correct: true, points: 5, mode: "cash" },
  { input: "Le braiment", correct: true, points: 2, mode: "square" },
  { input: "truie", correct: true, points: 5, mode: "cash" },
  { input: "Neuf mois", correct: false, points: 0, mode: "square" },
] as SessionAnswer[];

const styles = StyleSheet.create({
  qrRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.md,
  },
  qrFrame: {
    padding: SPACE.xs,
    backgroundColor: COLORS.face,
    borderWidth: 2,
    borderColor: COLORS.ink,
    borderRadius: 12,
  },
  qrCaption: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
    flexShrink: 1,
    maxWidth: 160,
  },
  legal: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
  },
  legalText: {
    ...TEXT.smallText,
    color: COLORS.inkMuted,
    textDecorationLine: "underline",
  },
});
