import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useAppHeaderHeight } from "@/components/app-header";
import { BlurBand } from "@/components/ui/blur-band";
import { BUTTON_BOX_HEIGHT, Button } from "@/components/ui/button";
import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { TransferNotice } from "@/features/account/components/transfer-notice";
import { HomeEmptyState } from "@/features/quiz/components/home-empty-state";
import { HomeThemeCard } from "@/features/quiz/components/home-theme-card";
import { PLAY_LABEL } from "@/features/quiz/constants";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { useHomeCards } from "@/features/quiz/use-home-cards";
import { GUTTER, SPACE } from "@/theme/tokens";

const CTA_BAND_HEIGHT = BUTTON_BOX_HEIGHT + SPACE.md * 2;

export function HomeScreen() {
  const router = useRouter();
  const headerHeight = useAppHeaderHeight();
  const session = useAuthStore((state) => state.session);
  const cards = useHomeCards();
  const transferred = useTransferStore((state) => state.transferred);
  const dismissed = useTransferStore((state) => state.dismissed);
  const isEmpty = cards.length === 0;

  // The signed-out shelf is empty because the stats moved, not because nothing was ever played.
  const showTransferNotice = !session && transferred && isEmpty && !dismissed;

  return (
    <ScreenContainer edges={TAB_SCREEN_EDGES}>
      {isEmpty ? (
        <View style={[styles.empty, { paddingTop: headerHeight }]}>
          {showTransferNotice ? <TransferNotice /> : null}
          {/* Scrolls only when the explainer outgrows the gap between the chrome. */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.explainer, { paddingBottom: CTA_BAND_HEIGHT }]}
          >
            <HomeEmptyState />
          </ScrollView>
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
              category={card.category}
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
  empty: {
    flex: 1,
  },
  explainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  cta: {
    paddingHorizontal: GUTTER,
    paddingVertical: SPACE.md,
  },
});
