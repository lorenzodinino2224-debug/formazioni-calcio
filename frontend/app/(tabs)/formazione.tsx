import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/src/components/Avatar";
import { Pitch } from "@/src/components/Pitch";
import { PlayerPicker } from "@/src/components/PlayerPicker";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useToast } from "@/src/components/Toast";
import { MODULES, emptySlots } from "@/src/data/modules";
import { useData } from "@/src/data/store";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, useTheme } from "@/src/theme";

const haptic = (s: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== "web") Haptics.impactAsync(s);
};

export default function FormazioneScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { width } = useWindowDimensions();
  const toast = useToast();
  const { players, lineup, setLineup, schemes, saveScheme, deleteScheme, playerById } = useData();
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [benchOpen, setBenchOpen] = useState(false);
  const [schemesOpen, setSchemesOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [schemeName, setSchemeName] = useState("");

  const pitchWidth = Math.min(width - 32, 460);

  const changeModule = (m: string) => {
    haptic(Haptics.ImpactFeedbackStyle.Rigid);
    setLineup({ ...lineup, module: m });
  };

  const assign = (id: string) => {
    if (slotIndex === null) return;
    const slots = lineup.slots.map((s) => (s === id ? null : s));
    slots[slotIndex] = id;
    setLineup({ ...lineup, slots, bench: lineup.bench.filter((b) => b !== id) });
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    setSlotIndex(null);
  };

  const clearSlot = () => {
    if (slotIndex === null) return;
    const slots = [...lineup.slots];
    slots[slotIndex] = null;
    setLineup({ ...lineup, slots });
    setSlotIndex(null);
  };

  const toggleBench = (id: string) => {
    const on = lineup.bench.includes(id);
    setLineup({
      ...lineup,
      slots: on ? lineup.slots : lineup.slots.map((s) => (s === id ? null : s)),
      bench: on ? lineup.bench.filter((b) => b !== id) : [...lineup.bench, id],
    });
  };

  const onSave = () => {
    const name = schemeName.trim() || `Schema ${lineup.module}`;
    saveScheme(name);
    setSaveOpen(false);
    setSchemeName("");
    toast(`"${name}" salvato`);
  };

  const filled = lineup.slots.filter(Boolean).length;
  const onPitch = lineup.slots.filter(Boolean) as string[];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Formazione"
        subtitle={`${lineup.module} · ${filled}/11 in campo`}
        right={
          <View style={styles.headActions}>
            <Pressable style={styles.headBtn} onPress={() => setSchemesOpen(true)} testID="formazione-schemes-button">
              <Ionicons name="folder-open-outline" size={22} color={colors.onBrandPrimary} />
            </Pressable>
            <Pressable style={styles.headBtn} onPress={() => setSaveOpen(true)} testID="formazione-save-button">
              <Ionicons name="save-outline" size={22} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        }
      />
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {MODULES.map((m) => {
            const active = lineup.module === m;
            return (
              <Pressable key={m} testID={`module-chip-${m}`} onPress={() => changeModule(m)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 24 }}>
        <Pitch
          module={lineup.module}
          slots={lineup.slots}
          playerById={playerById}
          onSlotPress={setSlotIndex}
          width={pitchWidth}
        />

        <View style={styles.benchHead}>
          <Text style={styles.sectionTitle}>PANCHINA · {lineup.bench.length}</Text>
          <Pressable onPress={() => setBenchOpen(true)} style={styles.linkBtn} testID="bench-edit-button">
            <Ionicons name="add-circle-outline" size={18} color={colors.brandSecondary} />
            <Text style={styles.linkText}>Modifica</Text>
          </Pressable>
        </View>
        {lineup.bench.length === 0 ? (
          <Text style={styles.muted}>Nessun giocatore in panchina.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {lineup.bench.map((id) => {
              const p = playerById(id);
              if (!p) return null;
              return (
                <View key={id} style={styles.benchItem} testID={`bench-player-${id}`}>
                  <Avatar player={p} size={48} />
                  <Text style={styles.benchNum}>{p.number}</Text>
                  <Text style={styles.benchName} numberOfLines={1}>
                    {p.lastName}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Pressable
          style={styles.resetBtn}
          testID="formazione-reset-button"
          onPress={() => {
            setLineup({ module: lineup.module, slots: emptySlots(), bench: [] });
            toast("Formazione svuotata", "info");
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.error} />
          <Text style={styles.resetText}>Svuota formazione</Text>
        </Pressable>
      </ScrollView>

      <PlayerPicker
        visible={slotIndex !== null}
        title="Scegli giocatore"
        players={players}
        selectedIds={slotIndex !== null && lineup.slots[slotIndex] ? [lineup.slots[slotIndex] as string] : []}
        busyIds={onPitch}
        onSelect={assign}
        onRemove={slotIndex !== null && lineup.slots[slotIndex] ? clearSlot : undefined}
        onClose={() => setSlotIndex(null)}
      />
      <PlayerPicker
        visible={benchOpen}
        title="Panchina"
        multi
        players={players}
        selectedIds={lineup.bench}
        busyIds={onPitch}
        onSelect={toggleBench}
        onClose={() => setBenchOpen(false)}
      />

      <Modal visible={schemesOpen} transparent animationType="slide" onRequestClose={() => setSchemesOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSchemesOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="schemes-sheet">
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Schemi salvati</Text>
            <Pressable onPress={() => setSchemesOpen(false)} style={styles.linkBtn} testID="schemes-close-button">
              <Text style={styles.linkText}>Chiudi</Text>
            </Pressable>
          </View>
          <ScrollView>
            {schemes.length === 0 && <Text style={styles.muted}>Nessuno schema salvato. Usa l&apos;icona salva in alto.</Text>}
            {schemes.map((s) => (
              <View key={s.id} style={styles.schemeRow}>
                <Pressable
                  style={{ flex: 1 }}
                  testID={`scheme-load-${s.id}`}
                  onPress={() => {
                    setLineup({ module: s.module, slots: s.slots, bench: s.bench });
                    setSchemesOpen(false);
                    toast(`Caricato "${s.name}"`);
                  }}
                >
                  <Text style={styles.schemeName}>{s.name}</Text>
                  <Text style={styles.muted}>
                    {s.module} · {s.slots.filter(Boolean).length}/11 · {new Date(s.createdAt).toLocaleDateString("it-IT")}
                  </Text>
                </Pressable>
                <Pressable onPress={() => deleteScheme(s.id)} style={styles.iconBtn} testID={`scheme-delete-${s.id}`}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={saveOpen} transparent animationType="fade" onRequestClose={() => setSaveOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.center}>
          <Pressable style={StyleOverlay.fill} onPress={() => setSaveOpen(false)} />
          <View style={styles.dialog} testID="save-scheme-dialog">
            <Text style={styles.sheetTitle}>Salva schema</Text>
            <TextInput
              value={schemeName}
              onChangeText={setSchemeName}
              placeholder={`Schema ${lineup.module}`}
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoFocus
              testID="scheme-name-input"
            />
            <View style={styles.dialogRow}>
              <Pressable style={styles.ghostBtn} onPress={() => setSaveOpen(false)} testID="scheme-cancel-button">
                <Text style={styles.ghostText}>Annulla</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={onSave} testID="scheme-confirm-button">
                <Text style={styles.primaryText}>Salva</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const StyleOverlay = { fill: { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 } };

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  headActions: { flexDirection: "row", gap: 4 },
  headBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.12)" },
  chipRow: { height: 56, backgroundColor: c.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: c.border, justifyContent: "center" },
  chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" },
  chip: {
    height: 36,
    flexShrink: 0,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceTertiary,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: c.brandSecondary, borderColor: c.brandSecondary },
  chipText: { fontSize: 14, fontWeight: "800", color: c.onSurfaceTertiary },
  chipTextActive: { color: c.onBrandSecondary },
  benchHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: c.brandSecondary, letterSpacing: 1 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 4 },
  linkText: { color: c.brandSecondary, fontSize: 15, fontWeight: "700" },
  muted: { color: c.muted, fontSize: 13 },
  benchItem: { width: 64, alignItems: "center" },
  benchNum: { fontSize: 13, fontWeight: "900", color: c.brandPrimary, marginTop: 4 },
  benchName: { fontSize: 11, color: c.onSurface, fontWeight: "600" },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", marginTop: 24, minHeight: 44, paddingHorizontal: 12 },
  resetText: { color: c.error, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: c.overlay },
  sheet: { maxHeight: "70%", backgroundColor: c.surfaceSecondary, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 8 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  schemeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider },
  schemeName: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: c.overlay },
  dialog: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 20, gap: 16 },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: c.surfaceTertiary,
    paddingHorizontal: 14,
    fontSize: 16,
    color: c.onSurface,
  },
  dialogRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  ghostBtn: { height: 44, paddingHorizontal: 16, justifyContent: "center" },
  ghostText: { color: c.muted, fontWeight: "700", fontSize: 15 },
  primaryBtn: { height: 44, paddingHorizontal: 20, borderRadius: 999, backgroundColor: c.brandPrimary, justifyContent: "center" },
  primaryText: { color: c.onBrandPrimary, fontWeight: "800", fontSize: 15 },
}));
