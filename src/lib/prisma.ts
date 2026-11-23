import { PrismaClient } from "@prisma/client"
import path from "path"
import fs from "fs"

// On Vercel serverless functions, copy the seeded SQLite DB to writable /tmp
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db"
  const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db")

  if (!fs.existsSync(tmpDbPath)) {
    try {
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath)
      } else {
        fs.writeFileSync(tmpDbPath, "")
      }
    } catch (err) {
      console.warn("[Prisma] Failed to copy SQLite db to /tmp:", err)
    }
  }
  process.env.DATABASE_URL = "file:/tmp/dev.db"
}

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
  prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => { })
  prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000;").catch(() => { })
}
