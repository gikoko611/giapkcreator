import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createProject, mergeProjects, readProjects, saveProjects, upsertProject, type ProjectRecord } from "@/lib/projects/project-store";
import { trpc } from "@/lib/trpc";
import type { ProviderId } from "@/lib/ai/providers";

function fromRemote(project: {
  id: string;
  name: string;
  packageName: string;
  description: string | null;
  status: ProjectRecord["status"];
  archiveKey: string | null;
  updatedAt: Date | string;
}): ProjectRecord {
  return {
    id: project.id,
    name: project.name,
    packageName: project.packageName,
    description: project.description ?? undefined,
    status: project.status,
    archiveKey: project.archiveKey,
    updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : new Date(project.updatedAt).toISOString(),
  };
}

export function useProjects() {
  const [localProjects, setLocalProjects] = useState<ProjectRecord[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const syncedExistingRef = useRef(false);
  const lastRemoteSignatureRef = useRef("");
  const remote = trpc.projects.list.useQuery(undefined, { retry: false, refetchInterval: 6000 });
  const saveMutation = trpc.projects.save.useMutation();
  const importMutation = trpc.projects.importArchive.useMutation();
  const archiveDownloadMutation = trpc.projects.archiveDownload.useMutation();
  const startAiMutation = trpc.ai.start.useMutation();

  useEffect(() => {
    let active = true;
    void readProjects().then((items) => {
      if (!active) return;
      setLocalProjects(items);
      setLocalLoaded(true);
    });
    return () => { active = false; };
  }, []);

  const remoteProjects = useMemo(
    () => remote.data?.map((project) => fromRemote(project)) ?? [],
    [remote.data],
  );
  const projects = useMemo(
    () => mergeProjects(localProjects, remoteProjects),
    [localProjects, remoteProjects],
  );

  useEffect(() => {
    if (!remote.isSuccess || !localLoaded || syncedExistingRef.current) return;
    syncedExistingRef.current = true;
    const known = new Set(remoteProjects.map((project) => project.id));
    const missing = localProjects.filter((project) => !known.has(project.id));
    if (!missing.length) return;
    void (async () => {
      for (const project of missing) {
        try {
          await saveMutation.mutateAsync({
            id: project.id,
            name: project.name,
            packageName: project.packageName,
            description: project.description ?? "",
          });
        } catch {
          // Keep local records available if the managed API is temporarily offline.
        }
      }
      await remote.refetch();
    })();
  }, [localLoaded, localProjects, remote, remoteProjects, saveMutation]);

  useEffect(() => {
    if (!remoteProjects.length) return;
    const signature = remoteProjects.map((project) => `${project.id}:${project.status}:${project.updatedAt}`).join("|");
    if (signature === lastRemoteSignatureRef.current) return;
    lastRemoteSignatureRef.current = signature;
    const merged = mergeProjects(localProjects, remoteProjects);
    if (JSON.stringify(merged) === JSON.stringify(localProjects)) return;
    void saveProjects(merged).then(() => setLocalProjects(merged));
  }, [remoteProjects, localProjects]);

  const refresh = useCallback(async () => {
    const [items] = await Promise.all([readProjects(), remote.refetch()]);
    setLocalProjects(items);
    setLocalLoaded(true);
  }, [remote]);

  const addProject = useCallback(async (name: string, packageName: string, description = "") => {
    const updated = await createProject(name, packageName, description);
    const project = updated[0];
    setLocalProjects(updated);
    let cloudSynced = false;
    try {
      await saveMutation.mutateAsync({
        id: project.id,
        name: project.name,
        packageName: project.packageName,
        description: project.description ?? "",
      });
      cloudSynced = true;
      await remote.refetch();
    } catch {
      // Local storage remains the source of truth while offline.
    }
    return { project, cloudSynced };
  }, [remote, saveMutation]);

  const startGeneration = useCallback(async (input: {
    projectId: string;
    providerId: ProviderId;
    model: string;
    endpoint: string;
    apiKey?: string;
    description: string;
  }) => {
    const result = await startAiMutation.mutateAsync(input);
    const updated = localProjects.map((project) => project.id === input.projectId
      ? { ...project, description: input.description, status: "Generating" as const, updatedAt: new Date().toISOString() }
      : project);
    setLocalProjects(updated);
    void saveProjects(updated).catch(() => undefined);
    return result;
  }, [localProjects, startAiMutation]);

  const importArchive = useCallback(async (name: string, fileName: string, archiveBase64: string) => {
    const imported = await importMutation.mutateAsync({ name, fileName, archiveBase64 });
    const project: ProjectRecord = {
      id: imported.id,
      name: imported.name,
      packageName: imported.packageName,
      description: `Imported from ${fileName}`,
      status: "Imported",
      archiveKey: imported.archiveKey,
      updatedAt: new Date().toISOString(),
    };
    const updated = await upsertProject(project);
    setLocalProjects(updated);
    return project;
  }, [importMutation]);

  const getArchiveDownload = useCallback(async (id: string) => {
    return archiveDownloadMutation.mutateAsync({ id });
  }, [archiveDownloadMutation]);

  return {
    projects,
    loading: !localLoaded && remote.isLoading,
    cloudAvailable: remote.isSuccess,
    cloudError: remote.error,
    refreshing: remote.isFetching,
    addProject,
    startGeneration,
    importArchive,
    getArchiveDownload,
    refresh,
  };
}
