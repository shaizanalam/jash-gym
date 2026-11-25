"use client"

import * as React from "react"
import Link from "next/link"
import { Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiButtonBaseProps {
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  size?: "sm" | "default"
}

type AiButtonAsButton = AiButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof AiButtonBaseProps> & {
    href?: undefined
  }

type AiButtonAsLink = AiButtonBaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof AiButtonBaseProps | "href"> & {
    href: string
  }

export type AiButtonProps = AiButtonAsButton | AiButtonAsLink

/**
 * AI glowing action button adapted from Uiverse.io (Spacious74/lazy-dragonfly-64).
 * Renders a Next.js Link when `href` is provided, or a native button otherwise.
 */
export function AiButton(props: AiButtonProps) {
  const { children = "Scan", className, icon, size = "default", ...rest } = props
  const iconSize = size === "sm" ? 14 : 18
  const sizeClass = size === "sm" ? "btn-ai-glow-sm" : undefined
  const classes = cn("btn-ai-glow", sizeClass, className)

  const content = (
    <>
      {icon ?? <Camera size={iconSize} aria-hidden="true" className="shrink-0" />}
      <span>{children}</span>
    </>
  )

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkProps } = rest
    return (
      <Link href={href} className={classes} {...linkProps}>
        {content}
      </Link>
    )
  }

  const { type = "button", ...buttonProps } = rest as Omit<
    AiButtonAsButton,
    keyof AiButtonBaseProps
  >

  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  )
}
