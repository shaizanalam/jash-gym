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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eef3] dark:bg-[#06141B] p-4 sm:p-6">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[36px] bg-[#11212D] shadow-[0_20px_50px_rgba(6,20,27,0.35)] border border-[#253745]/40 flex flex-col">
        {/* Editorial Decorative Header Banner matching reference */}
        <div className="relative pt-12 pb-14 px-8 bg-gradient-to-br from-[#253745] via-[#4A5C6A] to-[#11212D] overflow-hidden text-center">
          {/* Abstract organic background shapes */}
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-[#9BA8AB]/25 blur-xl pointer-events-none" />
          <div className="absolute top-4 -right-10 w-44 h-44 rounded-full bg-[#CCD0CF]/15 blur-2xl pointer-events-none" />

          <h1 className="relative z-10 text-3xl font-extrabold text-[#CCD0CF] tracking-tight">
            Create an<br />account
          </h1>
        </div>

        {/* Main Form Sheet overlapping with rounded top */}
        <div className="-mt-6 relative z-20 bg-white dark:bg-[#06141B] rounded-t-[32px] pt-8 px-7 pb-8 flex-1 flex flex-col">
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
            {/* Split First Name / Last Name Inputs matching reference */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-13 px-4 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-13 px-4 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
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
                className="w-full h-13 px-5 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
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
                className="w-full h-13 pl-5 pr-12 rounded-2xl bg-[#f4f6f8] dark:bg-[#11212D] text-sm text-[#06141B] dark:text-[#CCD0CF] placeholder:text-[#9BA8AB] border-none focus:outline-none focus:ring-2 focus:ring-[#253745] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1.5 text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 mt-3 rounded-full bg-[#06141B] dark:bg-[#CCD0CF] text-[#CCD0CF] dark:text-[#06141B] text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all duration-150 flex items-center justify-center cursor-pointer"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Legal / Policy note */}
          <p className="mt-5 text-[11px] text-center text-[#9BA8AB] leading-relaxed">
            By signing up, you agree to mindful nutrition tracking and privacy terms.
          </p>

          {/* Footer Link */}
          <div className="mt-5 text-center text-xs text-[#4A5C6A] dark:text-[#9BA8AB]">
            Have an account?{" "}
            <Link
              href="/login"
              className="text-[#06141B] dark:text-[#CCD0CF] font-bold hover:underline ml-1"
            >
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

