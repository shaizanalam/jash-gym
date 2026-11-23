import React from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  href?: string
}

/**
 * Authentic NutriMentor Icon Emblem (Heart + Leaf + Trend Arrow)
 * Rendered from the exact brand asset with alpha transparency
 */
export function NutriMentorIcon({
  className,
  size = 28,
}: {
  className?: string
  size?: number
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn("relative shrink-0 select-none", className)}
    >
      <Image
        src="/logo-icon.png"
        alt="NutriMentor"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain pointer-events-none"
        priority
      />
    </div>
  )
}

/**
 * Authentic Full NutriMentor Logo
 * Features the exact heart-leaf-arrow emblem and the 3-tone wordmark:
 * Nutri (White) + Ment (Green) + or (Orange)
 */
export function NutriMentorLogo({
  className,
  iconOnly = false,
  size = "md",
  href = "/",
}: LogoProps) {
  const sizeMap = {
    sm: { height: 26, width: 110, iconSize: 26 },
    md: { height: 32, width: 136, iconSize: 32 },
    lg: { height: 42, width: 178, iconSize: 42 },
    xl: { height: 54, width: 230, iconSize: 54 },
  }

  const current = sizeMap[size] || sizeMap.md

  const content = iconOnly ? (
    <div className={cn("inline-flex items-center justify-center select-none group", className)}>
      <NutriMentorIcon
        size={current.iconSize}
        className="transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  ) : (
    <div
      style={{ height: current.height, width: current.width }}
      className={cn("relative inline-flex items-center select-none group shrink-0", className)}
    >
      <Image
        src="/logo.png"
        alt="NutriMentor"
        width={current.width * 2}
        height={current.height * 2}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-[1.02]"
        priority
      />
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
