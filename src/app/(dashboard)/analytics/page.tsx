import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDateIST, startOfWeekIST } from "@/lib/dates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from "@/components/ui/index"
import { CalorieTrendChart, MacroDistributionChart } from "@/components/charts/nutrition-charts"
import { Flame, Egg, Leaf, Droplet, List, Clock, TrendingUp, Info, ArrowRight } from "lucide-react"
import Link from "next/link"

interface DailyAgg {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged: boolean
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const userId = session.user.id
  const weekStart = startOfWeekIST()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const entries = await prisma.foodEntry.findMany({
    where: {
      userId,
      loggedAt: { gte: weekStart, lte: weekEnd },
    },
    orderBy: { loggedAt: "asc" },
  })

  // Aggregate by day
  const dayMap: Record<string, DailyAgg> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split("T")[0]
    dayMap[key] = {
      name: d.toLocaleDateString("en-US", { weekday: "short" }),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      logged: false,
    }
  }

  for (const e of entries) {
    const key = new Date(e.loggedAt).toISOString().split("T")[0]
    if (dayMap[key]) {
      dayMap[key].calories += e.calories || 0
      dayMap[key].protein += e.proteinG || 0
      dayMap[key].carbs += e.carbsG || 0
      dayMap[key].fat += e.fatG || 0
      dayMap[key].logged = true
    }
  }

  const weeklyData = Object.values(dayMap)

  // Calculations for logged days only (avoid treating unlogged days as 0 calories)
  const loggedDaysList = weeklyData.filter((d) => d.logged && d.calories > 0)
  const loggedDaysCount = loggedDaysList.length

  const totalCalories = loggedDaysList.reduce((s, d) => s + d.calories, 0)
  const totalProtein = loggedDaysList.reduce((s, d) => s + d.protein, 0)
  const totalCarbs = loggedDaysList.reduce((s, d) => s + d.carbs, 0)
  const totalFat = loggedDaysList.reduce((s, d) => s + d.fat, 0)

  const avgCalories = loggedDaysCount > 0 ? Math.round(totalCalories / loggedDaysCount) : 0
  const avgProtein = loggedDaysCount > 0 ? Number((totalProtein / loggedDaysCount).toFixed(1)) : 0
  const avgCarbs = loggedDaysCount > 0 ? Number((totalCarbs / loggedDaysCount).toFixed(1)) : 0
  const avgFat = loggedDaysCount > 0 ? Number((totalFat / loggedDaysCount).toFixed(1)) : 0

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#253745]/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
            Nutritional Insights
          </h1>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Weekly trends, intake distribution, and data-driven nutrition observations.
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto text-xs font-mono">
          {loggedDaysCount} of 7 days logged
        </Badge>
      </div>

      {/* Summary Stat Cards (Compact & Refined) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Days Logged */}
        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA8AB]">Days Logged</span>
            <List className="h-4 w-4 text-[#9BA8AB]" />
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-[#CCD0CF] tabular-nums font-mono">
              {loggedDaysCount}
            </span>
            <span className="text-xs text-[#9BA8AB] ml-1">/ 7 days</span>
          </div>
          <span className="text-[10px] text-[#9BA8AB]">
            {loggedDaysCount >= 5 ? "Consistent logging" : "Log meals daily for trends"}
          </span>
        </Card>

        {/* Avg Calories */}
        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA8AB]">Avg Calories</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-[#CCD0CF] tabular-nums font-mono">
              {avgCalories.toLocaleString()}
            </span>
            <span className="text-xs text-[#9BA8AB] ml-1">kcal/day</span>
          </div>
          <span className="text-[10px] text-[#9BA8AB]">
            {loggedDaysCount > 0 ? "Avg across logged days" : "No logs recorded"}
          </span>
        </Card>

        {/* Avg Protein */}
        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA8AB]">Avg Protein</span>
            <Egg className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-[#CCD0CF] tabular-nums font-mono">
              {avgProtein}
            </span>
            <span className="text-xs text-[#9BA8AB] ml-1">g/day</span>
          </div>
          <span className="text-[10px] text-emerald-400">
            {avgProtein > 0 ? `${Math.round(avgProtein * 4)} kcal from protein` : "No protein logged"}
          </span>
        </Card>

        {/* Avg Carbs / Fat */}
        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA8AB]">Carbs / Fat</span>
            <Droplet className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-xl font-bold text-[#CCD0CF] tabular-nums font-mono">
              {Math.round(avgCarbs)} / {Math.round(avgFat)}
            </span>
            <span className="text-xs text-[#9BA8AB] ml-1">g</span>
          </div>
          <span className="text-[10px] text-[#9BA8AB]">
            Daily average ratio
          </span>
        </Card>
      </div>

      {/* Main Charts: Calorie Trend & Macro Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Calorie Trend Chart */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
            <div>
              <h3 className="text-sm font-semibold text-[#CCD0CF]">
                Calorie Trend (7 Days)
              </h3>
              <p className="text-[11px] text-[#9BA8AB]">
                Daily intake progression across the current week
              </p>
            </div>
            {avgCalories > 0 && (
              <Badge variant="amber" className="text-[10px] font-mono">
                {avgCalories} kcal avg
              </Badge>
            )}
          </div>
          <div className="pt-3">
            <CalorieTrendChart data={weeklyData} />
          </div>
        </Card>

        {/* Macronutrient Distribution Chart */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
            <div>
              <h3 className="text-sm font-semibold text-[#CCD0CF]">
                Macro Distribution
              </h3>
              <p className="text-[11px] text-[#9BA8AB]">
                Protein (green), Carbs (cyan), Fat (amber) in grams
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Daily Grams
            </Badge>
          </div>
          <div className="pt-3">
            <MacroDistributionChart data={weeklyData} />
          </div>
        </Card>
      </div>

      {/* Data-Driven Observations Section (Only when real data exists) */}
      <Card className="p-4 sm:p-5 bg-[#09131a] border border-[#253745]/60">
        <h3 className="text-xs font-semibold text-[#CCD0CF] uppercase tracking-wider mb-2 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#9BA8AB]" />
          Weekly Observations
        </h3>

        {loggedDaysCount >= 3 ? (
          <div className="space-y-2 text-xs text-[#9BA8AB]">
            <p>
              • You logged meals on <span className="text-[#CCD0CF] font-medium">{loggedDaysCount} out of 7 days</span> this week, with an average intake of <span className="text-[#CCD0CF] font-medium">{avgCalories} kcal</span> on logged days.
            </p>
            <p>
              • Protein intake averaged <span className="text-emerald-400 font-medium">{avgProtein}g per day</span>, providing approximately {Math.round((avgProtein * 4 / (avgCalories || 1)) * 100)}% of your daily energy.
            </p>
            <p>
              • Consistency check: {loggedDaysCount >= 5 ? "Consistent meal logging patterns detected across weekdays." : "Logging meals on consecutive days helps build clearer nutritional trends."}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#9BA8AB]">
            <Info className="h-4 w-4 shrink-0 text-[#9BA8AB]" />
            <span>
              Log meals for at least 3 days this week to generate factual intake observations and consistency patterns.
            </span>
          </div>
        )}
      </Card>

      {/* Recent Entries */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
          <div>
            <h3 className="text-sm font-semibold text-[#CCD0CF]">
              Recent Food Entries
            </h3>
            <p className="text-[11px] text-[#9BA8AB]">
              Items logged during this 7-day period
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/journal">
              View Journal <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="pt-2">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9BA8AB]">
              <Clock className="h-5 w-5 mx-auto mb-1.5 opacity-40" />
              No entries logged in this week yet.
            </div>
          ) : (
            <div className="divide-y divide-[#253745]/30">
              {entries.slice(0, 6).map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-[#4A5C6A] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-[#CCD0CF] block truncate">
                        {e.foodName}
                      </span>
                      <span className="text-[10px] text-[#9BA8AB]">
                        {new Date(e.loggedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {e.mealCategory.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs font-semibold text-[#CCD0CF]">
                    {Math.round(e.calories)} kcal
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
