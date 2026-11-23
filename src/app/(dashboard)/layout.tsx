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
    <div className="flex min-h-screen bg-[#f4f8fa] dark:bg-[#071b2b] text-[#071b2b] dark:text-[#f4f8fa] antialiased selection:bg-[#167d8d]/20 selection:text-[#071b2b] dark:selection:text-[#b9e4e8]">
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
