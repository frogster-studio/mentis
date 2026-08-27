import { Redirect } from "expo-router";
import { useOnboardingStore } from "@/features/onboarding/store";
import { HomeScreen } from "@/features/quiz/components/home-screen";

const HomeRoute = () => {
  const hasOnboarded = useOnboardingStore((state) => state.hasOnboarded);

  return hasOnboarded ? <HomeScreen /> : <Redirect href="/onboarding" />;
};

export default HomeRoute;
