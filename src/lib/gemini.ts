import { z } from "zod"

export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest"
export const GEMINI_FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const

export interface GeminiTextPart {
  text: string
  thought?: boolean
}

export interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string
    data: string
  }
}

export type GeminiRequestPart = { text: string } | GeminiInlineDataPart

export interface GeminiGenerationConfig {
  temperature?: number
  maxOutputTokens?: number
  responseMimeType?: string
}

export interface GeminiAnalyzeResponseItem {
  foodName: string
  category: string
  estimatedPortionG: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  confidence: string
  notes: string
}

export interface GeminiAnalyzeResponse {
  items: GeminiAnalyzeResponseItem[]
  uncertainty: string
  requiresClarification?: boolean
  clarificationQuestion?: string | null
}

interface GeminiCandidate {
  content?: {
    parts?: Array<Partial<GeminiTextPart>>
  }
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[]
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export type GeminiCallResult =
  | {
      ok: true
      status: number
      data: GeminiApiResponse
      text: string
    }
  | {
      ok: false
      status: number
      errorMessage: string
    }

const FAILOVER_STATUS_CODES = new Set([404, 429, 500, 502, 503, 504])

/**
 * Returns an ordered, deduplicated list of Gemini models to try (requested model first).
 */
export function resolveGeminiModelChain(preferredModel?: string): string[] {
  const candidates = [
    preferredModel?.trim(),
    DEFAULT_GEMINI_MODEL,
    ...GEMINI_FALLBACK_MODELS,
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(candidates))
}

/**
 * Builds the Gemini v1beta generateContent endpoint URL for a given model.
 */
export function buildGeminiGenerateContentUrl(model?: string): string {
  const resolvedModel = model?.trim() || DEFAULT_GEMINI_MODEL
  return `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(resolvedModel)}:generateContent`
}

/**
 * Extracts MIME type and raw base64 payload from a data URL or base64 string.
 */
export function parseImageDataUrl(imageUrl: string): {
  mimeType: string
  data: string
} {
  const trimmed = imageUrl.trim()
  const match = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/i)
  if (match) {
    return {
      mimeType: match[1].toLowerCase(),
      data: match[2].trim(),
    }
  }
  return {
    mimeType: "image/jpeg",
    data: trimmed.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, ""),
  }
}

/**
 * Extracts non-thought text parts from a Gemini generateContent payload.
 */
export function extractGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const response = payload as GeminiApiResponse
  const parts = response.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null

  const text = parts
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim()

  return text || null
}

/**
 * Parses a JSON object returned in model text output, tolerating Markdown fences.
 */
export function parseGeminiJson<T>(rawText: string): T {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error("Model response did not contain valid JSON.")
    }
    return JSON.parse(match[0]) as T
  }
}

function extractGeminiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const err = (payload as GeminiApiResponse).error
  return typeof err?.message === "string" && err.message.trim()
    ? err.message.trim()
    : null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateGeminiContentSingle(options: {
  apiKey: string
  model: string
  parts: GeminiRequestPart[]
  generationConfig?: GeminiGenerationConfig
  timeoutMs: number
}): Promise<GeminiCallResult> {
  const url = buildGeminiGenerateContentUrl(options.model)
  const requestBody = JSON.stringify({
    contents: [{ parts: options.parts }],
    ...(options.generationConfig ? { generationConfig: options.generationConfig } : {}),
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": options.apiKey,
      },
      body: requestBody,
      signal: controller.signal,
    })

    let parsedBody: GeminiApiResponse | null = null
    try {
      parsedBody = (await response.json()) as GeminiApiResponse
    } catch {
      parsedBody = null
    }

    if (!response.ok) {
      const upstreamMessage = extractGeminiErrorMessage(parsedBody)
      return {
        ok: false,
        status: response.status,
        errorMessage:
          upstreamMessage || `Gemini API returned status ${response.status}.`,
      }
    }

    const text = extractGeminiText(parsedBody)
    if (!text || !parsedBody) {
      return {
        ok: false,
        status: 502,
        errorMessage: "No content returned from Gemini model.",
      }
    }

    return {
      ok: true,
      status: response.status,
      data: parsedBody,
      text,
    }
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError"
    return {
      ok: false,
      status: isAbort ? 504 : 502,
      errorMessage: isAbort
        ? "Gemini API request timed out."
        : err instanceof Error
          ? err.message
          : "Network error contacting Gemini API.",
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Calls the Gemini generateContent REST API with automatic model fallback on 429/503/404/network errors.
 */
export async function generateGeminiContent(options: {
  apiKey: string
  model?: string
  parts: GeminiRequestPart[]
  generationConfig?: GeminiGenerationConfig
  timeoutMs?: number
  maxRetries?: number
}): Promise<GeminiCallResult> {
  const apiKey = options.apiKey.trim()
  if (!apiKey) {
    return { ok: false, status: 401, errorMessage: "Missing Gemini API key." }
  }

  const models = resolveGeminiModelChain(options.model)
  const timeoutMs = options.timeoutMs ?? 20_000
  const maxRetries = options.maxRetries ?? 1
  let lastFailure: GeminiCallResult = {
    ok: false,
    status: 502,
    errorMessage: "Gemini API request failed.",
  }

  for (let pass = 0; pass <= maxRetries; pass++) {
    for (const modelName of models) {
      const result = await generateGeminiContentSingle({
        apiKey,
        model: modelName,
        parts: options.parts,
        generationConfig: options.generationConfig,
        timeoutMs,
      })

      if (result.ok) {
        return result
      }

      lastFailure = result

      if (!FAILOVER_STATUS_CODES.has(result.status)) {
        return result
      }
    }

    if (pass < maxRetries) {
      await delay(500 * (pass + 1))
    }
  }

  return lastFailure
}

/**
 * Builds the nutrition analysis prompt for natural language meal descriptions.
 */
export function buildFoodTextPrompt(textPrompt: string): string {
  return `You are an expert clinical and sports nutritionist. The user describes their meal: ${JSON.stringify(textPrompt)}.
Analyze all distinct food items in the text. For each item:
- foodName: clean name (e.g. "Roti / Chapati", "Dal Tadka", "Steamed White Rice", "Boiled Egg")
- category: one of "indian_grain", "indian_dal", "indian_dairy", "indian_sabzi", "indian_snack", "fruit", "vegetable", "protein", "dairy", "beverage", "other"
- estimatedPortionG: realistic estimated portion in grams based on quantities in text (e.g. 2 rotis = 80g, 1 bowl dal = 150g)
- servingUnit: "piece", "bowl", "cup", "plate", or "slice"
- calories: realistic kcal for this portion
- proteinG: realistic grams of protein (float)
- carbsG: realistic grams of carbs (float)
- fatG: realistic grams of fat (float)
- fibreG: realistic grams of dietary fibre (float)
- confidence: "high"
- notes: brief nutritional note

Respond ONLY with valid JSON:
{
  "items": [
    {
      "foodName": "...",
      "category": "...",
      "estimatedPortionG": 0,
      "servingUnit": "...",
      "calories": 0,
      "proteinG": 0,
      "carbsG": 0,
      "fatG": 0,
      "fibreG": 0,
      "confidence": "high",
      "notes": "..."
    }
  ],
  "uncertainty": "Nutrient values calculated by AI based on standard Indian & global nutritional references."
}`
}

/**
 * Builds the nutrition analysis prompt for plate/meal photos.
 */
export function buildFoodVisionPrompt(textHint?: string): string {
  const hintClause = textHint?.trim()
    ? `\nUser dish hint for additional context: ${JSON.stringify(textHint.trim())}.\n`
    : ""
  return `You are an expert nutritionist specializing in Indian and global cuisine. Analyze the food image and respond ONLY with valid JSON (no markdown formatting).
${hintClause}
For each distinct food item visible on the plate, identify:
- foodName: clear common name
- category: one of "indian_grain", "indian_dal", "indian_dairy", "indian_sabzi", "indian_snack", "fruit", "vegetable", "protein", "dairy", "beverage", "other"
- estimatedPortionG: estimated weight in grams
- servingUnit: "piece", "bowl", "cup", "glass", "plate", or "slice"
- calories: estimated integer kcal
- proteinG: estimated float grams of protein
- carbsG: estimated float grams of carbohydrates
- fatG: estimated float grams of total fat
- fibreG: estimated float grams of dietary fibre
- confidence: "low", "medium", or "high"
- notes: brief observation

Respond strictly in this JSON format:
{
  "items": [
    {
      "foodName": "...",
      "category": "...",
      "estimatedPortionG": 0,
      "servingUnit": "...",
      "calories": 0,
      "proteinG": 0,
      "carbsG": 0,
      "fatG": 0,
      "fibreG": 0,
      "confidence": "high",
      "notes": "..."
    }
  ],
  "uncertainty": "Nutrient estimates are visual approximations based on standard portion guidelines.",
  "requiresClarification": false,
  "clarificationQuestion": null
}`
}

const AnalyzedItemSchema = z.object({
  foodName: z.string().trim().min(1).default("Meal Item"),
  category: z.string().trim().default("other"),
  estimatedPortionG: z.coerce.number().finite().nonnegative().default(150),
  servingUnit: z.string().trim().default("serving"),
  calories: z.coerce.number().finite().nonnegative().default(0),
  proteinG: z.coerce.number().finite().nonnegative().default(0),
  carbsG: z.coerce.number().finite().nonnegative().default(0),
  fatG: z.coerce.number().finite().nonnegative().default(0),
  fibreG: z.coerce.number().finite().nonnegative().default(0),
  confidence: z.string().trim().default("medium"),
  notes: z.string().trim().default(""),
})

/**
 * Normalizes and validates raw model-returned food items, clamping invalid values safely.
 */
export function sanitizeAnalyzedItems(rawItems: unknown): GeminiAnalyzeResponseItem[] {
  if (!Array.isArray(rawItems)) return []
  const cleaned: GeminiAnalyzeResponseItem[] = []
  for (const raw of rawItems) {
    const parsed = AnalyzedItemSchema.safeParse(raw)
    if (!parsed.success) continue
    const item = parsed.data
    cleaned.push({
      foodName: item.foodName.slice(0, 120),
      category: item.category || "other",
      estimatedPortionG: Math.max(1, Math.round(item.estimatedPortionG)),
      servingUnit: item.servingUnit || "serving",
      calories: Math.round(item.calories),
      proteinG: Number(item.proteinG.toFixed(1)),
      carbsG: Number(item.carbsG.toFixed(1)),
      fatG: Number(item.fatG.toFixed(1)),
      fibreG: Number(item.fibreG.toFixed(1)),
      confidence: item.confidence || "medium",
      notes: item.notes.slice(0, 240),
    })
  }
  return cleaned
}

async function runAnalyzeWithModelFallback(options: {
  apiKey: string
  model?: string
  parts: GeminiRequestPart[]
  generationConfig: GeminiGenerationConfig
}): Promise<
  | { ok: true; data: GeminiAnalyzeResponse }
  | { ok: false; status: number; errorMessage: string }
> {
  const apiKey = options.apiKey.trim()
  if (!apiKey) {
    return { ok: false, status: 401, errorMessage: "Missing Gemini API key." }
  }

  const models = resolveGeminiModelChain(options.model)
  let lastError: { ok: false; status: number; errorMessage: string } = {
    ok: false,
    status: 502,
    errorMessage: "Gemini request failed.",
  }

  for (const modelName of models) {
    const result = await generateGeminiContentSingle({
      apiKey,
      model: modelName,
      parts: options.parts,
      generationConfig: options.generationConfig,
      timeoutMs: 22_000,
    })

    if (!result.ok) {
      lastError = result
      if (!FAILOVER_STATUS_CODES.has(result.status)) {
        return result
      }
      continue
    }

    try {
      const parsed = parseGeminiJson<GeminiAnalyzeResponse>(result.text)
      const items = sanitizeAnalyzedItems(parsed.items)
      if (items.length === 0) {
        lastError = {
          ok: false,
          status: 502,
          errorMessage: "Gemini response JSON did not include valid food items.",
        }
        continue
      }
      return {
        ok: true,
        data: {
          ...parsed,
          items,
        },
      }
    } catch (err) {
      lastError = {
        ok: false,
        status: 502,
        errorMessage:
          err instanceof Error ? err.message : "Failed to parse Gemini JSON response.",
      }
    }
  }

  return lastError
}

export async function analyzeFoodTextWithGemini(options: {
  apiKey: string
  model?: string
  textPrompt: string
}): Promise<
  | { ok: true; data: GeminiAnalyzeResponse }
  | { ok: false; status: number; errorMessage: string }
> {
  return runAnalyzeWithModelFallback({
    apiKey: options.apiKey,
    model: options.model,
    parts: [{ text: buildFoodTextPrompt(options.textPrompt) }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  })
}

export async function analyzeFoodImageWithGemini(options: {
  apiKey: string
  model?: string
  imageUrl: string
  textHint?: string
}): Promise<
  | { ok: true; data: GeminiAnalyzeResponse }
  | { ok: false; status: number; errorMessage: string }
> {
  const { mimeType, data } = parseImageDataUrl(options.imageUrl)
  if (!data) {
    return {
      ok: false,
      status: 400,
      errorMessage: "Image data is empty or invalid.",
    }
  }

  return runAnalyzeWithModelFallback({
    apiKey: options.apiKey,
    model: options.model,
    parts: [
      { text: buildFoodVisionPrompt(options.textHint) },
      { inlineData: { mimeType, data } },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  })
}
