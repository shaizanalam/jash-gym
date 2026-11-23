"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/index"
import { Input } from "@/components/ui/index"
import { Card, CardContent } from "@/components/ui/index"
import { Lock, Mail, Sparkles, CheckCircle2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(
    registered ? "Account created successfully! Please sign in." : ""
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md p-8 shadow-xl border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
      <div className="flex flex-col items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Sign In to NutriMentor
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
          Mindful Nutrition Companion
        </p>
      </div>

      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold shadow-md shadow-emerald-600/25 mt-2"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <CardContent className="pt-6 px-0 pb-0 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl animate-pulse h-96" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
