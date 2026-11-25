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
  Badge,
  Input,
  Progress,
} from "@/components/ui/index"
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
} from "lucide-react"
import { MEAL_CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  apiCreateMealPlanItem,
  apiDeleteMealPlanItem,
  apiFetchMealPlans,
  apiUpdateMealPlanItem,
} from "@/lib/client-api"

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

export default function PlannerPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<MealPlanItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add Item Modal state
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
      const data = (await apiFetchMealPlans(date)) as Array<{
        id: string
        items?: MealPlanItem[]
      }>
      const flat = data.flatMap((plan) =>
        (plan.items || []).map((item) => ({ ...item, planId: plan.id }))
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
      await apiUpdateMealPlanItem(id, {
        isCompleted: completed,
        completedAt: completed ? new Date().toISOString() : null,
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
      await apiCreateMealPlanItem({
        mealPlanId: date,
        mealCategory: selectedCategory,
        plannedTime: newItemTime || null,
        foodName: newItemName.trim(),
        portionG: isNaN(portionNum as number) ? null : portionNum,
        isCompleted: false,
        notes: "",
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
      await apiDeleteMealPlanItem(id)
    } catch (e) {
      console.error(e)
      loadItems()
    }
  }

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
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 max-w-5xl w-full mx-auto">
      {/* Header & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#253745]/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
            Meal Planner
          </h1>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Plan your daily nutrition routine and track completed meals.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-1.5 bg-[#09131a] p-1 rounded-xl border border-[#253745]/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustDate(-1)}
            aria-label="Previous day"
            className="h-7 w-7 rounded-lg"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={setToday}
            className="text-xs font-medium px-2 h-7"
          >
            Today
          </Button>

          <div className="flex items-center gap-1 px-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#9BA8AB]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#CCD0CF] border-none outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustDate(1)}
            aria-label="Next day"
            className="h-7 w-7 rounded-lg"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Routine Completion Progress Card (Compact) */}
      <Card className="p-4 bg-[#09131a] border border-[#253745]/60">
        <div className="flex items-center justify-between pb-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-[#CCD0CF]">Day&apos;s Progress</span>
            <span className="text-[#9BA8AB]">
              {totalCount === 0
                ? "Plan meals ahead for the day — tap + Add on any slot below"
                : `${completedCount} of ${totalCount} dishes completed (${completionPct}%)`}
            </span>
          </div>
          {totalCount > 0 && (
            <Badge variant={completionPct === 100 ? "success" : "outline"} className="text-[10px] font-mono">
              {completedCount}/{totalCount} Done
            </Badge>
          )}
        </div>

        <Progress
          value={completedCount}
          max={totalCount || 1}
          className="h-1.5 bg-[#11212D]"
          barClassName="bg-emerald-500"
        />
      </Card>

      {/* Meal Categories Grid */}
      <div className="space-y-3">
        {MEAL_CATEGORIES.map((cat) => {
          const catItems = items.filter((i) => i.mealCategory === cat.id)
          const Icon = MEAL_ICONS[cat.id] || Clock
          const isPopulated = catItems.length > 0
          const allCompleted = isPopulated && catItems.every((i) => i.isCompleted)
          const totalPortion = catItems.reduce((s, i) => s + (i.portionG || 0), 0)

          // Significantly smaller empty card (~54px) vs populated card (~120px)
          if (!isPopulated) {
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-[#253745]/50 bg-[#09131a]/40 hover:border-[#4A5C6A]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#11212D] border border-[#253745]/50 flex items-center justify-center text-[#9BA8AB]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#CCD0CF] block">{cat.label}</span>
                    <span className="text-[10px] text-[#9BA8AB]">No dishes planned</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAddModal(cat.id)}
                  className="text-xs h-7 px-2.5 text-[#9BA8AB] hover:text-[#CCD0CF]"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            )
          }

          // Populated Card: Compact & Refined
          return (
            <Card key={cat.id} className="overflow-hidden bg-[#0f1b24] border border-[#253745]/60">
              {/* Header */}
              <div className="py-2.5 px-4 bg-[#09131a] border-b border-[#253745]/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#182C3D] border border-[#253745] flex items-center justify-center text-[#CCD0CF]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#CCD0CF] block">{cat.label}</span>
                    <span className="text-[10px] text-[#9BA8AB]">
                      {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                      {totalPortion > 0 ? ` • ${totalPortion}g total` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={allCompleted ? "success" : "outline"} className="text-[10px]">
                    {catItems.filter((i) => i.isCompleted).length}/{catItems.length}
                  </Badge>
                  <button
                    onClick={() => openAddModal(cat.id)}
                    className="p-1 rounded-md text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] transition-colors"
                    title={`Add dish to ${cat.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#253745]/30 p-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#11212D]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleComplete(item.id, !item.isCompleted)}
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer",
                          item.isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-[#06141B]"
                            : "border-[#253745] bg-[#081219] hover:border-[#4A5C6A]"
                        )}
                        aria-label={`Mark ${item.foodName} as ${item.isCompleted ? "incomplete" : "complete"}`}
                      >
                        {item.isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-xs font-medium block truncate",
                            item.isCompleted ? "text-[#9BA8AB] line-through" : "text-[#CCD0CF]"
                          )}
                        >
                          {item.foodName}
                        </span>
                        {(item.portionG || item.plannedTime) && (
                          <span className="text-[10px] text-[#9BA8AB] flex items-center gap-1.5">
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

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-[#9BA8AB] hover:text-rose-400 opacity-75 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity ml-2 shrink-0 touch-manipulation"
                      title="Remove dish"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Item Bottom Sheet */}
      <BottomSheet
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add to ${MEAL_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Meal Plan"}`}
      >
        <form onSubmit={handleSaveNewItem} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
              Dish Name *
            </label>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Scrambled Eggs & Avocado Toast"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Planned Time (optional)
              </label>
              <Input
                type="time"
                value={newItemTime}
                onChange={(e) => setNewItemTime(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9BA8AB] block mb-1">
                Portion in Grams (optional)
              </label>
              <Input
                type="number"
                placeholder="e.g. 200"
                value={newItemPortion}
                onChange={(e) => setNewItemPortion(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#253745]/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-full shadow-md"
              disabled={savingItem || !newItemName.trim()}
            >
              {savingItem ? "Adding..." : "Add to Routine"}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
