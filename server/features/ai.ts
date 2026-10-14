import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { giAiTasks, giProjects } from "../../drizzle/schema";
import { generateProjectBundle } from "../ai-provider";
import { listLLMModels } from "../_core/llm";
import { getDb } from "../db";
import { installationProcedure, router } from "../_core/trpc";
import type { ProviderId } from "../../lib/ai/providers";

const providerIds = ["manus", "groq", "gemini", "cohere", "openrouter", "ollama-cloud", "custom"] as const;
type BackgroundTask = () => Promise<void>;
const pendingTasks: { taskId: string; run: BackgroundTask }[] = [];
const controllers = new Map<string, AbortController>();
let runningCount = 0;
const MAX_PARALLEL_TASKS = 2;

function scheduleTask(taskId: string, task: BackgroundTask) {
  pendingTasks.push({ taskId, run: task });
  pumpQueue();
}

function pumpQueue() {
  while (runningCount < MAX_PARALLEL_TASKS && pendingTasks.length) {
    const next = pendingTasks.shift();
    if (!next) return;
    runningCount += 1;
    void next.run().catch(() => undefined).finally(() => {
      runningCount -= 1;
      pumpQueue();
    });
  }
}

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Project database is unavailable" });
  return db;
}

function publicTaskError(error: unknown, aborted: boolean): string {
  if (aborted) return "Generation cancelled.";
  const message = error instanceof Error ? error.message : "";
  const status = message.match(/AI provider returned HTTP (\d{3})/);
  if (status) return `AI provider returned HTTP ${status[1]}. Check the provider quota and API key.`;
  if (message.includes("source-bundle JSON format") || message.includes("required source-bundle fields")) {
    return "AI response format was not usable. Try again or choose another model.";
  }
  if (message.includes("endpoint")) return "AI endpoint is invalid or unavailable. Check its HTTPS URL and provider selection.";
  return "AI generation failed. Check the model, provider quota, and network, then retry.";
}

async function runTask(input: {
  taskId: string;
  ownerHash: string;
  projectId: string;
  providerId: ProviderId;
  model: string;
  endpoint: string;
  apiKey?: string;
  projectName: string;
  packageName: string;
  description: string;
}) {
  const abortController = new AbortController();
  controllers.set(input.taskId, abortController);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    abortController.abort();
  }, 120_000);
  try {
    const db = await database();
    const current = await db.select({ status: giAiTasks.status }).from(giAiTasks)
      .where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash))).limit(1);
    if (!current[0] || current[0].status === "cancelled") return;

    await db.update(giAiTasks).set({ status: "running", stage: "generating", progress: 20, error: null })
      .where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash)));
    const bundle = await generateProjectBundle({ ...input, signal: abortController.signal });
    if (timedOut) throw new Error("AI task timed out");
    await db.update(giAiTasks).set({ stage: "checking", progress: 85 })
      .where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash)));

    const latest = await db.select({ status: giAiTasks.status }).from(giAiTasks)
      .where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash))).limit(1);
    if (!latest[0] || latest[0].status === "cancelled") return;

    await db.update(giAiTasks).set({
      status: "completed",
      stage: "review",
      progress: 100,
      result: JSON.stringify(bundle),
      error: null,
    }).where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash)));
    await db.update(giProjects).set({ status: "Needs review", updatedAt: new Date() })
      .where(and(eq(giProjects.id, input.projectId), eq(giProjects.ownerHash, input.ownerHash)));
  } catch (error) {
    const cancelled = abortController.signal.aborted && !timedOut;
    const db = await getDb();
    if (db) {
      const message = publicTaskError(error, cancelled);
      await db.update(giAiTasks).set({
        status: cancelled ? "cancelled" : "failed",
        stage: cancelled ? "cancelled" : "failed",
        error: message,
      }).where(and(eq(giAiTasks.id, input.taskId), eq(giAiTasks.ownerHash, input.ownerHash)));
      if (!cancelled) {
        await db.update(giProjects).set({ status: "Draft", updatedAt: new Date() })
          .where(and(eq(giProjects.id, input.projectId), eq(giProjects.ownerHash, input.ownerHash)));
      }
    }
  } finally {
    clearTimeout(timeout);
    controllers.delete(input.taskId);
  }
}

export const aiRouter = router({
  models: installationProcedure.query(async () => {
    try {
      const response = await listLLMModels();
      return response.data.map((model) => model.id).filter(Boolean).slice(0, 100);
    } catch {
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Built-in AI model catalog is unavailable" });
    }
  }),

  list: installationProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select({
      id: giAiTasks.id,
      projectId: giAiTasks.projectId,
      providerId: giAiTasks.providerId,
      model: giAiTasks.model,
      prompt: giAiTasks.prompt,
      status: giAiTasks.status,
      stage: giAiTasks.stage,
      progress: giAiTasks.progress,
      result: giAiTasks.result,
      error: giAiTasks.error,
      createdAt: giAiTasks.createdAt,
      updatedAt: giAiTasks.updatedAt,
    }).from(giAiTasks).where(eq(giAiTasks.ownerHash, ctx.installationHash))
      .orderBy(desc(giAiTasks.createdAt)).limit(50);
  }),

  start: installationProcedure.input(z.object({
    projectId: z.string().min(1).max(64),
    providerId: z.enum(providerIds),
    model: z.string().trim().max(255).default(""),
    endpoint: z.string().trim().max(1024).default(""),
    apiKey: z.string().max(4096).optional(),
    description: z.string().trim().min(10).max(6000),
  })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const projectRows = await db.select().from(giProjects).where(and(
      eq(giProjects.id, input.projectId),
      eq(giProjects.ownerHash, ctx.installationHash),
    )).limit(1);
    const project = projectRows[0];
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
    if (input.providerId !== "manus" && !input.apiKey?.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This provider requires an API key" });
    }
    if (input.providerId !== "manus" && !input.model.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Model ID is required" });
    }

    const active = await db.select({ id: giAiTasks.id }).from(giAiTasks).where(and(
      eq(giAiTasks.ownerHash, ctx.installationHash),
      inArray(giAiTasks.status, ["queued", "running"]),
    )).limit(3);
    if (active.length >= 3) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "This installation already has three active AI tasks" });

    const taskId = randomUUID();
    await db.insert(giAiTasks).values({
      id: taskId,
      ownerHash: ctx.installationHash,
      projectId: project.id,
      providerId: input.providerId,
      model: input.model || "default",
      prompt: input.description,
      status: "queued",
      stage: "queued",
      progress: 0,
    });
    await db.update(giProjects).set({ status: "Generating", description: input.description, updatedAt: new Date() })
      .where(and(eq(giProjects.id, project.id), eq(giProjects.ownerHash, ctx.installationHash)));

    // The provider key exists only in this in-memory closure for the duration of the task.
    // It is deliberately not written to the task row or any server log.
    const taskInput = {
      taskId,
      ownerHash: ctx.installationHash,
      projectId: project.id,
      providerId: input.providerId,
      model: input.model,
      endpoint: input.endpoint,
      apiKey: input.apiKey,
      projectName: project.name,
      packageName: project.packageName,
      description: input.description,
    };
    scheduleTask(taskId, () => runTask(taskInput));
    return { id: taskId, status: "queued" as const, stage: "queued" as const, progress: 0 };
  }),

  cancel: installationProcedure.input(z.object({ id: z.string().min(1).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const rows = await db.select().from(giAiTasks).where(and(
      eq(giAiTasks.id, input.id),
      eq(giAiTasks.ownerHash, ctx.installationHash),
    )).limit(1);
    const task = rows[0];
    if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "AI task not found" });
    if (task.status === "queued" || task.status === "running") {
      const queuedIndex = pendingTasks.findIndex((queued) => queued.taskId === task.id);
      if (queuedIndex >= 0) pendingTasks.splice(queuedIndex, 1);
      controllers.get(task.id)?.abort();
      await db.update(giAiTasks).set({ status: "cancelled", stage: "cancelled", error: "Generation cancelled." })
        .where(and(eq(giAiTasks.id, task.id), eq(giAiTasks.ownerHash, ctx.installationHash)));
      await db.update(giProjects).set({ status: "Draft", updatedAt: new Date() })
        .where(and(eq(giProjects.id, task.projectId), eq(giProjects.ownerHash, ctx.installationHash)));
    }
    return { success: true };
  }),
});

/** Mark in-flight tasks from a previous process as interrupted; keys are never persisted for replay. */
export async function recoverInterruptedAiTasks(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(giAiTasks).set({
      status: "failed",
      stage: "interrupted",
      error: "The server restarted before this task completed. Start the generation again.",
    }).where(inArray(giAiTasks.status, ["queued", "running"]));
  } catch {
    // The first startup before feature-table migration is allowed; the app remains healthy.
  }
}
