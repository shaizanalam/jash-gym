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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NutriMentorLogo } from "@/components/ui/logo"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Food Journal", icon: List },
  { href: "/scanner", label: "Scan Food", icon: Camera },
  { href: "/planner", label: "Meal Planner", icon: UtensilsCrossed },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: List },
  { href: "/scanner", label: "Scan", icon: Camera, isPrimary: true },
  { href: "/planner", label: "Planner", icon: UtensilsCrossed },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Sidebar for mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-[#09131a] text-[#CCD0CF] transform transition-transform duration-250 ease-out lg:hidden flex flex-col shadow-2xl border-r border-[#253745]/50",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-15 items-center justify-between px-5 border-b border-[#253745]/40">
          <div onClick={() => setOpen(false)}>
            <NutriMentorLogo size="sm" href="/" />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-[#9BA8AB] hover:text-[#CCD0CF] rounded-lg hover:bg-[#11212D] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150",
                  isActive
                    ? "bg-[#182C3D] text-[#CCD0CF] border border-[#253745]/70 font-semibold"
                    : "text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]/60"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#CCD0CF]" : "text-[#9BA8AB]")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Card at bottom of drawer */}
        <div className="p-4 border-t border-[#253745]/40 bg-[#06141B]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-full bg-[#182C3D] border border-[#253745] text-[#CCD0CF] flex items-center justify-center font-semibold text-xs">
              {(session?.user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#CCD0CF] truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-[#9BA8AB] truncate">
                {session?.user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-2.5 border-b border-[#253745]/40 bg-[#070d12]/90 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 text-[#9BA8AB] hover:text-[#CCD0CF] rounded-lg hover:bg-[#11212D] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <NutriMentorLogo size="sm" href="/" />
        </div>

        <Link
          href="/scanner"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCD0CF] bg-[#182C3D] hover:bg-[#253745] px-3 py-1.5 rounded-xl border border-[#253745] transition-colors"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Scan</span>
        </Link>
      </header>

      {/* Mobile Floating Bottom Bar with Liquid Glass */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] pointer-events-none flex justify-center">
        <nav className="pointer-events-auto w-full max-w-sm liquid-glass rounded-[28px] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-[#4A5C6A]/35 flex items-center justify-around">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 min-h-[44px] min-w-[50px]",
                  isActive
                    ? "bg-[#253745]/75 text-[#CCD0CF] font-semibold border border-[#4A5C6A]/40 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    : "text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182C3D]/40"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    isActive ? "text-[#CCD0CF] scale-105" : "text-[#9BA8AB]"
                  )}
                />
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-3.5 h-[2px] rounded-full bg-[#CCD0CF]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

export function DesktopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = React.useState(false)

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-[#253745]/40 bg-[#09131a] h-screen sticky top-0 shrink-0 transition-all duration-200",
        collapsed ? "w-18" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-15 items-center justify-between px-4 border-b border-[#253745]/40">
        <NutriMentorLogo
          size="sm"
          iconOnly={collapsed}
          href="/"
          className="min-w-0"
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] transition-colors shrink-0 ml-1"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9BA8AB]/70">
            Menu
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150",
                collapsed && "justify-center px-0 h-10 w-10 mx-auto",
                isActive
                  ? "bg-[#182C3D] text-[#CCD0CF] border border-[#253745]/70 font-semibold"
                  : "text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]/60"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#CCD0CF]" : "text-[#9BA8AB]")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-3 border-t border-[#253745]/40 bg-[#06141B]/70">
        <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center" : "px-2 py-1")}>
          <div className="h-8 w-8 rounded-full bg-[#182C3D] border border-[#253745] text-[#CCD0CF] flex items-center justify-center font-semibold text-xs shrink-0">
            {(session?.user?.name || "U").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#CCD0CF] truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-[#9BA8AB] truncate">
                {session?.user?.email}
              </span>
            </div>
          )}
        </div>
        {!collapsed ? (
          <button
            onClick={handleLogout}
            className="mt-2.5 flex w-full items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        ) : (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="mt-2.5 flex items-center justify-center h-8 w-8 mx-auto rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  )
}
