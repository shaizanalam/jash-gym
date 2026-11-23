import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { X } from "lucide-react"

// Utility type for merging class names
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ")
}

// --- UI Components ---

export { LiquidGlassCard, LiquidGlassButton } from "./liquid-glass"

// Button component adhering to Apple HIG (min 44px touch target on mobile + spring physics)
export function Button({
  children,
  className,
  variant = "default",
  size = "default",
  disabled,
  asChild,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "accent" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    default:
      "bg-gradient-to-r from-[#167d8d] via-[#1a8e9e] to-[#2f4a63] hover:from-[#136b79] hover:to-[#253d53] text-white shadow-sm shadow-[#167d8d]/30 active:from-[#0d505b] active:to-[#1a2d3e]",
    accent:
      "bg-[#071b2b] text-white hover:bg-[#131b2b] active:bg-[#040e17] dark:bg-[#b9e4e8] dark:text-[#071b2b] dark:hover:bg-white shadow-sm",
    glass:
      "btn-liquid-glass hover:border-[#167d8d]/50 hover:shadow-[#167d8d]/20",
    secondary:
      "bg-[#cfeae0]/40 text-[#071b2b] hover:bg-[#cfeae0]/70 active:bg-[#cfeae0] dark:bg-[#2f4a63]/40 dark:text-[#cfeae0] dark:hover:bg-[#2f4a63]/70",
    outline:
      "border border-[#2f4a63]/20 dark:border-[#5b91a3]/30 bg-white/70 dark:bg-[#131b2b]/70 text-[#071b2b] dark:text-[#f4f8fa] hover:bg-[#cfeae0]/30 dark:hover:bg-[#2f4a63]/30 shadow-2xs hover:border-[#167d8d]/40 hover:shadow-sm",
    ghost:
      "text-[#4e6a7d] hover:text-[#071b2b] hover:bg-[#cfeae0]/30 dark:text-[#8ba5b5] dark:hover:text-[#f4f8fa] dark:hover:bg-[#2f4a63]/30",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-600/25",
  }

  // 44px minimum mobile tap targets (Apple HIG Section 3.B)
  const sizes = {
    default: "min-h-[44px] px-4 py-2 text-sm font-semibold rounded-2xl",
    sm: "min-h-[36px] sm:min-h-[32px] px-3.5 py-1.5 text-xs font-semibold rounded-xl",
    lg: "min-h-[50px] px-6 text-base font-bold rounded-2xl",
    icon: "min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-2xl",
  }

  const combinedClasses = cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.96] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer touch-manipulation",
    variants[variant],
    sizes[size],
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(combinedClasses, (children.props as any)?.className),
    })
  }

  return (
    <button
      type="button"
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Input component with 44px touch height and Apple focus styling
export function Input({
  className,
  type,
  ...props
}: {
  className?: string
  type?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-[44px] w-full rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/15 transition-all disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
        className
      )}
      {...props}
    />
  )
}

// Textarea component
export function Textarea({
  className,
  ...props
}: {
  className?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/15 transition-all disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
        className
      )}
      {...props}
    />
  )
}

// Badge component with soft tinted pill styles
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children?: React.ReactNode
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "info" | "destructive" | "ocean" | "mint"
  className?: string
}) {
  const variants = {
    default: "bg-[#071b2b] text-white dark:bg-[#b9e4e8] dark:text-[#071b2b]",
    ocean:
      "bg-[#2f4a63]/15 text-[#2f4a63] border border-[#2f4a63]/25 dark:bg-[#5b91a3]/20 dark:text-[#b9e4e8] dark:border-[#5b91a3]/30",
    mint:
      "bg-[#cfeae0]/70 text-[#071b2b] border border-[#cfeae0] dark:bg-[#cfeae0]/15 dark:text-[#cfeae0] dark:border-[#cfeae0]/20",
    secondary:
      "bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80",
    outline:
      "border border-[#2f4a63]/20 dark:border-[#5b91a3]/30 bg-transparent text-[#071b2b] dark:text-[#f4f8fa]",
    success:
      "bg-[#cfeae0]/80 text-[#0d505b] border border-[#cfeae0] dark:bg-[#167d8d]/30 dark:text-[#b9e4e8] dark:border-[#167d8d]/40",
    warning:
      "bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70",
    info:
      "bg-[#b9e4e8]/40 text-[#167d8d] border border-[#b9e4e8]/60 dark:bg-[#167d8d]/20 dark:text-[#b9e4e8] dark:border-[#167d8d]/30",
    destructive:
      "bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight select-none",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Label component
export function Label({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block", className)}>
      {children}
    </label>
  )
}

// Separator component
export function Separator({ className }: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative my-4 flex h-[1px] w-full shrink-0 cursor-default bg-slate-200/80 dark:bg-slate-800/80",
        className
      )}
    />
  )
}

// Switch component
export function Switch({
  checked,
  className,
  onCheckedChange,
  ...props
}: {
  checked?: boolean
  className?: string
  onCheckedChange?: (checked: boolean) => void
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167d8d] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
        checked ? "bg-[#167d8d]" : "bg-slate-200 dark:bg-slate-700",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-[20px]" : "translate-x-[2px]"
        )}
      />
    </button>
  )
}

// Avatar component
export function Avatar({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs",
        className
      )}
    >
      {children}
    </div>
  )
}

// Card components with Apple HIG diffuse elevation, liquid glass & rounded-2xl geometry
export function Card({ children, className, hoverable, glass }: {
  children?: React.ReactNode
  className?: string
  hoverable?: boolean
  glass?: boolean
}) {
  return (
    <div
      className={cn(
        glass
          ? "liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-6"
          : "bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.04)]",
        hoverable && "liquid-glass-hover transition-all duration-200 hover:shadow-lg hover:border-emerald-500/30 active:scale-[0.99] cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <h3
      className={cn(
        "text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-xs text-slate-500 dark:text-slate-400", className)}>
      {children}
    </p>
  )
}

export function CardContent({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return <div className={cn("pt-0", className)}>{children}</div>
}

export function CardFooter({ children, className }: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4",
        className
      )}
    >
      {children}
    </div>
  )
}

// Skeleton component for skeleton screens & loading states
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80",
        className
      )}
      {...props}
    />
  )
}

// Phone-First Apple HIG Bottom Sheet Modal
export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-Up Sheet (Mobile) / Centered Modal (Desktop) */}
      <div
        className={cn(
          "relative w-full max-h-[92vh] sm:max-h-[85vh] sm:max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-slate-800/80 rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col z-10 animate-sheet-slide-up overflow-hidden",
          className
        )}
      >
        {/* iOS Pull Pill Indicator (Mobile only) */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden cursor-grab active:cursor-grabbing">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sheet"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 safe-bottom">
          {children}
        </div>
      </div>
    </div>
  )
}
