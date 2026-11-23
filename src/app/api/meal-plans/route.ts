import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const userId = session.user.id

  const where: any = { userId }
  if (date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const end = new Date(d)
    end.setDate(end.getDate() + 1)
    where.planDate = { gte: d, lt: end }
  }

  const plans = await prisma.mealPlan.findMany({
    where,
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { planDate: "desc" },
  })

  return NextResponse.json(plans)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { planDate, title, items } = body

  const plan = await prisma.mealPlan.create({
    data: {
      userId: session.user.id,
      planDate: new Date(planDate),
      title: title || `Meal plan ${planDate}`,
      items: {
        create: (items || []).map((item: any, index: number) => ({
          mealCategory: item.mealCategory,
          plannedTime: item.plannedTime || null,
          foodName: item.foodName,
          portionG: item.portionG || null,
          isCompleted: false,
          sortOrder: index,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json(plan, { status: 201 })
}
