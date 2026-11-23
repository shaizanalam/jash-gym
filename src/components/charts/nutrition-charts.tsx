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
} from "recharts"

export interface DailyChartData {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function CalorieTrendChart({ data }: { data: DailyChartData[] }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-80 w-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              color: "#f8fafc",
              borderRadius: "8px",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#10b981" }}
            activeDot={{ r: 6 }}
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
    return <div className="h-80 w-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              color: "#f8fafc",
              borderRadius: "8px",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="protein" name="Protein (g)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="carbs" name="Carbs (g)" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="fat" name="Fat (g)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DashboardTrendChart({ data }: { data?: { name: string; calories: number }[] }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = data && data.length > 0 ? data : [
    { name: "Mon", calories: 0 },
    { name: "Tue", calories: 0 },
    { name: "Wed", calories: 0 },
    { name: "Thu", calories: 0 },
    { name: "Fri", calories: 0 },
    { name: "Sat", calories: 0 },
    { name: "Sun", calories: 0 },
  ]

  if (!mounted) {
    return <div className="h-64 w-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              color: "#f8fafc",
              borderRadius: "8px",
              border: "none",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
