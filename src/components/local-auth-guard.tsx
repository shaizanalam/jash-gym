"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAppSession } from "@/components/providers"

export function LocalAuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAppSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06141B] text-[#CCD0CF]">
        <Loader2 className="h-6 w-6 animate-spin text-[#9BA8AB]" />
      </div>
    )
  }

  return <>{children}</>
}
