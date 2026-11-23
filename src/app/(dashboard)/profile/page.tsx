"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge } from "@/components/ui/index"
import { User, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react"

function formatJsonArray(val: any): string {
  if (!val) return ""
  try {
    const parsed = typeof val === "string" ? JSON.parse(val) : val
    return Array.isArray(parsed) ? parsed.join(", ") : String(parsed)
  } catch {
    return String(val)
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<any>(null)
  const [guidance, setGuidance] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [savingGuidance, setSavingGuidance] = React.useState(false)
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setGuidance(data.guidance)
      }
    } catch (err) {
      console.error("Failed to load profile:", err)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const age = formData.get("age") as string
    const dietaryPreference = formData.get("dietaryPreference") as string
    const allergies = (formData.get("allergies") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const restrictions = (formData.get("restrictions") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const activityLevel = formData.get("activityLevel") as string

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          age,
          dietaryPreference,
          allergies,
          restrictions,
          activityLevel,
        }),
      })
      if (res.ok) {
        setSavedMessage("Profile details updated successfully")
        setTimeout(() => setSavedMessage(null), 3000)
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveGuidance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingGuidance(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    const dailyCalorieRef = formData.get("dailyCalorieRef") as string
    const dailyProteinRef = formData.get("dailyProteinRef") as string
    const sourceNotes = formData.get("sourceNotes") as string

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "guidance",
          dailyCalorieRef,
          dailyProteinRef,
          sourceNotes,
        }),
      })
      if (res.ok) {
        setSavedMessage("Professional guidance targets updated")
        setTimeout(() => setSavedMessage(null), 3000)
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingGuidance(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#9BA8AB]" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 w-full">
      <div className="pb-1 border-b border-[#253745]/40">
        <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
          Nutrition Profile
        </h1>
        <p className="text-xs text-[#9BA8AB] mt-0.5">
          Dietary habits, allergies, and professional targets.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/25">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Personal Details Card */}
      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60">
        <div className="flex items-center gap-2 pb-3 border-b border-[#253745]/40">
          <User className="h-4 w-4 text-[#9BA8AB]" />
          <h3 className="text-sm font-semibold text-[#CCD0CF]">Personal Preferences</h3>
        </div>

        <form onSubmit={saveProfile} className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Age
              </label>
              <Input
                type="number"
                name="age"
                defaultValue={profile?.age || ""}
                placeholder="e.g. 24"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Dietary Preference
              </label>
              <select
                name="dietaryPreference"
                defaultValue={profile?.dietaryPreference || "vegetarian"}
                className="w-full h-10 rounded-xl bg-[#081219] px-3 text-xs text-[#CCD0CF] border border-[#253745]/60 focus:outline-none"
              >
                <option value="vegetarian">Vegetarian</option>
                <option value="non_vegetarian">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="jain">Jain</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
              Food Allergies (comma-separated)
            </label>
            <Input
              name="allergies"
              defaultValue={formatJsonArray(profile?.allergies)}
              placeholder="e.g. peanuts, dairy, gluten"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
              Dietary Restrictions (comma-separated)
            </label>
            <Input
              name="restrictions"
              defaultValue={formatJsonArray(profile?.restrictions)}
              placeholder="e.g. low sodium, no refined sugar"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
              Lifestyle Activity Level
            </label>
            <select
              name="activityLevel"
              defaultValue={profile?.activityLevel || "moderately_active"}
              className="w-full h-10 rounded-xl bg-[#081219] px-3 text-xs text-[#CCD0CF] border border-[#253745]/60 focus:outline-none"
            >
              <option value="sedentary">Sedentary (desk work, minimal activity)</option>
              <option value="lightly_active">Lightly Active (light walking 1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (intense training or physical labor)</option>
            </select>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="accent" size="default" disabled={savingProfile} className="w-full">
              {savingProfile ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Professional Guidance Card */}
      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60">
        <div className="flex items-center gap-2 pb-3 border-b border-[#253745]/40">
          <ShieldCheck className="h-4 w-4 text-[#9BA8AB]" />
          <h3 className="text-sm font-semibold text-[#CCD0CF]">Clinical / Professional Guidance</h3>
        </div>

        <form onSubmit={saveGuidance} className="space-y-4 pt-3">
          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            Record doctor or dietitian nutritional reference guidelines. NutriMentor does not prescribe restrictive crash diets automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Daily Calorie Target (kcal)
              </label>
              <Input
                type="number"
                name="dailyCalorieRef"
                defaultValue={guidance?.dailyCalorieRef || ""}
                placeholder="e.g. 2100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Daily Protein Target (g)
              </label>
              <Input
                type="number"
                name="dailyProteinRef"
                defaultValue={guidance?.dailyProteinRef || ""}
                placeholder="e.g. 110"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
              Consultation Notes
            </label>
            <Textarea
              name="sourceNotes"
              defaultValue={guidance?.sourceNotes || ""}
              placeholder="e.g. Advised by Dr. Sharma for lean hypertrophy"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="outline" size="default" disabled={savingGuidance} className="w-full">
              {savingGuidance ? "Saving..." : "Save Clinical Reference"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
