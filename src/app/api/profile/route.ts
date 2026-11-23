import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [profile, guidance] = await Promise.all([
    prisma.nutritionProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.professionalGuidance.findUnique({ where: { userId: session.user.id } }),
  ])

  return NextResponse.json({ profile, guidance })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { type } = data

    if (type === "profile") {
      const { age, dietaryPreference, allergies, restrictions, activityLevel } = data
      const parsedAge = age ? parseInt(String(age), 10) : null

      const updated = await prisma.nutritionProfile.upsert({
        where: { userId: session.user.id },
        update: {
          age: parsedAge,
          dietaryPreference,
          allergies: allergies ? JSON.stringify(allergies) : null,
          restrictions: restrictions ? JSON.stringify(restrictions) : null,
          activityLevel,
        },
        create: {
          userId: session.user.id,
          age: parsedAge,
          dietaryPreference,
          allergies: allergies ? JSON.stringify(allergies) : null,
          restrictions: restrictions ? JSON.stringify(restrictions) : null,
          activityLevel,
        },
      })
      return NextResponse.json({ profile: updated })
    }

    if (type === "guidance") {
      const { dailyCalorieRef, dailyProteinRef, sourceNotes } = data
      const cal = dailyCalorieRef ? parseInt(String(dailyCalorieRef), 10) : null
      const prot = dailyProteinRef ? parseInt(String(dailyProteinRef), 10) : null

      const updated = await prisma.professionalGuidance.upsert({
        where: { userId: session.user.id },
        update: {
          dailyCalorieRef: cal,
          dailyProteinRef: prot,
          sourceNotes,
        },
        create: {
          userId: session.user.id,
          dailyCalorieRef: cal,
          dailyProteinRef: prot,
          sourceNotes,
          enteredByProfessional: false,
        },
      })
      return NextResponse.json({ guidance: updated })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
