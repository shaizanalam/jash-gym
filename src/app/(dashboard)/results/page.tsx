"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardFooter, Badge } from "@/components/ui/index"
import { CheckCircle2, Plus, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"
import Link from "next/link"

interface AnalysisItem {
  foodName: string
  alternativeNames?: string[]
  category?: string
  estimatedPortionG?: number
  servingUnit?: string
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  fibreG?: number
  confidence?: string
  notes?: string
}

interface AnalysisData {
  items: AnalysisItem[]
  uncertainty?: string
  requiresClarification?: boolean
  clarificationQuestion?: string
}

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<AnalysisItem[]>([])
  const [mealCategory, setMealCategory] = useState<string>("lunch")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("dietscan_pending_scan")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.analysis?.items) {
            setItems(parsed.analysis.items)
            return
          }
        }
      }
    } catch (e) {
      console.warn("Error reading from sessionStorage", e)
    }

    const raw = searchParams.get("analysis")
    if (raw) {
      try {
        const data: AnalysisData = JSON.parse(raw)
        setItems(data.items || [])
      } catch {
        setError("Invalid analysis data")
      }
    }
  }, [searchParams])

  const totals = {
    calories: items.reduce((s, i) => s + (i.calories || 0), 0),
    protein: items.reduce((s, i) => s + (i.proteinG || 0), 0),
    carbs: items.reduce((s, i) => s + (i.carbsG || 0), 0),
    fat: items.reduce((s, i) => s + (i.fatG || 0), 0),
    fibre: items.reduce((s, i) => s + (i.fibreG || 0), 0),
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = items.map((item) => ({
        mealCategory,
        foodName: item.foodName || "Meal Item",
        estimatedPortionG: Number(item.estimatedPortionG) || 100,
        calories: Number(item.calories) || 0,
        proteinG: Number(item.proteinG) || 0,
        carbsG: Number(item.carbsG) || 0,
        fatG: Number(item.fatG) || 0,
        fibreG: Number(item.fibreG) || 0,
        aiConfidence: item.confidence as any,
        isAiGenerated: true,
        isConfirmedByUser: true,
        notes: notes.trim() || null,
      }))

      const res = await fetch("/api/food-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to save meal items")
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (index: number, field: keyof AnalysisItem, value: any) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  if (saved) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-[#CCD0CF]">
          Meal Added to Journal
        </h2>
        <p className="text-xs text-[#9BA8AB] leading-relaxed">
          Your meal items and nutritional breakdown have been saved to your food journal.
        </p>
        <div className="flex items-center gap-2.5 pt-2">
          <Button variant="accent" onClick={() => router.push("/journal")}>
            View Food Journal
          </Button>
          <Button variant="outline" onClick={() => router.push("/scanner")}>
            Scan Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 w-full">
      <div className="flex items-center justify-between pb-2 border-b border-[#253745]/40">
        <button
          onClick={() => router.push("/scanner")}
          className="flex items-center gap-1.5 text-xs text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Scanner
        </button>
        <h1 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
          Confirm Meal Details
        </h1>
      </div>

      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#CCD0CF]">
            Review & Adjust Before Saving
          </h3>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Adjust portion sizes or food names. Nothing is committed to your log until you confirm.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#253745]/50 bg-[#06141B]/50 p-3 sm:p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={item.foodName}
                    onChange={(e) => updateItem(idx, "foodName", e.target.value)}
                    className="font-medium text-xs sm:text-sm text-[#CCD0CF]"
                    placeholder="Food item name"
                  />
                  {item.confidence && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.confidence}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1.5 text-[#9BA8AB] hover:text-rose-400 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#9BA8AB] block mb-1">Portion (g)</span>
                  <Input
                    type="number"
                    value={item.estimatedPortionG || ""}
                    onChange={(e) => updateItem(idx, "estimatedPortionG", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block mb-1">Calories (kcal)</span>
                  <Input
                    type="number"
                    value={item.calories || ""}
                    onChange={(e) => updateItem(idx, "calories", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block mb-1">Protein (g)</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.proteinG || ""}
                    onChange={(e) => updateItem(idx, "proteinG", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-cyan-400 block mb-1">Carbs (g)</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.carbsG || ""}
                    onChange={(e) => updateItem(idx, "carbsG", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 block mb-1">Fat (g)</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={item.fatG || ""}
                    onChange={(e) => updateItem(idx, "fatG", parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setItems((prev) => [...prev, { foodName: "Added Item", estimatedPortionG: 100, calories: 150, proteinG: 5, carbsG: 20, fatG: 5 }])}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Dish Item
          </Button>
        </div>

        {/* Meal Category & Notes */}
        <div className="pt-3 border-t border-[#253745]/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">Meal Category</label>
            <select
              value={mealCategory}
              onChange={(e) => setMealCategory(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#081219] px-3 text-xs text-[#CCD0CF] border border-[#253745]/60 focus:outline-none"
            >
              {MEAL_CATEGORIES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Home cooked, lightly salted"
              className="h-10 text-xs"
            />
          </div>
        </div>

        {/* Nutrition Roll-Up Card */}
        <div className="p-3.5 rounded-xl bg-[#09131a] border border-[#253745]/60">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-amber-400 block">Calories</span>
              <span className="font-bold text-[#CCD0CF] font-mono">{Math.round(totals.calories)} kcal</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block">Protein</span>
              <span className="font-bold text-[#CCD0CF] font-mono">{totals.protein.toFixed(1)}g</span>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 block">Carbs</span>
              <span className="font-bold text-[#CCD0CF] font-mono">{totals.carbs.toFixed(1)}g</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block">Fat</span>
              <span className="font-bold text-[#CCD0CF] font-mono">{totals.fat.toFixed(1)}g</span>
            </div>
            <div>
              <span className="text-[10px] text-violet-400 block">Fibre</span>
              <span className="font-bold text-[#CCD0CF] font-mono">{totals.fibre.toFixed(1)}g</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="accent"
            size="lg"
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving Meal...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Confirm & Add to Food Journal
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
            {error}
          </div>
        )}
      </Card>
    </div>
  )
}
