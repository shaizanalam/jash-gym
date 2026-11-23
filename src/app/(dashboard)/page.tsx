import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDateIST, startOfDayIST } from "@/lib/dates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { Badge } from "@/components/ui/index"
import {
  Plus,
  Clock,
  Droplet,
  Flame,
  Leaf,
  Egg,
  Info,
  Camera,
  ArrowRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Utensils,
} from "lucide-react"
import { DashboardTrendChart } from "@/components/charts/nutrition-charts"
import { MEAL_CATEGORIES } from "@/lib/constants"
import Link from "next/link"

export default async function Home() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const userId = session.user.id
  const today = startOfDayIST()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [entries, weekEntries, profile] = await Promise.all([
    prisma.foodEntry.findMany({
      where: {
        userId,
        loggedAt: { gte: today },
      },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.foodEntry.findMany({
      where: {
        userId,
        loggedAt: { gte: sevenDaysAgo },
      },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.nutritionProfile.findUnique({ where: { userId } }),
  ])

  // Build 7-day trend
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

  // Calculate 7-day average
  const totalWeeklyCalories = Object.values(daysMap).reduce((a, b) => a + b, 0)
  const averageDailyCalories = Math.round(totalWeeklyCalories / 7)

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

  const byMeal = MEAL_CATEGORIES.map((cat) => {
    const items = entries.filter((e) => e.mealCategory === cat.id)
    const total = items.reduce((s, e) => s + (e.calories || 0), 0)
    return { ...cat, count: items.length, calories: total, items }
  })

  // Dynamic greeting based on current time
  const currentHour = new Date().getHours()
  let greetingTime = "Good day"
  if (currentHour < 12) greetingTime = "Good morning"
  else if (currentHour < 17) greetingTime = "Good afternoon"
  else greetingTime = "Good evening"

  const firstName = session.user.name ? session.user.name.split(" ")[0] : "Friend"

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greetingTime}, {firstName}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your meals mindfully with AI-powered instant recognition.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Button variant="glass" asChild size="default" className="shadow-2xs">
            <Link href="/journal">
              <Plus className="h-4 w-4 mr-1.5 text-slate-500" />
              <span>Log Meal</span>
            </Link>
          </Button>
          <Button asChild size="default" className="shadow-md shadow-emerald-600/30">
            <Link href="/scanner">
              <Camera className="h-4 w-4 mr-1.5" />
              <span>Scan Food</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento Nutrition Metrics Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-500" />
            Today's Nutrition Breakdown
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">Informational estimates</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Calories Highlight Card */}
          <div className="col-span-2 md:col-span-1 rounded-2xl sm:rounded-3xl p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/70 dark:border-amber-800/40 relative overflow-hidden flex flex-col justify-between shadow-2xs liquid-glass-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Calories</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {Math.round(summary.calories)}
              </div>
              <span className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80">kcal total</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {entries.length} items logged today
            </div>
          </div>

          {/* Protein Card */}
          <div className="rounded-2xl sm:rounded-3xl p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs liquid-glass-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Protein</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Egg className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {summary.protein.toFixed(1)}
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">grams</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Build & repair
            </div>
          </div>

          {/* Carbs Card */}
          <div className="rounded-2xl sm:rounded-3xl p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs liquid-glass-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Carbs</span>
              <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Leaf className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {summary.carbs.toFixed(1)}
              </div>
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400">grams</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Daily energy
            </div>
          </div>

          {/* Fat Card */}
          <div className="rounded-2xl sm:rounded-3xl p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs liquid-glass-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Fat</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Droplet className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {summary.fat.toFixed(1)}
              </div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">grams</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Essential fats
            </div>
          </div>

          {/* Fibre Card */}
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Fibre</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Leaf className="h-4 w-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {summary.fibre.toFixed(1)}
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">grams</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Digestive health
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Trend & Today's Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend Card (7 cols on lg) */}
        <Card className="lg:col-span-7 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Weekly Intake Trend
                </CardTitle>
                <CardDescription>7-day daily calorie history</CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                Avg: {averageDailyCalories} kcal/day
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <DashboardTrendChart data={weeklyTrend} />
          </CardContent>
        </Card>

        {/* Today's Meals Summary (5 cols on lg) */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                  Today's Meals
                </CardTitle>
                <CardDescription>Progress across meal categories</CardDescription>
              </div>
              <Link
                href="/journal"
                className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              {byMeal.map((meal) => {
                const Icon = meal.icon
                const isLogged = meal.count > 0

                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                          isLogged
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : "bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
                          {meal.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {isLogged ? `${meal.count} ${meal.count === 1 ? "item" : "items"}` : "Not logged yet"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isLogged ? (
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {Math.round(meal.calories)}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">kcal</span>
                        </div>
                      ) : (
                        <Link
                          href={`/journal?category=${meal.id}`}
                          className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Completed today</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {byMeal.filter((m) => m.count > 0).length} of {byMeal.length} categories
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meal Logs List (if any logged today) */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Food Entries</CardTitle>
                <CardDescription>Items recorded today with portion and nutrition</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {entries.length} recorded
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                        {entry.foodName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {entry.estimatedPortionG ? `${entry.estimatedPortionG}g • ` : ""}
                        {entry.mealCategory.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      {Math.round(entry.calories || 0)} kcal
                    </div>
                    <div className="text-[11px] text-slate-400">
                      P: {entry.proteinG?.toFixed(1) || 0}g • C: {entry.carbsG?.toFixed(1) || 0}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Transparency & Estimation Card */}
      <div className="rounded-2xl p-4 sm:p-5 border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent flex items-start gap-3.5 shadow-2xs">
        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            AI Nutrition Transparency
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Nutritional estimates are approximated using machine vision and Indian regional food databases. These values serve as educational references rather than strict medical prescriptions. You can adjust portions anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
