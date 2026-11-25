"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts"
import { BarChart3, TrendingUp } from "lucide-react"

export interface DailyChartData {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre?: number
}

// Custom Dark Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-xl bg-[#09131a] border border-[#253745] p-2.5 shadow-xl text-xs space-y-1">
      <div className="font-semibold text-[#CCD0CF] pb-1 border-b border-[#253745]/60">
        {label}
      </div>
      {payload.map((item: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
          <span className="flex items-center gap-1.5" style={{ color: item.color || item.fill }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
            {item.name}:
          </span>
          <span className="font-mono font-medium text-[#CCD0CF]">
            {Math.round(item.value)} {item.unit || (item.name.toLowerCase().includes("cal") ? "kcal" : "g")}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CalorieTrendChart({
  data,
  targetCalories,
}: {
  data: DailyChartData[]
  targetCalories?: number
}) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-64 w-full flex items-center justify-center text-xs text-[#9BA8AB]">Loading chart...</div>
  }

  const hasData = data && data.some((d) => d.calories > 0)

  if (!hasData) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-[#253745]/60 bg-[#06141B]/30">
        <TrendingUp className="h-6 w-6 text-[#9BA8AB]/40 mb-2" />
        <p className="text-xs font-medium text-[#CCD0CF]">No calorie data logged for this period</p>
        <p className="text-[11px] text-[#9BA8AB] mt-1 max-w-xs">
          Log food entries or scan meals to view your calorie trend over time.
        </p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full touch-pan-y">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(37, 55, 69, 0.4)" />
          <XAxis dataKey="name" stroke="#9BA8AB" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#9BA8AB"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[
              0,
              (dataMax: number) =>
                Math.ceil(Math.max(dataMax, targetCalories || 0) * 1.12),
            ]}
          />
          <Tooltip content={<CustomTooltip />} />
          {targetCalories && targetCalories > 0 && (
            <ReferenceLine
              y={targetCalories}
              stroke="#9BA8AB"
              strokeDasharray="4 4"
              strokeOpacity={0.65}
              label={{
                value: `Target ${targetCalories.toLocaleString()}`,
                position: "insideTopRight",
                fill: "#9BA8AB",
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f59e0b" }}
            activeDot={{ r: 5, fill: "#f59e0b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MacroDistributionChart({ data }: { data: DailyChartData[] }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-64 w-full flex items-center justify-center text-xs text-[#9BA8AB]">Loading chart...</div>
  }

  const hasData = data && data.some((d) => d.protein > 0 || d.carbs > 0 || d.fat > 0)

  if (!hasData) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-[#253745]/60 bg-[#06141B]/30">
        <BarChart3 className="h-6 w-6 text-[#9BA8AB]/40 mb-2" />
        <p className="text-xs font-medium text-[#CCD0CF]">No macronutrient logs available</p>
        <p className="text-[11px] text-[#9BA8AB] mt-1 max-w-xs">
          Macronutrient distribution will appear once meals are logged.
        </p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full touch-pan-y">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(37, 55, 69, 0.4)" />
          <XAxis dataKey="name" stroke="#9BA8AB" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#9BA8AB" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
          />
          {/* Exact designated macro colors: Protein: green, Carbs: cyan, Fat: amber */}
          <Bar dataKey="protein" name="Protein" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="carbs" name="Carbs" fill="#06b6d4" radius={[3, 3, 0, 0]} />
          <Bar dataKey="fat" name="Fat" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DashboardTrendChart({
  data,
  targetCalories,
}: {
  data?: { name: string; calories: number }[]
  targetCalories?: number
}) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-44 w-full flex items-center justify-center text-xs text-[#9BA8AB]">Loading chart...</div>
  }

  const hasData = data && data.some((d) => d.calories > 0)

  if (!hasData) {
    return (
      <div className="h-44 w-full flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[#253745]/50 bg-[#06141B]/20">
        <TrendingUp className="h-5 w-5 text-[#9BA8AB]/40 mb-1.5" />
        <p className="text-xs font-medium text-[#CCD0CF]">No intake recorded this week</p>
        <p className="text-[11px] text-[#9BA8AB] mt-0.5">Your 7-day trend line will render as you log meals.</p>
      </div>
    )
  }

  return (
    <div className="h-44 w-full touch-pan-y">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(37, 55, 69, 0.4)" />
          <XAxis dataKey="name" stroke="#9BA8AB" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#9BA8AB"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[
              0,
              (dataMax: number) =>
                Math.ceil(Math.max(dataMax, targetCalories || 0) * 1.12),
            ]}
          />
          <Tooltip content={<CustomTooltip />} />
          {targetCalories && targetCalories > 0 && (
            <ReferenceLine
              y={targetCalories}
              stroke="#9BA8AB"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
            />
          )}
          <Line
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "#f59e0b" }}
            activeDot={{ r: 4.5, fill: "#f59e0b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
