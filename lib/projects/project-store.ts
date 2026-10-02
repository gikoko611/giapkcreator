import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProjectStatus = "Draft" | "Ready to build" | "Building" | "Build failed";

export type ProjectRecord = {
  id: string;
  name: string;
  packageName: string;
  status: ProjectStatus;
  updatedAt: string;
};

const PROJECTS_KEY = "giapkcreator.projects.v1";

export async function readProjects(): Promise<ProjectRecord[]> {
  try {
    const value = await AsyncStorage.getItem(PROJECTS_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as ProjectRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createProject(name: string, packageName: string): Promise<ProjectRecord[]> {
  const existing = await readProjects();
  const project: ProjectRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    packageName: packageName.trim(),
    status: "Draft",
    updatedAt: new Date().toISOString(),
  };
  const updated = [project, ...existing];
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  return updated;
}
