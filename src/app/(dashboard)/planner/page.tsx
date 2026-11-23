"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, BottomSheet } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { Badge } from "@/components/ui/index"
import { Input } from "@/components/ui/index"
import {
  Plus,
  Check,
  Clock,
  Sun,
  Coffee,
  Apple,
  Moon,
  Cupcake,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface MealPlanItem {
  id: string
  mealCategory: string
  plannedTime?: string | null
  foodName: string
  portionG?: number | null
  isCompleted: boolean
  completedAt?: string | null
  notes?: string | null
}

const MEAL_ICONS: Record<string, typeof Clock> = {
  breakfast: Sun,
  mid_morning_snack: Coffee,
  lunch: Apple,
  evening_snack: Cupcake,
  dinner: Moon,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  breakfast: {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/60 dark:border-amber-800/60",
  },
  mid_morning_snack: {
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200/60 dark:border-orange-800/60",
  },
  lunch: {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-800/60",
  },
  evening_snack: {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200/60 dark:border-purple-800/60",
  },
  dinner: {
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200/60 dark:border-indigo-800/60",
  },
}

export default function PlannerPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [loading, setLoading] = useState(true)

  // Native Add Item Modal state (replaces archaic window.prompt)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("breakfast")
  const [newItemName, setNewItemName] = useState("")
  const [newItemTime, setNewItemTime] = useState("")
  const [newItemPortion, setNewItemPortion] = useState("")
  const [savingItem, setSavingItem] = useState(false)

  useEffect(() => {
    loadItems()
  }, [date])

  async function loadItems() {
    setLoading(true)
    try {
      const res = await fetch(`/api/meal-plans?date=${date}`)
      const data = await res.json()
      const flat = (data as any[]).flatMap((plan: any) =>
        (plan.items || []).map((item: any) => ({ ...item, planId: plan.id }))
      )
      setItems(flat)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isCompleted: completed } : i))
    )

    try {
      await fetch(`/api/meal-plan-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCompleted: completed,
          completedAt: completed ? new Date().toISOString() : null,
        }),
      })
    } catch (e) {
      console.error(e)
      loadItems()
    }
  }

  function openAddModal(category: string) {
    setSelectedCategory(category)
    setNewItemName("")
    setNewItemTime("")
    setNewItemPortion("")
    setModalOpen(true)
  }

  async function handleSaveNewItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim()) return

    setSavingItem(true)
    try {
      const portionNum = newItemPortion ? parseInt(newItemPortion, 10) : null
      await fetch("/api/meal-plan-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealPlanId: date,
          mealCategory: selectedCategory,
          plannedTime: newItemTime || null,
          foodName: newItemName.trim(),
          portionG: isNaN(portionNum as number) ? null : portionNum,
          isCompleted: false,
          notes: "",
        }),
      })
      setModalOpen(false)
      loadItems()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingItem(false)
    }
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await fetch(`/api/meal-plan-items/${id}`, { method: "DELETE" })
    } catch (e) {
      console.error(e)
      loadItems()
    }
  }

  // Quick date navigation
  function adjustDate(days: number) {
    const current = new Date(date)
    current.setDate(current.getDate() + days)
    setDate(current.toISOString().split("T")[0])
  }

  function setToday() {
    setDate(new Date().toISOString().split("T")[0])
  }

  const completedCount = items.filter((i) => i.isCompleted).length
  const totalCount = items.length
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">
      {/* Header and Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Meal Planner & Routine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Plan your daily nutrition rhythm and check off meals as you nourish yourself.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustDate(-1)}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={setToday}
            className="text-xs font-semibold px-2.5 h-8"
          >
            Today
          </Button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustDate(1)}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Progress Card */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/70 dark:border-emerald-900/40">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Routine Completion
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {totalCount === 0
                  ? "No meals planned for this date yet. Add meals below to start your day's plan."
                  : `${completedCount} of ${totalCount} meals completed today (${completionPct}%)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={completionPct === 100 && totalCount > 0 ? "success" : "secondary"} className="text-xs font-mono font-bold">
                {completedCount} / {totalCount} Completed
              </Badge>
            </div>
          </div>

          {/* Smooth animated progress bar */}
          <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meal Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MEAL_CATEGORIES.map((cat) => {
          const catItems = items.filter((i) => i.mealCategory === cat.id)
          const Icon = MEAL_ICONS[cat.id] || Clock
          const colors = CATEGORY_COLORS[cat.id] || {
            bg: "bg-slate-100",
            text: "text-slate-700",
            border: "border-slate-200",
          }
          const allCompleted = catItems.length > 0 && catItems.every((i) => i.isCompleted)

          return (
            <Card key={cat.id} className="flex flex-col justify-between overflow-hidden shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {catItems.length} {catItems.length === 1 ? "dish" : "dishes"} planned
                      </span>
                    </div>
                  </div>

                  {catItems.length > 0 && (
                    <Badge variant={allCompleted ? "success" : "secondary"} className="text-[11px]">
                      {catItems.filter((i) => i.isCompleted).length}/{catItems.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {/* Items List */}
              <CardContent className="flex-1 p-3.5 space-y-2 min-h-[140px] max-h-[260px] overflow-y-auto">
                {catItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-400">
                    <Icon className="h-6 w-6 mb-1.5 opacity-30" />
                    <span className="text-xs">Nothing planned yet</span>
                  </div>
                ) : (
                  catItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150",
                        item.isCompleted
                          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40"
                          : "bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      {/* Checkbox & Item Name */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleComplete(item.id, !item.isCompleted)}
                          className={cn(
                            "h-5 w-5 rounded-lg border flex items-center justify-center transition-all duration-150 active:scale-90 shrink-0 cursor-pointer",
                            item.isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800"
                          )}
                          aria-label={`Mark ${item.foodName} as ${item.isCompleted ? "incomplete" : "complete"}`}
                        >
                          {item.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "text-sm font-medium block truncate transition-all",
                              item.isCompleted
                                ? "text-slate-400 dark:text-slate-500 line-through"
                                : "text-slate-800 dark:text-slate-100"
                            )}
                          >
                            {item.foodName}
                          </span>
                          {(item.portionG || item.plannedTime) && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              {item.portionG ? `${item.portionG}g` : ""}
                              {item.portionG && item.plannedTime ? "•" : ""}
                              {item.plannedTime ? (
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {item.plannedTime}
                                </span>
                              ) : null}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0"
                        title="Remove dish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>

              {/* Add item button */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddModal(cat.id)}
                  className="w-full text-xs font-semibold py-1.5 h-8 border-dashed"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add to {cat.label}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Native Add Dish Bottom Sheet (Apple HIG phone-first sheet) */}
      <BottomSheet
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Planned Meal"
        subtitle={`Category: ${MEAL_CATEGORIES.find((c) => c.id === selectedCategory)?.label}`}
      >
        <form onSubmit={handleSaveNewItem} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
              Dish or Food Name *
            </label>
            <Input
              autoFocus
              required
              placeholder="e.g. 2 Rotis with Palak Dal"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {["Roti & Dal", "Oats & Fruits", "Paneer Salad", "Rice & Sambar", "Boiled Eggs"].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setNewItemName(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors min-h-[36px] flex items-center touch-manipulation"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Planned Time (Optional)
              </label>
              <Input
                type="time"
                value={newItemTime}
                onChange={(e) => setNewItemTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Portion (g, Optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 200"
                value={newItemPortion}
                onChange={(e) => setNewItemPortion(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingItem || !newItemName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
            >
              {savingItem ? "Adding..." : "Add to Plan"}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
