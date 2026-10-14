import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { EmptyState, Eyebrow, Panel, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";
import { useProjects } from "@/hooks/use-projects";
import type { ProjectRecord } from "@/lib/projects/project-store";

function projectTone(status: ProjectRecord["status"]): "muted" | "success" | "cyan" | "danger" {
  if (status === "Needs review" || status === "Ready to build") return "success";
  if (status === "Generating" || status === "Building") return "cyan";
  if (status === "Build failed") return "danger";
  return "muted";
}

function projectLabel(status: ProjectRecord["status"]): string {
  if (status === "Draft") return "မူကြမ်း";
  if (status === "Generating") return "AI ဖန်တီးနေသည်";
  if (status === "Needs review") return "Review လုပ်ရန်";
  if (status === "Imported") return "ZIP Import";
  if (status === "Ready to build") return "Build အဆင်သင့်";
  if (status === "Building") return "Build လုပ်နေသည်";
  return "Build မအောင်မြင်";
}

export default function ProjectsScreen() {
  const { projects, loading, cloudAvailable, getArchiveDownload } = useProjects();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const openArchive = async (id: string) => {
    setDownloading(id);
    setNotice("");
    try {
      const result = await getArchiveDownload(id);
      await Linking.openURL(result.url);
    } catch {
      setNotice("Archive ကိုရယူမရပါ။ Network နှင့် project data ကိုစစ်ပါ။");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 28 }}>
        <Eyebrow>WORKSPACE / PROJECTS</Eyebrow>
        <Text style={{ color: gi.text, fontSize: 26, fontWeight: "800", marginTop: 7 }}>ပရောဂျက်များ</Text>
        <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, marginBottom: 16 }}>ဒီ installation ၏ local နှင့် managed database projects</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}><Feather name={cloudAvailable ? "cloud" : "hard-drive"} size={14} color={cloudAvailable ? gi.success : gi.warning} /><Text style={{ color: cloudAvailable ? gi.success : gi.warning, fontSize: 10 }}>{cloudAvailable ? "Managed database sync ရရှိနိုင်သည်" : "Offline fallback · ဒီစက်ထဲမှာသိမ်းထားသည်"}</Text></View>
        {loading ? <Panel><View style={{ alignItems: "center", padding: 10 }}><ActivityIndicator color={gi.cyan} /><Text style={{ color: gi.muted, fontSize: 11, marginTop: 8 }}>ဖတ်နေသည်...</Text></View></Panel> : projects.length ? (
          <View style={{ gap: 10 }}>
            {projects.map((project) => (
              <Panel key={project.id} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: gi.cyanSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Feather name={project.archiveKey ? "archive" : "box"} size={18} color={gi.cyan} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700" }}>{project.name}</Text>
                    <Text style={{ color: gi.quiet, fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>{project.packageName}</Text>
                  </View>
                  <StatusBadge label={projectLabel(project.status)} tone={projectTone(project.status)} />
                </View>
                {project.description ? <Text numberOfLines={2} style={{ color: gi.muted, fontSize: 11, lineHeight: 16, marginTop: 11 }}>{project.description}</Text> : null}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <Text style={{ color: gi.quiet, fontSize: 10 }}>ပြင်ဆင်ချိန် · {new Date(project.updatedAt).toLocaleDateString()}</Text>
                  {project.archiveKey ? <Pressable disabled={downloading === project.id} onPress={() => void openArchive(project.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: gi.surfaceRaised, borderWidth: 1, borderColor: gi.border, opacity: downloading === project.id ? 0.55 : 1 }}>{downloading === project.id ? <ActivityIndicator size="small" color={gi.cyan} /> : <Feather name="download" size={13} color={gi.cyan} />}<Text style={{ color: gi.cyan, fontSize: 10, fontWeight: "700" }}>ZIP ရယူရန်</Text></Pressable> : null}
                </View>
              </Panel>
            ))}
          </View>
        ) : (
          <Panel><EmptyState icon="layers" title="Project မရှိသေးပါ" detail="Dashboard မှ Project အသစ်ဖန်တီးပါ၊ သို့မဟုတ် Android project ZIP ကို Import လုပ်ပါ။" /></Panel>
        )}
        {notice ? <Text style={{ color: gi.danger, fontSize: 11, lineHeight: 17, marginTop: 13 }}>{notice}</Text> : null}
        <Text style={{ color: gi.quiet, fontSize: 10, lineHeight: 15, marginTop: 18 }}>Cloud data သည် SecureStore token ရှိသော ဒီ app installation နှင့် ချိတ်ဆက်ထားသည်။ App ကိုဖျက်ပြီးပြန်တင်မီ archive ကို backup လုပ်ပါ။</Text>
      </ScrollView>
    </View>
  );
}
