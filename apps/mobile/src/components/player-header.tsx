import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { MainHeader } from "@/components/main-header";
import { MainSubHeader } from "@/components/main-sub-header";
import { PlayerGreeting } from "@/components/player-greeting";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileInitial } from "@/components/profile-initial";
import { NewButton } from "@/components/ui/new-button";
import { useProfile } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { PseudoSheet } from "@/features/account/components/pseudo-sheet";
import { PROFILE_TITLE } from "@/features/account/constants";
import { HOME_TITLE } from "@/features/quiz/constants";
import { WORLD_TITLE } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export const WORLD_PATH = "/world";

interface PlayerHeaderProps {
  isWorld: boolean;
}

export const PlayerHeader = ({ isWorld }: PlayerHeaderProps) => {
  const router = useRouter();
  const playerId = useAuthStore((state) => state.session?.user.id);
  const profile = useProfile(playerId);
  const [pseudoVisible, setPseudoVisible] = useState(false);

  return (
    <>
      <MainHeader
        isDark={isWorld}
        subHeader={
          <MainSubHeader>
            <Text style={styles.title} numberOfLines={2}>
              {isWorld ? WORLD_TITLE : HOME_TITLE}
            </Text>
          </MainSubHeader>
        }
      >
        <ProfileAvatar initial={profileInitial(profile.data?.pseudo)} />

        <PlayerGreeting isWorld={isWorld} onPseudoPress={() => setPseudoVisible(true)} />

        <NewButton
          layout="hug"
          shape="rounded"
          tone="default"
          disabled={false}
          pending={false}
          icon="menu"
          label={null}
          accessibilityLabel={PROFILE_TITLE}
          onPress={() => router.push("/profile")}
        />
      </MainHeader>

      {playerId === undefined ? null : (
        <PseudoSheet
          playerId={playerId}
          visible={pseudoVisible}
          onDismiss={() => setPseudoVisible(false)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  title: { ...TEXT.mainSubHeaderTitle, color: COLORS.ink },
});
