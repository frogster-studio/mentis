import { randomUUID } from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Grid2x2, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScreenContainer } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { useSessionQuestions } from "@/features/quiz/api";
import { CountdownRing } from "@/features/quiz/components/countdown-ring";
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
import { COLORS } from "@/utils/colors";

export function SessionScreen() {
  const { themeId, name } = useLocalSearchParams<{ themeId: string; name: string }>();
  const router = useRouter();
  const { data: questions, isPending } = useSessionQuestions(themeId);

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

  // Backgrounding the app (or hiding the web tab) throttles or pauses the interval, but
  // the Countdown is an absolute end-timestamp — it never really paused. On return, sync
  // `now` to the wall clock at once so the expiry effect resolves a question that ran out
  // while away, instead of waiting for the next throttled tick. (AppState maps to tab
  // visibility on react-native-web, so this covers web too.)
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

  // A finished Quiz Session is recorded into its world exactly once — the ref guards the
  // re-renders that follow. Abandoned Sessions never reach 'finished', so they never write.
  // Signed out → Device Stats, exactly as before. Signed in → the Account world: the session
  // is queued in the outbox first (the fold's optimistic overlay lands it on the home shelf
  // instantly, offline included), then pushed — a failed push just stays queued for the next
  // trigger. The two worlds never mix: a signed-in finish never touches Device Stats.
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

  // Every question starts with the keyboard open: refocus after each advance,
  // including when the player had dismissed the keyboard to see « Valider ».
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
          // A fresh Draw means a freshly mounted picker: drop the whole stack back to
          // home, then push a new picker so its Draw re-rolls. dismissTo would reuse the
          // stale picker still in the stack and recycle the same 10 themes.
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
        <View style={styles.centered}>
          {isPending ? (
            <ActivityIndicator color={COLORS.primary} size="large" />
          ) : (
            <Text style={styles.error}>{SESSION_ERROR}</Text>
          )}
        </View>
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
    // Dismiss the keyboard, then reveal the shuffled grid — the RNG is injected here at
    // the call site so the reducer stays pure. The switch discards the typed input.
    inputRef.current?.blur();
    switchToSquare(squareChoices(activeQuestion, Math.random));
  };

  const onConfirmQuit = () => {
    // Discard the Abandoned Session and land home. The screen's unmount cleanup
    // (clearSession) wipes the store, so no score and no trace of the session survive.
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
          <Pressable
            style={styles.quitButton}
            onPress={() => setQuitVisible(true)}
            accessibilityLabel={QUIT_LABEL}
            hitSlop={8}
          >
            <X color={COLORS.fill} size={26} />
          </Pressable>
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
            <Pressable
              style={({ pressed }) => [
                styles.validateButton,
                (pressed || confirmDisabled) && styles.buttonDimmed,
              ]}
              onPress={() => confirm(Date.now())}
              disabled={confirmDisabled}
            >
              <Text style={styles.validateLabel}>{CONFIRM_LABEL}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.footer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={session.input}
              onChangeText={setInput}
              // Web: Enter submits the standing Answer (an empty Enter is a no-op via
              // the reducer's confirm guard), then reclaims focus — react-native-web
              // blurs after submit no matter what, and it must not win, so the player
              // can chain Enter answer after answer. Native keyboards: the confirm key
              // only dismisses — the check button stays visible either way.
              onSubmitEditing={() =>
                Platform.OS === "web" ? confirm(Date.now()) : inputRef.current?.blur()
              }
              // Both spellings of « don't blur on submit »: react-native-web only
              // honors the legacy blurOnSubmit prop, native RN the current submitBehavior.
              blurOnSubmit={false}
              submitBehavior="submit"
              placeholder={ANSWER_PLACEHOLDER}
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Pressable
              style={styles.squareToggle}
              onPress={onSwitchToSquare}
              accessibilityLabel={SQUARE_SWITCH_LABEL}
            >
              <Grid2x2 color={COLORS.primary} size={26} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                (pressed || confirmDisabled) && styles.buttonDimmed,
              ]}
              onPress={() => confirm(Date.now())}
              disabled={confirmDisabled}
              accessibilityLabel={CONFIRM_LABEL}
            >
              <Check color={COLORS.fillOpposite} size={26} />
            </Pressable>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  error: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  // The one-way quit affordance, top-left; the negative margin pulls the glyph flush
  // with the content gutter while keeping a comfortable touch target.
  quitButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeDefault,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
  },
  questionContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionText: {
    color: COLORS.fill,
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.fill,
    fontSize: 18,
  },
  // Stretches to the input's height (row default), stays square-ish via fixed width.
  confirmButton: {
    width: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Outlined sibling of the filled confirm button: the primary-colored 2×2 grid icon
  // is the one-way switch to Carré, always available beside the input during Cash.
  squareToggle: {
    width: 52,
    borderRadius: 12,
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDimmed: {
    opacity: 0.5,
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.strokeStrong,
    backgroundColor: COLORS.panel,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceCardSelected: {
    borderColor: COLORS.primary,
  },
  choiceText: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  validateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  validateLabel: {
    color: COLORS.fillOpposite,
    fontSize: 16,
    fontWeight: "bold",
  },
});
