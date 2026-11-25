import { DashboardView } from "@/components/views/dashboard-view"

export default async function Home() {
  if (process.env.NEXT_PUBLIC_CAPACITOR_LOCAL === "true") {
    return <DashboardView />
  }

  const { loadDashboardData } = await import("@/lib/server-loaders")
  const initialData = await loadDashboardData()
  if (!initialData) {
    return null
  }

  return <DashboardView initialData={initialData} />
}
