import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { BrandMark } from "@/components/gi/brand-mark";
import { ActionCard, BuildStages, EmptyState, Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { useProjects } from "@/hooks/use-projects";
import { AI_PROVIDERS, DEFAULT_AI_SETTINGS, getProvider, PROVIDER_SETTINGS_KEY, type AISettings } from "@/lib/ai/providers";
import { readProviderKey } from "@/lib/ai/secure-key-store";
import type { ProjectRecord } from "@/lib/projects/project-store";
import { trpc } from "@/lib/trpc";

function projectTone(status: ProjectRecord["status"]): "muted" | "success" | "cyan" | "danger" {
  if (status === "Ready to build" || status === "Needs review") return "success";
  if (status === "Generating" || status === "Building") return "cyan";
  if (status === "Build failed") return "danger";
  return "muted";
}

function projectLabel(status: ProjectRecord["status"]): string {
  if (status === "Draft") return "မူကြမ်း";
  if (status === "Generating") return "AI ဖန်တီးနေသည်";
  if (status === "Needs review") return "စစ်ဆေးရန်";
  if (status === "Imported") return "ZIP Import";
  if (status === "Ready to build") return "Build အဆင်သင့်";
  if (status === "Building") return "Build လုပ်နေသည်";
  return "Build မအောင်မြင်";
}

function normalizeSettings(value: unknown): AISettings {
  if (!value || typeof value !== "object") return DEFAULT_AI_SETTINGS;
  const parsed = value as Partial<AISettings>;
  const providerId = AI_PROVIDERS.some((item) => item.id === parsed.providerId)
    ? parsed.providerId!
    : DEFAULT_AI_SETTINGS.providerId;
  return {
    providerId,
    model: typeof parsed.model === "string" ? parsed.model : "",
    endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : getProvider(providerId).endpoint,
  };
}

async function readPickedFileBase64(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  const inline = (asset as DocumentPicker.DocumentPickerAsset & { base64?: string }).base64;
  if (inline) return inline;
  if (Platform.OS === "web") {
    const file = (asset as DocumentPicker.DocumentPickerAsset & { file?: Blob }).file;
    if (!file) throw new Error("Browser မှ ZIP ဖိုင်ကို ဖတ်မရပါ။ ထပ်ရွေးကြည့်ပါ။");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("ZIP ဖိုင်ကို ဖတ်မရပါ။"));
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.readAsDataURL(file);
    });
  }
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
}

function stageLabel(stage: string): string {
  if (stage === "queued") return "Queue ထဲတွင် စောင့်နေသည်";
  if (stage === "generating") return "AI က source files ဖန်တီးနေသည်";
  if (stage === "checking") return "ဖန်တီးထားသော source ကို စစ်ဆေးနေသည်";
  if (stage === "review") return "Source ကို ပြန်စစ်ရန် အသင့်";
  if (stage === "interrupted") return "Server ပြန်စတင်သွားသည် · ထပ်လုပ်ပါ";
  if (stage === "cancelled") return "လုပ်ငန်းကို ရပ်တန့်လိုက်သည်";
  return "လုပ်ငန်း မအောင်မြင်ပါ";
}

export default function DashboardScreen() {
  const router = useRouter();
  const { projects, addProject, startGeneration, importArchive } = useProjects();
  const taskQuery = trpc.ai.list.useQuery(undefined, { retry: false, refetchInterval: 4000 });
  const [aiReady, setAiReady] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [projectIdea, setProjectIdea] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [taskHint, setTaskHint] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROVIDER_SETTINGS_KEY);
        const settings = normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_AI_SETTINGS);
        const provider = getProvider(settings.providerId);
        const ready = !provider.requiresApiKey || Boolean(await readProviderKey(settings.providerId)) && Boolean(settings.model.trim());
        if (active) setAiReady(ready);
      } catch {
        if (active) setAiReady(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const activeTask = useMemo(
    () => taskQuery.data?.find((task) => task.status === "queued" || task.status === "running"),
    [taskQuery.data],
  );
  const latestTask = taskQuery.data?.[0];

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3400);
  };

  const ensureAISettings = async () => {
    const raw = await AsyncStorage.getItem(PROVIDER_SETTINGS_KEY);
    const settings = normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_AI_SETTINGS);
    const provider = getProvider(settings.providerId);
    const apiKey = provider.requiresApiKey ? await readProviderKey(settings.providerId) : undefined;
    if (provider.requiresApiKey && (!apiKey || !settings.model.trim())) {
      throw new Error("AI Provider, Model ID နဲ့ API key ကို Settings ထဲမှာ အရင်သိမ်းပါ။");
    }
    return { ...settings, apiKey };
  };

  const createNewProject = async (generate: boolean) => {
    const cleanName = projectName.trim();
    if (!cleanName) {
      showNotice("Project အမည်ကို အရင်ဖြည့်ပါ။");
      return;
    }
    if (generate && projectIdea.trim().length < 10) {
      showNotice("AI က source ဖန်တီးနိုင်ရန် App idea ကို အနည်းဆုံး စာလုံး ၁၀ လုံးရေးပါ။");
      return;
    }
    if (cleanName.length > 160 || projectIdea.trim().length > 6000) {
      showNotice("Project အမည်ကို ၁၆၀ အက္ခရာ၊ App idea ကို ၆,၀၀၀ အက္ခရာအတွင်းထားပါ။");
      return;
    }
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "newapp";
    const cleanPackage = packageName.trim() || `com.gi.${/^[a-z]/.test(slug) ? slug : `app${slug}`}`;
    if (cleanPackage.length > 255 || !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(cleanPackage)) {
      showNotice("Package name ကို com.example.app ပုံစံဖြင့် ထည့်ပါ။");
      return;
    }

    setBusy(true);
    let aiSettings: AISettings & { apiKey?: string } | undefined;
    try {
      if (generate) aiSettings = await ensureAISettings();
    } catch (error) {
      setBusy(false);
      showNotice(error instanceof Error ? error.message : "AI Settings ကို ပြန်စစ်ပါ။");
      setCreateOpen(false);
      router.push("/(tabs)/settings");
      return;
    }

    try {
      const { project, cloudSynced } = await addProject(cleanName, cleanPackage, projectIdea.trim());
      setCreateOpen(false);
      setProjectName("");
      setPackageName("");
      if (generate && aiSettings) {
        try {
          await startGeneration({
            projectId: project.id,
            providerId: aiSettings.providerId,
            model: aiSettings.model,
            endpoint: aiSettings.endpoint,
            apiKey: aiSettings.apiKey,
            description: projectIdea.trim(),
          });
          setProjectIdea("");
          showNotice("AI source ဖန်တီးခြင်းကို background queue ထဲသို့ ပို့ပြီးပါပြီ။ Build tab မှ progress ကိုကြည့်ပါ။");
        } catch {
          showNotice("Project ကိုသိမ်းပြီးပါပြီ။ AI task မစနိုင်သေးပါ—Database နဲ့ provider settings ကိုစစ်ပြီး ထပ်လုပ်ပါ။");
        }
      } else {
        setProjectIdea("");
        showNotice(cloudSynced ? "Project ကို device နှင့် managed database နှစ်ခုလုံးတွင် သိမ်းပြီးပါပြီ။" : "Project ကို ဒီစက်တွင်သိမ်းပြီးပါပြီ။ Network ရသည့်အခါ sync လုပ်ပါမည်။");
      }
    } catch {
      showNotice("Project ကိုသိမ်းမရပါ။ အချက်အလက်များကို စစ်ပါ။");
    } finally {
      setBusy(false);
    }
  };

  const pickAndImport = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (!asset.name.toLowerCase().endsWith(".zip")) {
        showNotice("Android Project ကို ZIP ဖိုင်အဖြစ်ရွေးပါ။");
        return;
      }
      if (asset.size && asset.size > 8 * 1024 * 1024) {
        showNotice("ZIP file အရွယ်အစား 8 MB ထက်မကျော်ရပါ။ node_modules မပါဘဲ archive လုပ်ပါ။");
        return;
      }
      setImportBusy(true);
      setTaskHint("ZIP ကို လုံခြုံသော project storage သို့ ပို့နေသည်...");
      const archiveBase64 = await readPickedFileBase64(asset);
      if (archiveBase64.length > 11_200_000) throw new Error("ZIP file အရွယ်အစား 8 MB ထက်ကျော်နေသည်။");
      const name = asset.name.replace(/\.zip$/i, "").slice(0, 160) || "Imported Android Project";
      await importArchive(name, asset.name.slice(0, 255), archiveBase64);
      setImportOpen(false);
      showNotice("Project ZIP ကို managed storage သို့တင်ပြီး Projects ထဲမှာသိမ်းပြီးပါပြီ။");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "ZIP import မအောင်မြင်ပါ။ Network နဲ့ archive ကိုစစ်ပါ။");
    } finally {
      setImportBusy(false);
      setTaskHint("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surfaceRaised, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center" }}><BrandMark size={31} /></View>
          <View style={{ flex: 1, marginLeft: 11 }}>
            <Text style={{ color: gi.text, fontSize: 14, fontWeight: "900", letterSpacing: 0.8 }}>G.I APK CREATOR</Text>
            <Text style={{ color: gi.muted, fontSize: 11, marginTop: 2 }}>စိတ်ကူးကနေ Android source အထိ</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/builds")} accessibilityRole="button" accessibilityLabel="AI task လုပ်ငန်းများ" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surface, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
            <Feather name="bell" size={17} color={gi.muted} />
            {activeTask ? <View style={{ position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: gi.violet }} /> : null}
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" accessibilityLabel="ဆက်တင်များ" style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: gi.surface, borderWidth: 1, borderColor: gi.border, alignItems: "center", justifyContent: "center" }}>
            <Feather name="settings" size={17} color={gi.muted} />
          </Pressable>
        </View>

        <View style={{ marginBottom: 18 }}>
          <Eyebrow>ANDROID WORKSPACE / 01</Eyebrow>
          <Text style={{ color: gi.text, fontSize: 25, fontWeight: "800", marginTop: 7 }}>စတင်ဖန်တီးလိုက်ပါ</Text>
          <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, lineHeight: 19 }}>Project အသစ်လုပ်ပါ၊ AI source ဖန်တီးမှုကို နောက်ကွယ်မှာ စောင့်ကြည့်ပါ။</Text>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/settings")} accessibilityRole="button" style={({ pressed }) => ({ marginBottom: 18, opacity: pressed ? 0.85 : 1 })}>
          <Panel accent style={{ padding: 15 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: aiReady ? gi.successSoft : gi.violetSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Feather name={aiReady ? "check-circle" : "zap"} size={18} color={aiReady ? gi.success : "#BEA7FF"} /></View>
              <View style={{ flex: 1 }}>
                <Eyebrow color={aiReady ? gi.success : "#BEA7FF"}>{aiReady ? "AI CONFIG READY" : "AI SETUP"}</Eyebrow>
                <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", marginTop: 4 }}>{aiReady ? "AI source generation စတင်နိုင်သည်" : "AI provider ကိုချိတ်ဆက်ပါ"}</Text>
                <Text style={{ color: gi.muted, fontSize: 11, marginTop: 3 }}>{aiReady ? "Provider ပြင်ဆင်ပြီးပါပြီ · service ကို task ပို့ချိန်တွင်စစ်မည်" : "Manus AI သို့မဟုတ် ကိုယ်ပိုင် provider ကိုရွေးနိုင်သည်"}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={gi.muted} />
            </View>
          </Panel>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 11, marginBottom: 22 }}>
          <ActionCard icon="plus" title="Project အသစ်" detail="မူကြမ်း သို့မဟုတ် AI source" onPress={() => setCreateOpen(true)} tone="cyan" />
          <ActionCard icon="folder" title="Import Project" detail="8 MB အထိ ZIP archive" onPress={() => setImportOpen(true)} tone="violet" />
        </View>

        <SectionHeader title="လတ်တလော Projects" action="အားလုံးကြည့်ရန်" onAction={() => router.push("/(tabs)/projects")} />
        {projects.length ? (
          <View style={{ gap: 9, marginBottom: 23 }}>
            {projects.slice(0, 3).map((project) => (
              <Panel key={project.id} style={{ padding: 13 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#172334", alignItems: "center", justifyContent: "center", marginRight: 11 }}><Feather name="box" size={17} color={gi.cyan} /></View>
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
          <Panel style={{ marginBottom: 23, paddingVertical: 2 }}><EmptyState icon="layers" title="Project မရှိသေးပါ" detail="ပထမဆုံး Android project ကိုဖန်တီးပြီး ဒီနေရာမှာ ပြန်တွေ့နိုင်ပါတယ်။" /></Panel>
        )}

        <SectionHeader title="AI / Build Activity" action="လုပ်ငန်းများ" onAction={() => router.push("/(tabs)/builds")} />
        <Panel accent style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 13 }}>
            <View style={{ flex: 1 }}><Eyebrow>BACKGROUND AI QUEUE</Eyebrow><Text style={{ color: gi.text, fontSize: 15, fontWeight: "700", marginTop: 5 }}>{activeTask ? "AI source generation လုပ်နေသည်" : latestTask?.status === "completed" ? "နောက်ဆုံး source ကို review လုပ်ရန်အသင့်" : "လက်ရှိ AI task မရှိသေးပါ"}</Text></View>
            <StatusBadge label={activeTask ? `${activeTask.progress}%` : latestTask?.status?.toUpperCase() ?? "READY"} tone={activeTask ? "cyan" : latestTask?.status === "completed" ? "success" : "muted"} />
          </View>
          {activeTask ? (
            <>
              <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{stageLabel(activeTask.stage)}</Text>
              <View style={{ height: 6, overflow: "hidden", backgroundColor: gi.background, borderRadius: 4, marginBottom: 12 }}><View style={{ width: `${Math.max(8, activeTask.progress)}%`, height: 6, backgroundColor: gi.cyan, borderRadius: 4 }} /></View>
            </>
          ) : <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 18, marginBottom: 13 }}>{latestTask?.error ?? "AI task စတင်သည့်အခါ queue အခြေအနေကို ဒီနေရာမှာပြပါမယ်။"}</Text>}
          <BuildStages />
          <Text style={{ color: gi.quiet, fontSize: 10, lineHeight: 15, marginTop: 12 }}>အပေါ်ပါ task progress သည် AI source generation ဖြစ်သည်။ APK အစစ် compile လုပ်ရန် native build service မချိတ်ဆက်ရသေးပါ။</Text>
        </Panel>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 3 }}>
          <Feather name="shield" size={14} color={gi.quiet} />
          <Text style={{ color: gi.quiet, fontSize: 10, flex: 1, lineHeight: 15 }}>External AI key ကို SecureStore မှ ယူပြီး user တောင်းဆိုသော job အတွက် HTTPS ဖြင့် server memory ထဲသို့သာ ယာယီပို့သည်။</Text>
        </View>
      </ScrollView>

      {notice ? <View style={{ position: "absolute", bottom: 72, left: 20, right: 20, backgroundColor: gi.surfaceRaised, borderColor: gi.cyan, borderWidth: 1, borderRadius: 14, padding: 13 }}><Text style={{ color: gi.text, fontSize: 12, textAlign: "center", lineHeight: 18 }}>{notice}</Text></View> : null}

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => !busy && setCreateOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "rgba(3,7,14,0.82)", justifyContent: "center", padding: 20 }}>
          <Panel accent style={{ padding: 19 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <View><Eyebrow>NEW PROJECT</Eyebrow><Text style={{ color: gi.text, fontSize: 19, fontWeight: "800", marginTop: 5 }}>Project အသစ်</Text></View>
              <Pressable onPress={() => !busy && setCreateOpen(false)} style={{ padding: 8 }}><Feather name="x" size={20} color={gi.muted} /></Pressable>
            </View>
            <Text style={{ color: gi.muted, fontSize: 12, marginBottom: 6 }}>Project အမည်</Text>
            <TextInput value={projectName} onChangeText={setProjectName} maxLength={160} placeholder="ဥပမာ: My Android App" placeholderTextColor={gi.quiet} style={{ color: gi.text, backgroundColor: gi.background, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 13 }} />
            <Text style={{ color: gi.muted, fontSize: 12, marginBottom: 6 }}>Package name (optional)</Text>
            <TextInput value={packageName} onChangeText={setPackageName} maxLength={255} placeholder="com.gi.myapp" placeholderTextColor={gi.quiet} autoCapitalize="none" style={{ color: gi.text, backgroundColor: gi.background, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontFamily: "monospace", marginBottom: 13 }} />
            <Text style={{ color: gi.muted, fontSize: 12, marginBottom: 6 }}>App idea (AI source အတွက်)</Text>
            <TextInput value={projectIdea} onChangeText={setProjectIdea} maxLength={6000} multiline numberOfLines={3} textAlignVertical="top" placeholder="App က ဘာလုပ်မလဲ၊ ဘယ်သူသုံးမလဲ၊ ဘာ screen တွေလိုမလဲ..." placeholderTextColor={gi.quiet} style={{ color: gi.text, backgroundColor: gi.background, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, minHeight: 82, marginBottom: 14 }} />
            <Pressable disabled={busy} onPress={() => void createNewProject(true)} style={({ pressed }) => ({ minHeight: 48, backgroundColor: gi.cyan, borderRadius: 13, alignItems: "center", justifyContent: "center", opacity: busy ? 0.55 : pressed ? 0.84 : 1 })}>
              <Text style={{ color: gi.background, fontSize: 13, fontWeight: "900" }}>{busy ? "လုပ်ဆောင်နေသည်..." : "AI နဲ့ Source ဖန်တီးမည်"}</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void createNewProject(false)} style={{ minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 5 }}><Text style={{ color: gi.muted, fontSize: 12, fontWeight: "700" }}>Draft အဖြစ်သာသိမ်းမည်</Text></Pressable>
          </Panel>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={importOpen} transparent animationType="fade" onRequestClose={() => !importBusy && setImportOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,7,14,0.82)", justifyContent: "center", padding: 20 }}>
          <Panel style={{ padding: 19 }}>
            <View style={{ alignItems: "center", marginBottom: 13 }}><Feather name="folder" size={25} color={gi.cyan} /></View>
            <Text style={{ color: gi.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Project ZIP Import</Text>
            <Text style={{ color: gi.muted, fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 8 }}>ZIP archive 8 MB အထိရွေးပါ။ Server က အရွယ်အစားနှင့် ZIP signature ကိုစစ်ပြီး managed storage သို့တင်မည်။ ZIP ကို extract လုပ်ခြင်း သို့မဟုတ် APK build လုပ်ခြင်းတော့ မလုပ်သေးပါ။</Text>
            {taskHint ? <Text style={{ color: gi.cyan, fontSize: 11, textAlign: "center", marginTop: 12 }}>{taskHint}</Text> : null}
            <Pressable disabled={importBusy} onPress={() => void pickAndImport()} style={{ minHeight: 46, backgroundColor: gi.cyanSoft, borderColor: "#315062", borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 17, opacity: importBusy ? 0.55 : 1 }}><Text style={{ color: gi.cyan, fontSize: 13, fontWeight: "800" }}>{importBusy ? "Upload လုပ်နေသည်..." : "ZIP ဖိုင်ရွေးပြီး Import လုပ်မည်"}</Text></Pressable>
            <Pressable disabled={importBusy} onPress={() => setImportOpen(false)} style={{ minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 4 }}><Text style={{ color: gi.muted, fontSize: 12 }}>ပိတ်ရန်</Text></Pressable>
          </Panel>
        </View>
      </Modal>
    </View>
  );
}
