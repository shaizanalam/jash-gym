"use client"

import * as React from "react"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Camera,
  List,
  UtensilsCrossed,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scanner", label: "Scan Food", icon: Camera },
  { href: "/journal", label: "Food Journal", icon: List },
  { href: "/planner", label: "Meal Planner", icon: UtensilsCrossed },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/journal", label: "Meals", icon: List },
  { href: "/scanner", label: "Scan", icon: Camera, isPrimary: true },
  { href: "/planner", label: "Planner", icon: UtensilsCrossed },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
    setOpen(false)
  }

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Sidebar for mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-out lg:hidden flex flex-col shadow-2xl border-r border-slate-800",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">NutriMentor</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                  isActive
                    ? "bg-emerald-600/90 text-white font-semibold shadow-sm shadow-emerald-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                  {item.label}
                </div>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </Link>
            )
          })}
        </nav>

        {/* User Card in Drawer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs">
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {session?.user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors border border-rose-900/30"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Respects iPhone Notch & Dynamic Island) */}
      <header className="lg:hidden pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#071b2b]/85 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpen(true)}
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl active:scale-95 transition-all touch-manipulation"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
              NutriMentor
            </span>
          </Link>
        </div>

        <Link
          href="/scanner"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d505b] dark:text-[#b9e4e8] bg-[#cfeae0]/60 dark:bg-[#167d8d]/25 px-3 py-1.5 rounded-full border border-[#cfeae0] dark:border-[#167d8d]/40 shadow-2xs active:scale-95 transition-all touch-manipulation"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Quick Scan</span>
        </Link>
      </header>

      {/* 5-Item Persistent Mobile Bottom Navigation Bar (Apple HIG Touch Targets + Thumb-Zone Optimized + Apple Safe-Area) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 liquid-glass px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-apple-card border-t border-slate-200/80 dark:border-slate-800/80">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group min-w-[56px] min-h-[56px] touch-manipulation"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#167d8d] via-[#1f8f9f] to-[#2f4a63] hover:from-[#136b79] hover:to-[#253d53] text-white flex items-center justify-center shadow-lg shadow-[#167d8d]/35 ring-4 ring-white dark:ring-[#071b2b] active:scale-90 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[#167d8d]/50">
                  <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <span className="text-[10px] font-bold text-[#167d8d] dark:text-[#b9e4e8] mt-1">
                  Scan
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-[10px] font-semibold transition-all duration-150 active:scale-90 min-h-[44px] min-w-[48px] touch-manipulation",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-0.5 transition-transform", isActive && "scale-110 text-emerald-600 dark:text-emerald-400")} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function DesktopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <aside className="hidden lg:flex lg:w-64 flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl h-screen sticky top-0 shrink-0">
      <div className="flex h-16 items-center px-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <Link href="/" className="flex items-center">
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 block">
            NutriMentor
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        {DESKTOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] group relative overflow-hidden",
                isActive
                  ? "bg-[#cfeae0]/40 dark:bg-[#167d8d]/25 text-[#0d505b] dark:text-[#b9e4e8] font-bold border border-[#cfeae0] dark:border-[#167d8d]/40 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-2xs hover:translate-x-0.5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-[#167d8d] dark:text-[#b9e4e8]" : "text-slate-400 group-hover:text-[#167d8d]"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-[#167d8d] dark:bg-[#b9e4e8] shadow-sm" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile card */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-200 dark:border-emerald-800/60">
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {session?.user?.name || "User"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {session?.user?.email}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
