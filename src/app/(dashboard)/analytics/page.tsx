import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDateIST, startOfWeekIST } from "@/lib/dates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { CalorieTrendChart, MacroDistributionChart } from "@/components/charts/nutrition-charts"
import { Flame, Egg, Leaf, Droplet, List, Clock } from "lucide-react"

interface DailyAgg {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
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
    dayMap[key] = { name: d.toLocaleDateString(undefined, { weekday: "short" }), calories: 0, protein: 0, carbs: 0, fat: 0 }
  }

  for (const e of entries) {
    const key = new Date(e.loggedAt).toISOString().split("T")[0]
    if (dayMap[key]) {
      dayMap[key].calories += e.calories || 0
      dayMap[key].protein += e.proteinG || 0
      dayMap[key].carbs += e.carbsG || 0
      dayMap[key].fat += e.fatG || 0
    }
  }

  const weeklyData = Object.values(dayMap)

  const totalCalories = weeklyData.reduce((s, d) => s + d.calories, 0)
  const totalProtein = weeklyData.reduce((s, d) => s + d.protein, 0)
  const totalCarbs = weeklyData.reduce((s, d) => s + d.carbs, 0)
  const totalFat = weeklyData.reduce((s, d) => s + d.fat, 0)
  const loggedDays = weeklyData.filter((d) => d.calories > 0).length

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f8fafc]">
            Weekly analytics
          </h1>
          <p className="text-[#64748b] dark:text-[#94a3b8]">
            Informational overview of your logged meals.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Days logged"
            value={loggedDays}
            unit="/ 7"
            icon={<List className="h-5 w-5" />}
          />
          <StatCard
            title="Avg calories/day"
            value={loggedDays ? Math.round(totalCalories / loggedDays) : 0}
            unit="kcal"
            icon={<Flame className="h-5 w-5" />}
          />
          <StatCard
            title="Avg protein/day"
            value={loggedDays ? (totalProtein / loggedDays).toFixed(1) : 0}
            unit="g"
            icon={<Egg className="h-5 w-5" />}
          />
          <StatCard
            title="Avg carbs / fat"
            value={
              loggedDays
                ? `${(totalCarbs / loggedDays).toFixed(0)} / ${(totalFat / loggedDays).toFixed(0)}`
                : "0 / 0"
            }
            unit="g"
            icon={<Droplet className="h-5 w-5" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Weekly trend chart */}
          <Card>
            <CardHeader>
              <CardTitle>Calorie trend (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <CalorieTrendChart data={weeklyData} />
              <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8] text-center">
                Informational only — not a target.
              </p>
            </CardContent>
          </Card>

          {/* Macronutrient distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <MacroDistributionChart data={weeklyData} />
              <p className="mt-2 text-xs text-[#64748b] dark:text-[#94a3b8] text-center">
                Grams per day over the week.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent entries */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent entries</span>
              <Button asChild size="sm">
                <a href="/journal">View all</a>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center py-8 text-[#64748b] dark:text-[#94a3b8]">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                No recent entries.
              </p>
            ) : (
              <div className="space-y-3">
                {entries.slice(0, 8).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a]/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-[#0f172a] dark:text-[#f8fafc]">
                        {e.foodName}
                      </span>
                      <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                        {new Date(e.loggedAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#0f172a] dark:text-[#f8fafc]">
                        {Math.round(e.calories)} kcal
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, unit, icon }: { title: string; value: number | string; unit: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#f1f5f9] dark:bg-[#1e293b]">
            {icon}
          </div>
          <div>
            <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">{title}</div>
            <div className="text-xl font-bold text-[#0f172a] dark:text-[#f8fafc]">{value}{unit}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}