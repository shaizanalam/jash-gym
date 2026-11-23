"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { animate, stagger } from "animejs"

/**
 * SmoothPageTransition
 * Uses Anime.js to smoothly animate pages when switching routes in the dashboard
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

  React.useEffect(() => {
    if (!containerRef.current) return

    animate(containerRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      scale: [0.995, 1],
      ease: "outCubic",
      duration: 360,
    })
  }, [pathname])

  return (
    <div ref={containerRef} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  )
}

/**
 * AnimeEntrance
 * Smoothly animates a card or container on first mount using Anime.js
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
        duration: 450,
        delay: stagger(60, { start: delay }),
      })
    } else {
      animate(ref.current, {
        opacity: [0, 1],
        translateY: [24, 0],
        scale: [0.97, 1],
        ease: "outCubic",
        duration: 450,
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
