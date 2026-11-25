"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  BottomSheet,
  Button,
  Input,
  Badge,
  Progress,
} from "@/components/ui/index"
import {
  Calendar,
  Trash2,
  Plus,
  Camera,
  Sparkles,
  Utensils,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Info,
  Clock,
  SlidersHorizontal,
} from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"
import { resolveNutritionTargets, type ResolvedNutritionTargets } from "@/lib/nutrition-targets"
import {
  apiAnalyzeFood,
  apiCreateFoodEntries,
  apiDeleteFoodEntry,
  apiFetchFoodEntries,
  apiFetchProfile,
  apiUpdateFoodEntry,
} from "@/lib/client-api"
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
  { name: "Oatmeal with Milk & Banana", category: "breakfast" },
  { name: "Chicken Curry with Rice", category: "dinner" },
]

export default function JournalPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [targets, setTargets] = useState<ResolvedNutritionTargets>(() =>
    resolveNutritionTargets(null)
  )
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [date, setDate] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  // Form state
  const [formFoodName, setFormFoodName] = useState("")
  const [formCategory, setFormCategory] = useState("lunch")
  const [formPortion, setFormPortion] = useState("150")
  const [formCalories, setFormCalories] = useState("250")
  const [formProtein, setFormProtein] = useState("10")
  const [formCarbs, setFormCarbs] = useState("35")
  const [formFat, setFormFat] = useState("6")
  const [formFibre, setFormFibre] = useState("4")
  const [formNotes, setFormNotes] = useState("")

  useEffect(() => {
    apiFetchProfile()
      .then((data) => {
        if (data?.targets) {
          setTargets(data.targets)
        } else if (data?.guidance) {
          setTargets(resolveNutritionTargets(data.guidance))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadEntries()
  }, [filter, date])

  async function loadEntries() {
    setLoading(true)
    try {
      const data = await apiFetchFoodEntries({ date, mealCategory: filter })
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Remove this entry from your journal?")) return
    try {
      await apiDeleteFoodEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  function openEditModal(entry: FoodEntry) {
    setEditingEntry(entry)
    setFormFoodName(entry.foodName)
    setFormCategory(entry.mealCategory)
    setFormPortion(String(entry.estimatedPortionG))
    setFormCalories(String(entry.calories))
    setFormProtein(String(entry.proteinG))
    setFormCarbs(String(entry.carbsG))
    setFormFat(String(entry.fatG))
    setFormFibre(String(entry.fibreG || 0))
    setFormNotes(entry.notes || "")
    setShowAddModal(true)
  }

  function openAddModal() {
    setEditingEntry(null)
    setFormFoodName("")
    setFormCategory("lunch")
    setFormPortion("150")
    setFormCalories("250")
    setFormProtein("10")
    setFormCarbs("35")
    setFormFat("6")
    setFormFibre("4")
    setFormNotes("")
    setShowAddModal(true)
  }

  function applyPreset(preset: { name: string; category: string }) {
    setFormFoodName(preset.name)
    setFormCategory(preset.category)
    triggerAiAnalysis(preset.name)
  }

  async function triggerAiAnalysis(dishName?: string) {
    const textToAnalyze = dishName || formFoodName
    if (!textToAnalyze.trim()) return

    setAiAnalyzing(true)
    try {
      const data = await apiAnalyzeFood({ textDescription: textToAnalyze })
      if (data && data.items && data.items.length > 0) {
        const first = data.items[0]
        setFormCalories(String(Math.round(first.calories || 250)))
        setFormProtein(String(first.proteinG || 10))
        setFormCarbs(String(first.carbsG || 35))
        setFormFat(String(first.fatG || 6))
        setFormFibre(String(first.fibreG || 4))
        setFormPortion(String(first.estimatedPortionG || 150))
      }
    } catch (err) {
      console.warn("AI analysis fallback", err)
    } finally {
      setAiAnalyzing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formFoodName.trim()) return
    setSubmitting(true)

    const payload = {
      foodName: formFoodName.trim(),
      mealCategory: formCategory,
      estimatedPortionG: Number(formPortion) || 100,
      calories: Number(formCalories) || 0,
      proteinG: Number(formProtein) || 0,
      carbsG: Number(formCarbs) || 0,
      fatG: Number(formFat) || 0,
      fibreG: Number(formFibre) || 0,
      notes: formNotes.trim() || null,
      isAiGenerated: true,
      isConfirmedByUser: true,
    }

    try {
      if (editingEntry) {
        await apiUpdateFoodEntry(editingEntry.id, payload)
      } else {
        await apiCreateFoodEntries(payload)
      }

      setShowAddModal(false)
      loadEntries()
    } catch (err) {
      console.error("Error saving entry:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.proteinG || 0),
      carbs: acc.carbs + (e.carbsG || 0),
      fat: acc.fat + (e.fatG || 0),
      fibre: acc.fibre + (e.fibreG || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  )

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#253745]/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
            Food Journal
          </h1>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Logged meals and nutritional breakdown with expandable details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openAddModal} className="rounded-full">
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Meal
          </Button>
          <Button variant="primary" size="sm" asChild className="rounded-full shadow-md">
            <Link href="/scanner">
              <Camera className="h-3.5 w-3.5 mr-1" /> Scan Plate
            </Link>
          </Button>
        </div>
      </div>

      {/* Daily Nutrition Roll-Up Strip (Compact) */}
      <Card className="p-4 bg-[#09131a] border border-[#253745]/60">
        <div className="flex items-center justify-between pb-2 border-b border-[#253745]/40 text-xs">
          <span className="font-medium text-[#9BA8AB]">Daily Intake Roll-Up</span>
          <div className="flex items-center gap-3">
            <Link
              href="/profile#targets"
              className="inline-flex items-center gap-1 text-[11px] text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Edit targets
            </Link>
            <span className="font-mono text-[#CCD0CF]">{entries.length} items logged</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-center">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 font-medium block">Calories</span>
            <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{Math.round(totals.calories)}</span>
            <span className="text-[10px] text-[#9BA8AB] block tabular-nums">/ {targets.calories.toLocaleString()} kcal</span>
            <Progress value={totals.calories} max={targets.calories} className="h-1 mt-1.5 bg-[#11212D]" barClassName="bg-amber-500" />
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 font-medium block">Protein</span>
            <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totals.protein.toFixed(1)}</span>
            <span className="text-[10px] text-[#9BA8AB] block tabular-nums">/ {targets.protein}g</span>
            <Progress value={totals.protein} max={targets.protein} className="h-1 mt-1.5 bg-[#11212D]" barClassName="bg-emerald-500" />
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-cyan-400 font-medium block">Carbs</span>
            <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totals.carbs.toFixed(1)}</span>
            <span className="text-[10px] text-[#9BA8AB] block tabular-nums">/ {targets.carbs}g</span>
            <Progress value={totals.carbs} max={targets.carbs} className="h-1 mt-1.5 bg-[#11212D]" barClassName="bg-cyan-500" />
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 font-medium block">Fat</span>
            <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totals.fat.toFixed(1)}</span>
            <span className="text-[10px] text-[#9BA8AB] block tabular-nums">/ {targets.fat}g</span>
            <Progress value={totals.fat} max={targets.fat} className="h-1 mt-1.5 bg-[#11212D]" barClassName="bg-amber-500" />
          </div>
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 col-span-2 sm:col-span-1 flex flex-col justify-between">
            <span className="text-[10px] text-violet-400 font-medium block">Fibre</span>
            <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totals.fibre.toFixed(1)}</span>
            <span className="text-[10px] text-[#9BA8AB] block tabular-nums">/ {targets.fibre}g</span>
            <Progress value={totals.fibre} max={targets.fibre} className="h-1 mt-1.5 bg-[#11212D]" barClassName="bg-violet-500" />
          </div>
        </div>
      </Card>

      {/* Filter and Date Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-8"
          >
            All
          </Button>
          {MEAL_CATEGORIES.map((m) => (
            <Button
              key={m.id}
              variant={filter === m.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(m.id)}
              className="text-xs h-8"
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-[#081219] px-2.5 py-1 rounded-xl border border-[#253745]/60 text-xs">
          <Calendar className="h-3.5 w-3.5 text-[#9BA8AB]" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-[#CCD0CF] text-xs outline-none cursor-pointer"
          />
          {date && (
            <button onClick={() => setDate("")} className="text-[#9BA8AB] hover:text-[#CCD0CF] ml-1">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Entries List Grouped by Meal Category */}
      <div className="space-y-4">
        {MEAL_CATEGORIES.map((cat) => {
          const catEntries = entries.filter((e) => e.mealCategory === cat.id)
          if (catEntries.length === 0) return null
          const categoryCalories = catEntries.reduce((s, e) => s + (e.calories || 0), 0)

          return (
            <Card key={cat.id} className="overflow-hidden bg-[#0f1b24] border border-[#253745]/60">
              {/* Category Header */}
              <div className="py-2.5 px-4 bg-[#09131a] border-b border-[#253745]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <cat.icon className="h-3.5 w-3.5 text-[#9BA8AB]" />
                  <span className="font-semibold text-xs text-[#CCD0CF]">{cat.label}</span>
                  <span className="text-[11px] text-[#9BA8AB]">
                    ({catEntries.length} {catEntries.length === 1 ? "item" : "items"})
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {Math.round(categoryCalories)} kcal
                </Badge>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#253745]/30">
                {catEntries.map((entry) => {
                  const isExpanded = expandedId === entry.id

                  return (
                    <div key={entry.id} className="transition-colors hover:bg-[#11212D]/40">
                      {/* Main Entry Row */}
                      <div className="flex items-center justify-between p-3 sm:px-4 gap-3">
                        {/* Food Thumbnail or Icon */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {entry.sourceImage?.storageUrl ? (
                            <img
                              src={entry.sourceImage.storageUrl}
                              alt={entry.foodName}
                              className="h-10 w-10 rounded-xl object-cover border border-[#253745] shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-[#11212D] border border-[#253745]/60 flex items-center justify-center text-xs font-semibold text-[#CCD0CF] shrink-0">
                              {entry.foodName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-xs sm:text-sm text-[#CCD0CF] block truncate">
                              {entry.foodName}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#9BA8AB] mt-0.5">
                              <span>{entry.estimatedPortionG}g</span>
                              <span>•</span>
                              <span className="text-emerald-400">P: {entry.proteinG}g</span>
                              <span>•</span>
                              <span className="text-cyan-400">C: {entry.carbsG}g</span>
                              <span>•</span>
                              <span className="text-amber-400">F: {entry.fatG}g</span>
                            </div>
                          </div>
                        </div>

                        {/* Calories & Action Controls */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-[#CCD0CF] font-mono tabular-nums">
                            {Math.round(entry.calories)} kcal
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="p-2 text-[#9BA8AB] hover:text-[#CCD0CF] rounded-lg transition-colors touch-manipulation"
                              title="Expand details"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(entry)}
                              className="p-2 text-[#9BA8AB] hover:text-[#CCD0CF] rounded-lg transition-colors touch-manipulation"
                              title="Edit item"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(entry.id)}
                              className="p-2 text-[#9BA8AB] hover:text-rose-400 rounded-lg transition-colors touch-manipulation"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 bg-[#09131a]/60 text-xs text-[#9BA8AB] border-t border-[#253745]/30 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                            <div>Portion: <span className="text-[#CCD0CF]">{entry.estimatedPortionG}g</span></div>
                            <div>Fibre: <span className="text-violet-400">{entry.fibreG || 0}g</span></div>
                            <div>Detection: <span className="text-[#CCD0CF]">{entry.isAiGenerated ? "AI Estimated" : "Manual Log"}</span></div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(entry.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          {entry.notes && (
                            <p className="text-[11px] text-[#CCD0CF]/80 italic pt-1">
                              Notes: {entry.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}

        {entries.length === 0 && !loading && (
          <Card className="border-dashed border-2 border-[#253745]/60 p-10 text-center rounded-2xl bg-[#06141B]/20">
            <Utensils className="h-8 w-8 text-[#9BA8AB]/40 mx-auto mb-2" />
            <h3 className="font-semibold text-[#CCD0CF] text-sm">No Food Entries Found</h3>
            <p className="text-xs text-[#9BA8AB] max-w-sm mx-auto mt-1 mb-4">
              {date ? "No entries logged on this selected date." : "Your journal is empty. Log a meal or scan your plate to start tracking."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Meal
              </Button>
              <Button variant="accent" size="sm" asChild>
                <Link href="/scanner">
                  <Camera className="h-3.5 w-3.5 mr-1" /> Scan Food
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Add / Edit Food Item Bottom Sheet Modal */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingEntry ? "Edit Food Entry" : "Log Food Entry"}
      >
        <div className="space-y-4">
          {!editingEntry && (
            <div>
              <p className="text-[10px] font-semibold text-[#9BA8AB] uppercase tracking-wider mb-2">
                Quick 1-Tap Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#253745] bg-[#11212D]/60 hover:bg-[#182C3D] hover:text-white transition-colors text-[#CCD0CF]"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Dish or Food Name *
              </label>
              <div className="flex gap-2">
                <Input
                  value={formFoodName}
                  onChange={(e) => setFormFoodName(e.target.value)}
                  placeholder="e.g. 2 Rotis with Dal Tadka"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => triggerAiAnalysis()}
                  disabled={aiAnalyzing || !formFoodName.trim()}
                  className="shrink-0 text-xs"
                >
                  {aiAnalyzing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-[#CCD0CF]" />
                      Estimate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#081219] px-3 text-xs text-[#CCD0CF] border border-[#253745]/60 focus:outline-none"
                >
                  {MEAL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                  Portion (grams)
                </label>
                <Input
                  type="number"
                  value={formPortion}
                  onChange={(e) => setFormPortion(e.target.value)}
                  className="h-10 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-amber-400 block mb-1">Calories (kcal)</label>
                <Input
                  type="number"
                  value={formCalories}
                  onChange={(e) => setFormCalories(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-emerald-400 block mb-1">Protein (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formProtein}
                  onChange={(e) => setFormProtein(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-cyan-400 block mb-1">Carbs (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formCarbs}
                  onChange={(e) => setFormCarbs(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-amber-400 block mb-1">Fat (g)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formFat}
                  onChange={(e) => setFormFat(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#253745]/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-full shadow-md"
                disabled={submitting || !formFoodName.trim()}
              >
                {submitting ? "Saving..." : editingEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </div>
          </form>
        </div>
      </BottomSheet>
    </div>
  )
}
