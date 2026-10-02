import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { gi } from "@/constants/gi-theme";

const icons = {
  index: "home",
  projects: "grid",
  builds: "cpu",
  settings: "settings",
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: gi.cyan,
        tabBarInactiveTintColor: gi.quiet,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          height: 58 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
          backgroundColor: gi.background,
          borderTopColor: gi.border,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size }) => {
          const name = icons[route.name as keyof typeof icons] ?? "circle";
          return <Feather name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "မူလ" }} />
      <Tabs.Screen name="projects" options={{ title: "ပရောဂျက်" }} />
      <Tabs.Screen name="builds" options={{ title: "Builds" }} />
      <Tabs.Screen name="settings" options={{ title: "ဆက်တင်" }} />
    </Tabs>
  );
}
