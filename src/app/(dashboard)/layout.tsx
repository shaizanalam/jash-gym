import { redirect } from "next/navigation"
import { Navigation, DesktopNav } from "@/components/navigation"
import { SmoothPageTransition } from "@/components/ui/anime-motion"
import { LocalAuthGuard } from "@/components/local-auth-guard"

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#06141B] text-[#CCD0CF] antialiased selection:bg-[#4A5C6A]/30 selection:text-white">
      <DesktopNav />

      <div className="flex-1 flex flex-col min-w-0 pt-[var(--safe-area-inset-top,env(safe-area-inset-top,0px))] lg:pt-0 pb-[calc(6.5rem+var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))] lg:pb-8">
        <Navigation />

        <main className="flex-1 flex flex-col min-w-0">
          <SmoothPageTransition className="flex-1 flex flex-col min-w-0">
            {children}
          </SmoothPageTransition>
        </main>
      </div>
    </div>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NEXT_PUBLIC_CAPACITOR_LOCAL === "true") {
    return (
      <LocalAuthGuard>
        <DashboardShell>{children}</DashboardShell>
      </LocalAuthGuard>
    )
  }

  const { auth } = await import("@/lib/auth")
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  return <DashboardShell>{children}</DashboardShell>
}
