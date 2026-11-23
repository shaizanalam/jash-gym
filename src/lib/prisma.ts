import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
  prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {})
  prisma.$executeRawUnsafe("PRAGMA busy_timeout = 10000;").catch(() => {})
}
