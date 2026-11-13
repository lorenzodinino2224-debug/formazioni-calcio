import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="person.3.fill" />
          <NativeTabs.Trigger.Label>Rosa</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="formazione">
          <NativeTabs.Trigger.Icon sf="sportscourt.fill" />
          <NativeTabs.Trigger.Label>Formazione</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="convocati">
          <NativeTabs.Trigger.Icon sf="checklist" />
          <NativeTabs.Trigger.Label>Convocati</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="stampa">
          <NativeTabs.Trigger.Icon sf="printer.fill" />
          <NativeTabs.Trigger.Label>Stampa</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  const icon = (name: string, outline: string) => {
    const TabIcon = ({ color, focused }: { color: any; focused: boolean }) => (
      <Ionicons name={(focused ? name : outline) as any} size={24} color={color} />
    );
    return TabIcon;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Rosa", tabBarIcon: icon("people", "people-outline"), tabBarButtonTestID: "tab-rosa" }} />
      <Tabs.Screen name="formazione" options={{ title: "Formazione", tabBarIcon: icon("football", "football-outline"), tabBarButtonTestID: "tab-formazione" }} />
      <Tabs.Screen name="convocati" options={{ title: "Convocati", tabBarIcon: icon("clipboard", "clipboard-outline"), tabBarButtonTestID: "tab-convocati" }} />
      <Tabs.Screen name="stampa" options={{ title: "Stampa", tabBarIcon: icon("print", "print-outline"), tabBarButtonTestID: "tab-stampa" }} />
    </Tabs>
  );
}
