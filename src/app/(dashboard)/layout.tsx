import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navigation, DesktopNav } from "@/components/navigation"
import { SmoothPageTransition } from "@/components/ui/anime-motion"

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
    <div className="flex min-h-screen bg-[#06141B] text-[#CCD0CF] antialiased selection:bg-[#4A5C6A]/30 selection:text-white">
      {/* Desktop Persistent Sidebar */}
      <DesktopNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
        {/* Mobile Top Header & Bottom Nav */}
        <Navigation />

        <main className="flex-1 flex flex-col ios-scroll">
          <SmoothPageTransition className="flex-1 flex flex-col min-w-0">
            {children}
          </SmoothPageTransition>
        </main>
      </div>
    </div>
  )
}
