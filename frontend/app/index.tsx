import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

import { useData } from "@/src/data/store";
import { makeStyles, useTheme } from "@/src/theme";

export default function Splash() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { hydrated } = useData();
  const [minDone, setMinDone] = useState(false);
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setMinDone(true), 2200);
    return () => clearTimeout(t);
  }, [scale, opacity, textOpacity]);

  useEffect(() => {
    if (hydrated && minDone) router.replace("/(tabs)");
  }, [hydrated, minDone, router]);

  return (
    <LinearGradient colors={[colors.brandPrimary, colors.brandDeep]} style={styles.root} testID="splash-screen">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
          testID="splash-logo"
        />
      </Animated.View>
      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.title}>GESTIONALE TECNICO</Text>
        <View style={styles.bar} />
      </Animated.View>
    </LinearGradient>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 220, height: 256 },
  textWrap: { marginTop: 32, alignItems: "center" },
  title: { color: c.onBrandPrimary, fontSize: 16, fontWeight: "800", letterSpacing: 4 },
  bar: { width: 48, height: 3, backgroundColor: c.brandSky, marginTop: 12, borderRadius: 2 },
}));
