import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { giProjects } from "../../drizzle/schema";
import { storageGetSignedUrl, storagePut } from "../storage";
import { getDb } from "../db";
import { installationProcedure, router } from "../_core/trpc";

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Project database is unavailable" });
  return db;
}

const projectInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  packageName: z.string().trim().min(3).max(255).regex(/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/),
  description: z.string().max(6000).optional(),
});

export const projectsRouter = router({
  list: installationProcedure.query(async ({ ctx }) => {
    const db = await database();
    return db.select({
      id: giProjects.id,
      name: giProjects.name,
      packageName: giProjects.packageName,
      description: giProjects.description,
      status: giProjects.status,
      archiveKey: giProjects.archiveKey,
      createdAt: giProjects.createdAt,
      updatedAt: giProjects.updatedAt,
    }).from(giProjects).where(eq(giProjects.ownerHash, ctx.installationHash))
      .orderBy(desc(giProjects.updatedAt)).limit(100);
  }),

  save: installationProcedure.input(projectInput).mutation(async ({ ctx, input }) => {
    const db = await database();
    const existing = await db.select().from(giProjects).where(and(
      eq(giProjects.id, input.id),
      eq(giProjects.ownerHash, ctx.installationHash),
    )).limit(1);
    if (existing[0]) {
      await db.update(giProjects).set({
        name: input.name,
        packageName: input.packageName,
        description: input.description ?? existing[0].description,
        updatedAt: new Date(),
      }).where(and(eq(giProjects.id, input.id), eq(giProjects.ownerHash, ctx.installationHash)));
    } else {
      await db.insert(giProjects).values({
        id: input.id,
        ownerHash: ctx.installationHash,
        name: input.name,
        packageName: input.packageName,
        description: input.description ?? null,
        status: "Draft",
      });
    }
    return { success: true, id: input.id };
  }),

  importArchive: installationProcedure.input(z.object({
    name: z.string().trim().min(1).max(160),
    fileName: z.string().trim().min(5).max(255).regex(/\.zip$/i),
    archiveBase64: z.string().min(16).max(11_200_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
  })).mutation(async ({ ctx, input }) => {
    const bytes = Buffer.from(input.archiveBase64, "base64");
    if (bytes.length < 4 || bytes.length > 8 * 1024 * 1024 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ZIP archive must be valid and no larger than 8 MB" });
    }
    const db = await database();
    const id = randomUUID();
    const archive = await storagePut(`gi-projects/${ctx.installationHash}/${id}.zip`, bytes, "application/zip");
    const cleanSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "imported";
    const packagePart = cleanSlug.slice(0, 80);
    const packageName = `com.gi.imported.${/^[a-z]/.test(packagePart) ? packagePart : `app${packagePart}`}`;
    await db.insert(giProjects).values({
      id,
      ownerHash: ctx.installationHash,
      name: input.name,
      packageName,
      description: `Imported from ${input.fileName}`,
      status: "Imported",
      archiveKey: archive.key,
    });
    return { id, name: input.name, packageName, status: "Imported" as const, archiveKey: archive.key };
  }),

  archiveDownload: installationProcedure.input(z.object({ id: z.string().min(1).max(64) })).mutation(async ({ ctx, input }) => {
    const db = await database();
    const rows = await db.select({ archiveKey: giProjects.archiveKey }).from(giProjects).where(and(
      eq(giProjects.id, input.id),
      eq(giProjects.ownerHash, ctx.installationHash),
    )).limit(1);
    const key = rows[0]?.archiveKey;
    if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "Project archive not found" });
    return { url: await storageGetSignedUrl(key) };
  }),
});
