import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the starter's OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Project metadata scoped to a SecureStore-backed anonymous installation identity. */
export const giProjects = mysqlTable(
  "gi_projects",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerHash: varchar("ownerHash", { length: 64 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    packageName: varchar("packageName", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["Draft", "Generating", "Needs review", "Imported", "Ready to build", "Building", "Build failed"]).default("Draft").notNull(),
    archiveKey: varchar("archiveKey", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("gi_projects_owner_idx").on(table.ownerHash)],
);

/** Background AI work persists progress and results; provider keys are deliberately excluded. */
export const giAiTasks = mysqlTable(
  "gi_ai_tasks",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    ownerHash: varchar("ownerHash", { length: 64 }).notNull(),
    projectId: varchar("projectId", { length: 64 }).notNull().references(() => giProjects.id, { onDelete: "cascade" }),
    providerId: varchar("providerId", { length: 32 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    prompt: text("prompt").notNull(),
    status: mysqlEnum("status", ["queued", "running", "completed", "failed", "cancelled"]).default("queued").notNull(),
    stage: varchar("stage", { length: 100 }).notNull().default("queued"),
    progress: int("progress").notNull().default(0),
    result: text("result"),
    error: varchar("error", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("gi_ai_tasks_owner_created_idx").on(table.ownerHash, table.createdAt), index("gi_ai_tasks_project_idx").on(table.projectId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GIProject = typeof giProjects.$inferSelect;
export type InsertGIProject = typeof giProjects.$inferInsert;
export type GIAiTask = typeof giAiTasks.$inferSelect;
