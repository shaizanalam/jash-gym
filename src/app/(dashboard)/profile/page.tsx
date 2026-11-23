"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { Input } from "@/components/ui/index"
import { Textarea } from "@/components/ui/index"
import { User, ShieldCheck, CheckCircle2 } from "lucide-react"

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
        setSavedMessage("Profile details saved successfully!")
        setTimeout(() => setSavedMessage(null), 3000)
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function saveGuidance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
        setSavedMessage("Professional guidance saved successfully!")
        setTimeout(() => setSavedMessage(null), 3000)
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Nutrition Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize your nutrition preferences and dietary notes.
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-2 p-3 text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" /> Personal details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Age
                  </label>
                  <Input type="number" name="age" defaultValue={profile?.age || ""} placeholder="e.g. 19" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Dietary preference
                  </label>
                  <select
                    name="dietaryPreference"
                    defaultValue={profile?.dietaryPreference || "vegetarian"}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non_vegetarian">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="jain">Jain</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Food allergies (comma-separated)
                </label>
                <Input
                  name="allergies"
                  defaultValue={formatJsonArray(profile?.allergies)}
                  placeholder="e.g. peanuts, dairy, gluten"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dietary preferences or restrictions (comma-separated)
                </label>
                <Input
                  name="restrictions"
                  defaultValue={formatJsonArray(profile?.restrictions)}
                  placeholder="e.g. no refined sugar, low sodium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Lifestyle activity level
                </label>
                <select
                  name="activityLevel"
                  defaultValue={profile?.activityLevel || "moderately_active"}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="sedentary">Sedentary (mostly sitting)</option>
                  <option value="lightly_active">Lightly active (light walking/exercise 1-3 days)</option>
                  <option value="moderately_active">Moderately active (sports/exercise 3-5 days)</option>
                  <option value="very_active">Very active (heavy physical training)</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Save Personal Details
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" /> Professional Guidance (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              If a qualified doctor or registered dietitian has provided you with nutrition targets, you can record them here as an informational reference.
            </p>
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-slate-100 block mb-1">
                Teen & Growth Development Safety:
              </strong>
              Nutritional needs for teenagers vary significantly based on developmental stage and daily activity. DietScan does not automatically prescribe restrictive targets.
            </div>

            <form onSubmit={saveGuidance} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Daily Calorie Reference (kcal)
                  </label>
                  <Input
                    type="number"
                    name="dailyCalorieRef"
                    defaultValue={guidance?.dailyCalorieRef || ""}
                    placeholder="e.g. 2200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Daily Protein Reference (g)
                  </label>
                  <Input
                    type="number"
                    name="dailyProteinRef"
                    defaultValue={guidance?.dailyProteinRef || ""}
                    placeholder="e.g. 65"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Doctor / Dietitian consultation notes
                </label>
                <Textarea
                  name="sourceNotes"
                  defaultValue={guidance?.sourceNotes || ""}
                  rows={2}
                  placeholder="e.g. Recommended by Dr. Mehta for active growth"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full">
                Save Professional Reference
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
