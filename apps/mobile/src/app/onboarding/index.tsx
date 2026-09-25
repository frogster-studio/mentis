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
import { SurpriseHero } from "@/features/onboarding/components/surprise-hero";
import {
  ONBOARDING_COMPETITION_CAPTION,
  ONBOARDING_COMPETITION_TITLE,
  ONBOARDING_DECK_EDGES,
  ONBOARDING_PRACTICE_CAPTION,
  ONBOARDING_PRACTICE_TITLE,
  ONBOARDING_SURPRISE_CAPTION,
  ONBOARDING_SURPRISE_CTA_LABEL,
  ONBOARDING_SURPRISE_TITLE,
} from "@/features/onboarding/constants";

export default function Page() {
  const router = useRouter();
  const carousel = useRef<CarouselRef>(null);
  const [index, setIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [deck, setDeck] = useState<LayoutRectangle | null>(null);

  const pages: ReactElement[] = [
    <OnboardingPage
      key="practice"
      isRevealed={furthestIndex >= 0}
      hero={<PracticeHero />}
      caption={ONBOARDING_PRACTICE_CAPTION}
      emblem={null}
      title={ONBOARDING_PRACTICE_TITLE}
      action={null}
    />,
    <OnboardingPage
      key="competition"
      isRevealed={furthestIndex >= 1}
      hero={<CompetitionHero />}
      caption={ONBOARDING_COMPETITION_CAPTION}
      emblem={null}
      title={ONBOARDING_COMPETITION_TITLE}
      action={null}
    />,
    <OnboardingPage
      key="surprise"
      isRevealed={furthestIndex >= 2}
      hero={null}
      caption={ONBOARDING_SURPRISE_CAPTION}
      emblem={<SurpriseHero />}
      title={ONBOARDING_SURPRISE_TITLE}
      action={
        <NewButton
          layout="block"
          shape="full"
          tone="gradient-primary"
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
    <ScreenContainer edges={ONBOARDING_DECK_EDGES} backdropColor={null}>
      <View style={styles.deck} onLayout={(event) => setDeck(event.nativeEvent.layout)}>
        {deck ? (
          <Carousel
            ref={carousel}
            style={{ width: deck.width, height: deck.height }}
            data={pages}
            renderItem={({ item }) => item}
            onSnapToItem={(snappedIndex) => {
              setIndex(snappedIndex);
              setFurthestIndex((furthest) => Math.max(furthest, snappedIndex));
            }}
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
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
  },
});
