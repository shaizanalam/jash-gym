import { PrismaClient } from "@prisma/client"

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db"
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./dev.db",
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Enable SQLite WAL mode & busy timeout to prevent "database is locked" errors
if (
  process.env.DATABASE_URL?.includes("file:") ||
  process.env.DATABASE_URL?.includes(".db")
) {
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {})
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000;").catch(() => {})
}
