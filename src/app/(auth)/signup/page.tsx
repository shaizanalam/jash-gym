"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { animate } from "animejs"
import { NutriMentorLogo } from "@/components/ui/logo"

export default function SignupPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!fullName || !email || !password) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", name: fullName, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Signup failed")
        setLoading(false)
        return
      }

      // Automatically sign in upon registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push("/login?registered=true")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("Signup failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06141B] p-4 sm:p-6">
      <div
        ref={cardRef}
        className="w-full max-w-[380px] overflow-hidden rounded-[32px] bg-[#0c1822] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-[#253745]/70 flex flex-col will-change-transform relative"
      >
        {/* Specular Metallic Top Header */}
        <div className="relative pt-10 pb-7 px-8 bg-gradient-to-b from-[#4A5C6A]/50 via-[#253745]/30 to-transparent overflow-hidden text-center rounded-t-[32px] flex flex-col items-center">
          {/* Top Edge Specular Highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#CCD0CF]/40 to-transparent pointer-events-none" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full bg-[#9BA8AB]/20 blur-2xl pointer-events-none" />

          <NutriMentorLogo size="md" href="/" className="relative z-10 mb-4" />

          <h1 className="relative z-10 text-2xl font-extrabold text-[#CCD0CF] tracking-tight leading-snug">
            Create an account
          </h1>
        </div>

        {/* Main Form Sheet */}
        <div className="px-7 pb-8 pt-2 flex-1 flex flex-col">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 flex-1">
            {/* Split First Name / Last Name Inputs matching reference */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#162533] text-sm text-[#CCD0CF] placeholder:text-[#9BA8AB]/60 border border-[#253745] focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#162533] text-sm text-[#CCD0CF] placeholder:text-[#9BA8AB]/60 border border-[#253745] focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition-all"
                required
              />
            </div>

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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Legal / Policy note matching reference */}
          <p className="mt-5 text-[11px] text-center text-[#9BA8AB] leading-relaxed">
            Signing up for an account means you agree to the{" "}
            <span className="text-[#CCD0CF] font-medium underline">Privacy Policy</span> and{" "}
            <span className="text-[#CCD0CF] font-medium underline">Terms of Service</span>.
          </p>

          {/* Footer Link matching reference */}
          <div className="mt-4 text-center text-xs text-[#9BA8AB]">
            Have an account?{" "}
            <Link
              href="/login"
              className="text-[#CCD0CF] font-semibold underline underline-offset-2 ml-1"
            >
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

