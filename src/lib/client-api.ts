import { isLocalAppMode } from "@/lib/app-env"
import {
  analyzeFoodOnDevice,
  createLocalFoodEntries,
  createLocalMealPlanItem,
  deleteLocalFoodEntry,
  deleteLocalMealPlanItem,
  getLocalFoodEntries,
  getLocalMealPlans,
  getLocalProfileData,
  getLocalSession,
  saveLocalProfileData,
  updateLocalFoodEntry,
  updateLocalMealPlanItem,
  type CreateFoodEntryInput,
  type CreateMealPlanItemInput,
  type LocalFoodEntry,
  type LocalMealPlanItem,
} from "@/lib/local-store"

function requireLocalUserId(): string {
  const session = getLocalSession()
  if (!session?.id) {
    throw new Error("Unauthorized")
  }
  return session.id
}

export async function apiFetchFoodEntries(params: { date?: string; mealCategory?: string }) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return getLocalFoodEntries(userId, params.date, params.mealCategory)
  }
  const search = new URLSearchParams()
  if (params.date) search.set("date", params.date)
  if (params.mealCategory && params.mealCategory !== "all") search.set("mealCategory", params.mealCategory)
  const res = await fetch(`/api/food-entries?${search.toString()}`)
  return res.json()
}

export async function apiCreateFoodEntries(
  payload: CreateFoodEntryInput | CreateFoodEntryInput[],
  sourceImageDataUrl?: string | null
) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return createLocalFoodEntries(userId, payload, sourceImageDataUrl)
  }
  const res = await fetch("/api/food-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to save meal entries")
  return res.json()
}

export async function apiUpdateFoodEntry(id: string, body: Partial<LocalFoodEntry>) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    updateLocalFoodEntry(userId, id, body)
    return { success: true }
  }
  const res = await fetch(`/api/food-entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to update entry")
  return res.json()
}

export async function apiDeleteFoodEntry(id: string) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    deleteLocalFoodEntry(userId, id)
    return { success: true }
  }
  const res = await fetch(`/api/food-entries/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete entry")
  return res.json()
}

export async function apiFetchMealPlans(date: string) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return getLocalMealPlans(userId, date)
  }
  const res = await fetch(`/api/meal-plans?date=${date}`)
  return res.json()
}

export async function apiCreateMealPlanItem(body: CreateMealPlanItemInput) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return createLocalMealPlanItem(userId, body)
  }
  const res = await fetch("/api/meal-plan-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to create meal plan item")
  return res.json()
}

export async function apiUpdateMealPlanItem(id: string, body: Partial<LocalMealPlanItem>) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    updateLocalMealPlanItem(userId, id, body)
    return { success: true }
  }
  const res = await fetch(`/api/meal-plan-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to update meal plan item")
  return res.json()
}

export async function apiDeleteMealPlanItem(id: string) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    deleteLocalMealPlanItem(userId, id)
    return { success: true }
  }
  const res = await fetch(`/api/meal-plan-items/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete meal plan item")
  return res.json()
}

export async function apiFetchProfile() {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return getLocalProfileData(userId)
  }
  const res = await fetch("/api/profile", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load profile")
  return res.json()
}

export async function apiSaveProfile(body: Record<string, unknown>) {
  if (isLocalAppMode()) {
    const userId = requireLocalUserId()
    return saveLocalProfileData(userId, body)
  }
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || "Failed to update profile")
  return data
}

export async function apiAnalyzeFood(body: {
  imageUrl?: string
  textPrompt?: string
  textDescription?: string
  barcode?: string
}) {
  if (isLocalAppMode()) {
    return analyzeFoodOnDevice(body)
  }
  if (body.barcode && !body.imageUrl && !body.textPrompt && !body.textDescription) {
    const res = await fetch(
      `/api/foods/barcode?code=${encodeURIComponent(body.barcode)}`
    )
    const data = await res.json().catch(() => null)
    if (!data) {
      return {
        error: `Barcode lookup failed (${res.status}). Please try again or enter your item manually.`,
      }
    }
    return data
  }
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!data) {
    return {
      error: `AI analysis failed (${res.status}). Please try again or enter your dish manually.`,
    }
  }
  return data
}
