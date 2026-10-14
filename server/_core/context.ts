import { createHash } from "node:crypto";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { currentSessionCookie } from "./cookies";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  installationHash: string | null;
};

function readInstallationHash(req: CreateExpressContextOptions["req"]): string | null {
  const token = req.get("x-gi-installation-token") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  if (opts.req.get("authorization") || currentSessionCookie(opts.req)) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    installationHash: readInstallationHash(opts.req),
  };
}
