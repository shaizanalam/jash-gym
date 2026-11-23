"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/" }).catch(() => {
      setError("Google sign-in is not configured yet. Please register with email.")
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dde3ea] dark:bg-[#06141B] p-4 sm:p-6">
      <div className="w-full max-w-[380px] overflow-hidden rounded-[36px] bg-[#11212D] shadow-[0_25px_60px_-15px_rgba(6,20,27,0.4)] border border-[#253745]/30 flex flex-col">
        {/* Editorial Decorative Header Banner matching reference */}
        <div className="relative pt-12 pb-14 px-8 bg-gradient-to-br from-[#253745] via-[#4A5C6A] to-[#11212D] overflow-hidden text-center">
          {/* Organic textured background shapes */}
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-[#9BA8AB]/30 blur-2xl pointer-events-none" />
          <div className="absolute top-2 -right-8 w-44 h-44 rounded-full bg-[#CCD0CF]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-32 h-32 rounded-full bg-[#11212D]/40 blur-xl pointer-events-none" />

          <h1 className="relative z-10 text-3xl font-extrabold text-[#CCD0CF] tracking-tight leading-tight">
            Create an<br />account
          </h1>
        </div>

        {/* Main Form Sheet overlapping with rounded top */}
        <div className="-mt-6 relative z-20 bg-white dark:bg-[#06141B] rounded-t-[32px] pt-7 px-7 pb-8 flex-1 flex flex-col">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Google Sign-In Pill Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full h-12 rounded-full border border-[#CCD0CF] dark:border-[#253745] bg-white dark:bg-[#11212D] hover:bg-[#f4f6f8] dark:hover:bg-[#11212D]/80 text-[#06141B] dark:text-[#CCD0CF] text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Muted 'or' divider */}
          <div className="relative my-4 text-center">
            <span className="text-[11px] text-[#9BA8AB] font-medium lowercase px-2 bg-white dark:bg-[#06141B]">
              or
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 flex-1">
            {/* Split First Name / Last Name Inputs matching reference */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
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
                className="w-full h-12 px-4 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
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
                className="w-full h-12 pl-4 pr-11 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-full bg-[#06141B] dark:bg-[#CCD0CF] text-[#CCD0CF] dark:text-[#06141B] text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all duration-150 flex items-center justify-center cursor-pointer"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Legal / Policy note matching reference */}
          <p className="mt-4 text-[11px] text-center text-[#9BA8AB] leading-relaxed">
            Signing up for an account means you agree to the{" "}
            <span className="text-[#06141B] dark:text-[#CCD0CF] font-medium underline">Privacy Policy</span> and{" "}
            <span className="text-[#06141B] dark:text-[#CCD0CF] font-medium underline">Terms of Service</span>.
          </p>

          {/* Footer Link matching reference */}
          <div className="mt-5 text-center text-xs text-[#4A5C6A] dark:text-[#9BA8AB]">
            Have an account?{" "}
            <Link
              href="/login"
              className="text-[#06141B] dark:text-[#CCD0CF] font-semibold underline underline-offset-2 ml-1"
            >
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

