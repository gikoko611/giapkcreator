import { ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useProjects } from "@/hooks/use-projects";
import { EmptyState, Eyebrow, Panel, StatusBadge } from "@/components/gi/primitives";
import { gi } from "@/constants/gi-theme";

export default function ProjectsScreen() {
  const { projects, loading } = useProjects();
  return (
    <View style={{ flex: 1, backgroundColor: gi.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22, paddingBottom: 28 }}>
        <Eyebrow>WORKSPACE / PROJECTS</Eyebrow>
        <Text style={{ color: gi.text, fontSize: 26, fontWeight: "800", marginTop: 7 }}>ပရောဂျက်များ</Text>
        <Text style={{ color: gi.muted, fontSize: 13, marginTop: 5, marginBottom: 20 }}>ဒီစက်မှာ သိမ်းထားတဲ့ Android project များ</Text>
        {loading ? <Panel><Text style={{ color: gi.muted }}>ဖတ်နေသည်...</Text></Panel> : projects.length ? (
          <View style={{ gap: 10 }}>
            {projects.map((project) => (
              <Panel key={project.id} style={{ padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: gi.cyanSoft, alignItems: "center", justifyContent: "center", marginRight: 12 }}><Feather name="box" size={18} color={gi.cyan} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: gi.text, fontSize: 14, fontWeight: "700" }}>{project.name}</Text>
                    <Text style={{ color: gi.quiet, fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>{project.packageName}</Text>
                  </View>
                  <StatusBadge label={project.status === "Draft" ? "မူကြမ်း" : project.status} tone={project.status === "Ready to build" ? "success" : "muted"} />
                </View>
              </Panel>
            ))}
          </View>
        ) : (
          <Panel><EmptyState icon="layers" title="Project မရှိသေးပါ" detail="Dashboard မှ Project အသစ်ဖန်တီးပါ သို့မဟုတ် Import ကိုရွေးပါ။" /></Panel>
        )}
      </ScrollView>
    </View>
  );
}
