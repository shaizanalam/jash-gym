"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, Sparkles, Utensils, ScanBarcode, ArrowRight, X } from "lucide-react"
import { Button, Input, cn } from "@/components/ui/index"
import { DIETARY_PREFERENCES } from "@/lib/constants"
import { apiSaveProfile } from "@/lib/client-api"
import { DEFAULT_NUTRITION_TARGETS, estimateTargetsFromProfile } from "@/lib/nutrition-targets"

const GOAL_CHOICES = [
  { id: "fat_loss", label: "Lose Weight", subtitle: "Gentle calorie deficit" },
  { id: "maintain", label: "Stay Healthy", subtitle: "Maintain current weight" },
  { id: "lean_recomp", label: "Tone Up", subtitle: "Build lean muscle" },
  { id: "muscle_gain", label: "Gain Muscle", subtitle: "Calorie surplus" },
] as const

const ACTIVITY_CHOICES = [
  { id: "sedentary", label: "Mostly Seated" },
  { id: "lightly_active", label: "Lightly Active" },
  { id: "moderately_active", label: "Active (3–5d/wk)" },
  { id: "very_active", label: "Very Active" },
] as const

interface OnboardingWizardProps {
  userId?: string
  firstName: string
  onCompleted: () => void
  onDismiss: () => void
}

/**
 * Guided 2-step first-time setup shown only until the user personalizes their goal or skips.
 */
export function OnboardingWizard({
  firstName,
  onCompleted,
  onDismiss,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [goal, setGoal] = React.useState<string>("maintain")
  const [diet, setDiet] = React.useState<string>("vegetarian")
  const [activityLevel, setActivityLevel] = React.useState<string>("moderately_active")
  const [age, setAge] = React.useState("")
  const [weightKg, setWeightKg] = React.useState("")
  const [heightCm, setHeightCm] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const parsedAge = age.trim() ? Number(age) : null
  const parsedWeight = weightKg.trim() ? Number(weightKg) : null
  const parsedHeight = heightCm.trim() ? Number(heightCm) : null

  const estimated = estimateTargetsFromProfile({
    age: parsedAge && Number.isFinite(parsedAge) ? parsedAge : null,
    weightKg: parsedWeight && Number.isFinite(parsedWeight) ? parsedWeight : null,
    heightCm: parsedHeight && Number.isFinite(parsedHeight) ? parsedHeight : null,
    activityLevel,
    goal,
  })

  const previewCalories = estimated?.calories ?? DEFAULT_NUTRITION_TARGETS.calories

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const targetValues = estimated ?? DEFAULT_NUTRITION_TARGETS
      await apiSaveProfile({
        type: "all",
        goal,
        dietaryPreference: diet,
        activityLevel,
        age: parsedAge,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        dailyCalorieRef: targetValues.calories,
        dailyProteinRef: targetValues.protein,
        dailyCarbsRef: targetValues.carbs,
        dailyFatRef: targetValues.fat,
        dailyFibreRef: targetValues.fibre,
      })
      router.refresh()
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save setup. Please check your numbers.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-[#0c1822] border border-[#4A5C6A]/50 p-5 sm:p-6 shadow-[0_16px_44px_rgba(0,0,0,0.45)] space-y-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Setup • Step {step} of 2
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] tracking-tight mt-1">
            {step === 1
              ? `Welcome${firstName && firstName !== "there" ? `, ${firstName}` : ""}! What's your goal?`
              : "You're all set — log your first meal"}
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            {step === 1
              ? "We'll set a personalized daily calorie target for you. You can change this anytime."
              : "Tracking takes seconds. Pick whichever way feels easiest:"}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Skip setup"
          className="p-2 rounded-xl text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] transition-colors shrink-0 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSaveStep1} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <span className="text-xs font-medium text-[#CCD0CF] block mb-2">1. Pick your goal</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOAL_CHOICES.map((g) => {
                const selected = goal === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation",
                      selected
                        ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF]"
                        : "bg-[#09131a] border-[#253745]/70 text-[#9BA8AB] hover:border-[#4A5C6A]"
                    )}
                  >
                    <span className="text-xs font-semibold text-[#CCD0CF] block">{g.label}</span>
                    <span className="text-[11px] text-[#9BA8AB] block mt-0.5">{g.subtitle}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-[#CCD0CF] block mb-2">
                2. Dietary preference
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_PREFERENCES.map((d) => {
                  const selected = diet === d.id
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiet(d.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF]"
                          : "bg-[#09131a] border-[#253745]/70 text-[#9BA8AB] hover:text-[#CCD0CF]"
                      )}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-[#CCD0CF] block mb-2">
                3. Activity level
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ACTIVITY_CHOICES.map((a) => {
                  const selected = activityLevel === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActivityLevel(a.id)}
                      className={cn(
                        "px-2.5 py-2 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer",
                        selected
                          ? "bg-[#182C3D] border-[#647b8c] text-[#CCD0CF]"
                          : "bg-[#09131a] border-[#253745]/70 text-[#9BA8AB] hover:text-[#CCD0CF]"
                      )}
                    >
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#CCD0CF]">
                4. Body stats <span className="text-[#9BA8AB] font-normal">(optional — auto-calculates calories)</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-[#9BA8AB] block mb-1">Age (yrs)</label>
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="h-10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#9BA8AB] block mb-1">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={20}
                  max={400}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70"
                  className="h-10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#9BA8AB] block mb-1">Height (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={80}
                  max={260}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="172"
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#253745]/50">
            <div className="text-xs text-[#9BA8AB]">
              Daily goal preview:{" "}
              <span className="font-mono font-semibold text-[#CCD0CF]">
                {previewCalories.toLocaleString()} kcal/day
              </span>
              {estimated && (
                <span className="text-emerald-400 ml-1.5">
                  ({estimated.protein}g protein)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={saving}
                className="rounded-full px-5"
              >
                {saving ? "Saving..." : "Save & Continue"}
                {!saving && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#09131a] border border-[#253745]/70 space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-[#182C3D] flex items-center justify-center text-emerald-400">
                <Camera className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-[#CCD0CF]">1. Snap Your Plate</p>
              <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                Take or upload a meal photo and AI estimates calories &amp; macros.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#09131a] border border-[#253745]/70 space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-[#182C3D] flex items-center justify-center text-cyan-400">
                <Utensils className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-[#CCD0CF]">2. Quick Text Log</p>
              <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                Type what you ate like &ldquo;2 rotis &amp; dal&rdquo; for instant nutrition.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#09131a] border border-[#253745]/70 space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-[#182C3D] flex items-center justify-center text-amber-400">
                <ScanBarcode className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-[#CCD0CF]">3. Barcode Scan</p>
              <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                Scan packaged snacks or drinks to pull verified label nutrition.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#253745]/50">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onCompleted}
              className="rounded-full"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Explore Dashboard
            </Button>
            <Button
              type="button"
              variant="primary"
              size="default"
              onClick={() => {
                onCompleted()
                router.push("/scanner")
              }}
              className="rounded-full px-5"
            >
              <Camera className="h-4 w-4 mr-1.5" />
              Scan First Meal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
