import { ActivityIndicator, SectionList, StyleSheet, Text, View } from "react-native";
import { HistoryRow } from "@/components/account/history-row";
import { HistorySectionHeader } from "@/components/account/history-section-header";
import { useBottomTabBarHeight } from "@/components/bottom-tab-bar";
import { useMainHeaderHeight } from "@/components/main-header";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useHistory } from "@/features/account/api";
import { useAuthStore } from "@/features/account/auth-store";
import { HISTORY_EMPTY, HISTORY_ERROR, HISTORY_SIGNED_OUT } from "@/features/account/constants";
import { historySections } from "@/features/account/history-sections";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

export default function Page() {
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useMainHeaderHeight();
  const owner = useAuthStore((state) => state.session?.user.id);
  const isSignedIn = owner !== undefined;
  const history = useHistory(owner);

  const sessions = history.data?.pages.flatMap((page) => page.sessions) ?? [];
  const isLoading = isSignedIn && history.isPending;
  const isFailed = isSignedIn && !isLoading && history.data === undefined;

  const fetchNextPage = () => {
    if (history.hasNextPage && !history.isFetchingNextPage) {
      void history.fetchNextPage();
    }
  };

  return (
    <SectionList
      style={styles.list}
      sections={historySections(sessions, new Date())}
      keyExtractor={(session) => session.id}
      renderItem={({ item }) => <HistoryRow session={item} />}
      renderSectionHeader={({ section }) => <HistorySectionHeader title={section.title} />}
      ItemSeparatorComponent={() => <View style={styles.rowGap} />}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      onEndReached={fetchNextPage}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        !isSignedIn ? (
          <Text style={styles.caption}>{HISTORY_SIGNED_OUT}</Text>
        ) : isLoading ? (
          <ScreenLoading />
        ) : isFailed ? (
          <ScreenError message={HISTORY_ERROR} onRetry={() => void history.refetch()} />
        ) : (
          <Text style={styles.caption}>{HISTORY_EMPTY}</Text>
        )
      }
      ListFooterComponent={
        history.isFetchingNextPage ? (
          <ActivityIndicator color={COLORS.primary} style={styles.footer} />
        ) : null
      }
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + SPACE.lg, paddingBottom: tabBarHeight + SPACE.lg },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: GUTTER,
  },
  rowGap: { height: SPACE.sm },
  footer: { paddingVertical: SPACE.lg },
  caption: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
    paddingVertical: SPACE.lg,
  },
});
