import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandMark } from "@/components/gi/brand-mark";
import { gi } from "@/constants/gi-theme";

export default function SplashScreen() {
  const router = useRouter();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 1250, useNativeDriver: false }).start();
    const timer = setTimeout(() => router.replace("/(tabs)"), 1450);
    return () => clearTimeout(timer);
  }, [progress, router]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["8%", "100%"] });

  return (
    <View style={{ flex: 1, backgroundColor: gi.background, alignItems: "center", justifyContent: "center", padding: 28 }}>
      <View pointerEvents="none" style={{ position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "#0D1A27", opacity: 0.8 }} />
      <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: "#101B2A", borderColor: "#294052", borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <BrandMark size={65} />
      </View>
      <Text style={{ color: gi.text, fontSize: 22, fontWeight: "900", letterSpacing: 1.4 }}>G.I APK CREATOR</Text>
      <Text style={{ color: gi.muted, fontSize: 13, marginTop: 7, textAlign: "center" }}>AI အကူအညီဖြင့် Android app ဖန်တီးမယ်</Text>
      <View style={{ width: 210, height: 4, backgroundColor: "#1A2838", borderRadius: 4, overflow: "hidden", marginTop: 38 }}>
        <Animated.View style={{ width, height: 4, borderRadius: 4, backgroundColor: gi.cyan }} />
      </View>
      <Text style={{ color: gi.muted, fontSize: 11, marginTop: 13 }}>Workspace ကို ပြင်ဆင်နေသည်...</Text>
      <Text style={{ color: gi.quiet, fontSize: 10, marginTop: 38, fontFamily: "monospace", letterSpacing: 1 }}>v1.0.0 · BETA</Text>
    </View>
  );
}
