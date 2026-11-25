import type { AnalyzedFoodResultItem } from "@/lib/food-library"

export interface BarcodeLookupResult {
  found: boolean
  barcode: string
  productName?: string
  brand?: string
  item?: AnalyzedFoodResultItem
  source: "local_cache" | "open_food_facts" | "not_found"
  error?: string
}

interface OpenFoodFactsNutriments {
  "energy-kcal_100g"?: number
  "energy-kcal_serving"?: number
  energy_100g?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
  fiber_100g?: number
}

interface OpenFoodFactsResponse {
  status?: number
  code?: string
  product?: {
    product_name?: string
    product_name_en?: string
    generic_name?: string
    brands?: string
    serving_size?: string
    serving_quantity?: number | string
    nutriments?: OpenFoodFactsNutriments
    categories_tags?: string[]
  }
}

const BARCODE_CACHE_KEY = "nutrimentor_barcode_cache_v1"
const memoryCache = new Map<string, AnalyzedFoodResultItem>()

export function normalizeBarcode(raw: string): string {
  return raw.replace(/[^0-9]/g, "").trim()
}

export function isValidBarcode(code: string): boolean {
  return /^\d{6,14}$/.test(code)
}

function readCachedBarcode(code: string): AnalyzedFoodResultItem | null {
  const memHit = memoryCache.get(code)
  if (memHit) return memHit

  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(BARCODE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, AnalyzedFoodResultItem>
    const hit = parsed[code]
    if (hit) {
      memoryCache.set(code, hit)
      return hit
    }
  } catch {
    // Ignore storage read issues
  }
  return null
}

function writeCachedBarcode(code: string, item: AnalyzedFoodResultItem) {
  memoryCache.set(code, item)
  if (typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(BARCODE_CACHE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, AnalyzedFoodResultItem>) : {}
    // Cap local cache at 200 items to keep localStorage fast
    const keys = Object.keys(parsed)
    if (keys.length >= 200) {
      delete parsed[keys[0]]
    }
    parsed[code] = item
    window.localStorage.setItem(BARCODE_CACHE_KEY, JSON.stringify(parsed))
  } catch {
    // Ignore storage quota errors
  }
}

function mapCategoriesTag(tags?: string[]): string {
  if (!Array.isArray(tags) || tags.length === 0) return "other"
  const joined = tags.join(" ").toLowerCase()
  if (joined.includes("milk") || joined.includes("yogurt") || joined.includes("dairy") || joined.includes("paneer")) {
    return "dairy"
  }
  if (joined.includes("beverage") || joined.includes("drink") || joined.includes("juice") || joined.includes("tea")) {
    return "beverage"
  }
  if (joined.includes("snack") || joined.includes("biscuit") || joined.includes("cookie") || joined.includes("chips")) {
    return "indian_snack"
  }
  if (joined.includes("protein") || joined.includes("meat") || joined.includes("egg") || joined.includes("fish")) {
    return "protein"
  }
  if (joined.includes("fruit")) return "fruit"
  if (joined.includes("vegetable")) return "vegetable"
  return "other"
}

function parseServingQuantityG(servingQty?: number | string, servingSizeText?: string): number {
  const numeric = typeof servingQty === "number" ? servingQty : Number(servingQty)
  if (Number.isFinite(numeric) && numeric > 0 && numeric <= 2000) {
    return Math.round(numeric)
  }
  if (servingSizeText) {
    const match = servingSizeText.match(/(\d+(?:\.\d+)?)\s*(g|gm|grams?|ml)/i)
    if (match) {
      const val = Number(match[1])
      if (Number.isFinite(val) && val > 0 && val <= 2000) {
        return Math.round(val)
      }
    }
  }
  return 100
}

function toFinite(val: unknown): number {
  const num = typeof val === "number" ? val : Number(val)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

/**
 * Looks up a packaged food barcode via local cache first, then Open Food Facts v2 API.
 */
export async function lookupBarcodeNutrition(rawCode: string): Promise<BarcodeLookupResult> {
  const code = normalizeBarcode(rawCode)
  if (!isValidBarcode(code)) {
    return {
      found: false,
      barcode: code,
      source: "not_found",
      error: "Please enter or scan a valid 6–14 digit barcode (EAN-8 / UPC / EAN-13).",
    }
  }

  const cached = readCachedBarcode(code)
  if (cached) {
    return {
      found: true,
      barcode: code,
      productName: cached.foodName,
      item: cached,
      source: "local_cache",
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_en,generic_name,brands,serving_size,serving_quantity,nutriments,categories_tags`
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NutriMentor/1.3 (nutrition-tracker)",
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      return {
        found: false,
        barcode: code,
        source: "not_found",
        error: `Open Food Facts responded with status ${res.status}.`,
      }
    }

    const payload = (await res.json()) as OpenFoodFactsResponse
    if (payload.status !== 1 || !payload.product) {
      return {
        found: false,
        barcode: code,
        source: "not_found",
        error: `No packaged product found for barcode ${code}.`,
      }
    }

    const prod = payload.product
    const nutriments = prod.nutriments || {}
    const portionG = parseServingQuantityG(prod.serving_quantity, prod.serving_size)
    const scale = portionG / 100

    let kcalPer100 = toFinite(nutriments["energy-kcal_100g"])
    if (kcalPer100 === 0 && toFinite(nutriments.energy_100g) > 0) {
      // Open Food Facts energy_100g is in kJ when energy-kcal_100g is absent
      kcalPer100 = toFinite(nutriments.energy_100g) / 4.184
    }

    const proteinPer100 = toFinite(nutriments.proteins_100g)
    const carbsPer100 = toFinite(nutriments.carbohydrates_100g)
    const fatPer100 = toFinite(nutriments.fat_100g)
    const fibrePer100 = toFinite(nutriments.fiber_100g)

    const baseName =
      prod.product_name_en?.trim() ||
      prod.product_name?.trim() ||
      prod.generic_name?.trim() ||
      `Packaged Item (${code})`
    const brand = prod.brands?.split(",")[0]?.trim()
    const displayName =
      brand && !baseName.toLowerCase().includes(brand.toLowerCase())
        ? `${brand} ${baseName}`
        : baseName

    const item: AnalyzedFoodResultItem = {
      foodName: displayName,
      category: mapCategoriesTag(prod.categories_tags),
      estimatedPortionG: portionG,
      servingUnit: prod.serving_size?.trim() || "serving",
      calories: Math.round(kcalPer100 * scale),
      proteinG: Number((proteinPer100 * scale).toFixed(1)),
      carbsG: Number((carbsPer100 * scale).toFixed(1)),
      fatG: Number((fatPer100 * scale).toFixed(1)),
      fibreG: Number((fibrePer100 * scale).toFixed(1)),
      confidence: "high",
      notes: `Open Food Facts • Barcode ${code}${prod.serving_size ? ` (${prod.serving_size})` : ""}`,
    }

    writeCachedBarcode(code, item)

    return {
      found: true,
      barcode: code,
      productName: displayName,
      brand,
      item,
      source: "open_food_facts",
    }
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      found: false,
      barcode: code,
      source: "not_found",
      error: isAbort
        ? "Barcode lookup timed out. Check your internet connection or enter details manually."
        : "Could not reach Open Food Facts. You can still enter items manually.",
    }
  } finally {
    clearTimeout(timer)
  }
}
