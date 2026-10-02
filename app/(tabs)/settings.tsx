import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { AI_PROVIDERS, DEFAULT_AI_SETTINGS, PROVIDER_SETTINGS_KEY, getConnectionTestUrl, getProvider, isValidHttpUrl, type AISettings, type ProviderId } from "@/lib/ai/providers";
import { canPersistKeysSecurely, clearProviderKey, hasProviderKey, readProviderKey, saveProviderKey } from "@/lib/ai/secure-key-store";

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

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROVIDER_SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AISettings>;
          const providerId = parsed.providerId && AI_PROVIDERS.some((item) => item.id === parsed.providerId) ? parsed.providerId : DEFAULT_AI_SETTINGS.providerId;
          setSettings({
            providerId,
            model: typeof parsed.model === "string" ? parsed.model : "",
            endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : getProvider(providerId).endpoint,
          });
        }
      } catch {
        setNotice("သိမ်းထားသော Settings ကို ဖတ်မရပါ။ ပြန်ရွေးနိုင်ပါတယ်။");
      }
      setKeySaved(await hasProviderKey());
      setPreferencesLoaded(true);
    })();
  }, []);

  const provider = useMemo(() => getProvider(settings.providerId), [settings.providerId]);

  const changeProvider = (providerId: ProviderId) => {
    const next = getProvider(providerId);
    setSettings((current) => ({ ...current, providerId, endpoint: next.endpoint }));
    setTestStatus("idle");
    setTestMessage("");
  };

  const savePreferences = async () => {
    await AsyncStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(settings));
    setNotice("Provider, model နဲ့ endpoint ကို သိမ်းပြီးပါပြီ။");
    setTimeout(() => setNotice(""), 2600);
  };

  const saveKey = async () => {
    const value = keyDraft.trim();
    if (!value) {
      setNotice("API key အသစ်ထည့်ပါ၊ သို့မဟုတ် လက်ရှိသိမ်းထားသော key ကို သုံးနိုင်ပါတယ်။");
      return;
    }
    await saveProviderKey(value);
    setKeyDraft("");
    setKeySaved(true);
    setNotice(canPersistKeysSecurely() ? "API key ကို စက်၏ SecureStore ထဲမှာ သိမ်းပြီးပါပြီ။" : "Preview session အတွင်းသာ key ကို ယာယီထားပါတယ်။ APK ထဲတွင် SecureStore သုံးမည်။");
    setTimeout(() => setNotice(""), 3200);
  };

  const deleteKey = async () => {
    await clearProviderKey();
    setKeyDraft("");
    setKeySaved(false);
    setTestStatus("idle");
    setTestMessage("သိမ်းထားသော API key ကို ဖယ်ရှားပြီးပါပြီ။");
  };

  const testConnection = async () => {
    const apiKey = keyDraft.trim() || (await readProviderKey());
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
      setTestMessage("Browser CORS က provider request ကို ပိတ်နိုင်ပါတယ်။ Android APK ထဲမှာ connection test လုပ်ပါ။");
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
      const response = await fetch(url, { method: "GET", headers, signal: controller.signal });
      if (response.ok) {
        setTestStatus("success");
        setTestMessage("API endpoint ကို ဆက်သွယ်နိုင်ပါပြီ။ Model ID အလုပ်လုပ်မှုကို request ပို့ချိန်မှာ ထပ်စစ်မည်။");
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

          <Text style={{ color: gi.muted, fontSize: 12, marginTop: 17, marginBottom: 6 }}>API Endpoint</Text>
          <TextInput value={settings.endpoint} onChangeText={(endpoint) => { setSettings((current) => ({ ...current, endpoint })); setTestStatus("idle"); }} autoCapitalize="none" keyboardType="url" placeholder={provider.endpointHint} placeholderTextColor={gi.quiet} style={[inputStyle, { fontFamily: "monospace", fontSize: 11 }]} />

          <Text style={{ color: gi.muted, fontSize: 12, marginTop: 13, marginBottom: 6 }}>Model ID</Text>
          <TextInput value={settings.model} onChangeText={(model) => { setSettings((current) => ({ ...current, model })); setTestStatus("idle"); }} autoCapitalize="none" placeholder={provider.modelHint} placeholderTextColor={gi.quiet} style={inputStyle} />

          <Pressable onPress={() => void savePreferences()} style={({ pressed }) => ({ marginTop: 13, minHeight: 44, backgroundColor: gi.surfaceRaised, borderWidth: 1, borderColor: gi.border, borderRadius: 12, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.82 : 1 })}>
            <Text style={{ color: gi.text, fontSize: 12, fontWeight: "800" }}>Provider Settings သိမ်းရန်</Text>
          </Pressable>
        </Panel>

        <Panel style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <View style={{ flex: 1 }}><SectionHeader title="API Key" /></View>
            {keySaved ? <StatusBadge label="SAVED / MASKED" tone="success" /> : <StatusBadge label="NOT SET" tone="muted" />}
          </View>
          <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginBottom: 11 }}>Key အပြည့်အစုံကို မပြပါ။ Android တွင် encrypted SecureStore ထဲ၌ သိမ်းဆည်းပြီး project/database ထဲသို့ မပို့ပါ။</Text>
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
          <Pressable onPress={() => void testConnection()} disabled={testStatus === "testing"} style={({ pressed }) => ({ marginTop: 9, minHeight: 43, borderColor: gi.border, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: pressed ? 0.78 : 1 })}>
            {testStatus === "testing" ? <ActivityIndicator size="small" color={gi.cyan} /> : <Feather name="wifi" size={15} color={gi.cyan} />}
            <Text style={{ color: gi.cyan, fontSize: 12, fontWeight: "800" }}>Connection စမ်းသပ်ရန်</Text>
          </Pressable>
          {testMessage ? (
            <View style={{ marginTop: 10, padding: 11, borderRadius: 11, backgroundColor: testStatus === "success" ? gi.successSoft : testStatus === "error" ? gi.dangerSoft : gi.surfaceRaised }}>
              <Text style={{ color: testStatus === "success" ? gi.success : testStatus === "error" ? gi.danger : gi.muted, fontSize: 11, lineHeight: 17 }}>{testMessage}</Text>
            </View>
          ) : null}
          {!canPersistKeysSecurely() ? <Text style={{ color: gi.warning, fontSize: 10, lineHeight: 15, marginTop: 10 }}>ဤ Web Preview တွင် key သည် session အတွင်းသာ ယာယီဖြစ်သည်။ Secure persistence ကို Android APK တွင်အသုံးပြုပါ။</Text> : null}
        </Panel>

        {notice ? <View style={{ padding: 12, backgroundColor: gi.surfaceRaised, borderRadius: 12, borderColor: gi.border, borderWidth: 1, marginBottom: 14 }}><Text style={{ color: gi.text, fontSize: 12, lineHeight: 18 }}>{notice}</Text></View> : null}

        <Panel style={{ marginBottom: 16 }}>
          <Eyebrow>UNIVERSAL APK</Eyebrow>
          <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700", marginTop: 6 }}>တစ်ဖိုင်တည်းတွင် ABI များစွာ</Text>
          <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>ARMv7, ARM64, x86 နဲ့ x86_64 ပါဝင်သည့် APK profile ကို ပြင်ဆင်ထားသည်။ Release artifact ကို native build workflow မှ ထုတ်မည်။</Text>
        </Panel>

        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Feather name="shield" size={15} color={gi.quiet} />
          <Text style={{ color: gi.quiet, fontSize: 10, textAlign: "center", marginTop: 7, lineHeight: 15 }}>{preferencesLoaded ? "Key ကို chat၊ log သို့မဟုတ် managed database ထဲ မရေးပါ။" : "Settings ကို ဖတ်နေသည်..."}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
