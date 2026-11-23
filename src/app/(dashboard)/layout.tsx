import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navigation, DesktopNav } from "@/components/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
      {/* Desktop Persistent Sidebar */}
      <DesktopNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-8">
        {/* Mobile Top Header & Bottom Nav */}
        <Navigation />

        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
