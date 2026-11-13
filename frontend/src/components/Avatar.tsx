import { Image } from "expo-image";
import { Text, View } from "react-native";

import { Player } from "@/src/data/types";
import { makeStyles } from "@/src/theme";

export function Avatar({ player, size = 48, ring }: { player?: Player; size?: number; ring?: boolean }) {
  const styles = useStyles();
  const initials = player
    ? `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase()
    : "";
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.ring,
      ]}
    >
      {player?.photo ? (
        <Image source={{ uri: player.photo }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ring: { borderWidth: 2, borderColor: c.surfaceSecondary },
  initials: { color: c.onBrandTertiary, fontWeight: "800" },
}));
