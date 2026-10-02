import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { gi } from "@/constants/gi-theme";

export function Panel({ children, accent = false, style }: { children: ReactNode; accent?: boolean; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: gi.surface,
          borderColor: accent ? "#315062" : gi.border,
          borderWidth: 1,
          borderRadius: 18,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Eyebrow({ children, color = gi.cyan }: { children: ReactNode; color?: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>
      {children}
    </Text>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <Text style={{ color: gi.text, fontSize: 17, fontWeight: "700" }}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: 6 }}>
          <Text style={{ color: gi.cyan, fontSize: 12, fontWeight: "700" }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "muted" }: { label: string; tone?: "muted" | "cyan" | "violet" | "success" | "warning" | "danger" }) {
  const colors = {
    muted: { bg: "#1A2433", fg: gi.muted },
    cyan: { bg: gi.cyanSoft, fg: gi.cyan },
    violet: { bg: gi.violetSoft, fg: "#BEA7FF" },
    success: { bg: gi.successSoft, fg: gi.success },
    warning: { bg: gi.warningSoft, fg: gi.warning },
    danger: { bg: gi.dangerSoft, fg: gi.danger },
  }[tone];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ color: colors.fg, fontSize: 10, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

export function ActionCard({ icon, title, detail, onPress, tone = "cyan" }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; onPress: () => void; tone?: "cyan" | "violet" }) {
  const tint = tone === "cyan" ? gi.cyan : "#BEA7FF";
  const soft = tone === "cyan" ? gi.cyanSoft : gi.violetSoft;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 112,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: pressed ? tint : gi.border,
        backgroundColor: gi.surface,
        padding: 14,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: soft, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Feather name={icon} size={17} color={tint} />
      </View>
      <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: gi.muted, fontSize: 11, marginTop: 3, lineHeight: 16 }}>{detail}</Text>
    </Pressable>
  );
}

const BUILD_STAGES = ["ပြင်ဆင်", "Dependencies", "Compile", "APK ထုပ်ပိုး", "စစ်ဆေး"];

export function BuildStages({ activeIndex = -1 }: { activeIndex?: number }) {
  return (
    <View style={{ gap: 9 }}>
      {BUILD_STAGES.map((stage, index) => {
        const done = activeIndex >= 0 && index < activeIndex;
        const active = index === activeIndex;
        const color = done ? gi.success : active ? gi.cyan : gi.quiet;
        return (
          <View key={stage} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: color, backgroundColor: done ? gi.successSoft : active ? gi.cyanSoft : "transparent", alignItems: "center", justifyContent: "center" }}>
              {done ? <Feather name="check" size={12} color={gi.success} /> : <View style={{ width: active ? 6 : 4, height: active ? 6 : 4, borderRadius: 4, backgroundColor: color }} />}
            </View>
            <Text style={{ color: active || done ? gi.text : gi.muted, fontSize: 12, fontWeight: active ? "700" : "500" }}>{stage}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: gi.border }} />
            <Text style={{ color: gi.quiet, fontSize: 10, fontFamily: "monospace" }}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 22, paddingHorizontal: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: "#172131", alignItems: "center", justifyContent: "center", marginBottom: 11 }}>
        <Feather name={icon} size={19} color={gi.muted} />
      </View>
      <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", textAlign: "center" }}>{title}</Text>
      <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 5 }}>{detail}</Text>
    </View>
  );
}
