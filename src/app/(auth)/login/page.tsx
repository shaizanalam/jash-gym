"use client"

import { useState, Suspense, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { animate } from "animejs"
import { NutriMentorLogo } from "@/components/ui/logo"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(
    registered ? "Account created successfully! Please sign in." : ""
  )

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.96, 1],
      ease: "outCubic",
      duration: 520,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const normalizedEmail = email.toLowerCase().trim()
      const rawPassword = password.trim()

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: rawPassword,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please try again.")
        setLoading(false)
        return
      }

      // Hard redirect ensures session cookie is flushed and picked up by server layout
      window.location.href = "/"
    } catch (err) {
      console.error("[Login] submit error:", err)
      setError("Login failed. Please try again.")
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    setEmail("demo@nutrimentor.com")
    setPassword("password123")
    setError("")
  }

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[380px] overflow-hidden rounded-[32px] bg-[#0c1822] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-[#253745]/70 flex flex-col will-change-transform relative"
    >
      {/* Specular Metallic Top Header */}
      <div className="relative pt-10 pb-7 px-8 bg-gradient-to-b from-[#4A5C6A]/50 via-[#253745]/30 to-transparent overflow-hidden text-center rounded-t-[32px] flex flex-col items-center">
        {/* Top Edge Specular Highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCD0CF]/40 to-transparent pointer-events-none" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full bg-[#9BA8AB]/20 blur-2xl pointer-events-none" />

        <NutriMentorLogo size="md" href="/" className="relative z-10 mb-3" />

        <h1 className="relative z-10 text-2xl font-extrabold text-[#CCD0CF] tracking-tight leading-snug">
          Welcome back
        </h1>
        <p className="relative z-10 text-xs text-[#9BA8AB] mt-1 font-medium">
          Sign in to your NutriMentor journey
        </p>
      </div>

      {/* Main Form Sheet */}
      <div className="px-7 pb-8 pt-2 flex-1 flex flex-col">
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-[#253745]/50 border border-[#9BA8AB]/40 text-[#CCD0CF] text-xs font-medium text-center">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
          {/* Email input pill */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-[#162533] text-sm text-[#CCD0CF] placeholder:text-[#9BA8AB]/60 border border-[#253745] focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all"
              required
            />
          </div>

          {/* Password input with toggle button */}
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-4 pr-11 rounded-xl bg-[#162533] text-sm text-[#CCD0CF] placeholder:text-[#9BA8AB]/60 border border-[#253745] focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Main Action Button - Silver Pill matching reference */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-3 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 flex items-center justify-center cursor-pointer"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>

          {/* Quick Demo Fill button */}
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full h-9 rounded-full bg-[#182C3D]/60 hover:bg-[#253745]/70 text-[#9BA8AB] hover:text-[#CCD0CF] text-xs font-medium border border-[#253745]/60 transition-all flex items-center justify-center cursor-pointer"
          >
            Fill Demo Account (demo@nutrimentor.com)
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[#9BA8AB]">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-[#CCD0CF] font-semibold underline underline-offset-2 ml-1"
          >
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06141B] p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-[380px] h-[520px] bg-white dark:bg-[#11212D] rounded-[36px] shadow-xl animate-pulse" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}

