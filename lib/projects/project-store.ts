import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProjectStatus = "Draft" | "Generating" | "Needs review" | "Imported" | "Ready to build" | "Building" | "Build failed";

export type ProjectRecord = {
  id: string;
  name: string;
  packageName: string;
  description?: string;
  status: ProjectStatus;
  archiveKey?: string | null;
  updatedAt: string;
};

const PROJECTS_KEY = "giapkcreator.projects.v1";

function isProjectRecord(value: unknown): value is ProjectRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ProjectRecord>;
  return typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.packageName === "string" && typeof item.status === "string" &&
    typeof item.updatedAt === "string";
}

export async function readProjects(): Promise<ProjectRecord[]> {
  try {
    const value = await AsyncStorage.getItem(PROJECTS_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isProjectRecord) : [];
  } catch {
    return [];
  }
}

export async function saveProjects(projects: ProjectRecord[]): Promise<void> {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function createProject(name: string, packageName: string, description = ""): Promise<ProjectRecord[]> {
  const existing = await readProjects();
  const project: ProjectRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: name.trim(),
    packageName: packageName.trim(),
    description: description.trim() || undefined,
    status: "Draft",
    updatedAt: new Date().toISOString(),
  };
  const updated = [project, ...existing];
  await saveProjects(updated);
  return updated;
}

export async function upsertProject(project: ProjectRecord): Promise<ProjectRecord[]> {
  const existing = await readProjects();
  const updated = [project, ...existing.filter((item) => item.id !== project.id)];
  await saveProjects(updated);
  return updated;
}

export function mergeProjects(local: ProjectRecord[], remote: ProjectRecord[]): ProjectRecord[] {
  const byId = new Map<string, ProjectRecord>();
  for (const project of local) byId.set(project.id, project);
  for (const project of remote) byId.set(project.id, project);
  return Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
