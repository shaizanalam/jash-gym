import {
  MASTER_INDIAN_FOODS,
  analyzeFoodTextOffline,
  analyzeFoodTextTier1,
  type AnalyzedFoodResultItem,
  type MasterFoodItem,
} from "@/lib/food-library"
import {
  analyzeFoodImageWithGemini,
  analyzeFoodTextWithGemini,
  buildFoodTextPrompt,
  parseGeminiJson,
  sanitizeAnalyzedItems,
  type GeminiAnalyzeResponse,
} from "@/lib/gemini"
import { lookupBarcodeNutrition } from "@/lib/barcode-lookup"

export type CascadeTierId =
  | "tier1_db"
  | "tier1_barcode"
  | "tier1_barcode_cache"
  | "tier2_on_device"
  | "tier3_gemini"
  | "fallback"

export interface CascadeAnalyzePayload {
  imageUrl?: string
  textPrompt?: string
  textDescription?: string
  barcode?: string
}

export interface CascadeAnalyzeResponse {
  items: AnalyzedFoodResultItem[]
  uncertainty: string
  analysisTier: CascadeTierId
  requiresClarification?: boolean
  clarificationQuestion?: string | null
  requiresManualEntry?: boolean
  error?: string
  statusCode?: number
}

export interface CascadeHooks {
  apiKey?: string
  model?: string
  foods?: MasterFoodItem[]
  isOnline?: boolean
  onDeviceTextParser?: (prompt: string) => Promise<{ text: string; latencyMs: number } | null>
  onDeviceImageClassifier?: (
    imageUrl: string
  ) => Promise<{ labels: Array<{ label: string; confidence: number }>; latencyMs: number } | null>
}

function buildManualPlaceholdersForUnmatched(
  clauses: string[]
): AnalyzedFoodResultItem[] {
  return clauses.map((clause) => ({
    foodName: clause,
    category: "other",
    estimatedPortionG: 150,
    servingUnit: "serving",
    calories: 250,
    proteinG: 8.0,
    carbsG: 32.0,
    fatG: 9.0,
    fibreG: 2.5,
    confidence: "low",
    notes: "No exact offline match found; adjust macros before saving.",
  }))
}

async function tryOnDeviceTextTier2(
  prompt: string,
  parser?: CascadeHooks["onDeviceTextParser"]
): Promise<AnalyzedFoodResultItem[] | null> {
  if (!parser) return null
  try {
    const raw = await parser(buildFoodTextPrompt(prompt))
    if (!raw?.text) return null
    const parsed = parseGeminiJson<GeminiAnalyzeResponse>(raw.text)
    const items = sanitizeAnalyzedItems(parsed.items)
    return items.length > 0 ? items : null
  } catch (err) {
    console.warn("[Cascade] Tier 2 on-device LLM text parsing failed:", err)
    return null
  }
}

/**
 * Executes NutriMentor's 3-Tier Cascade:
 * Tier 1: Local IFCT/USDA Food Database + Barcode / Open Food Facts ($0, instant)
 * Tier 2: On-Device MediaPipe GenAI / TFLite Classifier ($0, offline)
 * Tier 3: Gemini Cloud Vision / Text Fallback (highest accuracy for complex plates)
 */
export async function analyzeFoodWithCascade(
  payload: CascadeAnalyzePayload,
  hooks: CascadeHooks = {}
): Promise<CascadeAnalyzeResponse> {
  const foods = hooks.foods && hooks.foods.length > 0 ? hooks.foods : MASTER_INDIAN_FOODS
  const apiKey = (hooks.apiKey || "").trim()
  const isOnline = hooks.isOnline ?? true
  const textPrompt = (payload.textPrompt || payload.textDescription || "").trim()
  const imageUrl = (payload.imageUrl || "").trim()
  const barcode = (payload.barcode || "").trim()

  // -------------------------------------------------------------
  // Tier 1B: Packaged Food Barcode Lookup
  // -------------------------------------------------------------
  if (barcode) {
    const lookup = await lookupBarcodeNutrition(barcode)
    if (lookup.found && lookup.item) {
      return {
        items: [lookup.item],
        analysisTier:
          lookup.source === "local_cache" ? "tier1_barcode_cache" : "tier1_barcode",
        uncertainty:
          "Packaged food nutrition loaded from Open Food Facts / local barcode cache.",
        requiresClarification: false,
        clarificationQuestion: null,
      }
    }
    return {
      items: [],
      analysisTier: "fallback",
      uncertainty: lookup.error || "Barcode product not found.",
      error: lookup.error || "Barcode product not found.",
      statusCode: 404,
    }
  }

  // -------------------------------------------------------------
  // Text Mode: Tier 1 Local DB -> Tier 2 On-Device LLM -> Tier 3 Gemini Cloud
  // -------------------------------------------------------------
  if (textPrompt && !imageUrl) {
    const tier1 = analyzeFoodTextTier1(textPrompt, foods)

    // Full Tier 1 resolution (instant, $0, 0 cloud calls)
    if (tier1.items.length > 0 && tier1.unmatchedClauses.length === 0) {
      return {
        items: tier1.items,
        uncertainty: tier1.uncertainty,
        analysisTier: "tier1_db",
        requiresClarification: false,
        clarificationQuestion: null,
      }
    }

    const residualPrompt =
      tier1.items.length > 0 && tier1.unmatchedClauses.length > 0
        ? tier1.unmatchedClauses.join(", ")
        : textPrompt

    // Tier 2: On-Device MediaPipe LLM (only for unresolved clauses)
    const tier2Items = await tryOnDeviceTextTier2(residualPrompt, hooks.onDeviceTextParser)
    if (tier2Items && tier2Items.length > 0) {
      return {
        items: [...tier1.items, ...tier2Items],
        analysisTier: "tier2_on_device",
        uncertainty:
          tier1.items.length > 0
            ? "Combined Tier 1 IFCT/USDA database + Tier 2 on-device AI estimates."
            : "Parsed offline on-device using local MediaPipe LLM.",
        requiresClarification: false,
        clarificationQuestion: null,
      }
    }

    // Tier 3: Gemini Cloud Text Fallback (only when online + key + unresolved items)
    if (apiKey && isOnline) {
      const tier3 = await analyzeFoodTextWithGemini({
        apiKey,
        model: hooks.model,
        textPrompt: residualPrompt,
      })

      if (tier3.ok && tier3.data.items.length > 0) {
        return {
          items: [...tier1.items, ...tier3.data.items],
          analysisTier: "tier3_gemini",
          uncertainty:
            tier1.items.length > 0
              ? "Combined Tier 1 IFCT/USDA matches + Tier 3 Gemini estimates."
              : tier3.data.uncertainty,
          requiresClarification: false,
          clarificationQuestion: null,
        }
      }
    }

    // Partial Tier 1 fallback if some clauses matched cleanly
    if (tier1.items.length > 0) {
      return {
        items: [
          ...tier1.items,
          ...buildManualPlaceholdersForUnmatched(tier1.unmatchedClauses),
        ],
        analysisTier: "tier1_db",
        uncertainty:
          "Some items matched the local food library; please review the remaining estimated items.",
        requiresClarification: false,
        clarificationQuestion: null,
      }
    }

    const offline = analyzeFoodTextOffline(textPrompt, foods)
    return {
      ...offline,
      analysisTier: "fallback",
    }
  }

  // -------------------------------------------------------------
  // Vision Mode: Tier 2 TFLite Food Classifier -> Tier 3 Gemini Vision
  // -------------------------------------------------------------
  if (imageUrl) {
    let visionLabelHint = textPrompt

    if (hooks.onDeviceImageClassifier) {
      const classified = await hooks.onDeviceImageClassifier(imageUrl)
      if (classified && classified.labels.length > 0) {
        const usableLabels = classified.labels.filter((l) => l.confidence >= 0.4)
        const topLabel = usableLabels[0]

        if (usableLabels.length > 0 && !visionLabelHint) {
          visionLabelHint = usableLabels.map((l) => l.label).join(", ")
        }

        // High-confidence single-dish match or offline fallback via Tier 1 macros
        if (topLabel && (topLabel.confidence >= 0.78 || !apiKey || !isOnline)) {
          const labelQuery = usableLabels
            .filter((l) => l.confidence >= 0.55)
            .slice(0, 3)
            .map((l) => l.label)
            .join(", ")

          if (labelQuery) {
            const labelTier1 = analyzeFoodTextTier1(labelQuery, foods)
            if (labelTier1.items.length > 0) {
              return {
                items: labelTier1.items.map((item) => ({
                  ...item,
                  confidence: topLabel.confidence >= 0.78 ? "high" : "medium",
                  notes: `Tier 2 on-device classifier (${Math.round(topLabel.confidence * 100)}%) + Tier 1 macros.`,
                })),
                analysisTier: "tier2_on_device",
                uncertainty:
                  "Identified on-device via local vision classifier and matched to IFCT/USDA macros.",
                requiresClarification: false,
                clarificationQuestion: null,
              }
            }
          }
        }
      }
    }

    if (apiKey && isOnline) {
      const visionRes = await analyzeFoodImageWithGemini({
        apiKey,
        model: hooks.model,
        imageUrl,
        textHint: visionLabelHint || undefined,
      })

      if (visionRes.ok) {
        return {
          items: visionRes.data.items,
          uncertainty: visionRes.data.uncertainty,
          requiresClarification: visionRes.data.requiresClarification,
          clarificationQuestion: visionRes.data.clarificationQuestion,
          analysisTier: "tier3_gemini",
        }
      }

      if (textPrompt) {
        const textFallback = analyzeFoodTextTier1(textPrompt, foods)
        if (textFallback.items.length > 0) {
          return {
            items: textFallback.items,
            uncertainty: textFallback.uncertainty,
            analysisTier: "tier1_db",
          }
        }
      }

      return {
        items: [],
        analysisTier: "fallback",
        uncertainty: visionRes.errorMessage,
        error:
          visionRes.status === 503 || visionRes.status === 429
            ? `AI Vision service is temporarily busy (${visionRes.status}). Please retry or add a dish description below.`
            : `AI Vision analysis failed (${visionRes.status}): ${visionRes.errorMessage}`,
        statusCode:
          visionRes.status === 400
            ? 400
            : visionRes.status === 429 || visionRes.status === 503 || visionRes.status === 504
              ? 503
              : 502,
      }
    }

    if (textPrompt) {
      const offline = analyzeFoodTextOffline(textPrompt, foods)
      return {
        ...offline,
        analysisTier: "tier1_db",
      }
    }

    return {
      items: [],
      requiresManualEntry: true,
      analysisTier: "fallback",
      uncertainty:
      apiKey && !isOnline
      ? "Device appears offline: reconnect to the internet for Gemini Vision, type a dish description below, or configure a Tier 2 offline model in Settings."
      : "Offline / no vision API key configured: add your meal items manually below, type a dish description, or configure Tier 2 / Gemini in Settings.",
      statusCode: 503,
    }
}

return {
  items: [],
  analysisTier: "fallback",
  uncertainty: "Either a food image, barcode, or food description text is required.",
  error: "Either a food image, barcode, or food description text is required",
  statusCode: 400,
}
}
