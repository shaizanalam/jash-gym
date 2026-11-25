import { Sun, Coffee, Apple, Cookie, Moon, type LucideIcon } from "lucide-react"

export interface MealCategoryConfig {
  id: "breakfast" | "mid_morning_snack" | "lunch" | "evening_snack" | "dinner"
  label: string
  icon: LucideIcon
}

export const MEAL_CATEGORIES: MealCategoryConfig[] = [
  { id: "breakfast", label: "Breakfast", icon: Sun },
  { id: "mid_morning_snack", label: "Mid-Morning Snack", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Apple },
  { id: "evening_snack", label: "Evening Snack", icon: Cookie },
  { id: "dinner", label: "Dinner", icon: Moon },
]

export const DIETARY_PREFERENCES = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "non_vegetarian", label: "Non-Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "jain", label: "Jain" },
] as const

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary (desk work, minimal exercise)" },
  { id: "lightly_active", label: "Lightly Active (light exercise 1-3 days/week)" },
  { id: "moderately_active", label: "Moderately Active (exercise 3-5 days/week)" },
  { id: "very_active", label: "Very Active (hard training or physical labor)" },
] as const

export const FITNESS_GOALS = [
  { id: "fat_loss", label: "Fat Loss (−400 kcal)" },
  { id: "lean_recomp", label: "Lean Recomp (−150 kcal)" },
  { id: "maintain", label: "Maintain Weight" },
  { id: "muscle_gain", label: "Muscle Gain (+300 kcal)" },
] as const

export const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other / Prefer not to say" },
] as const

export const FOOD_CATEGORIES = [
  { id: "indian_grain", label: "Indian Grains (Roti, Rice, Paratha)" },
  { id: "indian_dal", label: "Indian Dals & Curries" },
  { id: "indian_dairy", label: "Indian Dairy (Paneer, Curd, Milk)" },
  { id: "indian_sabzi", label: "Indian Sabzi / Vegetables" },
  { id: "indian_snack", label: "Indian Snacks (Poha, Idli, Dosa, Khichdi)" },
  { id: "fruit", label: "Fruits" },
  { id: "vegetable", label: "Vegetables" },
  { id: "protein", label: "Protein (Eggs, Chicken, Fish, Sprouts)" },
  { id: "beverage", label: "Beverages" },
  { id: "other", label: "Other" },
] as const
