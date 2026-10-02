import { ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BuildStages, EmptyState, Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";

export default function BuildsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 28 }}>
        <Eyebrow>REMOTE PIPELINE / BUILDS</Eyebrow>
        <Text style={{ color: gi.text, fontSize: 26, fontWeight: "800", marginTop: 7 }}>Build များ</Text>
        <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, marginBottom: 21 }}>Queue, progress နှင့် ယခင် APK artifact များ</Text>
        <Panel accent style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <View style={{ flex: 1 }}><SectionHeader title="လက်ရှိ Queue" /></View>
            <StatusBadge label="0 ACTIVE" tone="muted" />
          </View>
          <EmptyState icon="cpu" title="လုပ်ဆောင်နေသော Build မရှိပါ" detail="Project တစ်ခုကို remote builder သို့ပို့လိုက်ပါက တိုးတက်မှုကို ဒီနေရာမှာ ဆက်ကြည့်နိုင်ပါတယ်။" />
        </Panel>
        <Panel>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <Feather name="activity" size={16} color={gi.violet} />
            <Text style={{ color: gi.text, fontSize: 15, fontWeight: "700" }}>Build လုပ်ငန်းစဉ်</Text>
          </View>
          <BuildStages />
          <Text style={{ color: gi.quiet, fontSize: 11, lineHeight: 17, marginTop: 15 }}>Preparing → Dependencies → Compile → Package → Verify</Text>
        </Panel>
      </ScrollView>
    </View>
  );
}
