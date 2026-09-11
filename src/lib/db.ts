import { copyFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const BUNDLED_DB = path.join(process.cwd(), "prisma", "dev.db");
const VERCEL_DB = "/tmp/hc-library.db";

function prepareDatabaseUrl() {
  if (process.env.VERCEL) {
    const sourceReady = existsSync(BUNDLED_DB);
    const destReady = existsSync(VERCEL_DB);
    if (
      sourceReady &&
      (!destReady || statSync(VERCEL_DB).size < statSync(BUNDLED_DB).size)
    ) {
      copyFileSync(BUNDLED_DB, VERCEL_DB);
    }
    process.env.DATABASE_URL = `file:${existsSync(VERCEL_DB) ? VERCEL_DB : BUNDLED_DB}`;
    return;
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
}

prepareDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
