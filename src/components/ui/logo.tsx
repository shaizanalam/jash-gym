import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  href?: string
}

/**
 * High-fidelity NutriMentor SVG Icon
 * Heart + Leaf + Upward Trend Arrow with vibrant Emerald to Cyan gradient
 */
export function NutriMentorIcon({
  className,
  size = 28,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nm-icon-gradient" x1="10%" y1="90%" x2="95%" y2="15%">
          <stop offset="0%" stopColor="#00E676" />
          <stop offset="55%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Left Leaf Body (Forms left lobe of the heart) */}
      <path
        d="M 12 30 C 10 46 16 62 28 75 C 36 84 44 91 52 94 C 44 80 40 68 40 54 C 40 40 48 34 52 34 C 44 26 30 22 12 30 Z"
        stroke="url(#nm-icon-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Leaf Vein Line */}
      <path
        d="M 14 36 C 22 46 28 58 36 70"
        stroke="url(#nm-icon-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Heart Lobe & Rising Trend / Arrow */}
      {/* Upper Right Arc of Heart */}
      <path
        d="M 52 34 C 60 26 76 26 86 38 C 94 48 94 62 86 74 C 78 84 64 90 52 94"
        stroke="url(#nm-icon-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Heart Pulse / Cardiogram Lightning Arrow shooting through upper right */}
      <path
        d="M 44 76 L 56 60 L 64 68 L 88 38"
        stroke="url(#nm-icon-gradient)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrowhead */}
      <path
        d="M 72 38 L 88 38 L 88 54"
        stroke="url(#nm-icon-gradient)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Full NutriMentor Logo with Icon & 3-tone Wordmark:
 * "Nutri" (White) + "Ment" (Emerald Green) + "or" (Warm Amber)
 */
export function NutriMentorLogo({
  className,
  iconOnly = false,
  size = "md",
  href = "/",
}: LogoProps) {
  const sizeConfig = {
    sm: { icon: 22, text: "text-sm", gap: "gap-2" },
    md: { icon: 28, text: "text-base", gap: "gap-2.5" },
    lg: { icon: 36, text: "text-xl", gap: "gap-3" },
    xl: { icon: 48, text: "text-2xl sm:text-3xl", gap: "gap-3.5" },
  }

  const current = sizeConfig[size] || sizeConfig.md

  const content = (
    <div className={cn("inline-flex items-center select-none group", current.gap, className)}>
      <NutriMentorIcon
        size={current.icon}
        className="transition-transform duration-200 group-hover:scale-105"
      />

      {!iconOnly && (
        <span className={cn("font-bold tracking-tight inline-flex items-baseline", current.text)}>
          <span className="text-[#FFFFFF]">Nutri</span>
          <span className="text-[#00E676]">Ment</span>
          <span className="text-[#F59E0B]">or</span>
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center outline-none">
        {content}
      </Link>
    )
  }

  return content
}
