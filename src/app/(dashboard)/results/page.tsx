"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/index"
import { Input } from "@/components/ui/index"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/index"
import { Badge } from "@/components/ui/index"
import { CheckCircle2, Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"

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
      const results = await Promise.all(
        items.map((item) =>
          fetch("/api/food-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mealCategory,
              foodName: item.foodName,
              estimatedPortionG: item.estimatedPortionG || 100,
              calories: item.calories || 0,
              proteinG: item.proteinG || 0,
              carbsG: item.carbsG || 0,
              fatG: item.fatG || 0,
              fibreG: item.fibreG || 0,
              aiConfidence: item.confidence as any,
              isAiGenerated: true,
              isConfirmedByUser: true,
              notes,
            }),
          })
        )
      )

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) {
        throw new Error("Failed to save some items")
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
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] text-center p-8">
        <div className="h-16 w-16 rounded-full bg-[#166534]/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-[#166534]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc] mb-2">
          Meal added to journal
        </h2>
        <p className="text-[#64748b] dark:text-[#94a3b8] mb-6">
          Your confirmed meal has been saved to today's food journal.
        </p>
        <Button onClick={() => router.push("/journal")}>
          View journal
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/scanner")}
          className="mt-3"
        >
          Scan another
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push("/scanner")}
            className="flex items-center gap-2 text-[#0f172a] dark:text-[#f8fafc] hover:text-[#38bdf8]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc] ml-auto">
            Confirm your meal
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Review & edit before saving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-4">
              Adjust portions or correct food names. Nothing is saved until you confirm.
            </p>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.foodName}
                        onChange={(e) => updateItem(idx, "foodName", e.target.value)}
                        className="w-40 text-sm border-0 bg-transparent focus:ring-0"
                      />
                      <Badge
                        variant={
                          item.confidence === "high"
                            ? "success"
                            : item.confidence === "medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {item.confidence}
                      </Badge>
                    </div>
                    <button
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-[#64748b] hover:text-[#ef4444]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Portion (g)</span>
                      <Input
                        type="number"
                        value={item.estimatedPortionG || ""}
                        onChange={(e) =>
                          updateItem(idx, "estimatedPortionG", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-sm border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Calories</span>
                      <Input
                        type="number"
                        value={item.calories || ""}
                        onChange={(e) =>
                          updateItem(idx, "calories", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-sm border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Protein</span>
                      <Input
                        type="number"
                        value={item.proteinG || ""}
                        onChange={(e) =>
                          updateItem(idx, "proteinG", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-sm border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Carbs</span>
                      <Input
                        type="number"
                        value={item.carbsG || ""}
                        onChange={(e) =>
                          updateItem(idx, "carbsG", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-sm border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">Fat</span>
                      <Input
                        type="number"
                        value={item.fatG || ""}
                        onChange={(e) =>
                          updateItem(idx, "fatG", parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-sm border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                  </div>
                  {item.notes && (
                    <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8] italic">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}

              <button
                onClick={() => setItems((prev) => [...prev, { foodName: "" }])}
                className="flex items-center gap-2 text-[#0f172a] dark:text-[#f8fafc] text-sm font-medium hover:text-[#38bdf8]"
              >
                <Plus className="h-4 w-4" /> Add another item
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#e2e8f0] dark:border-[#334155]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">Meal category</span>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value)}
                  className="rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-3 py-1.5 text-sm text-[#0f172a] dark:text-[#f8fafc] focus:ring-2 focus:ring-[#0f172a]"
                >
                  {MEAL_CATEGORIES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f172a] dark:text-[#f8fafc] mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] px-3 py-1.5 text-sm text-[#0f172a] dark:text-[#f8fafc] focus:ring-2 focus:ring-[#0f172a]"
                />
              </div>
            </div>
          </CardContent>
          <CardContent>
            <div className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-[#f1f5f9] dark:bg-[#1e293b] p-4">
              <h4 className="font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-2">Estimated totals</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">Calories</div>
                  <div className="font-bold">{Math.round(totals.calories)} kcal</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">Protein</div>
                  <div className="font-bold">{totals.protein.toFixed(1)} g</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">Carbs</div>
                  <div className="font-bold">{totals.carbs.toFixed(1)} g</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">Fat</div>
                  <div className="font-bold">{totals.fat.toFixed(1)} g</div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">Fibre</div>
                  <div className="font-bold">{totals.fibre.toFixed(1)} g</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="w-full"
            >
              {saving ? (
                <>
                  <Save className="h-4 w-4 animate-spin mr-2" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Confirm & Add to Journal
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#fca5a5] text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
