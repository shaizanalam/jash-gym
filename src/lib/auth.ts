import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

// Strip localhost NEXTAUTH_URL so Auth.js dynamically adapts to mobile IP (192.168.x.x) and Vercel domains
if (process.env.NEXTAUTH_URL?.includes("localhost")) {
  delete process.env.NEXTAUTH_URL
}
if (process.env.AUTH_URL?.includes("localhost")) {
  delete process.env.AUTH_URL
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "nutrimentor-jwt-secret-key-32chars-fallback-secure",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const normalizedEmail = String(credentials.email).toLowerCase().trim()
        const rawPassword = String(credentials.password).trim()

        // Guaranteed instant access for demo credentials across all environments
        if (normalizedEmail === "demo@nutrimentor.com" && rawPassword === "password123") {
          try {
            const user = await prisma.user.findUnique({
              where: { email: "demo@nutrimentor.com" },
            })
            if (user) {
              return {
                id: user.id,
                email: user.email,
                name: user.name || "Demo User",
                image: user.image || null,
              }
            }
          } catch (e) {
            console.warn("[Auth] Demo user lookup error:", e)
          }

          // Stable fallback with matching database UUID
          return {
            id: "fbcc7c6d-515d-4803-b907-7fab07656ff3",
            email: "demo@nutrimentor.com",
            name: "Demo User",
            image: null,
          }
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            rawPassword,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || "User",
            image: user.image || null,
          }
        } catch (error) {
          console.error("[Auth] Database authorize error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        if (token.email) session.user.email = token.email as string
        if (token.name) session.user.name = token.name as string
      }
      return session
    },
  },
})
