import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDayIST, startOfWeekIST } from "@/lib/dates"

export async function loadDashboardData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const today = startOfDayIST()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [dbUser, entries, weekEntries, guidance] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.foodEntry.findMany({
      where: { userId, loggedAt: { gte: today } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.foodEntry.findMany({
      where: { userId, loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.professionalGuidance.findUnique({ where: { userId } }),
  ])

  return {
    userName: dbUser?.name || session.user.name || "there",
    entries: entries.map((e) => ({
      ...e,
      loggedAt: e.loggedAt.toISOString(),
    })),
    weekEntries: weekEntries.map((e) => ({
      ...e,
      loggedAt: e.loggedAt.toISOString(),
    })),
    guidance,
  }
}

export async function loadAnalyticsData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const weekStart = startOfWeekIST()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [entries, guidance] = await Promise.all([
    prisma.foodEntry.findMany({
      where: {
        userId,
        loggedAt: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.professionalGuidance.findUnique({ where: { userId } }),
  ])

  return {
    entries: entries.map((e) => ({
      ...e,
      loggedAt: e.loggedAt.toISOString(),
    })),
    guidance,
  }
}

export async function loadSettingsData() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [dbUser, images] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.uploadedImage.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return {
    user: {
      name: dbUser?.name || session.user.name || "User",
      email: dbUser?.email || session.user.email || "",
    },
    images: images.map((img) => ({
      id: img.id,
      storageKey: img.storageKey,
      storageUrl: img.storageUrl,
      fileSizeKb: img.fileSizeKb,
      createdAt: img.createdAt.toISOString(),
    })),
  }
}
