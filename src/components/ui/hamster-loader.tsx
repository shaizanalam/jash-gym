/*
From Uiverse.io by Nawsome - https://uiverse.io/Nawsome/wet-mayfly-23
MIT License, Copyright (c) Nawsome
*/

import * as React from "react"
import { cn } from "@/lib/utils"

export interface HamsterLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

/**
 * Animated hamster wheel loader adapted from Uiverse.io (Nawsome/wet-mayfly-23).
 */
export function HamsterLoader({
  className,
  label = "Orange and tan hamster running in a metal wheel",
  ...props
}: HamsterLoaderProps) {
  return (
    <div
      aria-label={label}
      role="img"
      className={cn("hamster-loader", className)}
      {...props}
    >
      <div className="hamster-loader__wheel" />
      <div className="hamster-loader__hamster">
        <div className="hamster-loader__body">
          <div className="hamster-loader__head">
            <div className="hamster-loader__ear" />
            <div className="hamster-loader__eye" />
            <div className="hamster-loader__nose" />
          </div>
          <div className="hamster-loader__limb hamster-loader__limb--fr" />
          <div className="hamster-loader__limb hamster-loader__limb--fl" />
          <div className="hamster-loader__limb hamster-loader__limb--br" />
          <div className="hamster-loader__limb hamster-loader__limb--bl" />
          <div className="hamster-loader__tail" />
        </div>
      </div>
      <div className="hamster-loader__spoke" />
    </div>
  )
}
