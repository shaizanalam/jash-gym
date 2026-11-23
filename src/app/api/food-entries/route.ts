import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const entrySchema = z.object({
  mealCategory: z.string().default("breakfast"),
  foodName: z.string().min(1, "Food name is required"),
  estimatedPortionG: z.number().nonnegative().default(100),
  calories: z.number().nonnegative().default(0),
  proteinG: z.number().nonnegative().default(0),
  carbsG: z.number().nonnegative().default(0),
  fatG: z.number().nonnegative().default(0),
  fibreG: z.number().nonnegative().optional().nullable(),
  aiConfidence: z.string().optional().nullable(),
  isAiGenerated: z.boolean().default(false),
  isConfirmedByUser: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  sourceImageId: z.string().optional().nullable(),
  foodItemId: z.string().optional().nullable(),
  loggedAt: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const mealCategory = searchParams.get("mealCategory")
  const userId = session.user.id

  const where: any = { userId }
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.loggedAt = { gte: start, lte: end }
  }
  if (mealCategory && mealCategory !== "all") {
    where.mealCategory = mealCategory
  }

  const entries = await prisma.foodEntry.findMany({
    where,
    orderBy: { loggedAt: "desc" },
    include: { sourceImage: true, foodItem: true, customRecipe: true },
  })

  return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    // Support single entry or array of entries
    const items = Array.isArray(body) ? body : [body]

    const createdEntries = []
    for (const item of items) {
      const parsed = entrySchema.safeParse(item)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid data", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const entry = await prisma.foodEntry.create({
        data: {
          ...parsed.data,
          userId: session.user.id,
          loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date(),
        },
      })
      createdEntries.push(entry)
    }

    return NextResponse.json(
      Array.isArray(body) ? createdEntries : createdEntries[0],
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create food entry:", error)
    return NextResponse.json(
      { error: "Failed to create food entry" },
      { status: 500 }
    )
  }
}
