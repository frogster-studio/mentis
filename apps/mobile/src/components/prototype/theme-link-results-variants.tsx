// PROTOTYPE (ticket 94): three structurally different Theme Link results pages — throwaway.
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/logo-mark";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import { ResultCard } from "@/features/quiz/components/result-card";
import { ResultsHeaderCard } from "@/features/quiz/components/results-header-card";
import { ResultsHomeLink } from "@/features/quiz/components/results-home-link";
import { ResultsView } from "@/features/quiz/components/results-view";
import { sessionScore } from "@/features/quiz/session-reducer";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, PRESSED, RADIUS, SPACE } from "@/theme/tokens";
import {
  APP_STORE_URL,
  CTA_COUNTS,
  CTA_SENTENCES,
  type CopyOption,
  type Device,
  DownloadControl,
  LegalLinks,
  MOCK_ANSWERS,
  MOCK_QUESTIONS,
  MOCK_THEME,
  share,
  shareLine,
  LANDING_ANDROID_URL,
} from "./theme-link-results-parts";

export interface VariantProps {
  device: Device;
  copy: CopyOption;
}

const SCORE = sessionScore(MOCK_ANSWERS);
const OUTCOMES = MOCK_ANSWERS.map((answer) => answer.correct);
const REPLAY_LABEL = "Rejouer, même thème";
const noop = () => {};

const ResultCards = () => (
  <>
    {MOCK_QUESTIONS.map((question, index) => (
      <ResultCard
        key={question.id}
        position={index + 1}
        total={MOCK_QUESTIONS.length}
        questionText={question.text}
        canonicalAnswer={question.answer}
        answerText={MOCK_ANSWERS[index].input}
        correct={MOCK_ANSWERS[index].correct}
        points={MOCK_ANSWERS[index].points}
        onExplain={noop}
      />
    ))}
  </>
);

const ReplayButton = ({ tone }: { tone: "default" | "gradient-primary" }) => (
  <NewButton
    layout="block"
    shape="full"
    tone={tone}
    icon="play-circle-outline"
    label={REPLAY_LABEL}
    accessibilityLabel={null}
    onPress={noop}
    disabled={false}
    pending={false}
  />
);

// A — « Bande »: today's results page, the footer band carries CTA → Rejouer → Partager.
export const VariantA = ({ device, copy }: VariantProps) => (
  <View style={[styles.fill, device === "desktop" && styles.phoneColumn]}>
    <ResultsView
      score={SCORE}
      themeName={MOCK_THEME}
      outcomes={OUTCOMES}
      footer={
        <View style={styles.footerStack}>
          <Text style={styles.ctaSentence}>{CTA_SENTENCES[copy]}</Text>
          <DownloadControl device={device} qrSize={88} qrCaption="Scanne pour installer Mentis" />
          <ReplayButton tone="default" />
          <ResultsHomeLink
            label="Partager"
            onPress={() => void share(device, shareLine(copy, SCORE, MOCK_THEME))}
          />
        </View>
      }
    >
      <ResultCards />
      <LegalLinks />
    </ResultsView>
  </View>
);

// B — « Carte »: an app card sits right under the score, the band keeps Rejouer + Partager.
export const VariantB = ({ device, copy }: VariantProps) => (
  <View style={[styles.fill, device === "desktop" && styles.phoneColumn]}>
    <ResultsView
      score={SCORE}
      themeName={MOCK_THEME}
      outcomes={OUTCOMES}
      footer={
        <View style={styles.footerRow}>
          <View style={styles.fill}>
            <ReplayButton tone="default" />
          </View>
          <NewButton
            layout="hug"
            shape="full"
            tone="default"
            icon="share-variant-outline"
            label={null}
            accessibilityLabel="Partager"
            onPress={() => void share(device, shareLine(copy, SCORE, MOCK_THEME))}
            disabled={false}
            pending={false}
          />
        </View>
      }
    >
      <Squircle
        radius={RADIUS.base}
        corners="all"
        color={COLORS.yellow}
        borderColor={COLORS.ink}
        borderWidth={2}
        style={styles.appCard}
      >
        <View style={styles.appCardHead}>
          <LogoMark color={COLORS.ink} size={32} />
          <Text style={styles.appCardTitle}>Mentis, sur iPhone</Text>
        </View>
        <Text style={styles.appCardBody}>{CTA_SENTENCES[copy]}</Text>
        <DownloadControl device={device} qrSize={128} qrCaption="Scanne avec ton iPhone" />
      </Squircle>
      <ResultCards />
      <LegalLinks />
    </ResultsView>
  </View>
);

// C — « Écran final »: no band. Desktop splits results | sticky app panel; mobile leads with the app and folds the detail.
export const VariantC = ({ device, copy }: VariantProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const onShare = () => void share(device, shareLine(copy, SCORE, MOCK_THEME));

  const appPanel = (
    <View style={styles.panel}>
      <LogoMark color={COLORS.ink} size={48} />
      <Text style={styles.panelSentence}>{CTA_SENTENCES[copy]}</Text>
      <DownloadControl device={device} qrSize={180} qrCaption="" />
      {device === "desktop" ? (
        <Text style={styles.panelHint}>Scanne avec l'appareil photo de ton iPhone</Text>
      ) : null}
      <View style={styles.panelDivider} />
      <ReplayButton tone="default" />
      <ResultsHomeLink label="Partager mon score" onPress={onShare} />
    </View>
  );

  if (device === "desktop") {
    return (
      <View style={styles.split}>
        <ScrollView style={styles.splitResults} contentContainerStyle={styles.splitResultsContent}>
          <ResultsHeaderCard score={SCORE} themeName={MOCK_THEME} outcomes={OUTCOMES} />
          <ResultCards />
          <LegalLinks />
        </ScrollView>
        <Squircle
          radius={RADIUS.base}
          corners="all"
          color={COLORS.card}
          borderColor={COLORS.ink}
          borderWidth={2}
          style={styles.splitPanel}
        >
          {appPanel}
        </Squircle>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.mobileContent}>
      <ResultsHeaderCard score={SCORE} themeName={MOCK_THEME} outcomes={OUTCOMES} />
      {appPanel}
      <Pressable onPress={() => setShowDetail((shown) => !shown)}>
        {({ pressed }) => (
          <Text style={[styles.detailToggle, pressed && PRESSED]}>
            {showDetail ? "Masquer le détail" : "Voir le détail des 10 questions"}
          </Text>
        )}
      </Pressable>
      {showDetail ? <ResultCards /> : null}
      <LegalLinks />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  phoneColumn: { width: "100%", maxWidth: 480, alignSelf: "center" },
  footerStack: { gap: SPACE.sm },
  footerRow: { flexDirection: "row", gap: SPACE.sm, paddingBottom: SPACE.sm },
  ctaSentence: { ...TEXT.caption, color: COLORS.ink, textAlign: "center" },
  appCard: { padding: SPACE.lg, gap: SPACE.md },
  appCardHead: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  appCardTitle: { ...TEXT.cardTitle, color: COLORS.ink },
  appCardBody: { ...TEXT.body, color: COLORS.ink },
  panel: { alignItems: "stretch", gap: SPACE.md },
  panelSentence: { ...TEXT.cardTitle, color: COLORS.ink, textAlign: "center" },
  panelHint: { ...TEXT.caption, color: COLORS.inkMuted, textAlign: "center" },
  panelDivider: { height: 1, backgroundColor: COLORS.stroke },
  split: {
    flex: 1,
    flexDirection: "row",
    gap: SPACE.xl,
    padding: SPACE.xl,
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
  },
  splitResults: { flex: 1 },
  splitResultsContent: { gap: SPACE.md },
  splitPanel: { width: 360, alignSelf: "flex-start", padding: SPACE.xl },
  mobileContent: { padding: GUTTER, gap: SPACE.lg, paddingTop: SPACE.xxl },
  qrExpanded: { alignItems: "center", gap: SPACE.sm, paddingBottom: SPACE.sm },
  qrDismiss: { position: "absolute", top: 0, right: 0, padding: SPACE.xs },
  detailToggle: {
    ...TEXT.label,
    color: COLORS.ink,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

const D_CTA = `Plus de ${CTA_COUNTS.themes} thèmes et ${CTA_COUNTS.questions} questions sur l'app Mentis, avec une Compétition chaque jour entre joueurs.`;
const dShareLine = (score: number, themeName: string) =>
  `J'ai fait ${score}/50 sur « ${themeName} » sur Mentis. À toi !`;

// D — Hugo's pick: detail first, band = sentence + [Télécharger][share], Rejouer at the very bottom.
export const VariantD = ({ device }: VariantProps) => {
  const [qrVisible, setQrVisible] = useState(false);
  const isAndroid = device === "android";
  const onDownload = () => {
    if (device === "desktop") setQrVisible(true);
    else void Linking.openURL(isAndroid ? LANDING_ANDROID_URL : APP_STORE_URL);
  };

  return (
    <View style={[styles.fill, device === "desktop" && styles.phoneColumn]}>
      <ResultsView
        score={SCORE}
        themeName={MOCK_THEME}
        outcomes={OUTCOMES}
        footer={
          <View style={styles.footerStack}>
            <Text style={styles.ctaSentence}>{D_CTA}</Text>
            {qrVisible ? (
              <View style={styles.qrExpanded}>
                <DownloadControl device="desktop" qrSize={160} qrCaption="" />
                <Text style={styles.panelHint}>Scanne avec l'appareil photo de ton téléphone</Text>
                <Pressable
                  style={styles.qrDismiss}
                  accessibilityLabel="Fermer le QR code"
                  onPress={() => setQrVisible(false)}
                >
                  {({ pressed }) => (
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={COLORS.ink}
                      style={pressed && PRESSED}
                    />
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.footerRow}>
                <View style={styles.fill}>
                  <NewButton
                    layout="block"
                    shape="full"
                    tone="gradient-primary"
                    icon={isAndroid ? "android" : "apple"}
                    label="Télécharger"
                    accessibilityLabel={null}
                    onPress={onDownload}
                    disabled={false}
                    pending={false}
                  />
                </View>
                <NewButton
                  layout="hug"
                  shape="full"
                  tone="default"
                  icon="share"
                  label={null}
                  accessibilityLabel="Partager"
                  onPress={() => void share(device, dShareLine(SCORE, MOCK_THEME))}
                  disabled={false}
                  pending={false}
                />
              </View>
            )}
          </View>
        }
      >
        <ResultCards />
        <ReplayButton tone="default" />
        <LegalLinks />
      </ResultsView>
    </View>
  );
};
