/**
 * Generates src/data/indian-foods.json by combining:
 * 1. Curated prepared Indian & global staple dishes (NIN / IFCT / USDA cooked meal portions)
 * 2. All 542 raw & traditional entries from the official IFCT 2017 dataset (@ifct2017/compositions)
 *
 * Run: node --experimental-strip-types scripts/import-foods.ts (Node 22+)
 */
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

export interface ImportedFoodItem {
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

const CURATED_PREPARED_DISHES: ImportedFoodItem[] = [
  {
    name: "Roti / Chapati",
    alternativeNames: ["Roti", "Rotis", "Chapati", "Chapatis", "Phulka", "Phulkas", "Fulka"],
    category: "indian_grain",
    servingSizeG: 40,
    servingUnit: "piece",
    caloriesPer100g: 297,
    proteinG: 9.7,
    carbsG: 59.6,
    fatG: 3.8,
    fibreG: 4.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Rice (Cooked)",
    alternativeNames: ["Chawal", "Steamed Rice", "White Rice", "Boiled Rice", "Cooked Rice", "Rice"],
    category: "indian_grain",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 130,
    proteinG: 2.7,
    carbsG: 28.2,
    fatG: 0.3,
    fibreG: 0.4,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Brown Rice (Cooked)",
    alternativeNames: ["Brown Rice", "Cooked Brown Rice"],
    category: "indian_grain",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 112,
    proteinG: 2.6,
    carbsG: 23.5,
    fatG: 0.9,
    fibreG: 1.8,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Jeera Rice",
    alternativeNames: ["Cumin Rice"],
    category: "indian_grain",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 158,
    proteinG: 3.0,
    carbsG: 28.5,
    fatG: 3.5,
    fibreG: 0.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Paratha",
    alternativeNames: ["Plain Paratha", "Parathas"],
    category: "indian_grain",
    servingSizeG: 80,
    servingUnit: "piece",
    caloriesPer100g: 296,
    proteinG: 6.1,
    carbsG: 38.5,
    fatG: 13.0,
    fibreG: 3.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Aloo Paratha",
    alternativeNames: ["Potato Paratha", "Stuffed Aloo Paratha"],
    category: "indian_grain",
    servingSizeG: 120,
    servingUnit: "piece",
    caloriesPer100g: 245,
    proteinG: 5.2,
    carbsG: 36.0,
    fatG: 9.2,
    fibreG: 3.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Paneer Paratha",
    alternativeNames: ["Stuffed Paneer Paratha"],
    category: "indian_grain",
    servingSizeG: 130,
    servingUnit: "piece",
    caloriesPer100g: 270,
    proteinG: 10.2,
    carbsG: 31.0,
    fatG: 11.5,
    fibreG: 2.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Naan",
    alternativeNames: ["Plain Naan", "Butter Naan", "Tandoori Naan"],
    category: "indian_grain",
    servingSizeG: 90,
    servingUnit: "piece",
    caloriesPer100g: 290,
    proteinG: 8.5,
    carbsG: 50.0,
    fatG: 6.2,
    fibreG: 2.1,
    source: "USDA / NIN",
    isCustom: false,
  },
  {
    name: "Poha",
    alternativeNames: ["Kanda Poha", "Batata Poha", "Cooked Poha", "Flattened Rice"],
    category: "indian_snack",
    servingSizeG: 150,
    servingUnit: "plate",
    caloriesPer100g: 160,
    proteinG: 3.2,
    carbsG: 32.0,
    fatG: 2.5,
    fibreG: 1.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Upma",
    alternativeNames: ["Rava Upma", "Suji Upma"],
    category: "indian_snack",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 145,
    proteinG: 3.8,
    carbsG: 24.5,
    fatG: 3.6,
    fibreG: 1.9,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Idli",
    alternativeNames: ["Idlis", "Steamed Rice Cake", "Rava Idli"],
    category: "indian_snack",
    servingSizeG: 50,
    servingUnit: "piece",
    caloriesPer100g: 139,
    proteinG: 4.2,
    carbsG: 28.0,
    fatG: 0.8,
    fibreG: 1.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Dosa",
    alternativeNames: ["Plain Dosa", "Paper Dosa", "Dosas", "Sada Dosa"],
    category: "indian_snack",
    servingSizeG: 90,
    servingUnit: "piece",
    caloriesPer100g: 165,
    proteinG: 3.9,
    carbsG: 28.2,
    fatG: 4.1,
    fibreG: 1.9,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Masala Dosa",
    alternativeNames: ["Potato Dosa"],
    category: "indian_snack",
    servingSizeG: 170,
    servingUnit: "piece",
    caloriesPer100g: 195,
    proteinG: 4.2,
    carbsG: 30.5,
    fatG: 6.4,
    fibreG: 2.3,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Uttapam",
    alternativeNames: ["Onion Uttapam", "Vegetable Uttapam"],
    category: "indian_snack",
    servingSizeG: 130,
    servingUnit: "piece",
    caloriesPer100g: 175,
    proteinG: 4.5,
    carbsG: 30.0,
    fatG: 4.0,
    fibreG: 2.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Medu Vada",
    alternativeNames: ["Vada", "Urad Dal Vada", "Sambar Vada"],
    category: "indian_snack",
    servingSizeG: 55,
    servingUnit: "piece",
    caloriesPer100g: 285,
    proteinG: 9.2,
    carbsG: 31.0,
    fatG: 13.8,
    fibreG: 3.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Khichdi",
    alternativeNames: ["Moong Dal Khichdi", "Dal Khichdi", "Rice and Lentil Mix"],
    category: "indian_snack",
    servingSizeG: 200,
    servingUnit: "bowl",
    caloriesPer100g: 120,
    proteinG: 4.5,
    carbsG: 24.0,
    fatG: 1.5,
    fibreG: 2.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Dal Tadka",
    alternativeNames: ["Dal", "Yellow Dal", "Toor Dal", "Yellow Lentil Curry", "Dal Fry", "Moong Dal"],
    category: "indian_dal",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 115,
    proteinG: 6.8,
    carbsG: 18.5,
    fatG: 2.5,
    fibreG: 5.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Dal Makhani",
    alternativeNames: ["Black Lentil Curry", "Maa Ki Dal"],
    category: "indian_dal",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 185,
    proteinG: 8.2,
    carbsG: 22.0,
    fatG: 7.5,
    fibreG: 6.0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Rajma Masala",
    alternativeNames: ["Rajma", "Rajma Curry", "Kidney Bean Curry"],
    category: "indian_dal",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 135,
    proteinG: 6.5,
    carbsG: 19.5,
    fatG: 3.2,
    fibreG: 5.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Chole Masala",
    alternativeNames: ["Chole", "Chana Masala", "Chickpea Curry", "Kabuli Chana"],
    category: "indian_dal",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 155,
    proteinG: 6.8,
    carbsG: 21.5,
    fatG: 4.5,
    fibreG: 6.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Sambar",
    alternativeNames: ["Sambhar", "Lentil Vegetable Stew"],
    category: "indian_dal",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 95,
    proteinG: 4.5,
    carbsG: 14.5,
    fatG: 2.2,
    fibreG: 4.0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Kadhi Pakora",
    alternativeNames: ["Kadhi", "Besan Kadhi"],
    category: "indian_dal",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 128,
    proteinG: 4.0,
    carbsG: 12.2,
    fatG: 7.0,
    fibreG: 1.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Paneer",
    alternativeNames: ["Cottage Cheese", "Fresh Paneer"],
    category: "indian_dairy",
    servingSizeG: 100,
    servingUnit: "portion",
    caloriesPer100g: 265,
    proteinG: 18.3,
    carbsG: 1.2,
    fatG: 20.8,
    fibreG: 0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Paneer Bhurji",
    alternativeNames: ["Scrambled Paneer"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 215,
    proteinG: 13.5,
    carbsG: 4.8,
    fatG: 15.8,
    fibreG: 1.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Palak Paneer",
    alternativeNames: ["Spinach Paneer", "Spinach with Paneer"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 165,
    proteinG: 9.5,
    carbsG: 10.2,
    fatG: 10.5,
    fibreG: 3.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Paneer Butter Masala",
    alternativeNames: ["Paneer Makhani", "Shahi Paneer"],
    category: "indian_sabzi",
    servingSizeG: 160,
    servingUnit: "bowl",
    caloriesPer100g: 235,
    proteinG: 8.8,
    carbsG: 10.5,
    fatG: 17.5,
    fibreG: 1.6,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Matar Paneer",
    alternativeNames: ["Mutter Paneer", "Peas Paneer"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 172,
    proteinG: 8.6,
    carbsG: 11.4,
    fatG: 10.2,
    fibreG: 2.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Curd / Yogurt",
    alternativeNames: ["Curd", "Dahi", "Plain Curd", "Yogurt", "Greek Yogurt"],
    category: "indian_dairy",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 61,
    proteinG: 3.5,
    carbsG: 4.7,
    fatG: 3.3,
    fibreG: 0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Chaas (Buttermilk)",
    alternativeNames: ["Chaas", "Buttermilk", "Mattha", "Masala Chaas"],
    category: "beverage",
    servingSizeG: 250,
    servingUnit: "glass",
    caloriesPer100g: 32,
    proteinG: 1.8,
    carbsG: 2.8,
    fatG: 1.4,
    fibreG: 0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Lassi (Sweet)",
    alternativeNames: ["Lassi", "Sweet Lassi"],
    category: "beverage",
    servingSizeG: 250,
    servingUnit: "glass",
    caloriesPer100g: 78,
    proteinG: 2.6,
    carbsG: 11.2,
    fatG: 2.5,
    fibreG: 0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Milk",
    alternativeNames: ["Doodh", "Cow Milk", "Toned Milk"],
    category: "indian_dairy",
    servingSizeG: 250,
    servingUnit: "glass",
    caloriesPer100g: 61,
    proteinG: 3.2,
    carbsG: 4.8,
    fatG: 3.3,
    fibreG: 0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Masala Chai",
    alternativeNames: ["Chai", "Milk Tea", "Tea", "Indian Tea"],
    category: "beverage",
    servingSizeG: 150,
    servingUnit: "cup",
    caloriesPer100g: 48,
    proteinG: 1.6,
    carbsG: 6.5,
    fatG: 1.6,
    fibreG: 0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Filter Coffee / Milk Coffee",
    alternativeNames: ["Coffee", "Filter Coffee", "Cappuccino"],
    category: "beverage",
    servingSizeG: 150,
    servingUnit: "cup",
    caloriesPer100g: 52,
    proteinG: 2.0,
    carbsG: 6.8,
    fatG: 1.8,
    fibreG: 0,
    source: "USDA / NIN",
    isCustom: false,
  },
  {
    name: "Black Coffee",
    alternativeNames: ["Americano", "Espresso"],
    category: "beverage",
    servingSizeG: 200,
    servingUnit: "cup",
    caloriesPer100g: 2,
    proteinG: 0.1,
    carbsG: 0.2,
    fatG: 0,
    fibreG: 0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Aloo Sabzi",
    alternativeNames: ["Potato Curry", "Jeera Aloo", "Aloo Tamatar"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 95,
    proteinG: 2.1,
    carbsG: 14.5,
    fatG: 3.8,
    fibreG: 2.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Aloo Gobi",
    alternativeNames: ["Cauliflower Potato Sabzi"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 98,
    proteinG: 2.6,
    carbsG: 13.0,
    fatG: 4.1,
    fibreG: 3.0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Bhindi Masala",
    alternativeNames: ["Bhindi Sabzi", "Okra Fry", "Ladyfinger Sabzi"],
    category: "indian_sabzi",
    servingSizeG: 140,
    servingUnit: "bowl",
    caloriesPer100g: 105,
    proteinG: 2.4,
    carbsG: 11.2,
    fatG: 5.6,
    fibreG: 3.8,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Baingan Bharta",
    alternativeNames: ["Eggplant Mash", "Brinjal Bharta"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 88,
    proteinG: 2.0,
    carbsG: 10.2,
    fatG: 4.4,
    fibreG: 3.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Mixed Vegetable",
    alternativeNames: ["Sabzi Mix", "Mix Veg", "Mix Veg Sabzi", "Sabzi"],
    category: "indian_sabzi",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 75,
    proteinG: 2.8,
    carbsG: 12.5,
    fatG: 2.0,
    fibreG: 4.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Egg (Boiled)",
    alternativeNames: ["Boiled Egg", "Boiled Eggs", "Anda", "Hard Boiled Egg", "Eggs", "Egg"],
    category: "protein",
    servingSizeG: 50,
    servingUnit: "piece",
    caloriesPer100g: 155,
    proteinG: 13.0,
    carbsG: 1.1,
    fatG: 11.0,
    fibreG: 0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Egg Omelette",
    alternativeNames: ["Omelette", "Masala Omelette", "Egg Bhurji"],
    category: "protein",
    servingSizeG: 100,
    servingUnit: "serving",
    caloriesPer100g: 174,
    proteinG: 11.8,
    carbsG: 1.8,
    fatG: 13.2,
    fibreG: 0.3,
    source: "USDA / NIN",
    isCustom: false,
  },
  {
    name: "Chicken Breast (Grilled)",
    alternativeNames: ["Grilled Chicken", "Chicken Breast", "Tandoori Chicken Breast"],
    category: "protein",
    servingSizeG: 150,
    servingUnit: "serving",
    caloriesPer100g: 165,
    proteinG: 31.0,
    carbsG: 0,
    fatG: 3.6,
    fibreG: 0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Chicken Curry",
    alternativeNames: ["Murgh Curry", "Tariwala Chicken", "Home Style Chicken Curry"],
    category: "protein",
    servingSizeG: 150,
    servingUnit: "bowl",
    caloriesPer100g: 220,
    proteinG: 18.0,
    carbsG: 6.5,
    fatG: 13.5,
    fibreG: 1.0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Chicken Biryani",
    alternativeNames: ["Biryani", "Hyderabadi Chicken Biryani"],
    category: "indian_grain",
    servingSizeG: 250,
    servingUnit: "plate",
    caloriesPer100g: 178,
    proteinG: 9.4,
    carbsG: 21.8,
    fatG: 5.8,
    fibreG: 1.2,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Veg Biryani / Pulao",
    alternativeNames: ["Veg Pulao", "Pulao", "Veg Biryani"],
    category: "indian_grain",
    servingSizeG: 220,
    servingUnit: "plate",
    caloriesPer100g: 148,
    proteinG: 3.6,
    carbsG: 24.5,
    fatG: 4.0,
    fibreG: 2.0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Sprouts",
    alternativeNames: ["Moong Sprouts", "Ankurit Moong", "Sprouted Moong"],
    category: "protein",
    servingSizeG: 100,
    servingUnit: "bowl",
    caloriesPer100g: 110,
    proteinG: 8.0,
    carbsG: 18.0,
    fatG: 1.5,
    fibreG: 7.0,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Whey Protein Shake",
    alternativeNames: ["Whey Protein", "Protein Shake", "Whey"],
    category: "protein",
    servingSizeG: 30,
    servingUnit: "scoop",
    caloriesPer100g: 390,
    proteinG: 78.0,
    carbsG: 8.0,
    fatG: 4.5,
    fibreG: 1.0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Oatmeal",
    alternativeNames: ["Oats", "Porridge", "Daliya", "Rolled Oats Cooked"],
    category: "indian_grain",
    servingSizeG: 180,
    servingUnit: "bowl",
    caloriesPer100g: 71,
    proteinG: 2.5,
    carbsG: 12.0,
    fatG: 1.4,
    fibreG: 1.7,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Whole Wheat Toast",
    alternativeNames: ["Toast", "Bread", "Brown Bread", "Whole Wheat Bread"],
    category: "indian_grain",
    servingSizeG: 35,
    servingUnit: "slice",
    caloriesPer100g: 252,
    proteinG: 12.5,
    carbsG: 43.0,
    fatG: 3.4,
    fibreG: 6.0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Samosa",
    alternativeNames: ["Aloo Samosa", "Punjabi Samosa"],
    category: "indian_snack",
    servingSizeG: 75,
    servingUnit: "piece",
    caloriesPer100g: 308,
    proteinG: 4.8,
    carbsG: 32.0,
    fatG: 18.0,
    fibreG: 2.5,
    source: "NIN / IFCT",
    isCustom: false,
  },
  {
    name: "Peanut Butter",
    alternativeNames: ["Unsweetened Peanut Butter"],
    category: "protein",
    servingSizeG: 16,
    servingUnit: "tbsp",
    caloriesPer100g: 588,
    proteinG: 25.0,
    carbsG: 20.0,
    fatG: 50.0,
    fibreG: 6.0,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Banana",
    alternativeNames: ["Kela", "Ripe Banana"],
    category: "fruit",
    servingSizeG: 118,
    servingUnit: "piece",
    caloriesPer100g: 89,
    proteinG: 1.1,
    carbsG: 22.8,
    fatG: 0.3,
    fibreG: 2.6,
    source: "USDA",
    isCustom: false,
  },
  {
    name: "Apple",
    alternativeNames: ["Seb"],
    category: "fruit",
    servingSizeG: 182,
    servingUnit: "piece",
    caloriesPer100g: 52,
    proteinG: 0.3,
    carbsG: 14.0,
    fatG: 0.2,
    fibreG: 2.4,
    source: "USDA",
    isCustom: false,
  },
]

function mapIfctGroupToCategory(grup: string): {
  category: string
  servingSizeG: number
  servingUnit: string
} {
  const g = grup.toLowerCase()
  if (g.includes("cereal") || g.includes("millet")) {
    return { category: "indian_grain", servingSizeG: 100, servingUnit: "serving" }
  }
  if (g.includes("legume")) {
    return { category: "indian_dal", servingSizeG: 100, servingUnit: "serving" }
  }
  if (g.includes("milk")) {
    return { category: "indian_dairy", servingSizeG: 150, servingUnit: "cup" }
  }
  if (g.includes("fruit")) {
    return { category: "fruit", servingSizeG: 100, servingUnit: "serving" }
  }
  if (g.includes("vegetable") || g.includes("tuber") || g.includes("mushroom")) {
    return { category: "vegetable", servingSizeG: 100, servingUnit: "serving" }
  }
  if (g.includes("egg")) {
    return { category: "protein", servingSizeG: 50, servingUnit: "piece" }
  }
  if (g.includes("poultry") || g.includes("meat") || g.includes("fish") || g.includes("shellfish") || g.includes("mollusk")) {
    return { category: "protein", servingSizeG: 100, servingUnit: "serving" }
  }
  if (g.includes("nut") || g.includes("oil seed")) {
    return { category: "protein", servingSizeG: 30, servingUnit: "handful" }
  }
  if (g.includes("oil") || g.includes("fat")) {
    return { category: "other", servingSizeG: 10, servingUnit: "tbsp" }
  }
  return { category: "other", servingSizeG: 50, servingUnit: "serving" }
}

/**
 * Parses IFCT language annotations like "H. Poha; Mar. Pohe; E. Flattened rice" into clean alias names.
 */
function extractRegionalAliases(langField: unknown): string[] {
  if (typeof langField !== "string" || !langField.trim()) return []
  const aliases = new Set<string>()
  const segments = langField.split(";")
  for (const seg of segments) {
    // Strip language prefix like "H. ", "Mar. ", "Tam. ", "Tel. "
    const withoutPrefix = seg.replace(/^[A-Za-z]{1,5}\.\s*/, "").trim()
    for (const part of withoutPrefix.split(",")) {
      const cleaned = part.replace(/\([^)]*\)/g, "").trim()
      if (cleaned.length >= 3 && cleaned.length <= 45) {
        aliases.add(cleaned)
      }
    }
  }
  return Array.from(aliases).slice(0, 12)
}

function round1(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) && num >= 0 ? Number(num.toFixed(1)) : 0
}

async function main() {
  const compositions = require("@ifct2017/compositions") as {
    load: () => Promise<void>
    (query: string): Array<Record<string, unknown>>
  }
  await compositions.load()
  const allIfctRows = compositions("")

  const curatedNames = new Set(CURATED_PREPARED_DISHES.map((d) => d.name.toLowerCase()))
  const ifctItems: ImportedFoodItem[] = []

  for (const row of allIfctRows) {
    const rawName = typeof row.name === "string" ? row.name.trim() : ""
    if (!rawName || curatedNames.has(rawName.toLowerCase())) continue

    // IFCT 2017 enerc is in kJ/100g -> divide by 4.184 for kcal/100g
    const kj = typeof row.enerc === "number" ? row.enerc : Number(row.enerc)
    const kcalPer100g = Number.isFinite(kj) && kj > 0 ? Math.round(kj / 4.184) : 0
    const grup = typeof row.grup === "string" ? row.grup : "Other"
    const mapping = mapIfctGroupToCategory(grup)

    // Prefer available carbs (choavldf) or fallback to cho
    const carbsRaw =
      typeof row.choavldf === "number" && row.choavldf >= 0
        ? row.choavldf
        : row.cho

    ifctItems.push({
      name: `${rawName} (IFCT)`,
      alternativeNames: Array.from(
        new Set([rawName, ...extractRegionalAliases(row.lang)])
      ),
      category: mapping.category,
      servingSizeG: mapping.servingSizeG,
      servingUnit: mapping.servingUnit,
      caloriesPer100g: kcalPer100g,
      proteinG: round1(row.protcnt),
      carbsG: round1(carbsRaw),
      fatG: round1(row.fatce),
      fibreG: round1(row.fibtg),
      source: "IFCT 2017 (NIN)",
      isCustom: false,
    })
  }

  const combined = [...CURATED_PREPARED_DISHES, ...ifctItems]
  const outPath = path.resolve(process.cwd(), "src", "data", "indian-foods.json")
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2))

  console.log(
    `Generated ${outPath} with ${combined.length} items (${CURATED_PREPARED_DISHES.length} curated prepared dishes + ${ifctItems.length} IFCT 2017 entries).`
  )
}

main().catch((err) => {
  console.error("Failed to import food dataset:", err)
  process.exit(1)
})
