import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Player, ROLES, fullName, sortPlayers } from "@/src/data/types";
import { makeStyles, useTheme } from "@/src/theme";
import { Avatar } from "./Avatar";

export function PlayerPicker({
  visible,
  title,
  players,
  selectedIds,
  busyIds,
  onSelect,
  onRemove,
  onClose,
  multi,
}: {
  visible: boolean;
  title: string;
  players: Player[];
  selectedIds: string[];
  busyIds?: string[];
  onSelect: (id: string) => void;
  onRemove?: () => void;
  onClose: () => void;
  multi?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sorted = sortPlayers(players);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="picker-backdrop" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID="player-picker">
        <View style={styles.handle} />
        <View style={styles.headRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} testID="picker-close-button" style={styles.closeBtn}>
            <Text style={styles.closeText}>{multi ? "Fatto" : "Chiudi"}</Text>
          </Pressable>
        </View>
        {onRemove ? (
          <Pressable style={styles.removeRow} onPress={onRemove} testID="picker-remove-button">
            <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
            <Text style={styles.removeText}>Libera posizione</Text>
          </Pressable>
        ) : null}
        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {sorted.length === 0 && (
            <Text style={styles.empty}>Nessun giocatore in rosa. Aggiungili dalla scheda Rosa.</Text>
          )}
          {ROLES.map((r) => {
            const list = sorted.filter((p) => p.role === r.key);
            if (!list.length) return null;
            return (
              <View key={r.key}>
                <Text style={styles.section}>{r.plural.toUpperCase()}</Text>
                {list.map((p) => {
                  const selected = selectedIds.includes(p.id);
                  const busy = busyIds?.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      testID={`picker-player-${p.id}`}
                      onPress={() => onSelect(p.id)}
                      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.7 }]}
                    >
                      <Avatar player={p} size={40} />
                      <Text style={styles.num}>{p.number || "-"}</Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {fullName(p)}
                      </Text>
                      {busy && !selected ? <Text style={styles.busy}>in campo</Text> : null}
                      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.brandPrimary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: { flex: 1, backgroundColor: c.overlay },
  sheet: {
    maxHeight: "75%",
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong, alignSelf: "center", marginTop: 8 },
  headRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: c.onSurface },
  closeBtn: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  closeText: { color: c.brandSecondary, fontSize: 16, fontWeight: "700" },
  removeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, minHeight: 44 },
  removeText: { color: c.error, fontSize: 15, fontWeight: "700" },
  section: { fontSize: 12, fontWeight: "800", color: c.muted, letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 56,
  },
  rowSelected: { backgroundColor: c.brandTertiary },
  num: { width: 28, textAlign: "center", fontSize: 16, fontWeight: "800", color: c.brandSecondary },
  name: { flex: 1, fontSize: 16, fontWeight: "600", color: c.onSurface },
  busy: { fontSize: 12, color: c.muted },
  empty: { color: c.muted, textAlign: "center", paddingVertical: 24 },
}));
