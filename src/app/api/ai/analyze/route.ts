import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MASTER_INDIAN_FOODS, type MasterFoodItem } from "@/lib/food-library"
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini"
import { analyzeFoodWithCascade } from "@/lib/cascade-analyzer"

async function loadMergedServerFoods(): Promise<MasterFoodItem[]> {
  try {
    const dbFoods = await prisma.foodItem.findMany()
    if (dbFoods.length === 0) return MASTER_INDIAN_FOODS

    const seen = new Set<string>()
    const merged: MasterFoodItem[] = []

    // Prioritize custom user foods and curated prepared dishes first
    const dbMapped: MasterFoodItem[] = dbFoods.map((f) => ({
      name: f.name,
      alternativeNames: f.alternativeNames
        ? (JSON.parse(f.alternativeNames) as string[])
        : [],
      category: f.category,
      servingSizeG: f.servingSizeG || 100,
      servingUnit: f.servingUnit || "serving",
      caloriesPer100g: f.caloriesPer100g,
      proteinG: f.proteinG,
      carbsG: f.carbsG,
      fatG: f.fatG,
      fibreG: f.fibreG || 0,
      source: f.source || "NIN / IFCT",
      isCustom: f.isCustom,
    }))

    for (const item of [...MASTER_INDIAN_FOODS, ...dbMapped]) {
      const key = item.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
    return merged
  } catch (err) {
    console.warn("[AI Analyze] Could not load Prisma FoodItems, using bundled library:", err)
    return MASTER_INDIAN_FOODS
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : ""
  const textPrompt =
    typeof body.textPrompt === "string"
      ? body.textPrompt.trim()
      : typeof body.textDescription === "string"
        ? body.textDescription.trim()
        : ""
  const barcode = typeof body.barcode === "string" ? body.barcode.trim() : ""

  if (!imageUrl && !textPrompt && !barcode) {
    return NextResponse.json(
      { error: "Either a food image, barcode, or food description text is required" },
      { status: 400 }
    )
  }

  const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "").trim()
  const model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim()
  const foods = await loadMergedServerFoods()

  try {
    const result = await analyzeFoodWithCascade(
      { imageUrl, textPrompt, barcode },
      {
        apiKey,
        model,
        foods,
        isOnline: true,
      }
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 502 }
      )
    }

    if (result.requiresManualEntry && imageUrl && !apiKey) {
      return NextResponse.json(
        {
          error:
            "AI Vision analysis requires GOOGLE_AI_API_KEY. You can also type your food description above or scan a barcode.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze meal. Please try again." },
      { status: 500 }
    )
  }
}
