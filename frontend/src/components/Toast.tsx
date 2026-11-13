import Ionicons from "@react-native-vector-icons/ionicons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles } from "@/src/theme";

type Kind = "success" | "error" | "info";
const ToastCtx = createContext<(msg: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ msg: string; kind: Kind } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, kind: Kind = "success") => {
      setToast({ msg, kind });
      if (timer.current) clearTimeout(timer.current);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
      }, 2400);
    },
    [anim],
  );

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          testID="toast-message"
          style={[
            styles.toast,
            styles[toast.kind],
            {
              top: insets.top + 8,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}
        >
          <View style={styles.row}>
            <Ionicons
              name={toast.kind === "error" ? "alert-circle" : toast.kind === "info" ? "information-circle" : "checkmark-circle"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.text}>{toast.msg}</Text>
          </View>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

const useStyles = makeStyles((c) => ({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  success: { backgroundColor: c.surfaceInverse },
  error: { backgroundColor: c.error },
  info: { backgroundColor: c.brandSecondary },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "600", flex: 1 },
}));
