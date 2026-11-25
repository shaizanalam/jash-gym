import { AnalyticsView } from "@/components/views/analytics-view"

export default async function AnalyticsPage() {
  if (process.env.NEXT_PUBLIC_CAPACITOR_LOCAL === "true") {
    return <AnalyticsView />
  }

  const { loadAnalyticsData } = await import("@/lib/server-loaders")
  const initialData = await loadAnalyticsData()
  if (!initialData) {
    return null
  }

  return <AnalyticsView initialData={initialData} />
}
