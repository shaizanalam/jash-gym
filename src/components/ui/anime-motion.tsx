"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { animate, stagger } from "animejs"

/**
 * Route order map matching navigation bar tabs
 * Index determines slide direction (slide left when going right, slide right when going left)
 */
export const ROUTE_ORDER: Record<string, number> = {
  "/": 0,
  "/journal": 1,
  "/scanner": 2,
  "/results": 2.5,
  "/planner": 3,
  "/analytics": 4,
  "/profile": 5,
  "/settings": 6,
}

/**
 * SmoothPageTransition
 * Uses Anime.js to smoothly slide and fade pages based on nav bar tab direction
 */
export function SmoothPageTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prevPathRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prevPath = prevPathRef.current
    let initialX = 0

    if (prevPath !== null && prevPath !== pathname) {
      const prevIdx = ROUTE_ORDER[prevPath] ?? 0
      const currIdx = ROUTE_ORDER[pathname] ?? 0

      if (currIdx > prevIdx) {
        // Switching to a tab to the right -> slide in from right to left
        initialX = 32
      } else if (currIdx < prevIdx) {
        // Switching to a tab to the left -> slide in from left to right
        initialX = -32
      }
    }

    prevPathRef.current = pathname

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ) {
      el.style.transform = ""
      el.style.opacity = ""
      el.style.willChange = ""
      return
    }

    const clearStyles = () => {
      el.style.transform = ""
      el.style.opacity = ""
      el.style.willChange = ""
    }

    el.style.willChange = "transform, opacity"

    let anim: ReturnType<typeof animate> | null = null
    try {
      anim = animate(el, {
        opacity: [0, 1],
        translateX: [initialX, 0],
        translateY: [initialX === 0 ? 6 : 0, 0],
        ease: "outCubic",
        duration: 240,
        onComplete: clearStyles,
      })
    } catch {
      clearStyles()
    }

    return () => {
      try {
        anim?.cancel?.()
      } catch {
        // Ignore cleanup cancellation errors
      }
      clearStyles()
    }
  }, [pathname])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

/**
 * AnimeEntrance
 * Smoothly animates cards or items on mount using Anime.js
 */
export function AnimeEntrance({
  children,
  className,
  delay = 0,
  staggerChildren = false,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  staggerChildren?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ) {
      return
    }

    const clearTarget = (target: HTMLElement) => {
      target.style.transform = ""
      target.style.opacity = ""
      target.style.willChange = ""
    }

    let anim: ReturnType<typeof animate> | null = null
    try {
      if (staggerChildren && el.children.length > 0) {
        const targets = Array.from(el.children) as HTMLElement[]
        targets.forEach((child) => {
          child.style.willChange = "transform, opacity"
        })
        anim = animate(targets, {
          opacity: [0, 1],
          translateY: [14, 0],
          ease: "outQuart",
          duration: 320,
          delay: stagger(45, { start: delay }),
          onComplete: () => targets.forEach(clearTarget),
        })
      } else {
        el.style.willChange = "transform, opacity"
        anim = animate(el, {
          opacity: [0, 1],
          translateY: [16, 0],
          ease: "outCubic",
          duration: 320,
          delay,
          onComplete: () => clearTarget(el),
        })
      }
    } catch {
      clearTarget(el)
    }

    return () => {
      try {
        anim?.cancel?.()
      } catch {
        // Ignore cleanup cancellation errors
      }
      clearTarget(el)
    }
  }, [delay, staggerChildren])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
