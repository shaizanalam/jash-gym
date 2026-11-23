import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.toLowerCase() || ""

  const foods = await prisma.foodItem.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { alternativeNames: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 50,
  })

  return NextResponse.json(foods)
}
