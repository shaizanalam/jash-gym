import { PrismaClient } from "@prisma/client"
import path from "path"
import fs from "fs"
import { restoreFallbackDb } from "./db-seed-fallback"

// On Vercel serverless functions, copy or restore the seeded SQLite DB to writable /tmp
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db"
  const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db")

  const needsInit = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size < 1000

  if (needsInit) {
    let restored = false
    try {
      if (fs.existsSync(sourceDbPath) && fs.statSync(sourceDbPath).size > 1000) {
        fs.copyFileSync(sourceDbPath, tmpDbPath)
        restored = true
      }
    } catch (err) {
      console.warn("[Prisma] Could not copy source db:", err)
    }

    if (!restored) {
      console.log("[Prisma] Restoring embedded fallback SQLite database to /tmp/dev.db...")
      restoreFallbackDb(tmpDbPath)
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
    datasources: process.env.VERCEL
      ? {
          db: {
            url: "file:/tmp/dev.db",
          },
        }
      : undefined,
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
