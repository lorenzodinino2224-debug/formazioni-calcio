import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { backupSupported, isStandalone } from "@/src/backup";
import { Avatar } from "@/src/components/Avatar";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { backupOverdue, useData } from "@/src/data/store";
import { ROLES, Role, fullName, sortPlayers } from "@/src/data/types";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, useTheme } from "@/src/theme";

export default function RosaScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { players, lastBackup, installDismissed, dismissInstall } = useData();
  const [filter, setFilter] = useState<Role | "ALL">("ALL");
  const showInstall = backupSupported && !installDismissed && !isStandalone();
  const showBackup = backupSupported && backupOverdue(lastBackup, players.length > 0);

  const sections = useMemo(() => {
    const sorted = sortPlayers(players);
    return ROLES.filter((r) => filter === "ALL" || r.key === filter)
      .map((r) => ({ title: r.plural, key: r.key, data: sorted.filter((p) => p.role === r.key) }))
      .filter((s) => s.data.length);
  }, [players, filter]);

  const openNew = () => router.push({ pathname: "/player/[id]", params: { id: "new" } });

  return (
    <View style={styles.root}>
      <ScreenHeader title="Rosa" subtitle={`${players.length} giocatori`} />
      {showInstall ? (
        <View style={styles.banner} testID="install-banner">
          <Ionicons name="add-circle-outline" size={20} color={colors.brandSecondary} />
          <Text style={styles.bannerText}>
            Installa l&apos;app: tocca Condividi e poi &quot;Aggiungi alla schermata Home&quot;.
          </Text>
          <Pressable onPress={dismissInstall} hitSlop={10} style={styles.bannerClose} testID="install-banner-close">
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : showBackup ? (
        <Pressable style={styles.banner} onPress={() => router.push("/(tabs)/stampa")} testID="backup-reminder-banner">
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <Text style={styles.bannerText}>
            {lastBackup ? "Backup più vecchio di 30 giorni." : "Nessun backup ancora."} I dati sono solo su questo iPhone: tocca per esportarli.
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
      <View style={styles.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ key: "ALL" as const, plural: "Tutti" }, ...ROLES].map((r) => {
            const active = filter === r.key;
            const count = r.key === "ALL" ? players.length : players.filter((p) => p.role === r.key).length;
            return (
              <Pressable
                key={r.key}
                testID={`rosa-filter-${r.key}`}
                onPress={() => setFilter(r.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {r.plural} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {players.length === 0 ? (
        <View style={styles.empty} testID="rosa-empty">
          <View style={styles.emptyIcon}>
            <Ionicons name="shirt-outline" size={48} color={colors.brandPrimary} />
          </View>
          <Text style={styles.emptyTitle}>Nessun giocatore in rosa</Text>
          <Text style={styles.emptyText}>Aggiungi il primo giocatore con foto, numero e ruolo.</Text>
          <Pressable style={styles.primaryBtn} onPress={openNew} testID="rosa-empty-add-button">
            <Ionicons name="add" size={20} color={colors.onBrandPrimary} />
            <Text style={styles.primaryText}>Aggiungi giocatore</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 96 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.section}>
              {section.title.toUpperCase()} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              testID={`player-card-${item.id}`}
              onPress={() => router.push({ pathname: "/player/[id]", params: { id: item.id } })}
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <Avatar player={item} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {fullName(item)}
                </Text>
                <Text style={styles.meta}>
                  {ROLES.find((r) => r.key === item.role)?.label}
                  {item.foot ? ` · ${item.foot}` : ""}
                  {item.birthDate ? ` · ${item.birthDate}` : ""}
                </Text>
              </View>
              <Text style={styles.number}>{item.number}</Text>
            </Pressable>
          )}
        />
      )}

      {players.length > 0 && (
        <Pressable
          testID="rosa-add-player-fab"
          onPress={openNew}
          style={({ pressed }) => [styles.fab, { bottom: bottomChrome + 16 }, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Ionicons name="person-add" size={22} color={colors.onBrandPrimary} />
          <Text style={styles.primaryText}>Giocatore</Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: c.brandTertiary,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  bannerText: { flex: 1, fontSize: 13, color: c.onSurfaceTertiary, fontWeight: "600" },
  bannerClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
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
  chipActive: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary },
  chipTextActive: { color: c.onBrandPrimary },
  section: { fontSize: 12, fontWeight: "800", color: c.brandSecondary, letterSpacing: 1, marginTop: 8, marginBottom: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  name: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  meta: { fontSize: 13, color: c.muted, marginTop: 2 },
  number: { fontSize: 26, fontWeight: "900", color: c.brandPrimary, minWidth: 40, textAlign: "right" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: 16 },
  emptyText: { fontSize: 14, color: c.muted, textAlign: "center", marginTop: 8, marginBottom: 24 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.brandPrimary,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 999,
  },
  primaryText: { color: c.onBrandPrimary, fontSize: 15, fontWeight: "800" },
  fab: {
    position: "absolute",
    right: 16,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
}));
