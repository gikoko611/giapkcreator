import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BuildStages, EmptyState, Eyebrow, Panel, SectionHeader, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { useProjects } from "@/hooks/use-projects";
import { trpc } from "@/lib/trpc";

function stageLabel(stage: string): string {
  if (stage === "queued") return "Queue ထဲတွင် စောင့်နေသည်";
  if (stage === "generating") return "AI က source files ဖန်တီးနေသည်";
  if (stage === "checking") return "Source bundle ကိုစစ်ဆေးနေသည်";
  if (stage === "review") return "Source ကို review လုပ်ရန်အသင့်";
  if (stage === "interrupted") return "Server ပြန်စတင်သွားသည် · ထပ်လုပ်ပါ";
  if (stage === "cancelled") return "လုပ်ငန်းကို ရပ်တန့်လိုက်သည်";
  return "လုပ်ငန်း မအောင်မြင်ပါ";
}

function taskStatus(status: string): { label: string; tone: "muted" | "success" | "cyan" | "danger" } {
  if (status === "queued") return { label: "QUEUE", tone: "muted" };
  if (status === "running") return { label: "RUNNING", tone: "cyan" };
  if (status === "completed") return { label: "REVIEW", tone: "success" };
  if (status === "cancelled") return { label: "CANCELLED", tone: "muted" };
  return { label: "FAILED", tone: "danger" };
}

function parseBundle(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as { summary?: string; packageName?: string; files?: { path: string; content: string }[]; setupSteps?: string[] };
  } catch {
    return null;
  }
}

export default function BuildsScreen() {
  const { projects } = useProjects();
  const tasks = trpc.ai.list.useQuery(undefined, { retry: false, refetchInterval: 3500 });
  const cancel = trpc.ai.cancel.useMutation();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const selectedTask = useMemo(() => tasks.data?.find((task) => task.id === selectedTaskId) ?? null, [tasks.data, selectedTaskId]);
  const bundle = parseBundle(selectedTask?.result ?? null);
  const activeCount = tasks.data?.filter((task) => task.status === "queued" || task.status === "running").length ?? 0;

  const cancelTask = async (id: string) => {
    setCancelingId(id);
    try { await cancel.mutateAsync({ id }); await tasks.refetch(); }
    catch { /* The persisted status remains visible if the API is temporarily unavailable. */ }
    finally { setCancelingId(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 28 }}>
        <Eyebrow>REMOTE PIPELINE / ACTIVITY</Eyebrow>
        <Text style={{ color: gi.text, fontSize: 26, fontWeight: "800", marginTop: 7 }}>လုပ်ငန်းအခြေအနေ</Text>
        <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, marginBottom: 21 }}>AI background queue, progress နှင့် source review</Text>

        <Panel accent style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <View style={{ flex: 1 }}><SectionHeader title="လက်ရှိ AI Queue" /></View>
            <StatusBadge label={`${activeCount} ACTIVE`} tone={activeCount ? "cyan" : "muted"} />
          </View>
          {activeCount ? <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17 }}>AI generation သည် server ပေါ်တွင် ဆက်လုပ်နေသည်။ App ကိုပိတ်ပြီး ပြန်ဖွင့်လည်း task မှတ်တမ်းကို database မှ ပြန်ဖတ်နိုင်သည်။</Text> : <EmptyState icon="cpu" title="လုပ်ဆောင်နေသော AI task မရှိပါ" detail="Dashboard မှ Project အသစ်ဖန်တီးပြီး AI source generation ကိုစတင်ပါ။" />}
        </Panel>

        <Panel style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <Feather name="activity" size={16} color={gi.violet} />
            <Text style={{ color: gi.text, fontSize: 15, fontWeight: "700" }}>AI Task History</Text>
          </View>
          {tasks.isLoading ? <View style={{ padding: 16, alignItems: "center" }}><ActivityIndicator color={gi.cyan} /><Text style={{ color: gi.muted, fontSize: 11, marginTop: 9 }}>ဖတ်နေသည်...</Text></View> : tasks.data?.length ? (
            <View style={{ gap: 10 }}>
              {tasks.data.map((task) => {
                const status = taskStatus(task.status);
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <View key={task.id} style={{ padding: 12, borderRadius: 13, backgroundColor: gi.background, borderWidth: 1, borderColor: gi.border }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: gi.text, fontSize: 13, fontWeight: "700" }}>{project?.name ?? "Android project"}</Text>
                        <Text style={{ color: gi.quiet, fontSize: 10, marginTop: 3 }}>{task.providerId.toUpperCase()} · {task.model}</Text>
                      </View>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </View>
                    <Text numberOfLines={2} style={{ color: gi.muted, fontSize: 11, lineHeight: 16, marginTop: 10 }}>{stageLabel(task.stage)}</Text>
                    {(task.status === "running" || task.status === "queued") ? (
                      <View style={{ height: 5, overflow: "hidden", backgroundColor: gi.surfaceRaised, borderRadius: 4, marginTop: 9 }}><View style={{ width: `${Math.max(6, task.progress)}%`, height: 5, backgroundColor: gi.cyan, borderRadius: 4 }} /></View>
                    ) : null}
                    {task.error ? <Text style={{ color: gi.danger, fontSize: 10, lineHeight: 15, marginTop: 8 }}>{task.error}</Text> : null}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      {task.status === "completed" ? <Pressable onPress={() => setSelectedTaskId(task.id)} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: gi.cyanSoft, borderWidth: 1, borderColor: "#315062" }}><Feather name="code" size={13} color={gi.cyan} /><Text style={{ color: gi.cyan, fontSize: 11, fontWeight: "800" }}>Source ကို review လုပ်ရန်</Text></Pressable> : null}
                      {task.status === "running" || task.status === "queued" ? <Pressable disabled={cancelingId === task.id} onPress={() => void cancelTask(task.id)} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: gi.border, opacity: cancelingId === task.id ? 0.5 : 1 }}><Feather name="x-circle" size={13} color={gi.warning} /><Text style={{ color: gi.warning, fontSize: 11, fontWeight: "700" }}>{cancelingId === task.id ? "ရပ်နေသည်..." : "ရပ်ရန်"}</Text></Pressable> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="clock" title="Task history မရှိသေးပါ" detail={tasks.error ? "Server ကိုမရောက်နိုင်ပါ။ Internet ရသည့်အခါ ပြန်စစ်ပါ။" : "AI generation စတင်သည့်အခါ အခြေအနေနှင့် ရလဒ်ကို ဒီနေရာမှာပြပါမယ်။"} />
          )}
        </Panel>

        <Panel>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 16 }}><Feather name="smartphone" size={16} color={gi.warning} /><Text style={{ color: gi.text, fontSize: 15, fontWeight: "700" }}>APK Build အခြေအနေ</Text></View>
          <StatusBadge label="NATIVE BUILDER NOT CONNECTED" tone="muted" />
          <BuildStages />
          <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 17, marginTop: 13 }}>AI က source files ထုတ်ပေးနိုင်သော်လည်း ဤ app မှ Android SDK/Gradle build ကို မစတင်နိုင်သေးပါ။ APK အစစ်ကို အတည်ပြုရန် managed native build service ချိတ်ဆက်ပြီး successful artifact လိုအပ်သည်။</Text>
          <Text style={{ color: gi.quiet, fontSize: 10, lineHeight: 15, marginTop: 9 }}>Target profile: universal APK · ARMv7 + ARM64 + x86 + x86_64 · split APK မဟုတ်</Text>
        </Panel>
      </ScrollView>

      <Modal visible={Boolean(selectedTask)} transparent animationType="slide" onRequestClose={() => setSelectedTaskId(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,7,14,0.88)", justifyContent: "flex-end" }}>
          <View style={{ maxHeight: "88%", backgroundColor: gi.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: gi.border, padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flex: 1 }}><Eyebrow>GENERATED SOURCE / REVIEW</Eyebrow><Text style={{ color: gi.text, fontSize: 19, fontWeight: "800", marginTop: 5 }}>Source Bundle</Text></View>
              <Pressable onPress={() => setSelectedTaskId(null)} style={{ padding: 8 }}><Feather name="x" size={20} color={gi.muted} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {bundle ? (
                <>
                  <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700" }}>{bundle.summary ?? "AI generated source bundle"}</Text>
                  <Text style={{ color: gi.cyan, fontSize: 11, fontFamily: "monospace", marginTop: 8 }}>{bundle.packageName}</Text>
                  <Text style={{ color: gi.muted, fontSize: 11, marginTop: 14, marginBottom: 8 }}>ဖိုင် {bundle.files?.length ?? 0} ခု</Text>
                  {bundle.files?.map((file) => (
                    <View key={file.path} style={{ backgroundColor: gi.background, borderRadius: 11, borderWidth: 1, borderColor: gi.border, padding: 10, marginBottom: 8 }}>
                      <Text selectable style={{ color: gi.cyan, fontSize: 10, fontFamily: "monospace" }}>{file.path}</Text>
                      <Text selectable numberOfLines={24} style={{ color: gi.muted, fontSize: 10, lineHeight: 15, fontFamily: "monospace", marginTop: 7 }}>{file.content}</Text>
                    </View>
                  ))}
                  {bundle.setupSteps?.length ? <Text style={{ color: gi.muted, fontSize: 11, lineHeight: 18, marginTop: 6 }}>Setup: {bundle.setupSteps.join(" · ")}</Text> : null}
                </>
              ) : <Text selectable style={{ color: gi.muted, fontSize: 11, lineHeight: 17 }}>{selectedTask?.result ?? "Source bundle မရှိပါ။"}</Text>}
              <Text style={{ color: gi.warning, fontSize: 10, lineHeight: 15, marginTop: 14 }}>ဤ source သည် AI-generated ဖြစ်ပြီး review လုပ်ရန်လိုသည်။ App က generated code ကို server ပေါ်တွင် execute မလုပ်ပါ၊ APK build ပြီးကြောင်းလည်း မဆိုလိုပါ။</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
