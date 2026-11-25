"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Calendar,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  User,
  Settings,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  AiButton,
  Badge,
  Progress,
} from "@/components/ui/index"
import { DashboardTrendChart } from "@/components/charts/nutrition-charts"
import { MEAL_CATEGORIES } from "@/lib/constants"
import { startOfDayIST } from "@/lib/dates"
import { resolveNutritionTargets, type GuidanceRecord } from "@/lib/nutrition-targets"
import { useAppSession } from "@/components/providers"
import {
  getLocalDashboardData,
  getLocalStoreVersion,
  subscribeLocalStore,
} from "@/lib/local-store"

export interface DashboardFoodEntry {
  id: string
  foodName: string
  estimatedPortionG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG?: number | null
  mealCategory: string
  loggedAt: string
}

export interface DashboardInitialData {
  userName: string
  entries: DashboardFoodEntry[]
  weekEntries: DashboardFoodEntry[]
  guidance: GuidanceRecord | null
}

const serverSnapshot = () => -1

export function DashboardView({ initialData }: { initialData?: DashboardInitialData }) {
  const { data: session } = useAppSession()
  const userId = session?.user?.id
  const storeVersion = React.useSyncExternalStore(
    subscribeLocalStore,
    getLocalStoreVersion,
    serverSnapshot
  )

  const data = React.useMemo<DashboardInitialData | null>(() => {
    if (initialData) return initialData
    if (storeVersion >= 0 && userId) {
      return getLocalDashboardData(userId)
    }
    return null
  }, [initialData, storeVersion, userId])

  const entries = data?.entries || []
  const weekEntries = data?.weekEntries || []
  const guidance = data?.guidance || null

  const today = startOfDayIST()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const daysMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split("T")[0]
    daysMap[key] = 0
  }
  for (const item of weekEntries) {
    const key = new Date(item.loggedAt).toISOString().split("T")[0]
    if (daysMap[key] !== undefined) {
      daysMap[key] += item.calories || 0
    }
  }

  const weeklyTrend = Object.entries(daysMap).map(([key, calories]) => {
    const d = new Date(key)
    return {
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      calories: Math.round(calories),
    }
  })

  const loggedCaloriesList = Object.values(daysMap).filter((c) => c > 0)
  const averageDailyCalories = loggedCaloriesList.length
    ? Math.round(loggedCaloriesList.reduce((a, b) => a + b, 0) / loggedCaloriesList.length)
    : 0

  const summary = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.proteinG || 0),
      carbs: acc.carbs + (e.carbsG || 0),
      fat: acc.fat + (e.fatG || 0),
      fibre: acc.fibre + (e.fibreG || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  )

  const targets = resolveNutritionTargets(guidance)
  const targetCalories = targets.calories
  const targetProtein = targets.protein
  const targetCarbs = targets.carbs
  const targetFat = targets.fat
  const targetFibre = targets.fibre

  const remainingCalories = Math.max(0, targetCalories - summary.calories)
  const caloriePercent = Math.min(100, Math.round((summary.calories / targetCalories) * 100))

  const byMeal = MEAL_CATEGORIES.map((cat) => {
    const items = entries.filter((e) => e.mealCategory === cat.id)
    const total = items.reduce((s, e) => s + (e.calories || 0), 0)
    return { ...cat, count: items.length, calories: total, items }
  })

  const currentHour = new Date().getHours()
  let greetingTime = "Good day"
  if (currentHour < 12) greetingTime = "Good morning"
  else if (currentHour < 17) greetingTime = "Good afternoon"
  else greetingTime = "Good evening"

  const displayName = data?.userName || session?.user?.name || "there"
  const firstName = displayName ? displayName.split(" ")[0] : "there"
  const formattedToday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date())

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#9BA8AB] font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedToday}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight mt-1">
              {greetingTime}, {firstName}
            </h1>
          </div>

          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <Link
              href="/profile"
              aria-label="Profile and nutrition targets"
              className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#11212D] text-[#CCD0CF] border border-[#253745] hover:bg-[#182C3D] active:scale-[0.96] transition-all touch-manipulation"
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              href="/settings"
              aria-label="Settings and privacy"
              className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#11212D] text-[#CCD0CF] border border-[#253745] hover:bg-[#182C3D] active:scale-[0.96] transition-all touch-manipulation"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild size="sm" className="rounded-full">
            <Link href="/profile#targets">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-[#9BA8AB]" />
              <span>Targets</span>
            </Link>
          </Button>
          <Button variant="secondary" asChild size="sm" className="rounded-full">
            <Link href="/journal">
              <Plus className="h-3.5 w-3.5 mr-1 text-[#9BA8AB]" />
              <span>Log Food</span>
            </Link>
          </Button>
          <AiButton href="/scanner" size="sm">Scan Food</AiButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        <Card glass hoverable className="md:col-span-4 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-[#9BA8AB]">Daily Calories</span>
            <Badge variant="amber" className="text-[10px]">
              {caloriePercent}% target
            </Badge>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-[#CCD0CF] tabular-nums">
                {Math.round(summary.calories).toLocaleString()}
              </span>
              <span className="text-xs text-[#9BA8AB]">/ {targetCalories.toLocaleString()} kcal</span>
            </div>
            <p className="text-[11px] text-[#9BA8AB] mt-0.5">
              {remainingCalories > 0
                ? `${Math.round(remainingCalories).toLocaleString()} kcal remaining today`
                : `${Math.round(summary.calories - targetCalories)} kcal over target`}
            </p>
          </div>

          <div className="pt-2">
            <Progress
              value={summary.calories}
              max={targetCalories}
              className="h-2 bg-[#11212D]"
              barClassName="bg-amber-500"
            />
          </div>
        </Card>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Card glass hoverable className="p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9BA8AB]">Protein</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="my-1.5">
              <div className="text-lg font-bold text-[#CCD0CF] tabular-nums">
                {summary.protein.toFixed(1)} <span className="text-xs font-normal text-[#9BA8AB]">g</span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] block truncate">
                Target: {targetProtein}g
              </span>
            </div>
            <Progress
              value={summary.protein}
              max={targetProtein}
              className="h-1 bg-[#11212D]"
              barClassName="bg-emerald-500"
            />
          </Card>

          <Card glass hoverable className="p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9BA8AB]">Carbs</span>
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
            </div>
            <div className="my-1.5">
              <div className="text-lg font-bold text-[#CCD0CF] tabular-nums">
                {summary.carbs.toFixed(1)} <span className="text-xs font-normal text-[#9BA8AB]">g</span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] block truncate">
                Target: {targetCarbs}g
              </span>
            </div>
            <Progress
              value={summary.carbs}
              max={targetCarbs}
              className="h-1 bg-[#11212D]"
              barClassName="bg-cyan-500"
            />
          </Card>

          <Card glass hoverable className="p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9BA8AB]">Fat</span>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <div className="my-1.5">
              <div className="text-lg font-bold text-[#CCD0CF] tabular-nums">
                {summary.fat.toFixed(1)} <span className="text-xs font-normal text-[#9BA8AB]">g</span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] block truncate">
                Target: {targetFat}g
              </span>
            </div>
            <Progress
              value={summary.fat}
              max={targetFat}
              className="h-1 bg-[#11212D]"
              barClassName="bg-amber-500"
            />
          </Card>

          <Card glass hoverable className="p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9BA8AB]">Fibre</span>
              <span className="h-2 w-2 rounded-full bg-violet-500" />
            </div>
            <div className="my-1.5">
              <div className="text-lg font-bold text-[#CCD0CF] tabular-nums">
                {summary.fibre.toFixed(1)} <span className="text-xs font-normal text-[#9BA8AB]">g</span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] block truncate">
                Target: {targetFibre}g
              </span>
            </div>
            <Progress
              value={summary.fibre}
              max={targetFibre}
              className="h-1 bg-[#11212D]"
              barClassName="bg-violet-500"
            />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card glass hoverable className="lg:col-span-7 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Weekly Intake Trend</CardTitle>
                <CardDescription>7-day daily calorie logs vs {targetCalories.toLocaleString()} kcal target</CardDescription>
              </div>
              {averageDailyCalories > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Logged Avg: {averageDailyCalories} kcal/day
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex-1 flex flex-col justify-center">
            <DashboardTrendChart data={weeklyTrend} targetCalories={targetCalories} />
          </CardContent>
        </Card>

        <Card glass hoverable className="lg:col-span-5 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Today&apos;s Meal Progress</CardTitle>
                <CardDescription>
                  {byMeal.filter((m) => m.count > 0).length} of {byMeal.length} categories logged
                </CardDescription>
              </div>
              <Link
                href="/journal"
                className="text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center gap-1"
              >
                <span>Journal</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="pt-1 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              {byMeal.map((meal) => {
                const isLogged = meal.count > 0

                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#253745]/40 bg-[#06141B]/30 hover:bg-[#06141B]/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                          isLogged
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-[#11212D] text-[#9BA8AB] border border-[#253745]/50"
                        }`}
                      >
                        {isLogged ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#CCD0CF] block">
                          {meal.label}
                        </span>
                        <span className="text-[10px] text-[#9BA8AB]">
                          {isLogged ? `${meal.count} ${meal.count === 1 ? "dish" : "dishes"}` : "Unlogged"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isLogged ? (
                        <span className="text-xs font-semibold text-[#CCD0CF] tabular-nums font-mono">
                          {Math.round(meal.calories)} <span className="text-[10px] text-[#9BA8AB]">kcal</span>
                        </span>
                      ) : (
                        <Link
                          href={`/journal?category=${meal.id}`}
                          className="text-[11px] font-medium text-[#9BA8AB] hover:text-[#CCD0CF] px-2 py-0.5 rounded-md hover:bg-[#11212D] transition-colors"
                        >
                          + Log
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {entries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Today&apos;s Logged Items</CardTitle>
                <CardDescription>Recent entries recorded today</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="divide-y divide-[#253745]/40">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-[#11212D] border border-[#253745]/60 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-[#CCD0CF] block truncate">
                        {entry.foodName}
                      </span>
                      <span className="text-[10px] text-[#9BA8AB] block truncate">
                        {entry.estimatedPortionG ? `${entry.estimatedPortionG}g • ` : ""}
                        {entry.mealCategory.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs font-semibold text-[#CCD0CF] tabular-nums font-mono">
                      {Math.round(entry.calories || 0)} kcal
                    </div>
                    <div className="text-[10px] text-[#9BA8AB]">
                      P: {entry.proteinG?.toFixed(0) || 0}g • C: {entry.carbsG?.toFixed(0) || 0}g • F: {entry.fatG?.toFixed(0) || 0}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
