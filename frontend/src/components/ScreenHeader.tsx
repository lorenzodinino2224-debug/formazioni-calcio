import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles } from "@/src/theme";

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Image source={require("../../assets/images/logo.png")} style={styles.logo} contentFit="contain" />
      <View style={styles.titles}>
        <Text style={styles.kicker}>CITTÀ DI SPOLTORE</Text>
        <Text style={styles.title} numberOfLines={1} testID="screen-title">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    backgroundColor: c.brandPrimary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 3,
    borderBottomColor: c.brandSecondary,
  },
  logo: { width: 40, height: 46 },
  titles: { flex: 1 },
  kicker: { color: c.brandSky, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: c.onBrandPrimary, fontSize: 24, fontWeight: "800" },
  subtitle: { color: c.onBrandPrimary, opacity: 0.8, fontSize: 12, marginTop: 1 },
}));
