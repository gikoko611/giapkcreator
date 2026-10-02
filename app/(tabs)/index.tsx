import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BrandMark } from "@/components/gi/brand-mark";
import { ActionCard, BuildStages, EmptyState, Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { useProjects } from "@/hooks/use-projects";
import { hasProviderKey } from "@/lib/ai/secure-key-store";
import type { ProjectRecord } from "@/lib/projects/project-store";

function projectTone(status: ProjectRecord["status"]): "muted" | "success" | "cyan" | "danger" {
  if (status === "Ready to build") return "success";
  if (status === "Building") return "cyan";
  if (status === "Build failed") return "danger";
  return "muted";
}

function projectLabel(status: ProjectRecord["status"]): string {
  if (status === "Draft") return "မူကြမ်း";
  if (status === "Ready to build") return "Build အဆင်သင့်";
  if (status === "Building") return "Build လုပ်နေသည်";
  return "Build မအောင်မြင်";
}

export default function DashboardScreen() {
  const router = useRouter();
  const { projects, addProject } = useProjects();
  const [aiKeySaved, setAiKeySaved] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void hasProviderKey().then(setAiKeySaved);
  }, []);

  const createNewProject = async () => {
    const cleanName = projectName.trim();
    if (!cleanName) {
      setNotice("Project အမည်ကို အရင်ဖြည့်ပါ။");
      return;
    }
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "newapp";
    const cleanPackage = packageName.trim() || `com.gi.${slug}`;
    await addProject(cleanName, cleanPackage);
    setProjectName("");
    setPackageName("");
    setCreateOpen(false);
    setNotice("Project ကို ဒီစက်ထဲမှာ သိမ်းပြီးပါပြီ။");
    setTimeout(() => setNotice(""), 2600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surfaceRaised, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center" }}>
            <BrandMark size={31} />
          </View>
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text style={{ color: gi.text, fontSize: 14, fontWeight: "900", letterSpacing: 0.8 }}>G.I APK CREATOR</Text>
            <Text style={{ color: gi.muted, fontSize: 11, marginTop: 2 }}>စိတ်ကူးကနေ APK build အထိ</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/builds")} accessibilityRole="button" accessibilityLabel="အသိပေးချက်များ" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surface, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <Feather name="bell" size={17} color={gi.muted} />
            <View style={{ position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: gi.violet }} />
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" accessibilityLabel="ဆက်တင်များ" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surface, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center" }}>
            <Feather name="settings" size={17} color={gi.muted} />
          </Pressable>
        </View>

        <View style={{ marginBottom: 18 }}>
          <Eyebrow>ANDROID WORKSPACE / 01</Eyebrow>
          <Text style={{ color: gi.text, fontSize: 25, fontWeight: "800", marginTop: 7 }}>စတင်ဖန်တီးလိုက်ပါ</Text>
          <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, lineHeight: 19 }}>Project အသစ်လုပ်ပါ၊ AI ကိုချိတ်ပါ၊ Build အခြေအနေကို တစ်နေရာတည်းမှာကြည့်ပါ။</Text>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" style={({ pressed }) => ({ marginBottom: 18, opacity: pressed ? 0.85 : 1 })}>
          <Panel accent style={{ padding: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: aiKeySaved ? gi.successSoft : gi.violetSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Feather name={aiKeySaved ? "check-circle" : "zap"} size={18} color={aiKeySaved ? gi.success : "#BEA7FF"} />
              </View>
              <View style={{ flex: 1 }}>
                <Eyebrow color={aiKeySaved ? gi.success : "#BEA7FF"}>{aiKeySaved ? "AI READY" : "AI SETUP"}</Eyebrow>
                <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", marginTop: 4 }}>
                  {aiKeySaved ? "AI provider ချိတ်ဆက်ရန် အဆင်သင့်" : "AI provider ကိုချိတ်ဆက်ပါ"}
                </Text>
                <Text style={{ color: gi.muted, fontSize: 11, marginTop: 3 }}>
                  {aiKeySaved ? "Key ကို လုံခြုံသော device storage တွင် သိမ်းထားသည်" : "API key မထည့်ရသေးလည်း Project ကို စတင်နိုင်ပါတယ်"}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={gi.muted} />
            </View>
          </Panel>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 11, marginBottom: 22 }}>
          <ActionCard icon="plus" title="Project အသစ်" detail="AI သို့မဟုတ် template နဲ့ စတင်ပါ" onPress={() => setCreateOpen(true)} tone="cyan" />
          <ActionCard icon="folder" title="Import Project" detail="ရှိပြီးသား Android project ကိုဖွင့်ပါ" onPress={() => setImportOpen(true)} tone="violet" />
        </View>

        <SectionHeader title="လတ်တလော Projects" action="အားလုံးကြည့်ရန်" onAction={() => router.push("/(tabs)/projects")} />
        {projects.length ? (
          <View style={{ gap: 9, marginBottom: 23 }}>
            {projects.slice(0, 3).map((project) => (
              <Panel key={project.id} style={{ padding: 13 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#172334", alignItems: "center", justifyContent: "center", marginRight: 11 }}>
                    <Feather name="box" size={17} color={gi.cyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: gi.text, fontSize: 13, fontWeight: "700" }}>{project.name}</Text>
                    <Text numberOfLines={1} style={{ color: gi.quiet, fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>{project.packageName}</Text>
                  </View>
                  <StatusBadge label={projectLabel(project.status)} tone={projectTone(project.status)} />
                </View>
              </Panel>
            ))}
          </View>
        ) : (
          <Panel style={{ marginBottom: 23, paddingVertical: 2 }}>
            <EmptyState icon="layers" title="Project မရှိသေးပါ" detail="ပထမဆုံး Android project ကိုဖန်တီးပြီး ဒီနေရာမှာ ပြန်တွေ့နိုင်ပါတယ်။" />
          </Panel>
        )}

        <SectionHeader title="Build Activity" action="Build များ" onAction={() => router.push("/(tabs)/builds")} />
        <Panel accent style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 13 }}>
            <View style={{ flex: 1 }}>
              <Eyebrow>BUILD PIPELINE</Eyebrow>
              <Text style={{ color: gi.text, fontSize: 15, fontWeight: "700", marginTop: 5 }}>လက်ရှိ Build မရှိသေးပါ</Text>
            </View>
            <StatusBadge label="READY" tone="cyan" />
          </View>
          <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 18, marginBottom: 15 }}>Project တစ်ခု build စတင်တဲ့အခါ အဆင့်တိုင်းကို ဒီနေရာမှာ ပြပါမယ်။</Text>
          <BuildStages />
        </Panel>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 3 }}>
          <Feather name="shield" size={14} color={gi.quiet} />
          <Text style={{ color: gi.quiet, fontSize: 10, flex: 1, lineHeight: 15 }}>API key များကို Android စက်တွင် SecureStore ဖြင့်သိမ်းမည်။ Build artifact များအတွက် remote build service လိုအပ်သည်။</Text>
        </View>
      </ScrollView>

      {notice ? (
        <View style={{ position: "absolute", bottom: 72, left: 20, right: 20, backgroundColor: gi.surfaceRaised, borderColor: gi.cyan, borderWidth: 1, borderRadius: 14, padding: 13 }}>
          <Text style={{ color: gi.text, fontSize: 12, textAlign: "center" }}>{notice}</Text>
        </View>
      ) : null}

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "rgba(3,7,14,0.82)", justifyContent: "center", padding: 20 }}>
          <Panel accent style={{ padding: 19 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <View><Eyebrow>NEW PROJECT</Eyebrow><Text style={{ color: gi.text, fontSize: 19, fontWeight: "800", marginTop: 5 }}>Project အသစ်</Text></View>
              <Pressable onPress={() => setCreateOpen(false)} style={{ padding: 8 }}><Feather name="x" size={20} color={gi.muted} /></Pressable>
            </View>
            <Text style={{ color: gi.muted, fontSize: 12, marginBottom: 6 }}>Project အမည်</Text>
            <TextInput value={projectName} onChangeText={setProjectName} placeholder="ဥပမာ: My Android App" placeholderTextColor={gi.quiet} style={{ color: gi.text, backgroundColor: gi.background, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 13 }} />
            <Text style={{ color: gi.muted, fontSize: 12, marginBottom: 6 }}>Package name (optional)</Text>
            <TextInput value={packageName} onChangeText={setPackageName} placeholder="com.gi.myapp" placeholderTextColor={gi.quiet} autoCapitalize="none" style={{ color: gi.text, backgroundColor: gi.background, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontFamily: "monospace", marginBottom: 17 }} />
            <Pressable onPress={() => void createNewProject()} style={({ pressed }) => ({ minHeight: 48, backgroundColor: gi.cyan, borderRadius: 13, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.84 : 1 })}>
              <Text style={{ color: gi.background, fontSize: 14, fontWeight: "900" }}>Project ဖန်တီးမည်</Text>
            </Pressable>
          </Panel>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={importOpen} transparent animationType="fade" onRequestClose={() => setImportOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,7,14,0.82)", justifyContent: "center", padding: 20 }}>
          <Panel style={{ padding: 19 }}>
            <View style={{ alignItems: "center", marginBottom: 13 }}><Feather name="folder" size={25} color={gi.cyan} /></View>
            <Text style={{ color: gi.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Project Import</Text>
            <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 8 }}>ZIP project ကိုရွေးပြီး secure storage ထဲသို့ upload လုပ်မည့် import flow ကို နောက်အဆင့်တွင် ချိတ်ဆက်မည်။</Text>
            <Pressable onPress={() => setImportOpen(false)} style={{ minHeight: 46, backgroundColor: gi.cyanSoft, borderColor: "#315062", borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 17 }}><Text style={{ color: gi.cyan, fontSize: 13, fontWeight: "800" }}>နားလည်ပါပြီ</Text></Pressable>
          </Panel>
        </View>
      </Modal>
    </View>
  );
}
