import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Grid2x2, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuietButton } from "@/components/ui/quiet-button";
import { ScreenContainer } from "@/components/ui/screen-container";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { useAuthStore } from "@/features/account/auth-store";
import { useSessionQuestions } from "@/features/quiz/api";
import { CountdownRing } from "@/features/quiz/components/countdown-ring";
import { DevSkipToResults } from "@/features/quiz/components/dev-skip-to-results";
import { SessionResults } from "@/features/quiz/components/session-results";
import {
  ANSWER_PLACEHOLDER,
  CONFIRM_LABEL,
  COUNTDOWN_TICK_MS,
  QUIT_CANCEL_LABEL,
  QUIT_CONFIRM_LABEL,
  QUIT_LABEL,
  QUIT_MESSAGE,
  QUIT_TITLE,
  SESSION_ERROR,
  SQUARE_SWITCH_LABEL,
} from "@/features/quiz/constants";
import { isExpired, remainingFraction, remainingSeconds } from "@/features/quiz/countdown";
import { useOutboxStore } from "@/features/quiz/outbox-store";
import { drainOutbox } from "@/features/quiz/outbox-sync";
import { currentQuestion, sessionScore } from "@/features/quiz/session-reducer";
import { squareChoices } from "@/features/quiz/shuffle";
import { useStatsStore } from "@/features/quiz/stats-store";
import { useQuizStore } from "@/features/quiz/store";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, RADIUS } from "@/theme/tokens";

export function SessionScreen() {
  const { themeId, name } = useLocalSearchParams<{ themeId: string; name: string }>();
  const router = useRouter();
  const { data: questions, isPending, isFetching, refetch } = useSessionQuestions(themeId);

  const session = useQuizStore((state) => state.session);
  const startSession = useQuizStore((state) => state.startSession);
  const setInput = useQuizStore((state) => state.setInput);
  const switchToSquare = useQuizStore((state) => state.switchToSquare);
  const select = useQuizStore((state) => state.select);
  const confirm = useQuizStore((state) => state.confirm);
  const expire = useQuizStore((state) => state.expire);
  const clearSession = useQuizStore((state) => state.clearSession);
  const recordSession = useStatsStore((state) => state.recordSession);
  const enqueue = useOutboxStore((state) => state.enqueue);
  const owner = useAuthStore((state) => state.session?.user.id);

  const inputRef = useRef<TextInput>(null);
  const recordedRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [quitVisible, setQuitVisible] = useState(false);

  const isActive = session?.status === "active";
  const answeredCount = session?.answers.length ?? 0;
  // Stable per question (same array element), changes identity on each advance.
  const activeQuestion = session && isActive ? currentQuestion(session) : null;

  useEffect(() => {
    if (questions && questions.length > 0) {
      startSession(questions, Date.now());
    }
  }, [questions, startSession]);

  // An abandoned screen (back gesture, web back) must not leak a stale session.
  useEffect(() => clearSession, [clearSession]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
    return () => clearInterval(tick);
  }, [isActive]);

  // On foreground, sync to the wall clock so a question that expired while away resolves now.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        setNow(Date.now());
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (session?.status === "active" && isExpired(session.endsAt, now)) {
      expire(now);
    }
  }, [session, now, expire]);

  // The ref guards re-renders, so a finished session is recorded into its world exactly once.
  useEffect(() => {
    if (session?.status === "finished" && !recordedRef.current) {
      recordedRef.current = true;
      const points = sessionScore(session.answers);
      if (owner === undefined) {
        recordSession(themeId, name, points);
      } else {
        enqueue({
          id: randomUUID(),
          owner,
          themeId,
          themeName: name,
          points,
          finishedAt: new Date().toISOString(),
        });
        void drainOutbox(owner);
      }
    }
  }, [session, themeId, name, owner, recordSession, enqueue]);

  // Every question starts with the keyboard open — refocus after each advance.
  useEffect(() => {
    if (activeQuestion) {
      inputRef.current?.focus();
    }
  }, [activeQuestion]);

  if (session?.status === "finished") {
    return (
      <SessionResults
        themeName={name}
        questions={session.questions}
        answers={session.answers}
        onReplay={() => {
          // dismissTo would reuse the stale picker and recycle its Draw; a fresh push re-rolls it.
          router.dismissAll();
          router.push("/picker");
        }}
        onGoHome={() => router.dismissTo("/")}
      />
    );
  }

  if (!session) {
    return (
      <ScreenContainer>
        {/* Nothing is under way yet, so the quit control leaves straight away — no confirmation. */}
        <View style={styles.header}>
          <QuietButton
            layout="circle"
            icon={X}
            accessibilityLabel={QUIT_LABEL}
            onPress={() => router.dismissTo("/")}
          />
        </View>
        {/* A retry leaves the query in "error" until it lands, so the spinner stands in for it. */}
        {isPending || isFetching ? (
          <ScreenLoading />
        ) : (
          <ScreenError message={SESSION_ERROR} onRetry={() => void refetch()} />
        )}
      </ScreenContainer>
    );
  }

  const isSquare = session.mode === "square";
  // One guard for both modes: a standing text answer in Cash, a highlighted choice in Carré.
  const confirmDisabled = isSquare ? session.selection === null : session.input.trim() === "";

  const onSwitchToSquare = () => {
    if (!activeQuestion) {
      return;
    }
    // The RNG is injected here at the call site, so the reducer stays pure.
    inputRef.current?.blur();
    switchToSquare(squareChoices(activeQuestion, Math.random));
  };

  const onConfirmQuit = () => {
    // The unmount cleanup (clearSession) wipes the store, so no trace of the session survives.
    setQuitVisible(false);
    router.dismissTo("/");
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <QuietButton
            layout="circle"
            icon={X}
            accessibilityLabel={QUIT_LABEL}
            onPress={() => setQuitVisible(true)}
          />
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {answeredCount + 1}/{session.questions.length}
              </Text>
            </View>
            <CountdownRing
              fraction={remainingFraction(session.endsAt, now)}
              seconds={remainingSeconds(session.endsAt, now)}
            />
          </View>
        </View>
        <DevSkipToResults />
        <ScrollView style={styles.flex} contentContainerStyle={styles.questionContent}>
          <Text style={styles.questionText}>{activeQuestion?.text}</Text>
        </ScrollView>
        {isSquare && session.choices ? (
          <View style={styles.squareFooter}>
            <View style={styles.grid}>
              {session.choices.map((choice, index) => {
                const selected = session.selection === index;
                return (
                  <Pressable
                    key={choice}
                    style={[styles.choiceCard, selected && styles.choiceCardSelected]}
                    onPress={() => select(index)}
                  >
                    <Text style={styles.choiceText}>{choice}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={CONFIRM_LABEL}
              onPress={() => confirm(Date.now())}
              disabled={confirmDisabled}
            />
          </View>
        ) : (
          <View style={styles.footer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={session.input}
              onChangeText={setInput}
              // Web: Enter keeps focus (RN-web blurs on submit); native only dismisses.
              onSubmitEditing={() =>
                Platform.OS === "web" ? confirm(Date.now()) : inputRef.current?.blur()
              }
              // Both spellings: RN-web honors only blurOnSubmit, native only submitBehavior.
              blurOnSubmit={false}
              submitBehavior="submit"
              placeholder={ANSWER_PLACEHOLDER}
              placeholderTextColor={COLORS.inkMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Button
              layout="circle"
              icon={Grid2x2}
              accessibilityLabel={SQUARE_SWITCH_LABEL}
              onPress={onSwitchToSquare}
              theme="quiet"
            />
            <Button
              layout="circle"
              icon={Check}
              accessibilityLabel={CONFIRM_LABEL}
              onPress={() => confirm(Date.now())}
              disabled={confirmDisabled}
            />
          </View>
        )}
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={quitVisible}
        title={QUIT_TITLE}
        message={QUIT_MESSAGE}
        confirmLabel={QUIT_CONFIRM_LABEL}
        cancelLabel={QUIT_CANCEL_LABEL}
        onCancel={() => setQuitVisible(false)}
        onConfirm={onConfirmQuit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderWidth: 1,
    borderRadius: RADIUS.round,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    ...TEXT.label,
    color: COLORS.ink,
  },
  questionContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionText: {
    ...TEXT.question,
    color: COLORS.ink,
  },
  // Top-aligned so the input lines up with the buttons' faces, leaving their plates below it.
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  // Without minWidth the web input never shrinks past min-content and pushes the buttons out.
  input: {
    flex: 1,
    minWidth: 0,
    height: CONTROL_HEIGHT,
    backgroundColor: COLORS.quiet,
    borderColor: COLORS.stroke,
    borderWidth: 1,
    ...TEXT.body,
    borderRadius: RADIUS.base,
    paddingHorizontal: 16,
    color: COLORS.ink,
  },
  squareFooter: {
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 72,
    borderRadius: RADIUS.base,
    borderWidth: 2,
    borderColor: COLORS.stroke,
    backgroundColor: COLORS.quiet,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCardSelected: {
    borderColor: COLORS.primary,
  },
  choiceText: {
    ...TEXT.label,
    color: COLORS.ink,
    textAlign: "center",
  },
});
