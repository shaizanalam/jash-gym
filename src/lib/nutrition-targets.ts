export const DEFAULT_NUTRITION_TARGETS = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
  fibre: 30,
} as const

export interface GuidanceRecord {
  dailyCalorieRef?: number | null
  dailyProteinRef?: number | null
  dailyCarbsRef?: number | null
  dailyFatRef?: number | null
  dailyFibreRef?: number | null
  sourceNotes?: string | null
  enteredByProfessional?: boolean
}

export interface ResolvedNutritionTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
  hasCustomTargets: boolean
  sourceNotes: string | null
}

/**
 * Resolves a user's daily nutrition targets from saved guidance/targets with sensible defaults.
 */
export function resolveNutritionTargets(
  guidance?: GuidanceRecord | null
): ResolvedNutritionTargets {
  const hasCal = typeof guidance?.dailyCalorieRef === "number" && guidance.dailyCalorieRef > 0
  const hasProt = typeof guidance?.dailyProteinRef === "number" && guidance.dailyProteinRef > 0
  const hasCarbs = typeof guidance?.dailyCarbsRef === "number" && guidance.dailyCarbsRef >= 0
  const hasFat = typeof guidance?.dailyFatRef === "number" && guidance.dailyFatRef > 0
  const hasFibre = typeof guidance?.dailyFibreRef === "number" && guidance.dailyFibreRef >= 0

  return {
    calories: hasCal ? guidance!.dailyCalorieRef! : DEFAULT_NUTRITION_TARGETS.calories,
    protein: hasProt ? guidance!.dailyProteinRef! : DEFAULT_NUTRITION_TARGETS.protein,
    carbs: hasCarbs ? guidance!.dailyCarbsRef! : DEFAULT_NUTRITION_TARGETS.carbs,
    fat: hasFat ? guidance!.dailyFatRef! : DEFAULT_NUTRITION_TARGETS.fat,
    fibre: hasFibre ? guidance!.dailyFibreRef! : DEFAULT_NUTRITION_TARGETS.fibre,
    hasCustomTargets: hasCal || hasProt || hasCarbs || hasFat || hasFibre,
    sourceNotes: guidance?.sourceNotes || null,
  }
}

export type MacroPresetId = "balanced" | "high_protein" | "low_carb"

const MACRO_PRESET_RATIOS: Record<
  MacroPresetId,
  { proteinPct: number; carbsPct: number; fatPct: number }
> = {
  balanced: { proteinPct: 0.25, carbsPct: 0.45, fatPct: 0.3 },
  high_protein: { proteinPct: 0.32, carbsPct: 0.43, fatPct: 0.25 },
  low_carb: { proteinPct: 0.3, carbsPct: 0.25, fatPct: 0.45 },
}

/**
 * Calculates daily macro gram targets (protein, carbs, fat, fibre) from a calorie target.
 */
export function calculateMacroSplitFromCalories(
  calories: number,
  preset: MacroPresetId = "balanced"
): { protein: number; carbs: number; fat: number; fibre: number } {
  const safeCal = Math.max(500, Math.round(calories))
  const ratios = MACRO_PRESET_RATIOS[preset]

  return {
    protein: Math.round((safeCal * ratios.proteinPct) / 4),
    carbs: Math.round((safeCal * ratios.carbsPct) / 4),
    fat: Math.round((safeCal * ratios.fatPct) / 9),
    fibre: Math.max(20, Math.round((safeCal / 1000) * 14)),
  }
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
}

const GOAL_CALORIE_ADJUSTMENTS: Record<string, number> = {
  fat_loss: -400,
  lean_recomp: -150,
  maintain: 0,
  muscle_gain: 300,
}

/**
 * Estimates daily calorie and macro targets using Mifflin-St Jeor BMR, activity level, and goal.
 * Returns null if age, weightKg, or heightCm are missing or out of reasonable bounds.
 */
export function estimateTargetsFromProfile(params: {
  age?: number | null
  gender?: string | null
  weightKg?: number | null
  heightCm?: number | null
  activityLevel?: string | null
  goal?: string | null
}): {
  tdee: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
} | null {
  const { age, gender, weightKg, heightCm, activityLevel, goal } = params

  if (
    typeof age !== "number" ||
    !Number.isFinite(age) ||
    age < 10 ||
    age > 120 ||
    typeof weightKg !== "number" ||
    !Number.isFinite(weightKg) ||
    weightKg < 20 ||
    weightKg > 400 ||
    typeof heightCm !== "number" ||
    !Number.isFinite(heightCm) ||
    heightCm < 80 ||
    heightCm > 260
  ) {
    return null
  }

  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel || "moderately_active"] ?? 1.55
  const tdee = Math.round(bmr * multiplier)

  const goalAdjustment = GOAL_CALORIE_ADJUSTMENTS[goal || "maintain"] ?? 0
  const rawCalories = Math.max(1200, tdee + goalAdjustment)
  const calories = Math.round(rawCalories / 10) * 10

  const proteinPerKg =
    goal === "muscle_gain" || goal === "fat_loss" || goal === "lean_recomp" ? 1.8 : 1.5
  const maxProteinFromCal = Math.round((calories * 0.4) / 4)
  const protein = Math.min(maxProteinFromCal, Math.max(45, Math.round(weightKg * proteinPerKg)))
  const fat = Math.max(30, Math.round((calories * 0.27) / 9))
  const remainingCarbsCal = Math.max(200, calories - protein * 4 - fat * 9)
  const carbs = Math.round(remainingCarbsCal / 4)
  const fibre = Math.max(22, Math.round((calories / 1000) * 14))

  return { tdee, calories, protein, carbs, fat, fibre }
}

/**
 * Computes kcal contribution and percentage breakdown from protein, carbs, and fat grams.
 */
export function calculateMacroCalories(macros: {
  protein: number
  carbs: number
  fat: number
}) {
  const proteinCal = Math.max(0, macros.protein) * 4
  const carbsCal = Math.max(0, macros.carbs) * 4
  const fatCal = Math.max(0, macros.fat) * 9
  const totalMacroCal = Math.round(proteinCal + carbsCal + fatCal)
  const denom = totalMacroCal || 1

  return {
    proteinCal: Math.round(proteinCal),
    carbsCal: Math.round(carbsCal),
    fatCal: Math.round(fatCal),
    totalMacroCal,
    proteinPct: Math.round((proteinCal / denom) * 100),
    carbsPct: Math.round((carbsCal / denom) * 100),
    fatPct: Math.round((fatCal / denom) * 100),
  }
}
