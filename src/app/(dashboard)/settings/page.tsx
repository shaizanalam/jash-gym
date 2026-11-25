import { redirect } from "next/navigation"
import { SettingsView } from "@/components/views/settings-view"

export default async function SettingsPage() {
  if (process.env.NEXT_PUBLIC_CAPACITOR_LOCAL === "true") {
    return <SettingsView />
  }

  const { loadSettingsData } = await import("@/lib/server-loaders")
  const initialData = await loadSettingsData()
  if (!initialData) {
    redirect("/login")
  }

  return <SettingsView initialData={initialData} />
}
