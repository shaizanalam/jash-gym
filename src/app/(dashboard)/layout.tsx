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
    <div className="flex min-h-screen bg-[#f7f9fa] dark:bg-[#06141B] text-[#06141B] dark:text-[#CCD0CF] antialiased selection:bg-[#4A5C6A]/25 selection:text-[#06141B] dark:selection:text-[#CCD0CF]">
      {/* Desktop Persistent Sidebar */}
      <DesktopNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
        {/* Mobile Top Header & Bottom Nav */}
        <Navigation />

        <main className="flex-1 flex flex-col ios-scroll">
          {children}
        </main>
      </div>
    </div>
  )
}
