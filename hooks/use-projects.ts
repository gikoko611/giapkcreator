import { useCallback, useEffect, useState } from "react";
import { createProject, readProjects, type ProjectRecord } from "@/lib/projects/project-store";

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setProjects(await readProjects());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProject = useCallback(async (name: string, packageName: string) => {
    const updated = await createProject(name, packageName);
    setProjects(updated);
    return updated[0];
  }, []);

  return { projects, loading, refresh, addProject };
}
