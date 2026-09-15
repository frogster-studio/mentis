import { ScreenContainer, TAB_SCREEN_EDGES } from "@/components/ui/screen-container";
import { ProfileWash } from "@/features/account/components/profile-wash";

export const ProfileHistoryScreen = () => {
  return <ScreenContainer edges={TAB_SCREEN_EDGES} underlay={<ProfileWash />} />;
};
