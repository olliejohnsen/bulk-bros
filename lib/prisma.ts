import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function getDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:")) return url.slice(5);
  return path.join(process.cwd(), "dev.db");
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: `file:${getDbPath()}` });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
