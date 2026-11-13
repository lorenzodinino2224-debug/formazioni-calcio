import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/src/components/Avatar";
import { useToast } from "@/src/components/Toast";
import { useData } from "@/src/data/store";
import { Callup, ROLES, fullName, sortPlayers, uid } from "@/src/data/types";
import { convocatiHtml, sharePdf } from "@/src/pdf";
import { makeStyles, useTheme } from "@/src/theme";

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export default function CallupForm() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { callups, players, settings, saveCallup, deleteCallup } = useData();
  const existing = callups.find((c) => c.id === id);
  const [c, setC] = useState<Callup>(
    existing ?? {
      id: uid(),
      opponent: "",
      competition: "Campionato",
      date: today(),
      time: "15:00",
      meetTime: "13:30",
      venue: "",
      homeAway: "Casa",
      playerIds: [],
      notes: "",
      createdAt: new Date().toISOString(),
    },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const sorted = sortPlayers(players);

  const toggle = (pid: string) =>
    setC((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(pid) ? prev.playerIds.filter((x) => x !== pid) : [...prev.playerIds, pid],
    }));

  const validate = () => {
    if (!c.opponent.trim()) {
      toast("Inserisci l'avversario", "error");
      return false;
    }
    return true;
  };

  const onSave = () => {
    if (!validate()) return;
    saveCallup({ ...c, opponent: c.opponent.trim() });
    toast("Convocazione salvata");
    router.back();
  };

  const onPdf = async () => {
    if (!validate()) return;
    saveCallup(c);
    setPdfBusy(true);
    try {
      await sharePdf(await convocatiHtml(c, players, settings), "Distinta convocati");
    } catch {
      toast("Impossibile generare il PDF", "error");
    } finally {
      setPdfBusy(false);
    }
  };

  const input = (k: keyof Callup, label: string, placeholder: string, extra: object = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(c[k] ?? "")}
        onChangeText={(v) => setC({ ...c, [k]: v })}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        testID={`callup-${k}-input`}
        {...extra}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? 16 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headBtn} testID="callup-cancel-button">
          <Text style={styles.headBtnText}>Annulla</Text>
        </Pressable>
        <Text style={styles.headTitle}>{existing ? "Convocazione" : "Nuova convocazione"}</Text>
        <Pressable onPress={onPdf} style={[styles.headBtn, { alignItems: "flex-end" }]} testID="callup-pdf-button">
          {pdfBusy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Ionicons name="share-outline" size={22} color={colors.onBrandPrimary} />}
        </Pressable>
      </View>

      <KeyboardAwareScrollView bottomOffset={96} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {input("opponent", "Avversario", "Es. Pescara Calcio", { autoCapitalize: "words" })}
        <View style={styles.segment}>
          {(["Casa", "Trasferta"] as const).map((h) => (
            <Pressable key={h} onPress={() => setC({ ...c, homeAway: h })} style={[styles.segItem, c.homeAway === h && styles.segActive]} testID={`callup-homeaway-${h}`}>
              <Text style={[styles.segText, c.homeAway === h && styles.segTextActive]}>{h}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1.3 }}>{input("date", "Data", "gg/mm/aaaa")}</View>
          <View style={{ flex: 1 }}>{input("time", "Ora gara", "15:00")}</View>
          <View style={{ flex: 1 }}>{input("meetTime", "Ritrovo", "13:30")}</View>
        </View>
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>{input("competition", "Competizione", "Campionato")}</View>
          <View style={{ flex: 1 }}>{input("venue", "Campo", "Stadio comunale")}</View>
        </View>
        {input("notes", "Note", "Abbigliamento, documenti…", { multiline: true, style: [styles.input, styles.textarea] })}

        <View style={styles.listHead}>
          <Text style={styles.sectionTitle}>GIOCATORI · {c.playerIds.length} CONVOCATI</Text>
          <Pressable
            style={styles.linkBtn}
            testID="callup-select-all-button"
            onPress={() => setC({ ...c, playerIds: c.playerIds.length === players.length ? [] : players.map((p) => p.id) })}
          >
            <Text style={styles.linkText}>{c.playerIds.length === players.length && players.length ? "Nessuno" : "Tutti"}</Text>
          </Pressable>
        </View>
        {players.length === 0 && <Text style={styles.muted}>Aggiungi giocatori alla rosa per poterli convocare.</Text>}
        {ROLES.map((r) => {
          const list = sorted.filter((p) => p.role === r.key);
          if (!list.length) return null;
          return (
            <View key={r.key}>
              <Text style={styles.roleTitle}>{r.plural}</Text>
              {list.map((p) => {
                const on = c.playerIds.includes(p.id);
                return (
                  <Pressable key={p.id} onPress={() => toggle(p.id)} style={[styles.pRow, on && styles.pRowOn]} testID={`callup-player-${p.id}`}>
                    <Ionicons name={on ? "checkbox" : "square-outline"} size={24} color={on ? colors.brandPrimary : colors.borderStrong} />
                    <Avatar player={p} size={36} />
                    <Text style={styles.pNum}>{p.number}</Text>
                    <Text style={styles.pName} numberOfLines={1}>
                      {fullName(p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        {existing && (
          <Pressable
            style={[styles.deleteBtn, confirmDelete && styles.deleteConfirm]}
            testID="callup-delete-button"
            onPress={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              deleteCallup(c.id);
              toast("Convocazione eliminata", "info");
              router.back();
            }}
          >
            <Text style={[styles.deleteText, confirmDelete && { color: colors.onError }]}>
              {confirmDelete ? "Tocca di nuovo per confermare" : "Elimina convocazione"}
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollView>

      <View style={[styles.sticky, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={onSave} testID="callup-save-button">
          <Ionicons name="checkmark" size={20} color={colors.onBrandPrimary} />
          <Text style={styles.primaryText}>Salva convocati ({c.playerIds.length})</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingBottom: 8 },
  headBtn: { minHeight: 44, minWidth: 64, justifyContent: "center", paddingHorizontal: 8 },
  headBtnText: { color: c.onBrandPrimary, fontSize: 16 },
  headTitle: { color: c.onBrandPrimary, fontSize: 17, fontWeight: "800" },
  row2: { flexDirection: "row", gap: 8 },
  field: { gap: 6, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary },
  input: { height: 48, borderRadius: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, fontSize: 15, color: c.onSurface },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: "top" },
  segment: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 4, marginBottom: 14 },
  segItem: { flex: 1, height: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: c.brandSecondary },
  segText: { fontWeight: "800", color: c.onSurfaceTertiary },
  segTextActive: { color: c.onBrandSecondary },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: c.brandSecondary, letterSpacing: 1 },
  linkBtn: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  linkText: { color: c.brandSecondary, fontWeight: "700", fontSize: 15 },
  muted: { color: c.muted, fontSize: 13 },
  roleTitle: { fontSize: 13, fontWeight: "800", color: c.muted, marginTop: 8, marginBottom: 4 },
  pRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, minHeight: 52, marginBottom: 4, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  pRowOn: { backgroundColor: c.brandTertiary, borderColor: c.brandPrimary },
  pNum: { width: 28, textAlign: "center", fontWeight: "900", color: c.brandPrimary, fontSize: 15 },
  pName: { flex: 1, fontSize: 15, fontWeight: "600", color: c.onSurface },
  deleteBtn: { alignItems: "center", justifyContent: "center", height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: c.error, marginTop: 24 },
  deleteConfirm: { backgroundColor: c.error },
  deleteText: { color: c.error, fontWeight: "800" },
  sticky: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderTopColor: c.border },
  primaryBtn: { height: 52, borderRadius: 999, backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: c.onBrandPrimary, fontWeight: "800", fontSize: 16 },
}));
