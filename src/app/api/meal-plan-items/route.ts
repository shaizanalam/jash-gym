import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { mealPlanId, mealCategory, plannedTime, foodName, portionG, notes } = body

    if (!foodName || !mealCategory) {
      return NextResponse.json(
        { error: "foodName and mealCategory are required" },
        { status: 400 }
      )
    }

    let targetPlanId = mealPlanId

    // If mealPlanId is not an existing UUID, find or create one for today/given date
    const planDate = mealPlanId && !isNaN(Date.parse(mealPlanId))
      ? new Date(mealPlanId)
      : new Date()
    planDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(planDate)
    nextDay.setDate(nextDay.getDate() + 1)

    let plan = await prisma.mealPlan.findFirst({
      where: {
        userId: session.user.id,
        planDate: { gte: planDate, lt: nextDay },
      },
    })

    if (!plan) {
      plan = await prisma.mealPlan.create({
        data: {
          userId: session.user.id,
          planDate,
          title: `Meal Plan for ${planDate.toISOString().split("T")[0]}`,
        },
      })
    }

    targetPlanId = plan.id

    const item = await prisma.mealPlanItem.create({
      data: {
        mealPlanId: targetPlanId,
        mealCategory,
        plannedTime: plannedTime || null,
        foodName,
        portionG: portionG ? parseFloat(String(portionG)) : null,
        notes: notes || null,
        isCompleted: false,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Failed to create meal plan item:", error)
    return NextResponse.json(
      { error: "Failed to create meal plan item" },
      { status: 500 }
    )
  }
}
