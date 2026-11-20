// PROTOTYPE (ticket 94): /prototype-theme-link-results?variant=A&device=desktop&copy=1 — throwaway.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  CTA_SENTENCES,
  type CopyOption,
  type Device,
  detectDevice,
  MOCK_ANSWERS,
  MOCK_THEME,
  shareLine,
} from "@/components/prototype/theme-link-results-parts";
import { VariantA, VariantB, VariantC, VariantD } from "@/components/prototype/theme-link-results-variants";
import { sessionScore } from "@/features/quiz/session-reducer";
import { COLORS } from "@/theme/tokens";

const VARIANTS = [
  { key: "D", name: "Choix Hugo", Component: VariantD },
  { key: "A", name: "Bande", Component: VariantA },
  { key: "B", name: "Carte", Component: VariantB },
  { key: "C", name: "Écran final", Component: VariantC },
] as const;
const DEVICES: Device[] = ["desktop", "ios", "android"];
const COPIES: CopyOption[] = ["1", "2", "3"];

const cycle = <T,>(list: readonly T[], current: T, step: number) =>
  list[(list.indexOf(current) + step + list.length) % list.length];

export default function Page() {
  const router = useRouter();
  const params = useLocalSearchParams<{ variant?: string; device?: Device; copy?: CopyOption }>();
  const variant = VARIANTS.find((v) => v.key === params.variant) ?? VARIANTS[0];
  const device = params.device ?? detectDevice();
  const copy = params.copy ?? "1";

  const goVariant = (step: number) =>
    router.setParams({ variant: cycle(VARIANTS, variant, step).key });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") goVariant(-1);
      if (event.key === "ArrowRight") goVariant(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <View style={styles.root}>
      <variant.Component key={`${variant.key}-${device}`} device={device} copy={copy} />
      {__DEV__ ? (
        <View style={styles.bar} pointerEvents="box-none">
          <View style={styles.pill}>
            <Pressable onPress={() => goVariant(-1)}>
              <Text style={styles.barText}>‹</Text>
            </Pressable>
            <Text style={styles.barText}>
              {variant.key} ({variant.name})
            </Text>
            <Pressable onPress={() => goVariant(1)}>
              <Text style={styles.barText}>›</Text>
            </Pressable>
            <Text style={styles.barSep}>|</Text>
            <Pressable onPress={() => router.setParams({ device: cycle(DEVICES, device, 1) })}>
              <Text style={styles.barText}>{device}</Text>
            </Pressable>
            <Text style={styles.barSep}>|</Text>
            <Pressable onPress={() => router.setParams({ copy: cycle(COPIES, copy, 1) })}>
              <Text style={styles.barText}>copie {copy}</Text>
            </Pressable>
          </View>
          {variant.key === "D" ? null : (
          <Text style={styles.state} numberOfLines={3}>
            CTA: {CTA_SENTENCES[copy]}
            {"\n"}Partage: {shareLine(copy, sessionScore(MOCK_ANSWERS), MOCK_THEME)}
          </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  bar: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  barText: { color: "#fff", fontSize: 14 },
  barSep: { color: "#666", fontSize: 14 },
  state: {
    maxWidth: 560,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.7)",
    fontSize: 11,
    padding: 6,
    borderRadius: 6,
  },
});
