import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { X } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ")
}

export { LiquidGlassCard, LiquidGlassButton } from "./liquid-glass"
export { SmoothPageTransition, AnimeEntrance } from "./anime-motion"

// Premium Button component with 150-200ms transitions and tactile response
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
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "accent" | "subtle" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
  disabled?: boolean
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary:
      "bg-[#CCD0CF] text-[#06141B] hover:bg-white hover:text-[#06141B] font-bold shadow-md active:scale-[0.98] border border-white/20 rounded-full",
    default:
      "bg-[#11212D] text-[#CCD0CF] hover:bg-[#182C3D] hover:text-white border border-[#253745]/70 active:scale-[0.98] shadow-xs",
    accent:
      "bg-[#253745] text-[#CCD0CF] hover:bg-[#344b5e] hover:text-white active:scale-[0.98] shadow-xs border border-[#4A5C6A]/50",
    glass:
      "btn-liquid-glass hover:border-[#4A5C6A]/50 hover:shadow-[#253745]/20 text-[#CCD0CF] active:scale-[0.98]",
    secondary:
      "bg-[#162837]/60 text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#1c3346] border border-[#253745]/40 active:scale-[0.98]",
    outline:
      "border border-[#253745] bg-transparent text-[#CCD0CF] hover:bg-[#11212D]/80 hover:text-white hover:border-[#4A5C6A] active:scale-[0.98]",
    ghost:
      "text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D]/60 active:scale-[0.98]",
    subtle:
      "bg-[#11212D]/40 text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] border border-transparent hover:border-[#253745]/40",
    destructive:
      "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 active:scale-[0.98]",
  }

  const sizes = {
    default: "min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-xl",
    sm: "min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg",
    lg: "min-h-[46px] px-5 py-2.5 text-sm font-semibold rounded-xl",
    icon: "h-9 w-9 p-0 flex items-center justify-center rounded-xl",
  }

  const combinedClasses = cn(
    "inline-flex items-center justify-center gap-2 transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5C6A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06141B]",
    "disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none",
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(combinedClasses, (children.props as any)?.className),
    })
  }

  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// Liquid Glass Card component with refractive depth and specular highlights
export function Card({
  className,
  children,
  hoverable,
  glass,
  ...props
}: {
  hoverable?: boolean
  glass?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        glass
          ? "liquid-glass rounded-2xl border border-[#253745]/70 shadow-[0_8px_30px_rgba(6,20,27,0.5)]"
          : "rounded-2xl bg-[#0f1b24]/90 backdrop-blur-xl text-[#CCD0CF] border border-[#253745]/50 shadow-xs",
        hoverable && "liquid-glass-hover transition-all duration-200 hover:border-[#4A5C6A]/70 cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Specular metallic top sheen */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#4A5C6A]/20 via-[#253745]/10 to-transparent pointer-events-none rounded-t-2xl" />
      {/* 1px Specular top edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCD0CF]/35 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-5 pb-3 flex flex-col space-y-1", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm sm:text-base font-semibold tracking-tight text-[#CCD0CF]", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[#9BA8AB] leading-relaxed", className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-5 pt-0", className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 sm:p-5 pt-0 flex items-center", className)} {...props}>
      {children}
    </div>
  )
}

// Refined Input component with dark slate capsule style matching design
export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl bg-[#162533] px-4 py-2.5 text-sm text-[#CCD0CF]",
        "border border-[#253745] placeholder:text-[#9BA8AB]/50",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:border-[#4A5C6A] focus-visible:ring-1 focus-visible:ring-[#4A5C6A]",
        "disabled:cursor-not-allowed disabled:opacity-50",
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
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl bg-[#081219] px-3.5 py-2.5 text-xs sm:text-sm text-[#CCD0CF]",
        "border border-[#253745]/60 placeholder:text-[#9BA8AB]/50",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:border-[#4A5C6A] focus-visible:ring-1 focus-visible:ring-[#4A5C6A]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

// Compact Badge component
export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "amber" | "cyan" | "violet" | "destructive" | "info"
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const variants = {
    default: "bg-[#11212D] text-[#CCD0CF] border border-[#253745]/60",
    secondary: "bg-[#162837]/60 text-[#9BA8AB] border border-[#253745]/40",
    outline: "border border-[#253745] text-[#9BA8AB] bg-transparent",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25",
    violet: "bg-violet-500/10 text-violet-400 border border-violet-500/25",
    destructive: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
    info: "bg-sky-500/10 text-sky-400 border border-sky-500/25",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight select-none",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Progress Bar component
export function Progress({
  value = 0,
  max = 100,
  className,
  barClassName,
}: {
  value?: number
  max?: number
  className?: string
  barClassName?: string
}) {
  const percentage = Math.min(Math.max(0, (value / (max || 1)) * 100), 100)
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[#11212D]", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full transition-all duration-300 ease-out rounded-full bg-[#4A5C6A]", barClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Label component
export function Label({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("text-xs font-medium text-[#9BA8AB] block", className)}>
      {children}
    </label>
  )
}

// Separator component
export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative my-3 flex h-[1px] w-full shrink-0 bg-[#253745]/40", className)}
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
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4A5C6A] disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-[#253745]" : "bg-[#11212D]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 rounded-full bg-[#CCD0CF] shadow-xs transition-transform duration-150",
          checked ? "translate-x-4" : "translate-x-0.5"
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
        "h-9 w-9 rounded-full flex items-center justify-center font-semibold text-xs border border-[#253745] bg-[#11212D] text-[#CCD0CF]",
        className
      )}
    >
      {children}
    </div>
  )
}

// Skeleton loading component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[#11212D]/80",
        className
      )}
      {...props}
    />
  )
}

// BottomSheet / Modal component
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg bg-[#0f1b24] border border-[#253745] rounded-t-[24px] sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between p-4 px-5 border-b border-[#253745]/60 shrink-0">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#CCD0CF]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#9BA8AB] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#11212D] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export { NutriMentorLogo, NutriMentorIcon } from "./logo"
