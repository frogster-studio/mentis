import { ActivityIndicator, SectionList, StyleSheet, Text, View } from "react-native";
import { HistoryRow } from "@/components/account/history-row";
import { HistorySectionHeader } from "@/components/account/history-section-header";
import { useBottomTabBarHeight } from "@/components/bottom-tab-bar";
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
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + SPACE.lg }]}
    />
  );
}

const styles = StyleSheet.create({
  // The scene is clear over the layout's paper and wash, so the page caps its own width.
  list: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  // Grows to the viewport, so a loading or failed read fills the space under the header.
  content: {
    flexGrow: 1,
    paddingTop: SPACE.lg,
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
