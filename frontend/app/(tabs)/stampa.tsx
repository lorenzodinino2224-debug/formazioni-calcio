import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { useData } from "@/src/data/store";
import { Settings } from "@/src/data/types";
import { usesNativeTabs } from "@/src/navigation";
import { convocatiHtml, formazioneHtml, printPdf, rosaHtml, sharePdf } from "@/src/pdf";
import { makeStyles, useTheme } from "@/src/theme";

type Doc = "convocati" | "formazione" | "rosa";

export default function StampaScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const toast = useToast();
  const { players, lineup, callups, settings, saveSettings } = useData();
  const [callupId, setCallupId] = useState<string | null>(callups[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Settings>(settings);

  useEffect(() => setForm(settings), [settings]);
  useEffect(() => {
    if (!callups.find((c) => c.id === callupId)) setCallupId(callups[0]?.id ?? null);
  }, [callups, callupId]);

  const build = async (doc: Doc) => {
    if (doc === "rosa") return rosaHtml(players, settings);
    if (doc === "formazione") return formazioneHtml(lineup, players, settings);
    const c = callups.find((x) => x.id === callupId);
    if (!c) throw new Error("no callup");
    return convocatiHtml(c, players, settings);
  };

  const run = async (doc: Doc, mode: "share" | "print") => {
    if (doc === "convocati" && !callupId) {
      toast("Crea prima una convocazione", "error");
      return;
    }
    setBusy(`${doc}-${mode}`);
    try {
      const html = await build(doc);
      if (mode === "share") await sharePdf(html, "Condividi PDF");
      else await printPdf(html);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      toast("Impossibile generare il PDF", "error");
    } finally {
      setBusy(null);
    }
  };

  const docs: { key: Doc; title: string; desc: string; icon: string }[] = [
    { key: "convocati", title: "Distinta convocati", desc: "Elenco convocati con data, avversario e ritrovo", icon: "clipboard" },
    { key: "formazione", title: "Formazione in campo", desc: `Modulo ${lineup.module} con titolari e panchina`, icon: "football" },
    { key: "rosa", title: "Rosa completa", desc: `${players.length} giocatori divisi per ruolo`, icon: "people" },
  ];

  const field = (key: keyof Settings, label: string, placeholder: string) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) => setForm({ ...form, [key]: v })}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        testID={`settings-${key}-input`}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Moduli e stampa" subtitle="PDF da stampare o inviare" />
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 24 }}>
        {docs.map((d) => (
          <View key={d.key} style={styles.card} testID={`doc-card-${d.key}`}>
            <View style={styles.cardHead}>
              <View style={styles.iconBox}>
                <Ionicons name={d.icon as any} size={26} color={colors.onBrandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{d.title}</Text>
                <Text style={styles.cardDesc}>{d.desc}</Text>
              </View>
            </View>

            {d.key === "convocati" && (
              callups.length === 0 ? (
                <Text style={styles.muted}>Nessuna convocazione salvata.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {callups.map((c) => {
                    const active = c.id === callupId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCallupId(c.id)}
                        style={[styles.chip, active && styles.chipActive]}
                        testID={`print-callup-chip-${c.id}`}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                          {c.date} · {c.opponent}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )
            )}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
                onPress={() => run(d.key, "share")}
                disabled={!!busy}
                testID={`doc-${d.key}-share-button`}
              >
                {busy === `${d.key}-share` ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color={colors.onBrandPrimary} />
                    <Text style={styles.primaryText}>Condividi PDF</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
                onPress={() => run(d.key, "print")}
                disabled={!!busy}
                testID={`doc-${d.key}-print-button`}
              >
                {busy === `${d.key}-print` ? (
                  <ActivityIndicator color={colors.brandSecondary} />
                ) : (
                  <>
                    <Ionicons name="print-outline" size={18} color={colors.brandSecondary} />
                    <Text style={styles.secondaryText}>Stampa</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>DATI SOCIETÀ NEI MODULI</Text>
        <View style={styles.card}>
          {field("teamName", "Nome società", "Città di Spoltore")}
          {field("category", "Categoria", "Prima Squadra")}
          {field("season", "Stagione", "2026/2027")}
          {field("coach", "Allenatore", "Nome e cognome")}
          <Pressable
            style={[styles.primaryBtn, { alignSelf: "flex-start", flex: 0, paddingHorizontal: 24 }]}
            onPress={() => {
              saveSettings(form);
              toast("Dati società salvati");
            }}
            testID="settings-save-button"
          >
            <Text style={styles.primaryText}>Salva dati</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface },
  cardDesc: { fontSize: 13, color: c.muted, marginTop: 2 },
  muted: { fontSize: 13, color: c.muted },
  chips: { gap: 8 },
  chip: { height: 36, flexShrink: 0, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceTertiary, justifyContent: "center", maxWidth: 220 },
  chipActive: { backgroundColor: c.brandTertiary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary },
  chipTextActive: { color: c.onBrandTertiary },
  actions: { flexDirection: "row", gap: 8 },
  primaryBtn: { flex: 1, height: 48, borderRadius: 999, backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  primaryText: { color: c.onBrandPrimary, fontWeight: "800", fontSize: 15 },
  secondaryBtn: { flex: 1, height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: c.brandSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  secondaryText: { color: c.brandSecondary, fontWeight: "800", fontSize: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: c.brandSecondary, letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary },
  input: { height: 48, borderRadius: 12, backgroundColor: c.surfaceTertiary, paddingHorizontal: 14, fontSize: 16, color: c.onSurface },
}));
