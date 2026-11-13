import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/src/components/ScreenHeader";
import { useData } from "@/src/data/store";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, useTheme } from "@/src/theme";

export default function ConvocatiScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { callups, players, settings } = useData();

  const openNew = () => router.push({ pathname: "/callup/[id]", params: { id: "new" } });

  return (
    <View style={styles.root}>
      <ScreenHeader title="Convocati" subtitle={`${callups.length} convocazioni`} />
      <FlatList
        data={callups}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 96, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty} testID="convocati-empty">
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={48} color={colors.brandPrimary} />
            </View>
            <Text style={styles.emptyTitle}>Nessuna convocazione</Text>
            <Text style={styles.emptyText}>
              {players.length
                ? "Crea la prima convocazione per la prossima gara."
                : "Aggiungi prima i giocatori alla rosa per poterli convocare."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`callup-card-${item.id}`}
            onPress={() => router.push({ pathname: "/callup/[id]", params: { id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{item.date.split("/")[0] || "--"}</Text>
              <Text style={styles.dateMonth}>{item.date.split("/").slice(1).join("/")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.match} numberOfLines={1}>
                {item.homeAway === "Casa" ? `${settings.teamName} - ${item.opponent}` : `${item.opponent} - ${settings.teamName}`}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[item.competition, item.time && `ore ${item.time}`, item.venue].filter(Boolean).join(" · ")}
              </Text>
              <View style={styles.badges}>
                <View style={[styles.badge, item.homeAway === "Casa" ? styles.badgeHome : styles.badgeAway]}>
                  <Text style={styles.badgeText}>{item.homeAway}</Text>
                </View>
                <Text style={styles.count}>{item.playerIds.length} convocati</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        )}
      />
      <Pressable
        testID="convocati-new-fab"
        onPress={openNew}
        style={({ pressed }) => [styles.fab, { bottom: bottomChrome + 16 }, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <Ionicons name="add" size={24} color={colors.onBrandPrimary} />
        <Text style={styles.fabText}>Nuova</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
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
  dateBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  dateDay: { color: c.onBrandPrimary, fontSize: 22, fontWeight: "900" },
  dateMonth: { color: c.onBrandPrimary, fontSize: 10, fontWeight: "700", opacity: 0.85 },
  match: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  meta: { fontSize: 13, color: c.muted, marginTop: 2 },
  badges: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeHome: { backgroundColor: c.brandSecondary },
  badgeAway: { backgroundColor: c.surfaceInverse },
  badgeText: { color: c.onBrandSecondary, fontSize: 11, fontWeight: "800" },
  count: { fontSize: 12, fontWeight: "700", color: c.brandPrimary },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: 16 },
  emptyText: { fontSize: 14, color: c.muted, textAlign: "center", marginTop: 8 },
  fab: {
    position: "absolute",
    right: 16,
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { color: c.onBrandPrimary, fontSize: 15, fontWeight: "800" },
}));
