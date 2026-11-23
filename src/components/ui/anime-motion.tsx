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
    if (!containerRef.current) return

    const prevPath = prevPathRef.current
    let initialX = 0

    if (prevPath !== null && prevPath !== pathname) {
      const prevIdx = ROUTE_ORDER[prevPath] ?? 0
      const currIdx = ROUTE_ORDER[pathname] ?? 0

      if (currIdx > prevIdx) {
        // Switching to a tab to the right -> slide in from right to left
        initialX = 42
      } else if (currIdx < prevIdx) {
        // Switching to a tab to the left -> slide in from left to right
        initialX = -42
      } else {
        initialX = 0
      }
    }

    prevPathRef.current = pathname

    // Cancel any in-flight animation on the container
    try {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateX: [initialX, 0],
        translateY: [initialX === 0 ? 8 : 0, 0],
        scale: [0.99, 1],
        ease: "outCubic",
        duration: 320,
      })
    } catch (e) {
      // Fallback
    }
  }, [pathname])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
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
    if (!ref.current) return

    if (staggerChildren && ref.current.children.length > 0) {
      animate(Array.from(ref.current.children), {
        opacity: [0, 1],
        translateY: [16, 0],
        scale: [0.98, 1],
        ease: "outQuart",
        duration: 400,
        delay: stagger(50, { start: delay }),
      })
    } else {
      animate(ref.current, {
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.98, 1],
        ease: "outCubic",
        duration: 400,
        delay,
      })
    }
  }, [delay, staggerChildren])

  return (
    <div ref={ref} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  )
}
