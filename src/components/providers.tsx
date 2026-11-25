"use client"

import * as React from "react"
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { isLocalAppMode } from "@/lib/app-env"
import {
  getLocalSession,
  getLocalStoreVersion,
  localLogin,
  localLogout,
  localRegister,
  subscribeLocalStore,
  updateLocalSessionUser,
} from "@/lib/local-store"

export interface AppSessionUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

export interface AppSessionState {
  data: { user: AppSessionUser } | null
  status: "loading" | "authenticated" | "unauthenticated"
  refreshSession: (payload?: { name?: string }) => void
  signInUser: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  registerUser: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  updateSessionUser: (partial: { name?: string }) => Promise<void>
  signOutUser: () => Promise<void>
}

const AppSessionContext = React.createContext<AppSessionState>({
  data: null,
  status: "loading",
  refreshSession: () => {},
  signInUser: async () => ({ ok: false }),
  registerUser: async () => ({ ok: false }),
  updateSessionUser: async () => {},
  signOutUser: async () => {},
})

export function useAppSession() {
  return React.useContext(AppSessionContext)
}

const sessionServerSnapshot = () => -1

function LocalSessionBridge({ children }: { children: React.ReactNode }) {
  const storeVersion = React.useSyncExternalStore(
    subscribeLocalStore,
    getLocalStoreVersion,
    sessionServerSnapshot
  )

  const user = React.useMemo<AppSessionUser | null>(() => {
    if (storeVersion < 0) return null
    return getLocalSession()
  }, [storeVersion])

  const status: "loading" | "authenticated" | "unauthenticated" =
    storeVersion < 0 ? "loading" : user ? "authenticated" : "unauthenticated"

  const refreshSession = React.useCallback(() => {
    // Re-reads happen automatically via subscribeLocalStore
  }, [])

  const signInUser = React.useCallback(async (email: string, password: string) => {
    const res = localLogin(email, password)
    if (!res.ok || !res.user) {
      return { ok: false, error: res.error || "CredentialsSignin" }
    }
    return { ok: true }
  }, [])

  const registerUser = React.useCallback(async (name: string, email: string, password: string) => {
    const res = localRegister(name, email, password)
    if (!res.ok) {
      return { ok: false, error: res.error || "Signup failed" }
    }
    return { ok: true }
  }, [])

  const updateSessionUser = React.useCallback(async (partial: { name?: string }) => {
    updateLocalSessionUser(partial)
  }, [])

  const signOutUser = React.useCallback(async () => {
    localLogout()
  }, [])

  const value = React.useMemo<AppSessionState>(
    () => ({
      data: user ? { user } : null,
      status,
      refreshSession,
      signInUser,
      registerUser,
      updateSessionUser,
      signOutUser,
    }),
    [user, status, refreshSession, signInUser, registerUser, updateSessionUser, signOutUser]
  )

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
}

function NextAuthSessionBridge({ children }: { children: React.ReactNode }) {
  const { data, status, update } = useSession()

  const signInUser = React.useCallback(async (email: string, password: string) => {
    const result = await nextAuthSignIn("credentials", {
      email: email.toLowerCase().trim(),
      password: password.trim(),
      redirect: false,
    })
    if (result?.error) {
      return { ok: false, error: result.error }
    }
    return { ok: true }
  }, [])

  const registerUser = React.useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup", name, email, password }),
    })
    const payload = await res.json()
    if (!res.ok) {
      return { ok: false, error: payload.error || "Signup failed" }
    }
    return { ok: true }
  }, [])

  const updateSessionUser = React.useCallback(
    async (partial: { name?: string }) => {
      await update(partial)
    },
    [update]
  )

  const signOutUser = React.useCallback(async () => {
    await nextAuthSignOut({ callbackUrl: "/login" })
  }, [])

  const value = React.useMemo<AppSessionState>(
    () => ({
      data: data?.user ? { user: data.user as AppSessionUser } : null,
      status,
      refreshSession: (payload?: { name?: string }) => {
        void update(payload)
      },
      signInUser,
      registerUser,
      updateSessionUser,
      signOutUser,
    }),
    [data, status, update, signInUser, registerUser, updateSessionUser, signOutUser]
  )

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const localMode = isLocalAppMode()

  React.useEffect(() => {
    if (
      !localMode &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("NutriMentor PWA Service Worker registered:", reg.scope))
        .catch((err) => console.warn("PWA Service Worker registration failed:", err))
    }
  }, [localMode])

  if (localMode) {
    return <LocalSessionBridge>{children}</LocalSessionBridge>
  }

  return (
    <SessionProvider>
      <NextAuthSessionBridge>{children}</NextAuthSessionBridge>
    </SessionProvider>
  )
}
