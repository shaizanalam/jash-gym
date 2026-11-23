"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, BottomSheet } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { Input } from "@/components/ui/index"
import { Badge } from "@/components/ui/index"
import {
  List,
  Clock,
  Calendar,
  Trash2,
  Plus,
  Camera,
  Sparkles,
  Utensils,
  X,
  Check,
  Flame,
  Egg,
  Leaf,
  Droplet,
  Loader2,
  Info,
} from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"
import Link from "next/link"

interface FoodEntry {
  id: string
  foodName: string
  estimatedPortionG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG?: number
  mealCategory: string
  loggedAt: string
  isAiGenerated: boolean
  isConfirmedByUser: boolean
  aiConfidence?: string | null
  notes?: string | null
  sourceImage?: { id: string; storageUrl: string } | null
}

const COMMON_PRESETS = [
  { name: "2 Rotis with Dal Tadka", category: "lunch" },
  { name: "Cooked Rice & Sambar", category: "lunch" },
  { name: "Palak Paneer with 2 Rotis", category: "dinner" },
  { name: "2 Boiled Eggs & Toast", category: "breakfast" },
  { name: "Poha with Roasted Peanuts", category: "breakfast" },
  { name: "Chicken Curry with Rice", category: "dinner" },
  { name: "Curd / Dahi (1 bowl)", category: "lunch" },
  { name: "Oatmeal with Banana & Milk", category: "breakfast" },
]

export default function JournalPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [date, setDate] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null)

  // Form state
  const [formFoodName, setFormFoodName] = useState("")
  const [formCategory, setFormCategory] = useState("lunch")
  const [formPortion, setFormPortion] = useState("150")
  const [formCalories, setFormCalories] = useState("250")
  const [formProtein, setFormProtein] = useState("10")
  const [formCarbs, setFormCarbs] = useState("35")
  const [formFat, setFormFat] = useState("6")
  const [formFibre, setFormFibre] = useState("4")
  const [aiCalculated, setAiCalculated] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [filter, date])

  async function loadEntries() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (date) params.set("date", date)
      if (filter && filter !== "all") params.set("mealCategory", filter)
      const res = await fetch(`/api/food-entries?${params.toString()}`)
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Remove this entry from your journal?")) return
    await fetch(`/api/food-entries/${id}`, { method: "DELETE" })
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // ✨ AI Auto-Calculation: User doesn't need to know protein or calories!
  async function triggerAiAnalysis(textToAnalyze?: string) {
    const text = textToAnalyze || formFoodName
    if (!text.trim()) return

    setAiAnalyzing(true)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textPrompt: text }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiAnalysisResult(data)

        if (data.items && data.items.length > 0) {
          // Roll up all identified items
          const totalCal = data.items.reduce((s: number, i: any) => s + (i.calories || 0), 0)
          const totalP = data.items.reduce((s: number, i: any) => s + (i.proteinG || 0), 0)
          const totalC = data.items.reduce((s: number, i: any) => s + (i.carbsG || 0), 0)
          const totalF = data.items.reduce((s: number, i: any) => s + (i.fatG || 0), 0)
          const totalFib = data.items.reduce((s: number, i: any) => s + (i.fibreG || 0), 0)
          const totalG = data.items.reduce((s: number, i: any) => s + (i.estimatedPortionG || 0), 0)

          setFormCalories(String(Math.round(totalCal)))
          setFormProtein(String(totalP.toFixed(1)))
          setFormCarbs(String(totalC.toFixed(1)))
          setFormFat(String(totalF.toFixed(1)))
          setFormFibre(String(totalFib.toFixed(1)))
          setFormPortion(String(totalG || 150))
          setAiCalculated(true)
        }
      }
    } catch (err) {
      console.error("AI analysis error:", err)
    } finally {
      setAiAnalyzing(false)
    }
  }

  const applyPreset = (preset: typeof COMMON_PRESETS[0]) => {
    setFormFoodName(preset.name)
    setFormCategory(preset.category)
    triggerAiAnalysis(preset.name)
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formFoodName.trim()) return
    setSubmitting(true)

    try {
      // If AI identified multiple distinct dishes, log them individually
      if (aiAnalysisResult?.items && aiAnalysisResult.items.length > 1) {
        for (const item of aiAnalysisResult.items) {
          await fetch("/api/food-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mealCategory: formCategory,
              foodName: item.foodName,
              estimatedPortionG: item.estimatedPortionG || 100,
              calories: item.calories || 0,
              proteinG: item.proteinG || 0,
              carbsG: item.carbsG || 0,
              fatG: item.fatG || 0,
              fibreG: item.fibreG || 0,
              isAiGenerated: true,
              isConfirmedByUser: true,
              aiConfidence: "high",
              notes: item.notes,
            }),
          })
        }
      } else {
        await fetch("/api/food-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealCategory: formCategory,
            foodName: formFoodName.trim(),
            estimatedPortionG: parseFloat(formPortion) || 100,
            calories: parseFloat(formCalories) || 0,
            proteinG: parseFloat(formProtein) || 0,
            carbsG: parseFloat(formCarbs) || 0,
            fatG: parseFloat(formFat) || 0,
            fibreG: parseFloat(formFibre) || 0,
            isAiGenerated: aiCalculated,
            isConfirmedByUser: true,
            aiConfidence: aiCalculated ? "high" : undefined,
          }),
        })
      }

      setShowAddModal(false)
      setFormFoodName("")
      setAiAnalysisResult(null)
      setAiCalculated(false)
      loadEntries()
    } catch (err) {
      console.error("Error creating entry:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.proteinG,
      carbs: acc.carbs + e.carbsG,
      fat: acc.fat + e.fatG,
      fibre: acc.fibre + (e.fibreG || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  )

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Food Journal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Your logged meals and daily nutritional breakdown
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => {
                setShowAddModal(true)
                setAiCalculated(false)
                setAiAnalysisResult(null)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Log a Meal
            </Button>
            <Button variant="outline" asChild>
              <Link href="/scanner">
                <Camera className="h-4 w-4 mr-1.5" /> Scan Photo
              </Link>
            </Button>
          </div>
        </div>

        {/* Today's Intake Summary Strip */}
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Journal Intake Roll-Up
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {entries.length} items logged
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-200/60 dark:border-amber-800/40">
                <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> Calories
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {Math.round(totals.calories)} <span className="text-xs font-normal text-slate-400">kcal</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <Egg className="h-3.5 w-3.5" /> Protein
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {totals.protein.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-200/60 dark:border-sky-800/40">
                <div className="text-xs text-sky-700 dark:text-sky-400 font-semibold flex items-center justify-center gap-1">
                  <Leaf className="h-3.5 w-3.5" /> Carbs
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {totals.carbs.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-200/60 dark:border-orange-800/40">
                <div className="text-xs text-orange-700 dark:text-orange-400 font-semibold flex items-center justify-center gap-1">
                  <Droplet className="h-3.5 w-3.5" /> Fat
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {totals.fat.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-200/60 dark:border-purple-800/40 col-span-2 sm:col-span-1">
                <div className="text-xs text-purple-700 dark:text-purple-400 font-semibold flex items-center justify-center gap-1">
                  <Leaf className="h-3.5 w-3.5" /> Fibre
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {totals.fibre.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Date */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Meals
          </Button>
          {MEAL_CATEGORIES.map((m) => (
            <Button
              key={m.id}
              variant={filter === m.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(m.id)}
            >
              {m.label}
            </Button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* AI-Powered Quick Log Bottom Sheet (Apple HIG phone-first modal) */}
        <BottomSheet
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="AI Food Logger"
          subtitle="Type what you ate — AI estimates protein & macros automatically"
        >
          <div className="space-y-4">
            {/* 1-Tap Food Suggestions */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Popular Dishes (1-Tap Fill)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition-colors text-slate-700 dark:text-slate-300 min-h-[36px] flex items-center touch-manipulation"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                  What did you eat? *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formFoodName}
                    onChange={(e) => setFormFoodName(e.target.value)}
                    placeholder="e.g. 2 Rotis with Dal Tadka and Rice"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => triggerAiAnalysis()}
                    disabled={aiAnalyzing || !formFoodName.trim()}
                    className="shrink-0 text-xs font-semibold px-3.5"
                  >
                    {aiAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        AI Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                  Meal Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                >
                  {MEAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* AI Estimated Live Macro Display */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    AI Calculated Macros
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Portion: {formPortion}g
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-amber-600 font-semibold block">Calories</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formCalories}
                    </span>
                    <span className="text-[10px] text-slate-400 block">kcal</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-emerald-600 font-semibold block">Protein</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formProtein}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">protein</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-sky-600 font-semibold block">Carbs</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formCarbs}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">carbs</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10px] text-orange-600 font-semibold block">Fat</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {formFat}g
                    </span>
                    <span className="text-[10px] text-slate-400 block">fat</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formFoodName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
                >
                  {submitting ? "Saving..." : "Save to Journal"}
                </Button>
              </div>
            </form>
          </div>
        </BottomSheet>

        {/* Entries List Grouped by Meal Category */}
        <div className="space-y-5">
          {MEAL_CATEGORIES.map((cat) => {
            const catEntries = entries.filter((e) => e.mealCategory === cat.id)
            if (catEntries.length === 0) return null
            const categoryCalories = catEntries.reduce((s, e) => s + (e.calories || 0), 0)

            return (
              <Card key={cat.id} className="overflow-hidden border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                <CardHeader className="py-3 px-4 sm:px-5 bg-slate-50/70 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      <cat.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {cat.label}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {catEntries.length} {catEntries.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="ml-auto font-mono text-xs">
                      {Math.round(categoryCalories)} kcal
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {catEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {entry.sourceImage && (
                            <img
                              src={entry.sourceImage.storageUrl}
                              alt={entry.foodName}
                              className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {entry.foodName}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>{entry.estimatedPortionG}g</span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">P: {entry.proteinG}g</span>
                              <span>•</span>
                              <span className="text-sky-600 dark:text-sky-400 font-medium">C: {entry.carbsG}g</span>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">F: {entry.fatG}g</span>
                              {entry.isAiGenerated && (
                                <Badge variant="success" className="text-[10px] py-0 px-1.5">
                                  AI Estimated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3 shrink-0 ml-3">
                          <span className="font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                            {Math.round(entry.calories)} kcal
                          </span>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {entries.length === 0 && !loading && (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Utensils className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No Meals Logged Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
                Type what you ate or snap a picture — the AI will figure out the calories, protein, and macros for you.
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <Button
                  onClick={() => {
                    setShowAddModal(true)
                    setAiCalculated(false)
                    setAiAnalysisResult(null)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4"
                >
                  <Plus className="h-4 w-4 mr-1" /> Log with AI
                </Button>
                <Button variant="outline" asChild size="sm" className="text-xs h-9 px-4">
                  <Link href="/scanner">
                    <Camera className="h-4 w-4 mr-1" /> Scan Food Photo
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
