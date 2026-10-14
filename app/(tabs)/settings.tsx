import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { AI_PROVIDERS, DEFAULT_AI_SETTINGS, PROVIDER_SETTINGS_KEY, getConnectionTestUrl, getProvider, isValidHttpUrl, type AISettings, type ProviderId } from "@/lib/ai/providers";
import { canPersistKeysSecurely, clearProviderKey, hasProviderKey, readProviderKey, saveProviderKey } from "@/lib/ai/secure-key-store";
import { trpc } from "@/lib/trpc";

const inputStyle = {
  color: gi.text,
  backgroundColor: gi.background,
  borderColor: gi.border,
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 13,
  paddingVertical: 12,
  fontSize: 13,
};

type TestStatus = "idle" | "testing" | "success" | "error";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [keyDraft, setKeyDraft] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const builtInModels = trpc.ai.models.useQuery(undefined, { enabled: false, retry: false });
  const provider = useMemo(() => getProvider(settings.providerId), [settings.providerId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      let activeProvider: ProviderId = DEFAULT_AI_SETTINGS.providerId;
      try {
        const raw = await AsyncStorage.getItem(PROVIDER_SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AISettings>;
          activeProvider = parsed.providerId && AI_PROVIDERS.some((item) => item.id === parsed.providerId)
            ? parsed.providerId
            : DEFAULT_AI_SETTINGS.providerId;
          const next: AISettings = {
            providerId: activeProvider,
            model: typeof parsed.model === "string" ? parsed.model : "",
            endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : getProvider(activeProvider).endpoint,
          };
          if (active) setSettings(next);
        }
      } catch {
        if (active) setNotice("သိမ်းထားသော Settings ကို ဖတ်မရပါ။ ပြန်ရွေးနိုင်ပါတယ်။");
      }
      const saved = getProvider(activeProvider).requiresApiKey ? await hasProviderKey(activeProvider) : true;
      if (active) {
        setKeySaved(saved);
        setPreferencesLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3200);
  };

  const changeProvider = (providerId: ProviderId) => {
    const next = getProvider(providerId);
    setSettings((current) => ({ ...current, providerId, model: "", endpoint: next.endpoint }));
    setKeyDraft("");
    setKeySaved(!next.requiresApiKey);
    if (next.requiresApiKey) void hasProviderKey(providerId).then(setKeySaved);
    setTestStatus("idle");
    setTestMessage("");
    setAvailableModels([]);
  };

  const savePreferences = async () => {
    if (provider.requiresApiKey && !isValidHttpUrl(settings.endpoint)) {
      showNotice("API Endpoint တွင် public HTTPS URL သုံးပါ။");
      return;
    }
    if (provider.requiresApiKey && !settings.model.trim()) {
      showNotice("Provider က လက်ခံသော Model ID ကို ဖြည့်ပါ။");
      return;
    }
    await AsyncStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(settings));
    showNotice("Provider, model နဲ့ endpoint ကို သိမ်းပြီးပါပြီ။");
  };

  const saveKey = async () => {
    if (!provider.requiresApiKey) {
      showNotice("Manus AI သည် project ၏ built-in AI ဖြစ်သောကြောင့် API key မလိုပါ။");
      return;
    }
    const value = keyDraft.trim();
    if (!value) {
      showNotice("API key အသစ်ထည့်ပါ၊ သို့မဟုတ် လက်ရှိသိမ်းထားသော key ကို သုံးနိုင်ပါတယ်။");
      return;
    }
    await saveProviderKey(settings.providerId, value);
    setKeyDraft("");
    setKeySaved(true);
    showNotice(canPersistKeysSecurely() ? `${provider.name} key ကို ဒီစက်၏ SecureStore ထဲမှာ သိမ်းပြီးပါပြီ။` : "Preview session အတွင်းသာ key ကို ယာယီထားပါတယ်။ Android APK တွင် SecureStore သုံးမည်။");
  };

  const deleteKey = async () => {
    await clearProviderKey(settings.providerId);
    setKeyDraft("");
    setKeySaved(false);
    setTestStatus("idle");
    setTestMessage("သိမ်းထားသော API key ကို ဖယ်ရှားပြီးပါပြီ။");
  };

  const testConnection = async () => {
    if (settings.providerId === "manus") {
      setTestStatus("testing");
      setTestMessage("Built-in AI model များကို ရယူနေသည်...");
      try {
        const modelResult = await builtInModels.refetch();
        if (modelResult.error) throw modelResult.error;
        const models = modelResult.data ?? [];
        setAvailableModels(models);
        setTestStatus("success");
        setTestMessage(models.length ? `Built-in AI ကို ဆက်သွယ်နိုင်ပါပြီ။ Model ${models.length} ခု ရရှိသည်။` : "Built-in AI service ကို ဆက်သွယ်နိုင်ပါပြီ။ Default model ကိုသုံးနိုင်သည်။");
      } catch {
        setTestStatus("error");
        setTestMessage("Built-in AI service ကို ယခုဆက်သွယ်မရပါ။ Network နှင့် project AI service ကို စစ်ပါ။");
      }
      return;
    }

    const apiKey = keyDraft.trim() || (await readProviderKey(settings.providerId));
    if (!apiKey) {
      setTestStatus("error");
      setTestMessage("စမ်းသပ်ရန် API key ကို အရင်ထည့်ပြီး သိမ်းပါ။");
      return;
    }
    if (!settings.model.trim()) {
      setTestStatus("error");
      setTestMessage("Model ID ကိုလည်း ဖြည့်ပါ။");
      return;
    }
    if (!isValidHttpUrl(settings.endpoint)) {
      setTestStatus("error");
      setTestMessage("API endpoint တွင် HTTPS URL သုံးရပါမည်။");
      return;
    }
    if (Platform.OS === "web") {
      setTestStatus("error");
      setTestMessage("Browser CORS က provider request ကို ပိတ်နိုင်ပါတယ်။ Android APK ထဲတွင် connection test လုပ်ပါ။");
      return;
    }
    const url = getConnectionTestUrl(settings.providerId, settings.endpoint);
    if (!url) {
      setTestStatus("error");
      setTestMessage("API endpoint ကို စစ်ဆေးပါ။");
      return;
    }
    setTestStatus("testing");
    setTestMessage("Provider ကို စမ်းသပ်နေသည်...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const headers: Record<string, string> = provider.authHeader === "google-key"
        ? { "x-goog-api-key": apiKey }
        : { Authorization: `Bearer ${apiKey}` };
      const response = await fetch(url, { method: "GET", headers, signal: controller.signal, redirect: "error" });
      if (response.ok) {
        setTestStatus("success");
        setTestMessage("Provider endpoint ကို ဆက်သွယ်နိုင်ပါပြီ။ Model ID အလုပ်လုပ်မှုကို generation request ပို့ချိန်တွင် စစ်မည်။");
      } else {
        setTestStatus("error");
        setTestMessage(`Provider က HTTP ${response.status} ပြန်ပေးသည်။ Key, endpoint နှင့် provider quota ကိုစစ်ပါ။`);
      }
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError" ? "Connection timeout ဖြစ်သွားသည်။" : "Provider ကို ဆက်သွယ်မရပါ။ Network နှင့် endpoint ကို စစ်ပါ။";
      setTestStatus("error");
      setTestMessage(message);
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 30 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Eyebrow>APP CONFIGURATION / AI</Eyebrow>
        <Text style={{ color: gi.text, fontSize: 26, fontWeight: "800", marginTop: 7 }}>ဆက်တင်များ</Text>
        <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, marginBottom: 20 }}>AI provider နဲ့ လုံခြုံရေးဆိုင်ရာ ရွေးချယ်မှုများ</Text>

        <Panel accent style={{ marginBottom: 16 }}>
          <SectionHeader title="AI Provider" />
          <Text style={{ color: gi.muted, fontSize: 11, marginBottom: 10 }}>အသုံးပြုမည့် provider ကို ရွေးပါ</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {AI_PROVIDERS.map((item) => {
              const selected = settings.providerId === item.id;
              return (
                <Pressable key={item.id} onPress={() => changeProvider(item.id)} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => ({ minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: selected ? gi.cyan : gi.border, backgroundColor: selected ? gi.cyanSoft : gi.background, paddingHorizontal: 12, justifyContent: "center", opacity: pressed ? 0.78 : 1 })}>
                  <Text style={{ color: selected ? gi.cyan : gi.muted, fontSize: 12, fontWeight: selected ? "800" : "600" }}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {provider.requiresApiKey ? (
            <>
              <Text style={{ color: gi.muted, fontSize: 12, marginTop: 17, marginBottom: 6 }}>API Endpoint</Text>
              <TextInput value={settings.endpoint} onChangeText={(endpoint) => { setSettings((current) => ({ ...current, endpoint })); setTestStatus("idle"); }} autoCapitalize="none" keyboardType="url" placeholder={provider.endpointHint} placeholderTextColor={gi.quiet} style={[inputStyle, { fontFamily: "monospace", fontSize: 11 }]} />
              <Text style={{ color: gi.quiet, fontSize: 10, lineHeight: 15, marginTop: 6 }}>ယုံကြည်ရသော public HTTPS endpoint ကိုသာထည့်ပါ။ Connection test သို့မဟုတ် generation လုပ်သည့်အခါ API key ကို ထို endpoint သို့ပို့မည်။</Text>
            </>
          ) : (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: gi.violetSoft, borderWidth: 1, borderColor: "#423665" }}>
              <Text style={{ color: "#CDBDFF", fontSize: 11, lineHeight: 17 }}>Manus AI သည် built-in service ဖြစ်ပြီး သီးခြား API key မလိုပါ။ Generate ကိုနှိပ်သည့်အခါ project ၏ AI quota အသုံးပြုနိုင်သည်။</Text>
            </View>
          )}

          <Text style={{ color: gi.muted, fontSize: 12, marginTop: 13, marginBottom: 6 }}>Model ID {settings.providerId === "manus" ? "(မဖြည့်လည်းရသည်)" : ""}</Text>
          <TextInput value={settings.model} onChangeText={(model) => { setSettings((current) => ({ ...current, model })); setTestStatus("idle"); }} autoCapitalize="none" placeholder={provider.modelHint} placeholderTextColor={gi.quiet} style={inputStyle} />
          {availableModels.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {availableModels.slice(0, 18).map((model) => (
                <Pressable key={model} onPress={() => setSettings((current) => ({ ...current, model }))} style={{ borderRadius: 9, borderWidth: 1, borderColor: gi.border, backgroundColor: gi.background, paddingHorizontal: 9, paddingVertical: 7 }}>
                  <Text style={{ color: gi.cyan, fontSize: 10, fontFamily: "monospace" }}>{model}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable onPress={() => void savePreferences()} style={({ pressed }) => ({ marginTop: 13, minHeight: 44, backgroundColor: gi.surfaceRaised, borderWidth: 1, borderColor: gi.border, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.82 : 1 })}>
            <Text style={{ color: gi.text, fontSize: 12, fontWeight: "800" }}>Provider Settings သိမ်းရန်</Text>
          </Pressable>
        </Panel>

        {provider.requiresApiKey ? (
          <Panel style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ flex: 1 }}><SectionHeader title={`${provider.name} API Key`} /></View>
              {keySaved ? <StatusBadge label="SAVED / MASKED" tone="success" /> : <StatusBadge label="NOT SET" tone="muted" />}
            </View>
            <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginBottom: 11 }}>Key အပြည့်အစုံကို UI တွင်မပြပါ။ Android SecureStore ထဲမှာ သိမ်းမည်။ Background AI job စတင်သည့်အခါသာ HTTPS ဖြင့် project server သို့ ယာယီပို့ပြီး server memory ထဲတွင်သာသုံးသည်—database ထဲမသိမ်း၊ log မရေးပါ။</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput value={keyDraft} onChangeText={setKeyDraft} secureTextEntry={!showKey} autoCapitalize="none" autoCorrect={false} placeholder={keySaved ? "သိမ်းထားသော key ရှိသည် · အသစ်ထည့်ရန်သာ" : "API key ထည့်ပါ"} placeholderTextColor={gi.quiet} style={[inputStyle, { flex: 1, fontFamily: "monospace" }]} />
              <Pressable onPress={() => setShowKey((current) => !current)} accessibilityRole="button" accessibilityLabel={showKey ? "Key ကိုဖုံးရန်" : "Key ကိုကြည့်ရန်"} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: 5 }}>
                <Feather name={showKey ? "eye-off" : "eye"} size={17} color={gi.muted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 11 }}>
              <Pressable onPress={() => void saveKey()} style={({ pressed }) => ({ flex: 1, minHeight: 43, backgroundColor: gi.cyan, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.84 : 1 })}>
                <Text style={{ color: gi.background, fontSize: 12, fontWeight: "900" }}>Key ကို လုံခြုံစွာသိမ်းရန်</Text>
              </Pressable>
              {keySaved ? <Pressable onPress={() => void deleteKey()} style={({ pressed }) => ({ minHeight: 43, borderColor: gi.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.75 : 1 })}><Text style={{ color: gi.danger, fontSize: 11, fontWeight: "700" }}>ဖျက်ရန်</Text></Pressable> : null}
            </View>
          </Panel>
        ) : null}

        <Pressable onPress={() => void testConnection()} disabled={testStatus === "testing"} style={({ pressed }) => ({ marginBottom: 14, minHeight: 45, borderColor: gi.border, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: pressed ? 0.78 : 1 })}>
          {testStatus === "testing" ? <ActivityIndicator size="small" color={gi.cyan} /> : <Feather name="wifi" size={15} color={gi.cyan} />}
          <Text style={{ color: gi.cyan, fontSize: 12, fontWeight: "800" }}>{settings.providerId === "manus" ? "Built-in AI စမ်းသပ်ပြီး Models ကြည့်ရန်" : "Connection စမ်းသပ်ရန်"}</Text>
        </Pressable>
        {testMessage ? (
          <View style={{ marginBottom: 14, padding: 11, borderRadius: 11, backgroundColor: testStatus === "success" ? gi.successSoft : testStatus === "error" ? gi.dangerSoft : gi.surfaceRaised }}>
            <Text style={{ color: testStatus === "success" ? gi.success : testStatus === "error" ? gi.danger : gi.muted, fontSize: 11, lineHeight: 17 }}>{testMessage}</Text>
          </View>
        ) : null}
        {provider.requiresApiKey && !canPersistKeysSecurely() ? <Text style={{ color: gi.warning, fontSize: 10, lineHeight: 15, marginBottom: 12 }}>ဤ Web Preview တွင် key သည် session အတွင်းသာ ယာယီဖြစ်သည်။ Secure persistence ကို Android APK တွင်အသုံးပြုပါ။</Text> : null}
        {notice ? <View style={{ padding: 12, backgroundColor: gi.surfaceRaised, borderRadius: 12, borderColor: gi.border, borderWidth: 1, marginBottom: 14 }}><Text style={{ color: gi.text, fontSize: 12, lineHeight: 18 }}>{notice}</Text></View> : null}

        <Panel style={{ marginBottom: 16 }}>
          <Eyebrow>PROJECT DATA</Eyebrow>
          <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", marginTop: 6 }}>Managed database + file storage</Text>
          <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Project နဲ့ AI task မှတ်တမ်းများကို ဒီ app installation အတွက် random token ဖြင့်ခွဲထားသည်။ Token ကို Android SecureStore တွင်ထားသည်။ App ဖျက်ပြီးပြန်တင်လျှင် cloud မှတ်တမ်းဟောင်းကို ပြန်မရနိုင်နိုင်ပါ—ZIP ကိုကြိုတင် export/backup လုပ်ပါ။</Text>
        </Panel>

        <Panel style={{ marginBottom: 16 }}>
          <Eyebrow>UNIVERSAL APK</Eyebrow>
          <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", marginTop: 6 }}>တစ်ဖိုင်တည်းတွင် ABI များစွာ</Text>
          <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>ARMv7, ARM64, x86 နဲ့ x86_64 ပါဝင်သည့် APK profile ကို ပြင်ဆင်ထားသည်။ APK အစစ်ထုတ်ရန် native build service လိုအပ်ပြီး ဤ app ထဲမှ တိုက်ရိုက် build မရသေးပါ။</Text>
        </Panel>

        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Feather name="shield" size={15} color={gi.quiet} />
          <Text style={{ color: gi.quiet, fontSize: 10, textAlign: "center", marginTop: 7, lineHeight: 15 }}>{preferencesLoaded ? "API key များကို provider အလိုက်သီးခြားသိမ်းသည်။" : "Settings ကို ဖတ်နေသည်..."}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
