import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveNutritionTargets } from "@/lib/nutrition-targets"
import {
  ACTIVITY_LEVELS,
  DIETARY_PREFERENCES,
  FITNESS_GOALS,
  GENDERS,
} from "@/lib/constants"

const VALID_DIETARY = new Set<string>(DIETARY_PREFERENCES.map((d) => d.id))
const VALID_ACTIVITY = new Set<string>(ACTIVITY_LEVELS.map((a) => a.id))
const VALID_GOALS = new Set<string>(FITNESS_GOALS.map((g) => g.id))
const VALID_GENDERS = new Set<string>(GENDERS.map((g) => g.id))

type ParseResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string }

function parseBoundedNumber(
  raw: unknown,
  opts: { label: string; min: number; max: number; integer?: boolean; decimals?: number }
): ParseResult {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null }
  }
  const str = String(raw).trim()
  if (str === "") {
    return { ok: true, value: null }
  }

  const num = Number(str)
  if (!Number.isFinite(num)) {
    return { ok: false, error: `${opts.label} must be a valid number.` }
  }
  if (num < opts.min || num > opts.max) {
    return {
      ok: false,
      error: `${opts.label} must be between ${opts.min} and ${opts.max}.`,
    }
  }

  if (opts.integer) {
    return { ok: true, value: Math.round(num) }
  }
  const factor = Math.pow(10, opts.decimals ?? 1)
  return { ok: true, value: Math.round(num * factor) / factor }
}

function normalizeStringList(raw: unknown): string | null {
  if (!raw) return null
  const list = Array.isArray(raw)
    ? raw.map((item) => String(item).trim()).filter(Boolean)
    : String(raw)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

  return list.length > 0 ? JSON.stringify(list) : null
}

function normalizeEnum(raw: unknown, allowed: Set<string>): string | null {
  if (typeof raw !== "string") return null
  const val = raw.trim()
  return allowed.has(val) ? val : null
}

async function fetchProfileBundle(userId: string) {
  const [user, profile, guidance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.nutritionProfile.findUnique({ where: { userId } }),
    prisma.professionalGuidance.findUnique({ where: { userId } }),
  ])

  return {
    user,
    profile,
    guidance,
    targets: resolveNutritionTargets(guidance),
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bundle = await fetchProfileBundle(session.user.id)
  return NextResponse.json(bundle)
}

async function handleUpsert(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  let data: Record<string, unknown>
  try {
    data = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const type = typeof data.type === "string" ? data.type : ""
  const updateProfile = type === "profile" || type === "all"
  const updateTargets = type === "guidance" || type === "targets" || type === "all"

  if (!updateProfile && !updateTargets) {
    return NextResponse.json({ error: "Invalid update type" }, { status: 400 })
  }

  try {
    let updatedName: string | undefined
    let profileFields: {
      age: number | null
      gender: string | null
      weightKg: number | null
      heightCm: number | null
      goal: string | null
      dietaryPreference: string | null
      allergies: string | null
      restrictions: string | null
      activityLevel: string | null
    } | null = null

    if (updateProfile) {
      const ageRes = parseBoundedNumber(data.age, {
        label: "Age",
        min: 10,
        max: 120,
        integer: true,
      })
      const weightRes = parseBoundedNumber(data.weightKg, {
        label: "Weight (kg)",
        min: 20,
        max: 400,
        decimals: 1,
      })
      const heightRes = parseBoundedNumber(data.heightCm, {
        label: "Height (cm)",
        min: 80,
        max: 260,
        decimals: 1,
      })

      for (const r of [ageRes, weightRes, heightRes]) {
        if (!r.ok) {
          return NextResponse.json({ error: r.error }, { status: 400 })
        }
      }

      const trimmedName =
        typeof data.name === "string" ? data.name.trim() : undefined
      if (trimmedName !== undefined && trimmedName.length === 0) {
        return NextResponse.json(
          { error: "Display name cannot be empty." },
          { status: 400 }
        )
      }

      updatedName = trimmedName
      profileFields = {
        age: (ageRes as { ok: true; value: number | null }).value,
        gender: normalizeEnum(data.gender, VALID_GENDERS),
        weightKg: (weightRes as { ok: true; value: number | null }).value,
        heightCm: (heightRes as { ok: true; value: number | null }).value,
        goal: normalizeEnum(data.goal, VALID_GOALS),
        dietaryPreference: normalizeEnum(data.dietaryPreference, VALID_DIETARY),
        allergies: normalizeStringList(data.allergies),
        restrictions: normalizeStringList(data.restrictions),
        activityLevel: normalizeEnum(data.activityLevel, VALID_ACTIVITY),
      }
    }

    let targetsPayload: {
      dailyCalorieRef: number | null
      dailyProteinRef: number | null
      dailyCarbsRef: number | null
      dailyFatRef: number | null
      dailyFibreRef: number | null
      sourceNotes: string | null
      enteredByProfessional?: boolean
    } | null = null

    if (updateTargets) {
      const calRes = parseBoundedNumber(data.dailyCalorieRef, {
        label: "Daily Calorie Target",
        min: 500,
        max: 10000,
        integer: true,
      })
      const protRes = parseBoundedNumber(data.dailyProteinRef, {
        label: "Daily Protein Target",
        min: 10,
        max: 600,
        integer: true,
      })
      const carbsRes = parseBoundedNumber(data.dailyCarbsRef, {
        label: "Daily Carbs Target",
        min: 0,
        max: 1500,
        integer: true,
      })
      const fatRes = parseBoundedNumber(data.dailyFatRef, {
        label: "Daily Fat Target",
        min: 10,
        max: 500,
        integer: true,
      })
      const fibreRes = parseBoundedNumber(data.dailyFibreRef, {
        label: "Daily Fibre Target",
        min: 0,
        max: 200,
        integer: true,
      })

      for (const r of [calRes, protRes, carbsRes, fatRes, fibreRes]) {
        if (!r.ok) {
          return NextResponse.json({ error: r.error }, { status: 400 })
        }
      }

      const rawNotes =
        typeof data.sourceNotes === "string" ? data.sourceNotes.trim() : null

      targetsPayload = {
        dailyCalorieRef: (calRes as { ok: true; value: number | null }).value,
        dailyProteinRef: (protRes as { ok: true; value: number | null }).value,
        dailyCarbsRef: (carbsRes as { ok: true; value: number | null }).value,
        dailyFatRef: (fatRes as { ok: true; value: number | null }).value,
        dailyFibreRef: (fibreRes as { ok: true; value: number | null }).value,
        sourceNotes: rawNotes && rawNotes.length > 0 ? rawNotes.slice(0, 1000) : null,
        enteredByProfessional:
          typeof data.enteredByProfessional === "boolean"
            ? data.enteredByProfessional
            : undefined,
      }
    }

    await prisma.$transaction(async (tx) => {
      if (profileFields) {
        if (updatedName) {
          await tx.user.updateMany({
            where: { id: userId },
            data: { name: updatedName },
          })
        }

        await tx.nutritionProfile.upsert({
          where: { userId },
          update: profileFields,
          create: { userId, ...profileFields },
        })
      }

      if (targetsPayload) {
        const { enteredByProfessional, ...targetFields } = targetsPayload
        await tx.professionalGuidance.upsert({
          where: { userId },
          update: {
            ...targetFields,
            ...(enteredByProfessional !== undefined ? { enteredByProfessional } : {}),
          },
          create: {
            userId,
            ...targetFields,
            enteredByProfessional: enteredByProfessional ?? false,
          },
        })
      }
    })

    revalidatePath("/")
    revalidatePath("/analytics")
    revalidatePath("/journal")
    revalidatePath("/profile")
    revalidatePath("/settings")

    const bundle = await fetchProfileBundle(userId)
    return NextResponse.json(bundle)
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return handleUpsert(request)
}

export async function PATCH(request: Request) {
  return handleUpsert(request)
}
