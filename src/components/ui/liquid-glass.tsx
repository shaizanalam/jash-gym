"use client"

import React, { useRef, useState, useCallback } from "react"
import { cn } from "./index"

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  intensity?: number
  blur?: number
  interactive?: boolean
  className?: string
  glowColor?: "default" | "slate" | "steel"
}

/**
 * LiquidGlass component inspired by Apple WWDC Fluid Specular highlights.
 * Authentic light refraction, metallic sheen header, and dynamic cursor glare tracking.
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

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }, [])

  return (
    <div
      ref={cardRef}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerEnter={interactive ? (e) => { if (e.pointerType === "mouse") setIsHovered(true) } : undefined}
      onPointerLeave={interactive ? () => setIsHovered(false) : undefined}
      style={
        {
          "--mouse-x": `${mousePos.x}%`,
          "--mouse-y": `${mousePos.y}%`,
        } as React.CSSProperties
      }
      className={cn(
        "liquid-glass liquid-glass-hover rounded-3xl p-5 relative overflow-hidden group border border-[#253745]/70 bg-[#0f1b24]/90",
        isHovered && "ring-1 ring-[#4A5C6A]/50",
        className
      )}
      {...props}
    >
      {/* Specular Metallic Top Sheen */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#4A5C6A]/30 via-[#253745]/15 to-transparent pointer-events-none rounded-t-3xl" />
      {/* Specular Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCD0CF]/40 to-transparent pointer-events-none" />

      {/* Internal Glare Flare */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, rgba(204,208,207,0.12), transparent 45%)`,
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

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const variantStyles = {
    glass: "btn-liquid-glass",
    "glass-primary":
      "bg-[#CCD0CF] text-[#06141B] hover:bg-white shadow-md font-bold border border-white/20",
    "glass-teal":
      "btn-liquid-glass !bg-[#253745]/60 hover:!bg-[#253745]/80 !border-[#4A5C6A]/50 text-[#CCD0CF] !shadow-[#253745]/25",
    "glass-ocean":
      "btn-liquid-glass !bg-[#182C3D]/60 hover:!bg-[#182C3D]/80 !border-[#4A5C6A]/40 text-[#CCD0CF] !shadow-[#182C3D]/25",
    "glass-subtle": "btn-liquid-glass hover:bg-[#182C3D]/80 text-[#9BA8AB] hover:text-[#CCD0CF]",
  }

  const sizeStyles = {
    default: "min-h-[44px] px-4 py-2 text-sm font-semibold rounded-2xl",
    sm: "min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-xl",
    lg: "min-h-[50px] px-6 text-base font-bold rounded-2xl",
  }

  return (
    <button
      ref={btnRef}
      onPointerMove={handlePointerMove}
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
