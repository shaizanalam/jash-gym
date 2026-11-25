"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppSession } from "@/components/providers"
import { apiFetchProfile, apiSaveProfile } from "@/lib/client-api"
import {
  Button,
  Input,
  Skeleton,
  Switch,
  Textarea,
  cn,
} from "@/components/ui/index"
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  DIETARY_PREFERENCES,
  GENDERS,
} from "@/lib/constants"
import {
  DEFAULT_NUTRITION_TARGETS,
  calculateMacroCalories,
  calculateMacroSplitFromCalories,
  estimateTargetsFromProfile,
  type MacroPresetId,
} from "@/lib/nutrition-targets"

function formatJsonArray(val: unknown): string {
  if (!val) return ""
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val
    return Array.isArray(parsed) ? parsed.join(", ") : String(parsed)
  } catch {
    return String(val)
  }
}

interface TargetsFormState {
  dailyCalorieRef: string
  dailyProteinRef: string
  dailyCarbsRef: string
  dailyFatRef: string
  dailyFibreRef: string
  sourceNotes: string
  enteredByProfessional: boolean
}

interface ProfileFormState {
  name: string
  age: string
  gender: string
  weightKg: string
  heightCm: string
  goal: string
  dietaryPreference: string
  allergies: string
  restrictions: string
  activityLevel: string
}

const EMPTY_TARGETS_FORM: TargetsFormState = {
  dailyCalorieRef: "",
  dailyProteinRef: "",
  dailyCarbsRef: "",
  dailyFatRef: "",
  dailyFibreRef: "",
  sourceNotes: "",
  enteredByProfessional: false,
}

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: "",
  age: "",
  gender: "",
  weightKg: "",
  heightCm: "",
  goal: "maintain",
  dietaryPreference: "vegetarian",
  allergies: "",
  restrictions: "",
  activityLevel: "moderately_active",
}

interface ProfileBundleResponse {
  user?: { id: string; name?: string | null; email?: string | null } | null
  profile?: {
    age?: number | null
    gender?: string | null
    weightKg?: number | null
    heightCm?: number | null
    goal?: string | null
    dietaryPreference?: string | null
    allergies?: unknown
    restrictions?: unknown
    activityLevel?: string | null
  } | null
  guidance?: {
    dailyCalorieRef?: number | null
    dailyProteinRef?: number | null
    dailyCarbsRef?: number | null
    dailyFatRef?: number | null
    dailyFibreRef?: number | null
    sourceNotes?: string | null
    enteredByProfessional?: boolean
  } | null
}

const MACRO_PRESET_OPTIONS: ReadonlyArray<{
  id: MacroPresetId
  label: string
  ratioLabel: string
}> = [
  { id: "balanced", label: "Balanced", ratioLabel: "25 / 45 / 30" },
  { id: "high_protein", label: "High protein", ratioLabel: "32 / 43 / 25" },
  { id: "low_carb", label: "Low carb", ratioLabel: "30 / 25 / 45" },
]

const GOAL_OPTIONS: ReadonlyArray<{
  id: string
  label: string
  delta: string
}> = [
  { id: "fat_loss", label: "Fat loss", delta: "−400 kcal" },
  { id: "lean_recomp", label: "Lean recomp", delta: "−150 kcal" },
  { id: "maintain", label: "Maintain", delta: "Maintenance" },
  { id: "muscle_gain", label: "Muscle gain", delta: "+300 kcal" },
]

const ACTIVITY_OPTIONS: ReadonlyArray<{
  id: string
  label: string
  detail: string
}> = [
  { id: "sedentary", label: "Sedentary", detail: "Desk work" },
  { id: "lightly_active", label: "Light", detail: "1–3 days / wk" },
  { id: "moderately_active", label: "Moderate", detail: "3–5 days / wk" },
  { id: "very_active", label: "Very active", detail: "6–7 days / wk" },
]

function parseOptionalNum(val: string): number | null {
  const trimmed = val.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : null
}

function validateOptionalRange(
  raw: string,
  min: number,
  max: number,
  unit: string
): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < min || num > max) {
    return `${min.toLocaleString()}–${max.toLocaleString()} ${unit}`
  }
  return null
}

interface UnitInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  unit: string
  hasError?: boolean
  sizeVariant?: "default" | "hero"
}

function UnitInput({
  id,
  unit,
  hasError,
  sizeVariant = "default",
  className,
  ...props
}: UnitInputProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border bg-[#0b1620] px-3 transition-colors duration-150",
        sizeVariant === "hero" ? "h-12" : "h-12 sm:h-11",
        hasError
          ? "border-rose-500/60 focus-within:border-rose-400"
          : "border-[#253745]/80 focus-within:border-[#647b8c]",
        className
      )}
    >
      <input
        id={id}
        aria-invalid={hasError || undefined}
        className={cn(
          "w-full min-w-0 bg-transparent text-[#CCD0CF] placeholder:text-[#9BA8AB]/45 font-mono tabular-nums focus:outline-none",
          sizeVariant === "hero"
            ? "text-xl sm:text-2xl font-semibold tracking-tight text-center"
            : "text-base sm:text-sm font-medium"
        )}
        {...props}
      />
      {unit && (
        <span className="ml-2 shrink-0 text-[11px] font-medium text-[#9BA8AB] select-none">
          {unit}
        </span>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { updateSessionUser } = useAppSession()

  const [loading, setLoading] = React.useState(true)
  const [mobileTab, setMobileTab] = React.useState<"targets" | "profile">("targets")
  const [savingTargets, setSavingTargets] = React.useState(false)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [savingAll, setSavingAll] = React.useState(false)
  const [justSavedSection, setJustSavedSection] = React.useState<"targets" | "profile" | null>(null)

  const [targetsForm, setTargetsForm] = React.useState<TargetsFormState>(EMPTY_TARGETS_FORM)
  const [savedTargetsSnapshot, setSavedTargetsSnapshot] = React.useState<TargetsFormState>(EMPTY_TARGETS_FORM)

  const [profileForm, setProfileForm] = React.useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [savedProfileSnapshot, setSavedProfileSnapshot] = React.useState<ProfileFormState>(EMPTY_PROFILE_FORM)

  const [savedMessage, setSavedMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [estimateNotice, setEstimateNotice] = React.useState<string | null>(null)
  const [touchedFields, setTouchedFields] = React.useState<Record<string, boolean>>({})
  const [showClinicalNotes, setShowClinicalNotes] = React.useState(false)
  const [showDietaryNotes, setShowDietaryNotes] = React.useState(false)

  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedBadgeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const syncHash = () => {
      if (window.location.hash === "#targets") {
        setMobileTab("targets")
      }
    }
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => {
      window.removeEventListener("hashchange", syncHash)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (savedBadgeTimerRef.current) clearTimeout(savedBadgeTimerRef.current)
    }
  }, [])

  const markTouched = (field: string) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }))
  }

  const hydrateFromBundle = React.useCallback((data: ProfileBundleResponse | null | undefined) => {
    const u = data?.user
    const p = data?.profile
    const g = data?.guidance

    const nextTargets: TargetsFormState = {
      dailyCalorieRef:
        g?.dailyCalorieRef !== null && g?.dailyCalorieRef !== undefined
          ? String(g.dailyCalorieRef)
          : "",
      dailyProteinRef:
        g?.dailyProteinRef !== null && g?.dailyProteinRef !== undefined
          ? String(g.dailyProteinRef)
          : "",
      dailyCarbsRef:
        g?.dailyCarbsRef !== null && g?.dailyCarbsRef !== undefined
          ? String(g.dailyCarbsRef)
          : "",
      dailyFatRef:
        g?.dailyFatRef !== null && g?.dailyFatRef !== undefined
          ? String(g.dailyFatRef)
          : "",
      dailyFibreRef:
        g?.dailyFibreRef !== null && g?.dailyFibreRef !== undefined
          ? String(g.dailyFibreRef)
          : "",
      sourceNotes: g?.sourceNotes || "",
      enteredByProfessional: Boolean(g?.enteredByProfessional),
    }

    const nextProfile: ProfileFormState = {
      name: u?.name || "",
      age: p?.age !== null && p?.age !== undefined ? String(p.age) : "",
      gender: p?.gender || "",
      weightKg: p?.weightKg !== null && p?.weightKg !== undefined ? String(p.weightKg) : "",
      heightCm: p?.heightCm !== null && p?.heightCm !== undefined ? String(p.heightCm) : "",
      goal: p?.goal || "maintain",
      dietaryPreference: p?.dietaryPreference || "vegetarian",
      allergies: formatJsonArray(p?.allergies),
      restrictions: formatJsonArray(p?.restrictions),
      activityLevel: p?.activityLevel || "moderately_active",
    }

    setTargetsForm(nextTargets)
    setSavedTargetsSnapshot(nextTargets)
    setProfileForm(nextProfile)
    setSavedProfileSnapshot(nextProfile)
    setShowClinicalNotes(Boolean(nextTargets.sourceNotes || nextTargets.enteredByProfessional))
    setShowDietaryNotes(Boolean(nextProfile.allergies || nextProfile.restrictions))
    setTouchedFields({})
  }, [])

  React.useEffect(() => {
    let active = true
    apiFetchProfile()
      .then((data) => {
        if (active && data) {
          hydrateFromBundle(data)
        }
      })
      .catch((err) => {
        console.error("Failed to load profile:", err)
        if (active) {
          setErrorMessage("Could not load profile details. Refresh to retry.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [hydrateFromBundle])

  const showSuccess = (msg: string, section?: "targets" | "profile") => {
    setErrorMessage(null)
    setSavedMessage(msg)
    if (section) {
      setJustSavedSection(section)
      if (savedBadgeTimerRef.current) clearTimeout(savedBadgeTimerRef.current)
      savedBadgeTimerRef.current = setTimeout(() => setJustSavedSection(null), 2200)
    }
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setSavedMessage(null), 3800)
  }

  const targetsDirty = JSON.stringify(targetsForm) !== JSON.stringify(savedTargetsSnapshot)
  const profileDirty = JSON.stringify(profileForm) !== JSON.stringify(savedProfileSnapshot)

  const effectiveCalories =
    parseOptionalNum(targetsForm.dailyCalorieRef) ?? DEFAULT_NUTRITION_TARGETS.calories
  const effectiveProtein =
    parseOptionalNum(targetsForm.dailyProteinRef) ?? DEFAULT_NUTRITION_TARGETS.protein
  const effectiveCarbs =
    parseOptionalNum(targetsForm.dailyCarbsRef) ?? DEFAULT_NUTRITION_TARGETS.carbs
  const effectiveFat =
    parseOptionalNum(targetsForm.dailyFatRef) ?? DEFAULT_NUTRITION_TARGETS.fat

  const hasCustomTargets = Boolean(
    targetsForm.dailyCalorieRef.trim() ||
      targetsForm.dailyProteinRef.trim() ||
      targetsForm.dailyCarbsRef.trim() ||
      targetsForm.dailyFatRef.trim() ||
      targetsForm.dailyFibreRef.trim()
  )

  const macroBreakdown = calculateMacroCalories({
    protein: effectiveProtein,
    carbs: effectiveCarbs,
    fat: effectiveFat,
  })
  const calorieMacroDiff = Math.round(macroBreakdown.totalMacroCal - effectiveCalories)

  const targetErrors = {
    dailyCalorieRef: validateOptionalRange(targetsForm.dailyCalorieRef, 500, 10000, "kcal"),
    dailyProteinRef: validateOptionalRange(targetsForm.dailyProteinRef, 10, 600, "g"),
    dailyCarbsRef: validateOptionalRange(targetsForm.dailyCarbsRef, 0, 1500, "g"),
    dailyFatRef: validateOptionalRange(targetsForm.dailyFatRef, 10, 500, "g"),
    dailyFibreRef: validateOptionalRange(targetsForm.dailyFibreRef, 0, 200, "g"),
  }
  const hasTargetValidationErrors = Object.values(targetErrors).some(Boolean)

  const profileErrors = {
    age: validateOptionalRange(profileForm.age, 10, 120, "yrs"),
    weightKg: validateOptionalRange(profileForm.weightKg, 20, 400, "kg"),
    heightCm: validateOptionalRange(profileForm.heightCm, 80, 260, "cm"),
  }
  const hasProfileValidationErrors = Object.values(profileErrors).some(Boolean)

  const bodyEstimate = estimateTargetsFromProfile({
    age: parseOptionalNum(profileForm.age),
    gender: profileForm.gender || null,
    weightKg: parseOptionalNum(profileForm.weightKg),
    heightCm: parseOptionalNum(profileForm.heightCm),
    activityLevel: profileForm.activityLevel,
    goal: profileForm.goal,
  })

  const weightVal = parseOptionalNum(profileForm.weightKg)
  const heightVal = parseOptionalNum(profileForm.heightCm)
  const bmi =
    weightVal && heightVal && heightVal >= 80 && weightVal >= 20
      ? Number((weightVal / ((heightVal / 100) * (heightVal / 100))).toFixed(1))
      : null

  const activePresetId: MacroPresetId | null =
    MACRO_PRESET_OPTIONS.find((preset) => {
      const split = calculateMacroSplitFromCalories(effectiveCalories, preset.id)
      return (
        Math.abs(effectiveProtein - split.protein) <= 1 &&
        Math.abs(effectiveCarbs - split.carbs) <= 1 &&
        Math.abs(effectiveFat - split.fat) <= 1
      )
    })?.id ?? null

  const dietaryLabel =
    DIETARY_PREFERENCES.find((d) => d.id === profileForm.dietaryPreference)?.label || "Vegetarian"

  function buildProfilePayload() {
    return {
      name: profileForm.name.trim() || undefined,
      age: profileForm.age.trim() || null,
      gender: profileForm.gender || null,
      weightKg: profileForm.weightKg.trim() || null,
      heightCm: profileForm.heightCm.trim() || null,
      goal: profileForm.goal || null,
      dietaryPreference: profileForm.dietaryPreference,
      allergies: profileForm.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      restrictions: profileForm.restrictions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      activityLevel: profileForm.activityLevel,
    }
  }

  function buildTargetsPayload() {
    return {
      dailyCalorieRef: targetsForm.dailyCalorieRef.trim() || null,
      dailyProteinRef: targetsForm.dailyProteinRef.trim() || null,
      dailyCarbsRef: targetsForm.dailyCarbsRef.trim() || null,
      dailyFatRef: targetsForm.dailyFatRef.trim() || null,
      dailyFibreRef: targetsForm.dailyFibreRef.trim() || null,
      sourceNotes: targetsForm.sourceNotes.trim() || null,
      enteredByProfessional: targetsForm.enteredByProfessional,
    }
  }

  async function saveTargets(e: React.FormEvent) {
    e.preventDefault()
    if (hasTargetValidationErrors) {
      setTouchedFields((prev) => ({
        ...prev,
        dailyCalorieRef: true,
        dailyProteinRef: true,
        dailyCarbsRef: true,
        dailyFatRef: true,
        dailyFibreRef: true,
      }))
      setErrorMessage("Check highlighted target fields before saving.")
      return
    }

    setSavingTargets(true)
    setErrorMessage(null)

    try {
      const data = await apiSaveProfile({
        type: "targets",
        ...buildTargetsPayload(),
      })
      hydrateFromBundle(data)
      router.refresh()
      showSuccess("Daily calorie & macro targets saved.", "targets")
    } catch (err) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : "Failed to save nutrition targets.")
    } finally {
      setSavingTargets(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (hasProfileValidationErrors) {
      setTouchedFields((prev) => ({ ...prev, age: true, weightKg: true, heightCm: true }))
      setErrorMessage("Check highlighted body stat fields before saving.")
      return
    }

    setSavingProfile(true)
    setErrorMessage(null)

    try {
      const data = await apiSaveProfile({
        type: "profile",
        ...buildProfilePayload(),
      })
      hydrateFromBundle(data)
      if (data?.user?.name) {
        await updateSessionUser({ name: data.user.name })
      }
      router.refresh()
      showSuccess("Profile details saved.", "profile")
    } catch (err) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile details.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveAllChanges() {
    if (hasTargetValidationErrors || hasProfileValidationErrors) {
      setTouchedFields({
        dailyCalorieRef: true,
        dailyProteinRef: true,
        dailyCarbsRef: true,
        dailyFatRef: true,
        dailyFibreRef: true,
        age: true,
        weightKg: true,
        heightCm: true,
      })
      setErrorMessage("Resolve highlighted fields before saving all changes.")
      return
    }

    setSavingAll(true)
    setErrorMessage(null)

    try {
      const data = await apiSaveProfile({
        type: "all",
        ...buildProfilePayload(),
        ...buildTargetsPayload(),
      })
      hydrateFromBundle(data)
      if (data?.user?.name) {
        await updateSessionUser({ name: data.user.name })
      }
      router.refresh()
      showSuccess("Targets and profile updated.")
    } catch (err) {
      console.error(err)
      setErrorMessage(err instanceof Error ? err.message : "Failed to save changes.")
    } finally {
      setSavingAll(false)
    }
  }

  function stepCalories(delta: number) {
    const next = Math.min(10000, Math.max(500, Math.round(effectiveCalories + delta)))
    setTargetsForm((prev) => ({ ...prev, dailyCalorieRef: String(next) }))
  }

  function applyMacroPreset(preset: MacroPresetId) {
    const cal = parseOptionalNum(targetsForm.dailyCalorieRef) ?? DEFAULT_NUTRITION_TARGETS.calories
    const split = calculateMacroSplitFromCalories(cal, preset)
    setEstimateNotice(null)
    setTargetsForm((prev) => ({
      ...prev,
      dailyCalorieRef: String(Math.round(cal)),
      dailyProteinRef: String(split.protein),
      dailyCarbsRef: String(split.carbs),
      dailyFatRef: String(split.fat),
      dailyFibreRef: String(split.fibre),
    }))
  }

  function applyEstimatedTargets() {
    if (!bodyEstimate) {
      setEstimateNotice("Add Age, Weight, and Height in Body & Diet first.")
      return
    }

    setEstimateNotice(
      `Applied ${bodyEstimate.calories.toLocaleString()} kcal/day from ~${bodyEstimate.tdee.toLocaleString()} kcal maintenance.`
    )
    setTargetsForm((prev) => ({
      ...prev,
      dailyCalorieRef: String(bodyEstimate.calories),
      dailyProteinRef: String(bodyEstimate.protein),
      dailyCarbsRef: String(bodyEstimate.carbs),
      dailyFatRef: String(bodyEstimate.fat),
      dailyFibreRef: String(bodyEstimate.fibre),
    }))
  }

  function resetTargetsToDefaults() {
    setEstimateNotice(null)
    setTargetsForm((prev) => ({
      ...prev,
      dailyCalorieRef: "",
      dailyProteinRef: "",
      dailyCarbsRef: "",
      dailyFatRef: "",
      dailyFibreRef: "",
    }))
  }

  if (loading) {
    return (
      <div className="flex-1 px-4 pt-4 pb-6 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 w-full">
        <div className="space-y-2 pb-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="lg:hidden h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-7 h-[460px] rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-[460px] rounded-2xl hidden lg:block" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 pt-3 pb-6 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-5 w-full">
      {/* Compact Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-2.5 border-b border-[#253745]/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
              Nutrition &amp; Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#9BA8AB] mt-0.5 font-mono tabular-nums">
              {Math.round(effectiveCalories).toLocaleString()} kcal ·{" "}
              {Math.round(effectiveProtein)}P / {Math.round(effectiveCarbs)}C /{" "}
              {Math.round(effectiveFat)}F
              <span className="font-sans"> · {dietaryLabel}</span>
            </p>
          </div>

          <Link
            href="/settings"
            aria-label="Settings and privacy"
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#11212D] text-[#CCD0CF] border border-[#253745] hover:bg-[#182C3D] active:scale-[0.96] transition-all touch-manipulation shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {targetsForm.enteredByProfessional && (
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-[#182C3D] border border-[#4A5C6A]/50 text-[#CCD0CF] text-[11px] font-medium">
            Clinician plan
          </span>
        )}
      </header>

      {/* Mobile Floating Safe Toast + Desktop Inline Alert */}
      {savedMessage && (
        <div
          role="status"
          className="fixed top-[calc(0.75rem+var(--safe-area-inset-top,env(safe-area-inset-top,0px)))] left-4 right-4 sm:static z-30 flex items-center gap-2 px-3.5 py-2.5 text-xs bg-[#0d2621]/95 sm:bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/35 shadow-lg sm:shadow-none backdrop-blur-md"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="fixed top-[calc(0.75rem+var(--safe-area-inset-top,env(safe-area-inset-top,0px)))] left-4 right-4 sm:static z-30 flex items-center gap-2 px-3.5 py-2.5 text-xs bg-[#261116]/95 sm:bg-rose-500/10 text-rose-300 rounded-xl border border-rose-500/35 shadow-lg sm:shadow-none backdrop-blur-md"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mobile Segmented Tab Switcher (prevents endless mobile scroll) */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="lg:hidden grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#0c1721] border border-[#253745]/75"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "targets"}
          onClick={() => setMobileTab("targets")}
          className={cn(
            "min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
            mobileTab === "targets"
              ? "bg-[#182C3D] text-[#CCD0CF] border border-[#4A5C6A]/50 shadow-xs"
              : "text-[#9BA8AB] hover:text-[#CCD0CF]"
          )}
        >
          <span>Daily Targets</span>
          {targetsDirty && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Unsaved changes" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "profile"}
          onClick={() => setMobileTab("profile")}
          className={cn(
            "min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
            mobileTab === "profile"
              ? "bg-[#182C3D] text-[#CCD0CF] border border-[#4A5C6A]/50 shadow-xs"
              : "text-[#9BA8AB] hover:text-[#CCD0CF]"
          )}
        >
          <span>Body &amp; Diet</span>
          {profileDirty && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Unsaved changes" />
          )}
        </button>
      </div>

      {/* Desktop Split Grid / Mobile Active Tab View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Primary Panel: Daily Targets */}
        <section
          id="targets"
          aria-labelledby="targets-heading"
          className={cn(
            "lg:col-span-7 scroll-mt-24 rounded-2xl bg-[#0c1721] border border-[#253745]/75 p-4 sm:p-6 space-y-5",
            mobileTab !== "targets" && "hidden lg:block"
          )}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#253745]/45">
            <div>
              <h2 id="targets-heading" className="text-base font-semibold text-[#CCD0CF] tracking-tight">
                Daily Targets
              </h2>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                Set your daily calorie &amp; macro goals, or auto-calculate from your body stats.
              </p>
            </div>
            {hasCustomTargets && (
              <button
                type="button"
                onClick={resetTargetsToDefaults}
                className="inline-flex items-center gap-1.5 text-xs text-[#9BA8AB] hover:text-[#CCD0CF] min-h-[36px] px-2.5 -mr-1.5 rounded-lg hover:bg-[#11212D] transition-colors touch-manipulation cursor-pointer shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <form onSubmit={saveTargets} noValidate className="space-y-5">
            {/* Calorie Budget Stepper */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="target-calories" className="text-xs font-medium text-[#CCD0CF]">
                  Calorie budget
                </label>
                {touchedFields.dailyCalorieRef && targetErrors.dailyCalorieRef && (
                  <span className="text-[11px] text-rose-400">{targetErrors.dailyCalorieRef}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepCalories(-50)}
                  aria-label="Decrease calorie budget by 50 kcal"
                  className="h-12 w-12 shrink-0 rounded-xl border border-[#253745]/80 bg-[#0b1620] hover:bg-[#11212D] text-[#CCD0CF] flex items-center justify-center transition-all active:scale-[0.95] touch-manipulation cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <UnitInput
                  id="target-calories"
                  name="dailyCalorieRef"
                  type="number"
                  inputMode="numeric"
                  min={500}
                  max={10000}
                  step={10}
                  unit="kcal"
                  sizeVariant="hero"
                  className="flex-1"
                  hasError={Boolean(touchedFields.dailyCalorieRef && targetErrors.dailyCalorieRef)}
                  value={targetsForm.dailyCalorieRef}
                  onChange={(e) =>
                    setTargetsForm((prev) => ({ ...prev, dailyCalorieRef: e.target.value }))
                  }
                  onBlur={() => markTouched("dailyCalorieRef")}
                  placeholder={String(DEFAULT_NUTRITION_TARGETS.calories)}
                />

                <button
                  type="button"
                  onClick={() => stepCalories(50)}
                  aria-label="Increase calorie budget by 50 kcal"
                  className="h-12 w-12 shrink-0 rounded-xl border border-[#253745]/80 bg-[#0b1620] hover:bg-[#11212D] text-[#CCD0CF] flex items-center justify-center transition-all active:scale-[0.95] touch-manipulation cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Macro Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="target-protein"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF]"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    Protein
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-[#9BA8AB]">
                    {macroBreakdown.proteinPct}%
                  </span>
                </div>
                <UnitInput
                  id="target-protein"
                  name="dailyProteinRef"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={600}
                  step={1}
                  unit="g"
                  hasError={Boolean(touchedFields.dailyProteinRef && targetErrors.dailyProteinRef)}
                  value={targetsForm.dailyProteinRef}
                  onChange={(e) =>
                    setTargetsForm((prev) => ({ ...prev, dailyProteinRef: e.target.value }))
                  }
                  onBlur={() => markTouched("dailyProteinRef")}
                  placeholder={String(DEFAULT_NUTRITION_TARGETS.protein)}
                />
                {touchedFields.dailyProteinRef && targetErrors.dailyProteinRef && (
                  <p className="text-[11px] text-rose-400 mt-1">{targetErrors.dailyProteinRef}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="target-carbs"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF]"
                  >
                    <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" />
                    Carbs
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-[#9BA8AB]">
                    {macroBreakdown.carbsPct}%
                  </span>
                </div>
                <UnitInput
                  id="target-carbs"
                  name="dailyCarbsRef"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1500}
                  step={1}
                  unit="g"
                  hasError={Boolean(touchedFields.dailyCarbsRef && targetErrors.dailyCarbsRef)}
                  value={targetsForm.dailyCarbsRef}
                  onChange={(e) =>
                    setTargetsForm((prev) => ({ ...prev, dailyCarbsRef: e.target.value }))
                  }
                  onBlur={() => markTouched("dailyCarbsRef")}
                  placeholder={String(DEFAULT_NUTRITION_TARGETS.carbs)}
                />
                {touchedFields.dailyCarbsRef && targetErrors.dailyCarbsRef && (
                  <p className="text-[11px] text-rose-400 mt-1">{targetErrors.dailyCarbsRef}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="target-fat"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF]"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                    Fat
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-[#9BA8AB]">
                    {macroBreakdown.fatPct}%
                  </span>
                </div>
                <UnitInput
                  id="target-fat"
                  name="dailyFatRef"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={500}
                  step={1}
                  unit="g"
                  hasError={Boolean(touchedFields.dailyFatRef && targetErrors.dailyFatRef)}
                  value={targetsForm.dailyFatRef}
                  onChange={(e) =>
                    setTargetsForm((prev) => ({ ...prev, dailyFatRef: e.target.value }))
                  }
                  onBlur={() => markTouched("dailyFatRef")}
                  placeholder={String(DEFAULT_NUTRITION_TARGETS.fat)}
                />
                {touchedFields.dailyFatRef && targetErrors.dailyFatRef && (
                  <p className="text-[11px] text-rose-400 mt-1">{targetErrors.dailyFatRef}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="target-fibre"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#94d2bd]" aria-hidden="true" />
                    Fibre
                  </label>
                  <span className="text-[11px] text-[#9BA8AB]">min</span>
                </div>
                <UnitInput
                  id="target-fibre"
                  name="dailyFibreRef"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200}
                  step={1}
                  unit="g"
                  hasError={Boolean(touchedFields.dailyFibreRef && targetErrors.dailyFibreRef)}
                  value={targetsForm.dailyFibreRef}
                  onChange={(e) =>
                    setTargetsForm((prev) => ({ ...prev, dailyFibreRef: e.target.value }))
                  }
                  onBlur={() => markTouched("dailyFibreRef")}
                  placeholder={String(DEFAULT_NUTRITION_TARGETS.fibre)}
                />
                {touchedFields.dailyFibreRef && targetErrors.dailyFibreRef && (
                  <p className="text-[11px] text-rose-400 mt-1">{targetErrors.dailyFibreRef}</p>
                )}
              </div>
            </div>

            {/* Energy Balance Bar */}
            <div className="rounded-xl bg-[#08121a] border border-[#253745]/60 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#9BA8AB]">From macros</span>
                  <span className="font-mono font-semibold tabular-nums text-[#CCD0CF]">
                    {macroBreakdown.totalMacroCal.toLocaleString()} kcal
                  </span>
                  {Math.abs(calorieMacroDiff) > 50 && (
                    <span
                      className={cn(
                        "text-[11px] font-mono tabular-nums",
                        Math.abs(calorieMacroDiff) > 150 ? "text-amber-400" : "text-[#9BA8AB]"
                      )}
                    >
                      ({calorieMacroDiff > 0 ? `+${calorieMacroDiff}` : calorieMacroDiff})
                    </span>
                  )}
                </div>

                <span className="font-mono tabular-nums text-[11px] text-[#9BA8AB]">
                  {macroBreakdown.proteinPct}P · {macroBreakdown.carbsPct}C · {macroBreakdown.fatPct}F
                </span>
              </div>

              <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#11212D]">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${macroBreakdown.proteinPct}%` }}
                />
                <div
                  className="bg-sky-400 transition-all duration-300"
                  style={{ width: `${macroBreakdown.carbsPct}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-300"
                  style={{ width: `${macroBreakdown.fatPct}%` }}
                />
              </div>
            </div>

            {/* Split Presets + Estimator Action */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#9BA8AB]">
                  Split {Math.round(effectiveCalories).toLocaleString()} kcal
                </span>
                {bodyEstimate ? (
                  <button
                    type="button"
                    onClick={applyEstimatedTargets}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF] hover:text-white min-h-[38px] px-3 rounded-xl bg-[#11212D] hover:bg-[#182C3D] border border-[#253745]/75 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                  >
                    <Calculator className="h-3.5 w-3.5 text-[#9BA8AB]" />
                    <span>Apply est. {bodyEstimate.calories.toLocaleString()} kcal</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileTab("profile")
                      setEstimateNotice("Add Age, Weight, and Height in Body & Diet to estimate TDEE.")
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] min-h-[38px] px-3 rounded-xl bg-[#11212D]/70 border border-[#253745]/60 transition-all active:scale-[0.98] touch-manipulation cursor-pointer"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Estimate from stats</span>
                    <ArrowRight className="h-3 w-3 lg:hidden" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MACRO_PRESET_OPTIONS.map((preset) => {
                  const isActive = activePresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyMacroPreset(preset.id)}
                      className={cn(
                        "flex flex-col items-start justify-center px-3 py-2.5 min-h-[52px] rounded-xl border text-left transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
                        isActive
                          ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF]"
                          : "bg-[#0e1922] border-[#253745]/60 text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A]"
                      )}
                    >
                      <span className="text-xs font-semibold text-[#CCD0CF] truncate w-full">
                        {preset.label}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#9BA8AB]">
                        {preset.ratioLabel}
                      </span>
                    </button>
                  )
                })}
              </div>

              {estimateNotice && (
                <p className="text-xs text-[#CCD0CF] bg-[#11212D]/70 border border-[#253745]/70 rounded-xl px-3 py-2">
                  {estimateNotice}
                </p>
              )}
            </div>

            {/* Optional Notes & Clinician Reference */}
            <div className="pt-2 border-t border-[#253745]/45 space-y-3">
              <button
                type="button"
                onClick={() => setShowClinicalNotes((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#08121a] border border-[#253745]/60 text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors cursor-pointer"
              >
                <span>Optional plan notes &amp; clinician tag</span>
                {showClinicalNotes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showClinicalNotes && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="target-notes" className="text-xs font-medium text-[#CCD0CF]">
                        Plan notes
                      </label>
                      <span className="text-[11px] text-[#9BA8AB]">Optional</span>
                    </div>
                    <Textarea
                      id="target-notes"
                      name="sourceNotes"
                      value={targetsForm.sourceNotes}
                      onChange={(e) =>
                        setTargetsForm((prev) => ({ ...prev, sourceNotes: e.target.value }))
                      }
                      placeholder="Cut phase, coach name, or nutritionist plan"
                      className="min-h-[64px] text-base sm:text-sm bg-[#0b1620] border-[#253745]/80"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 px-3.5 py-3 min-h-[56px] rounded-xl bg-[#08121a] border border-[#253745]/55">
                    <label htmlFor="target-professional" className="cursor-pointer pr-2">
                      <span className="text-xs font-medium text-[#CCD0CF] block">
                        Dietitian or clinician plan
                      </span>
                      <span className="text-[11px] text-[#9BA8AB]">
                        Mark targets prescribed by a healthcare professional
                      </span>
                    </label>
                    <Switch
                      id="target-professional"
                      checked={targetsForm.enteredByProfessional}
                      onCheckedChange={(checked) =>
                        setTargetsForm((prev) => ({ ...prev, enteredByProfessional: checked }))
                      }
                      aria-label="Dietitian or clinician plan"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={savingTargets || savingAll}
              className="w-full rounded-xl min-h-[48px]"
            >
              {savingTargets ? (
                "Saving targets..."
              ) : justSavedSection === "targets" && !targetsDirty ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Targets saved</span>
                </>
              ) : (
                "Save targets"
              )}
            </Button>
          </form>
        </section>

        {/* Secondary Panel: Body & Preferences */}
        <section
          aria-labelledby="profile-heading"
          className={cn(
            "lg:col-span-5 rounded-2xl bg-[#0c1721] border border-[#253745]/75 p-4 sm:p-6 space-y-5",
            mobileTab !== "profile" && "hidden lg:block"
          )}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#253745]/45">
            <div>
              <h2 id="profile-heading" className="text-base font-semibold text-[#CCD0CF] tracking-tight">
                Body &amp; Diet
              </h2>
              <p className="text-xs text-[#9BA8AB] mt-0.5">
                Stats calculate maintenance calories and tailor meals.
              </p>
            </div>
            {bmi !== null && (
              <span className="text-[11px] font-mono tabular-nums text-[#CCD0CF] bg-[#11212D] border border-[#253745]/70 px-2.5 py-1 rounded-lg shrink-0">
                BMI {bmi}
              </span>
            )}
          </div>

          <form onSubmit={saveProfile} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="profile-name" className="text-xs font-medium text-[#CCD0CF] block mb-1.5">
                Display name
              </label>
              <Input
                id="profile-name"
                type="text"
                name="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Your name"
                className="h-12 sm:h-11 text-base sm:text-sm bg-[#0b1620] border-[#253745]/80"
              />
            </div>

            {/* Numeric Body Stats (2x2 clean grid on mobile, 3 cols on tablet+) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="profile-weight" className="text-xs font-medium text-[#CCD0CF] block mb-1.5">
                  Weight
                </label>
                <UnitInput
                  id="profile-weight"
                  name="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={20}
                  max={400}
                  unit="kg"
                  hasError={Boolean(touchedFields.weightKg && profileErrors.weightKg)}
                  value={profileForm.weightKg}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, weightKg: e.target.value }))
                  }
                  onBlur={() => markTouched("weightKg")}
                  placeholder="72"
                />
              </div>

              <div>
                <label htmlFor="profile-height" className="text-xs font-medium text-[#CCD0CF] block mb-1.5">
                  Height
                </label>
                <UnitInput
                  id="profile-height"
                  name="heightCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={80}
                  max={260}
                  unit="cm"
                  hasError={Boolean(touchedFields.heightCm && profileErrors.heightCm)}
                  value={profileForm.heightCm}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, heightCm: e.target.value }))
                  }
                  onBlur={() => markTouched("heightCm")}
                  placeholder="175"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="profile-age" className="text-xs font-medium text-[#CCD0CF] block mb-1.5">
                  Age
                </label>
                <UnitInput
                  id="profile-age"
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={120}
                  unit="yrs"
                  hasError={Boolean(touchedFields.age && profileErrors.age)}
                  value={profileForm.age}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, age: e.target.value }))
                  }
                  onBlur={() => markTouched("age")}
                  placeholder="24"
                />
              </div>
            </div>

            {(touchedFields.age && profileErrors.age) ||
            (touchedFields.weightKg && profileErrors.weightKg) ||
            (touchedFields.heightCm && profileErrors.heightCm) ? (
              <p className="text-[11px] text-rose-400">
                {[
                  touchedFields.weightKg && profileErrors.weightKg
                    ? `Weight: ${profileErrors.weightKg}`
                    : null,
                  touchedFields.heightCm && profileErrors.heightCm
                    ? `Height: ${profileErrors.heightCm}`
                    : null,
                  touchedFields.age && profileErrors.age ? `Age: ${profileErrors.age}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}

            {/* Sex Segmented Control */}
            <div>
              <span className="text-xs font-medium text-[#CCD0CF] block mb-1.5">Sex</span>
              <div role="radiogroup" aria-label="Sex" className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => {
                  const selected = profileForm.gender === g.id
                  const label = g.id === "other" ? "Other" : g.label
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setProfileForm((prev) => ({
                          ...prev,
                          gender: prev.gender === g.id ? "" : g.id,
                        }))
                      }
                      className={cn(
                        "min-h-[44px] px-2.5 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF] font-semibold"
                          : "bg-[#0e1922] border-[#253745]/60 text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A]"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Goal Segmented Cards */}
            <div>
              <span className="text-xs font-medium text-[#CCD0CF] block mb-1.5">Goal</span>
              <div role="radiogroup" aria-label="Goal" className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((opt) => {
                  const selected = profileForm.goal === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setProfileForm((prev) => ({ ...prev, goal: opt.id }))}
                      className={cn(
                        "flex flex-col items-start justify-center min-h-[52px] px-3 py-2 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c]"
                          : "bg-[#0e1922] border-[#253745]/60 hover:border-[#4A5C6A]"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selected ? "text-[#CCD0CF] font-semibold" : "text-[#CCD0CF]/90"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] font-mono text-[#9BA8AB]">{opt.delta}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Activity Level Cards */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#CCD0CF]">Activity level</span>
                {bodyEstimate && (
                  <span className="text-[11px] font-mono tabular-nums text-[#9BA8AB]">
                    TDEE ~{bodyEstimate.tdee.toLocaleString()} kcal
                  </span>
                )}
              </div>
              <div role="radiogroup" aria-label="Activity level" className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map((opt) => {
                  const selected = profileForm.activityLevel === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setProfileForm((prev) => ({ ...prev, activityLevel: opt.id }))
                      }
                      className={cn(
                        "flex flex-col items-start justify-center min-h-[52px] px-3 py-2 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c]"
                          : "bg-[#0e1922] border-[#253745]/60 hover:border-[#4A5C6A]"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selected ? "text-[#CCD0CF] font-semibold" : "text-[#CCD0CF]/90"
                        )}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-[#9BA8AB]">{opt.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mobile shortcut to apply calculated targets cleanly */}
            {bodyEstimate && (
              <button
                type="button"
                onClick={() => {
                  applyEstimatedTargets()
                  setMobileTab("targets")
                }}
                className="lg:hidden w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0e1b26] border border-[#253745]/75 text-xs text-[#CCD0CF] active:scale-[0.99] touch-manipulation cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-[#9BA8AB]" />
                  <span>
                    Apply <strong className="font-mono">{bodyEstimate.calories.toLocaleString()} kcal</strong> target
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#9BA8AB]" />
              </button>
            )}

            {/* Dietary Preference Chips */}
            <div>
              <span className="text-xs font-medium text-[#CCD0CF] block mb-1.5">
                Dietary preference
              </span>
              <div
                role="radiogroup"
                aria-label="Dietary preference"
                className="flex flex-wrap gap-2"
              >
                {DIETARY_PREFERENCES.map((d) => {
                  const selected = profileForm.dietaryPreference === d.id
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setProfileForm((prev) => ({ ...prev, dietaryPreference: d.id }))
                      }
                      className={cn(
                        "min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-150 active:scale-[0.98] touch-manipulation cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF] font-semibold"
                          : "bg-[#0e1922] border-[#253745]/60 text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A]"
                      )}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional Allergies & Restrictions */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDietaryNotes((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#08121a] border border-[#253745]/60 text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors cursor-pointer"
              >
                <span>Optional allergies &amp; restrictions</span>
                {showDietaryNotes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showDietaryNotes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label
                      htmlFor="profile-allergies"
                      className="text-xs font-medium text-[#CCD0CF] block mb-1.5"
                    >
                      Allergies
                    </label>
                    <Input
                      id="profile-allergies"
                      name="allergies"
                      value={profileForm.allergies}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, allergies: e.target.value }))
                      }
                      placeholder="Peanuts, dairy, gluten"
                      className="h-12 sm:h-11 bg-[#0b1620] border-[#253745]/80 text-base sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-restrictions"
                      className="text-xs font-medium text-[#CCD0CF] block mb-1.5"
                    >
                      Restrictions
                    </label>
                    <Input
                      id="profile-restrictions"
                      name="restrictions"
                      value={profileForm.restrictions}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, restrictions: e.target.value }))
                      }
                      placeholder="Low sodium, no sugar"
                      className="h-12 sm:h-11 bg-[#0b1620] border-[#253745]/80 text-base sm:text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant={mobileTab === "profile" ? "primary" : "outline"}
              size="lg"
              disabled={savingProfile || savingAll}
              className="w-full min-h-[48px] rounded-xl"
            >
              {savingProfile ? (
                "Saving profile..."
              ) : justSavedSection === "profile" && !profileDirty ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Profile saved</span>
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </form>
        </section>
      </div>

      {/* Inline Save-All action when edits span both tabs/panels */}
      {targetsDirty && profileDirty && (
        <div className="p-3.5 rounded-2xl bg-[#11212D] border border-[#4A5C6A]/60 flex items-center justify-between gap-3">
          <span className="text-xs text-[#CCD0CF] font-medium pl-1">
            Pending edits in Targets &amp; Body
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={saveAllChanges}
            disabled={savingAll || savingTargets || savingProfile}
            className="rounded-xl shrink-0 min-h-[44px] px-4"
          >
            <Save className="h-3.5 w-3.5" />
            {savingAll ? "Saving..." : "Save all"}
          </Button>
        </div>
      )}
    </div>
  )
}
