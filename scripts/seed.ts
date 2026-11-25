import fs from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

interface SeedFoodItem {
  name: string
  alternativeNames: string[]
  category: string
  servingSizeG: number
  servingUnit: string
  caloriesPer100g: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  source: string
  isCustom: boolean
}

const prisma = new PrismaClient()

async function main() {
  const dataPath = path.resolve(process.cwd(), "src", "data", "indian-foods.json")
  const foods = JSON.parse(fs.readFileSync(dataPath, "utf8")) as SeedFoodItem[]

  console.log(`Seeding Master Indian Food Reference Database (${foods.length} items)...`)

  const existing = await prisma.foodItem.findMany({
    select: { name: true },
  })
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  const toCreate = foods
    .filter((food) => !existingNames.has(food.name.toLowerCase()))
    .map((food) => ({
      name: food.name,
      alternativeNames: JSON.stringify(food.alternativeNames),
      category: food.category,
      servingSizeG: food.servingSizeG,
      servingUnit: food.servingUnit,
      caloriesPer100g: food.caloriesPer100g,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      fibreG: food.fibreG,
      source: food.source,
      isCustom: food.isCustom,
    }))

  let createdCount = 0
  if (toCreate.length > 0) {
    const result = await prisma.foodItem.createMany({
      data: toCreate,
    })
    createdCount = result.count
  }

  console.log(`Master Food Database ready. (${createdCount} new items inserted)`)
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
