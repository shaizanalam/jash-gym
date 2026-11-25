import indianFoodsData from "@/data/indian-foods.json"

/**
 * Verified Indian & global master nutrition reference dictionary (NIN / IFCT 2017 / USDA per 100g).
 * Shared by server seed/fallback and on-device Capacitor offline estimation.
 */
export interface MasterFoodItem {
  name: string
  alternativeNames: string[]
  category: string
  servingSizeG: number
  servingUnit: string
  caloriesPer100g: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  source: string
  isCustom: boolean
}

export const MASTER_INDIAN_FOODS: MasterFoodItem[] =
  indianFoodsData as MasterFoodItem[]

export interface AnalyzedFoodResultItem {
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

export interface Tier1AnalysisResult {
  items: AnalyzedFoodResultItem[]
  matchedClauses: string[]
  unmatchedClauses: string[]
  matchCoverage: number
  uncertainty: string
  requiresClarification: boolean
  clarificationQuestion: null
}

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
  double: 2,
}

const SIZE_MODIFIERS: Record<string, number> = {
  mini: 0.65,
  small: 0.75,
  medium: 1,
  regular: 1,
  standard: 1,
  large: 1.35,
  big: 1.35,
  full: 1.25,
}

const HOUSEHOLD_UNIT_GRAMS: Record<string, number> = {
  katori: 150,
  bowl: 150,
  cup: 180,
  glass: 250,
  plate: 220,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  chammach: 5,
  scoop: 30,
}

const FILLER_PREFIX_RE =
  /^(?:i\s+(?:just\s+)?(?:ate|had|consumed|took|drank)|ate|had|having|eating|for\s+(?:breakfast|lunch|dinner|snacks?)|some|just|about|approx(?:imately)?|around)\s+/i

const CLAUSE_SPLIT_RE =
  /(?:\s*[,;\n+&]\s*|\s+\band\b\s+|\s+\bwith\b\s+|\s+\baur\b\s+|\s+\bplus\b\s+)/i

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, idx) => idx)
  const curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      )
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j]
    }
  }
  return prev[b.length]
}

interface ParsedPortionClause {
  rawClause: string
  foodQuery: string
  explicitGrams: number | null
  quantity: number
  sizeMultiplier: number
  unit: string | null
}

function parseClausePortion(rawClause: string): ParsedPortionClause {
  let working = rawClause.trim()
  while (FILLER_PREFIX_RE.test(working)) {
    working = working.replace(FILLER_PREFIX_RE, "").trim()
  }

  let explicitGrams: number | null = null
  const weightMatch = working.match(
    /(?:^|\s)(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|gms|grams?|ml|l|liters?|litres?)\b/i
  )
  if (weightMatch) {
    const numeric = Number(weightMatch[1])
    const unit = weightMatch[2].toLowerCase()
    if (Number.isFinite(numeric) && numeric > 0) {
      explicitGrams =
        unit.startsWith("k") || unit === "l" || unit.startsWith("liter") || unit.startsWith("litre")
          ? Math.round(numeric * 1000)
          : Math.round(numeric)
    }
    working = working.replace(weightMatch[0], " ").replace(/\s+/g, " ").trim()
  }

  let quantity = 1
  const fractionMatch = working.match(/^(\d+)\s*\/\s*(\d+)\b/)
  if (fractionMatch) {
    const num = Number(fractionMatch[1])
    const den = Number(fractionMatch[2])
    if (den > 0) quantity = num / den
    working = working.slice(fractionMatch[0].length).trim()
  } else {
    const numMatch = working.match(/^(\d+(?:\.\d+)?)\s*(?:x\b)?/i)
    if (numMatch) {
      const parsed = Number(numMatch[1])
      if (Number.isFinite(parsed) && parsed > 0) {
        quantity = parsed
      }
      working = working.slice(numMatch[0].length).trim()
    } else {
      const firstWord = working.split(/\s+/)[0]?.toLowerCase()
      if (firstWord && WORD_NUMBERS[firstWord] !== undefined) {
        quantity = WORD_NUMBERS[firstWord]
        working = working.slice(firstWord.length).trim()
      }
    }
  }

  let sizeMultiplier = 1
  const tokens = working.split(/\s+/).filter(Boolean)
  const remainingTokens: string[] = []
  let unit: string | null = null

  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (SIZE_MODIFIERS[lower] !== undefined) {
      sizeMultiplier = SIZE_MODIFIERS[lower]
      continue
    }
    if (
      !unit &&
      /^(?:pieces?|pcs?|pc|katoris?|bowls?|cups?|glasses?|plates?|slices?|tbsps?|tablespoons?|tsps?|teaspoons?|chammach|scoops?|servings?)$/i.test(
        lower
      )
    ) {
      unit = lower.replace(/es$|s$/, "")
      if (lower === "glasses") unit = "glass"
      continue
    }
    if (lower === "of" && remainingTokens.length === 0) {
      continue
    }
    remainingTokens.push(token)
  }

  return {
    rawClause,
    foodQuery: normalizeText(remainingTokens.join(" ")),
    explicitGrams,
    quantity,
    sizeMultiplier,
    unit,
  }
}

function tokenSimilarity(queryTokens: string[], candidateTokens: string[]): number {
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0

  let matchedWeight = 0
  for (const qt of queryTokens) {
    let bestTokenScore = 0
    for (const ct of candidateTokens) {
      if (qt === ct) {
        bestTokenScore = 1
        break
      }
      if (qt.length >= 4 && ct.startsWith(qt)) {
        bestTokenScore = Math.max(bestTokenScore, 0.9)
      } else if (qt.length >= 4 && ct.length >= 4) {
        const maxDist = qt.length >= 7 ? 2 : 1
        const dist = levenshtein(qt, ct)
        if (dist <= maxDist) {
          bestTokenScore = Math.max(bestTokenScore, 1 - dist * 0.18)
        }
      }
    }
    matchedWeight += bestTokenScore
  }

  const recall = matchedWeight / queryTokens.length
  const precision = matchedWeight / Math.max(queryTokens.length, candidateTokens.length)
  return recall * 0.72 + precision * 0.28
}

function scoreFoodMatch(foodQuery: string, food: MasterFoodItem): number {
  if (!foodQuery || foodQuery.length < 2) return 0
  const queryTokens = foodQuery.split(" ").filter((t) => t.length >= 2)
  if (queryTokens.length === 0) return 0

  const isPreparedDish = !food.name.endsWith("(IFCT)")
  const preparedBoost = isPreparedDish ? 0.08 : 0

  const candidates = [
    food.name.replace(/\s*\(IFCT\)$/i, ""),
    ...food.alternativeNames,
  ]

  let bestScore = 0
  for (const rawCandidate of candidates) {
    const candidate = normalizeText(rawCandidate)
    if (!candidate) continue

    if (candidate === foodQuery) {
      bestScore = Math.max(bestScore, 1.0 + preparedBoost)
      continue
    }

    if (candidate.includes(foodQuery) && foodQuery.length >= 4) {
      bestScore = Math.max(bestScore, 0.88 + preparedBoost)
    } else if (foodQuery.includes(candidate) && candidate.length >= 4) {
      bestScore = Math.max(bestScore, 0.86 + preparedBoost)
    }

    const candidateTokens = candidate.split(" ").filter((t) => t.length >= 2)
    const sim = tokenSimilarity(queryTokens, candidateTokens)
    if (sim > 0) {
      bestScore = Math.max(bestScore, sim + preparedBoost * (sim >= 0.7 ? 1 : 0.25))
    }
  }

  return bestScore
}

function findBestFoodMatch(
  foodQuery: string,
  foods: MasterFoodItem[]
): { food: MasterFoodItem; score: number } | null {
  let best: { food: MasterFoodItem; score: number } | null = null

  for (const food of foods) {
    const score = scoreFoodMatch(foodQuery, food)
    if (score >= 0.68 && (!best || score > best.score)) {
      best = { food, score }
    }
  }

  return best
}

function computePortionGrams(
  parsed: ParsedPortionClause,
  food: MasterFoodItem
): { portionG: number; servingLabel: string } {
  if (parsed.explicitGrams !== null) {
    return {
      portionG: Math.max(1, parsed.explicitGrams),
      servingLabel: "g",
    }
  }

  const baseServingG =
    parsed.unit && HOUSEHOLD_UNIT_GRAMS[parsed.unit]
      ? parsed.unit === "bowl" || parsed.unit === "plate" || parsed.unit === "cup"
        ? food.servingUnit === parsed.unit
          ? food.servingSizeG
          : HOUSEHOLD_UNIT_GRAMS[parsed.unit]
        : HOUSEHOLD_UNIT_GRAMS[parsed.unit]
      : food.servingSizeG || 100

  const portionG = Math.max(
    5,
    Math.round(baseServingG * parsed.quantity * parsed.sizeMultiplier)
  )
  return {
    portionG,
    servingLabel: parsed.unit || food.servingUnit || "serving",
  }
}

/**
 * Tier 1 deterministic clause-splitting + fuzzy portion parser over the expanded IFCT/USDA food library.
 */
export function analyzeFoodTextTier1(
  prompt: string,
  foods: MasterFoodItem[] = MASTER_INDIAN_FOODS
): Tier1AnalysisResult {
  const rawClauses = prompt
    .split(CLAUSE_SPLIT_RE)
    .map((c) => c.trim())
    .filter((c) => c.length >= 2)

  const clauses = rawClauses.length > 0 ? rawClauses : [prompt.trim()].filter(Boolean)
  const matchedItems: AnalyzedFoodResultItem[] = []
  const matchedClauses: string[] = []
  const unmatchedClauses: string[] = []

  for (const clause of clauses) {
    const parsed = parseClausePortion(clause)
    const match = findBestFoodMatch(parsed.foodQuery, foods)

    if (!match) {
      unmatchedClauses.push(clause)
      continue
    }

    const { food, score } = match
    const { portionG, servingLabel } = computePortionGrams(parsed, food)
    const scale = portionG / 100
    const cleanName = food.name.replace(/\s*\(IFCT\)$/i, "")

    const prefixLabel =
      parsed.explicitGrams !== null
        ? `${portionG}g `
        : parsed.quantity !== 1
          ? `${parsed.quantity}x `
          : ""

    matchedItems.push({
      foodName: `${prefixLabel}${cleanName}`,
      category: food.category,
      estimatedPortionG: portionG,
      servingUnit: servingLabel,
      calories: Math.round(food.caloriesPer100g * scale),
      proteinG: Number((food.proteinG * scale).toFixed(1)),
      carbsG: Number((food.carbsG * scale).toFixed(1)),
      fatG: Number((food.fatG * scale).toFixed(1)),
      fibreG: Number(((food.fibreG || 0) * scale).toFixed(1)),
      confidence: score >= 0.85 ? "high" : "medium",
      notes: `Tier 1 ${food.source} match (${portionG}g).`,
    })
    matchedClauses.push(clause)
  }

  const totalClauses = clauses.length || 1
  const matchCoverage = matchedClauses.length / totalClauses

  return {
    items: matchedItems,
    matchedClauses,
    unmatchedClauses,
    matchCoverage,
    uncertainty:
      "Nutrient values calculated locally from verified IFCT 2017 / NIN / USDA references.",
    requiresClarification: false,
    clarificationQuestion: null,
  }
}

/**
 * Matches free-text meal descriptions against the verified offline food library,
 * returning an editable meal placeholder if no items matched.
 */
export function analyzeFoodTextOffline(
  prompt: string,
  foods: MasterFoodItem[] = MASTER_INDIAN_FOODS
): {
  items: AnalyzedFoodResultItem[]
  uncertainty: string
  requiresClarification: boolean
  clarificationQuestion: null
} {
  const tier1 = analyzeFoodTextTier1(prompt, foods)

  if (tier1.items.length > 0) {
    return {
      items: tier1.items,
      uncertainty: tier1.uncertainty,
      requiresClarification: false,
      clarificationQuestion: null,
    }
  }

  return {
    items: [
      {
        foodName: prompt.trim() || "Meal Item",
        category: "other",
        estimatedPortionG: 180,
        servingUnit: "plate",
        calories: 320,
        proteinG: 12.0,
        carbsG: 42.0,
        fatG: 11.0,
        fibreG: 3.5,
        confidence: "low",
        notes: "General meal estimate. Adjust macros if needed before saving.",
      },
    ],
    uncertainty: "No exact local match found; adjust estimated nutrition before saving.",
    requiresClarification: false,
    clarificationQuestion: null,
  }
}
