import { useRouter } from "expo-router";
import { CircleUser } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LogoWordmark } from "@/components/logo-wordmark";
import { Button } from "@/components/ui/button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE, TRANSFER_DONE_HOME } from "@/features/account/constants";
import { HomeThemeCard } from "@/features/quiz/components/home-theme-card";
import { PLAY_LABEL } from "@/features/quiz/constants";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { useHomeCards } from "@/features/quiz/use-home-cards";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export function HomeScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const cards = useHomeCards();
  const transferred = useTransferStore((state) => state.transferred);

  // The signed-out home is empty because the stats moved, not because nothing was ever played.
  const showTransferredNote = !session && transferred && cards.length === 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <LogoWordmark color={COLORS.ink} width={140} />
        {/* Opens the « Compte » screen; tinted primary while signed in, muted while signed out. */}
        <Pressable
          onPress={() => router.push("/account")}
          accessibilityLabel={ACCOUNT_TITLE}
          hitSlop={8}
        >
          <CircleUser size={32} color={session ? COLORS.primary : COLORS.ink} />
        </Pressable>
      </View>
      <View style={styles.cardsSection}>
        {showTransferredNote ? (
          <Text style={styles.transferredNote}>{TRANSFER_DONE_HOME}</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {cards.map((card) => (
              <HomeThemeCard key={card.id} name={card.name} average={card.average} />
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.footer}>
        <Button label={PLAY_LABEL} onPress={() => router.push("/picker")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  // The flex fill keeps « Jouer » pinned to the bottom of the screen.
  cardsSection: {
    flex: 1,
    paddingTop: 24,
  },
  cardsRow: {
    // flex-start keeps each card at its natural height — ScrollView would stretch them.
    alignItems: "flex-start",
    paddingHorizontal: 24,
    gap: 12,
  },
  transferredNote: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
