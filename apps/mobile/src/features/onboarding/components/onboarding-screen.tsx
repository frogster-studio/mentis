import { useRouter } from "expo-router";
import { type ReactElement, useRef, useState } from "react";
import { type LayoutRectangle, StyleSheet, View } from "react-native";
import { Carousel, type CarouselRef } from "react-native-reanimated-carousel";
import { NewButton } from "@/components/ui/new-button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { CompetitionHero } from "@/features/onboarding/components/competition-hero";
import { OnboardingPage } from "@/features/onboarding/components/onboarding-page";
import { OnboardingPager } from "@/features/onboarding/components/onboarding-pager";
import { PracticeHero } from "@/features/onboarding/components/practice-hero";
import {
  ONBOARDING_COMPETITION_CAPTION,
  ONBOARDING_COMPETITION_TITLE,
  ONBOARDING_PRACTICE_CAPTION,
  ONBOARDING_PRACTICE_TITLE,
  ONBOARDING_SURPRISE_CAPTION,
  ONBOARDING_SURPRISE_CTA_LABEL,
  ONBOARDING_SURPRISE_TITLE,
} from "@/features/onboarding/constants";

// The pager spends the bottom inset, so the deck takes only the top and the sides.
const DECK_EDGES = ["top", "left", "right"] as const;

export const OnboardingScreen = () => {
  const router = useRouter();
  const carousel = useRef<CarouselRef>(null);
  const [index, setIndex] = useState(0);
  const [deck, setDeck] = useState<LayoutRectangle | null>(null);

  const pages: ReactElement[] = [
    <OnboardingPage
      key="practice"
      hero={<PracticeHero />}
      caption={ONBOARDING_PRACTICE_CAPTION}
      title={ONBOARDING_PRACTICE_TITLE}
      action={null}
    />,
    <OnboardingPage
      key="competition"
      hero={<CompetitionHero />}
      caption={ONBOARDING_COMPETITION_CAPTION}
      title={ONBOARDING_COMPETITION_TITLE}
      action={null}
    />,
    <OnboardingPage
      key="surprise"
      hero={null}
      caption={ONBOARDING_SURPRISE_CAPTION}
      title={ONBOARDING_SURPRISE_TITLE}
      action={
        <NewButton
          layout="block"
          shape="full"
          tone="primary"
          icon="play-circle-outline"
          label={ONBOARDING_SURPRISE_CTA_LABEL}
          accessibilityLabel={null}
          onPress={() => router.push("/onboarding/quiz-session")}
          disabled={false}
          pending={false}
        />
      }
    />,
  ];

  return (
    <ScreenContainer edges={DECK_EDGES} underlay={null}>
      <View style={styles.deck} onLayout={(event) => setDeck(event.nativeEvent.layout)}>
        {deck ? (
          <Carousel
            ref={carousel}
            style={{ width: deck.width, height: deck.height }}
            data={pages}
            renderItem={({ item }) => item}
            onSnapToItem={setIndex}
          />
        ) : null}
      </View>
      <OnboardingPager
        index={index}
        count={pages.length}
        onBack={() => carousel.current?.prev()}
        onNext={() => carousel.current?.next()}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  deck: {
    flex: 1,
  },
});
