"use client"

import React, { useRef, useState, useCallback } from "react"
import { cn } from "./index"

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  intensity?: number
  blur?: number
  interactive?: boolean
  className?: string
  glowColor?: "teal" | "ocean" | "mint" | "default"
}

/**
 * LiquidGlass component inspired by rdev/liquid-glass-react & iyinchao/liquid-glass-studio.
 * Uses SVG displacement filter for authentic light refraction and dynamic cursor glare tracking.
 */
export function LiquidGlassCard({
  children,
  intensity = 15,
  blur = 20,
  interactive = true,
  className,
  glowColor = "default",
  ...props
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseEnter={interactive ? () => setIsHovered(true) : undefined}
      onMouseLeave={interactive ? () => setIsHovered(false) : undefined}
      style={
        {
          "--mouse-x": `${mousePos.x}%`,
          "--mouse-y": `${mousePos.y}%`,
        } as React.CSSProperties
      }
      className={cn(
        "liquid-glass liquid-glass-hover rounded-3xl p-5 relative overflow-hidden group",
        isHovered && "ring-1 ring-[#167d8d]/40",
        className
      )}
      {...props}
    >
      {/* Specular Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#b9e4e8]/80 dark:via-[#5b91a3]/40 to-transparent pointer-events-none" />

      {/* Internal Glare Flare */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(185,228,232,0.18), transparent 45%)`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "glass" | "glass-teal" | "glass-ocean" | "glass-subtle"
  size?: "default" | "sm" | "lg"
  className?: string
}

/**
 * LiquidGlassButton with refractive shine, fluid spring click, and specular sheen.
 */
export function LiquidGlassButton({
  children,
  variant = "glass",
  size = "default",
  className,
  ...props
}: LiquidGlassButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const variantStyles = {
    glass: "btn-liquid-glass",
    "glass-teal":
      "btn-liquid-glass !bg-[#167d8d]/20 hover:!bg-[#167d8d]/30 !border-[#167d8d]/40 text-[#071b2b] dark:text-[#b9e4e8] !shadow-[#167d8d]/25",
    "glass-ocean":
      "btn-liquid-glass !bg-[#2f4a63]/25 hover:!bg-[#2f4a63]/40 !border-[#5b91a3]/35 text-[#071b2b] dark:text-[#f4f8fa] !shadow-[#2f4a63]/25",
    "glass-subtle": "liquid-glass-pill hover:bg-white/80 dark:hover:bg-[#131b2b]/80 text-[#071b2b] dark:text-[#f4f8fa]",
  }

  const sizeStyles = {
    default: "min-h-[44px] px-4 py-2 text-sm font-semibold rounded-2xl",
    sm: "min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-xl",
    lg: "min-h-[50px] px-6 text-base font-bold rounded-2xl",
  }

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      style={
        {
          "--mouse-x": `${pos.x}%`,
          "--mouse-y": `${pos.y}%`,
        } as React.CSSProperties
      }
      className={cn(
        "inline-flex items-center justify-center font-semibold select-none active:scale-[0.96] transition-all duration-200 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
