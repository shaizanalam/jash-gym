import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    const trimmedName = String(name).trim()
    const normalizedEmail = String(email).toLowerCase().trim()
    const trimmedPassword = String(password).trim()

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Please enter your name" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 12)

    // Create user and initial nutrition profile atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: trimmedName,
          passwordHash,
        },
      })

      await tx.nutritionProfile.create({
        data: {
          userId: newUser.id,
          dietaryPreference: "vegetarian",
        },
      })

      return newUser
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    })
  } catch (error: any) {
    console.error("Registration error:", error)
    const message =
      error?.message && typeof error.message === "string"
        ? error.message
        : "Failed to register user. Please try again."
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
