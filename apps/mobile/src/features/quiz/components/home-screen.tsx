import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { BlurBand } from "@/components/ui/blur-band";
import { BUTTON_BOX_HEIGHT, Button } from "@/components/ui/button";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { TRANSFER_DONE_HOME } from "@/features/account/constants";
import { HomeThemeCard } from "@/features/quiz/components/home-theme-card";
import { PLAY_LABEL } from "@/features/quiz/constants";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { useHomeCards } from "@/features/quiz/use-home-cards";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const CTA_BAND_HEIGHT = BUTTON_BOX_HEIGHT + SPACE.md * 2;

export function HomeScreen() {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight();
  const session = useAuthStore((state) => state.session);
  const cards = useHomeCards();
  const transferred = useTransferStore((state) => state.transferred);

  // The signed-out home is empty because the stats moved, not because nothing was ever played.
  const showTransferredNote = !session && transferred && cards.length === 0;

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      {showTransferredNote ? (
        <View style={[styles.note, { paddingTop: headerHeight }]}>
          <Text style={styles.noteText}>{TRANSFER_DONE_HOME}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingTop: headerHeight, paddingBottom: CTA_BAND_HEIGHT },
          ]}
        >
          {cards.map((card) => (
            <HomeThemeCard
              key={card.id}
              name={card.name}
              average={card.average}
              sessionCount={card.sessionCount}
            />
          ))}
        </ScrollView>
      )}
      {/* After the list in JSX: expo-blur only blurs what mounted before it. */}
      <BlurBand edge="bottom">
        <View style={styles.cta}>
          <Button label={PLAY_LABEL} onPress={() => router.push("/picker")} />
        </View>
      </BlurBand>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: GUTTER,
    gap: SPACE.md,
  },
  note: {
    paddingHorizontal: GUTTER,
  },
  noteText: {
    ...TEXT.body,
    color: COLORS.inkMuted,
  },
  cta: {
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
});
