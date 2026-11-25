import { startOfDayIST, startOfWeekIST } from "@/lib/dates"
import { analyzeFoodWithCascade } from "@/lib/cascade-analyzer"
import {
  runOnDeviceFoodClassifier,
  runOnDeviceMealTextParser,
} from "@/lib/on-device-ai"
import { resolveNutritionTargets, type GuidanceRecord } from "@/lib/nutrition-targets"

export interface LocalUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: string
}

export interface LocalSessionUser {
  id: string
  email: string
  name: string
  image?: string | null
}

export interface LocalFoodEntry {
  id: string
  userId: string
  foodName: string
  estimatedPortionG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG: number
  mealCategory: string
  loggedAt: string
  isAiGenerated: boolean
  isConfirmedByUser: boolean
  aiConfidence?: string | null
  notes?: string | null
  sourceImageId?: string | null
  sourceImage?: { id: string; storageUrl: string } | null
}

export interface CreateFoodEntryInput {
  mealCategory?: string
  foodName: string
  estimatedPortionG?: number
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  fibreG?: number | null
  aiConfidence?: string | null
  isAiGenerated?: boolean
  isConfirmedByUser?: boolean
  notes?: string | null
  loggedAt?: string | null
}

export interface LocalMealPlanItem {
  id: string
  mealPlanId: string
  userId: string
  planDate: string
  mealCategory: string
  plannedTime?: string | null
  foodName: string
  portionG?: number | null
  isCompleted: boolean
  completedAt?: string | null
  notes?: string | null
}

export interface CreateMealPlanItemInput {
  mealPlanId?: string
  mealCategory: string
  plannedTime?: string | null
  foodName: string
  portionG?: number | null
  isCompleted?: boolean
  notes?: string | null
}

export interface LocalNutritionProfile {
  userId: string
  age?: number | null
  gender?: string | null
  weightKg?: number | null
  heightCm?: number | null
  goal?: string | null
  dietaryPreference: string
  allergies?: string | null
  restrictions?: string | null
  activityLevel?: string | null
}

export interface LocalProfessionalGuidance extends GuidanceRecord {
  userId: string
}

export interface LocalUploadedImage {
  id: string
  userId: string
  storageKey: string
  storageUrl: string
  fileSizeKb: number
  createdAt: string
}

interface LocalDbState {
  users: LocalUser[]
  foodEntries: LocalFoodEntry[]
  mealPlanItems: LocalMealPlanItem[]
  profiles: Record<string, LocalNutritionProfile>
  guidances: Record<string, LocalProfessionalGuidance>
  uploadedImages: LocalUploadedImage[]
}

const DB_KEY = "nutrimentor_local_db_v1"
const SESSION_KEY = "nutrimentor_local_session_v1"
const GEMINI_KEY = "nutrimentor_local_gemini_key_v1"
const LOCAL_EVENT = "nutrimentor-local-change"
const BUNDLED_GEMINI_KEY = (process.env.NEXT_PUBLIC_CAPACITOR_GEMINI_KEY || "").trim()
const BUNDLED_GEMINI_MODEL = (process.env.NEXT_PUBLIC_CAPACITOR_GEMINI_MODEL || "").trim()

let storeVersion = 0

export function subscribeLocalStore(listener: () => void): () => void {
  if (typeof window === "undefined") return () => { }
  const handler = () => listener()
  window.addEventListener(LOCAL_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(LOCAL_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}

export function getLocalStoreVersion(): number {
  return storeVersion
}

function notifyLocalChange() {
  storeVersion++
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_EVENT))
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "id-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36)
}

function createInitialState(): LocalDbState {
  return {
    users: [],
    foodEntries: [],
    mealPlanItems: [],
    profiles: {},
    guidances: {},
    uploadedImages: [],
  }
}

function readDb(): LocalDbState {
  if (typeof window === "undefined") return createInitialState()
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      const initial = createInitialState()
      window.localStorage.setItem(DB_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw) as Partial<LocalDbState>
    const users = Array.isArray(parsed.users)
      ? parsed.users.filter((u) => u.email.toLowerCase() !== "demo@nutrimentor.com")
      : []
    return {
      users,
      foodEntries: Array.isArray(parsed.foodEntries) ? parsed.foodEntries : [],
      mealPlanItems: Array.isArray(parsed.mealPlanItems) ? parsed.mealPlanItems : [],
      profiles: parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
      guidances: parsed.guidances && typeof parsed.guidances === "object" ? parsed.guidances : {},
      uploadedImages: Array.isArray(parsed.uploadedImages) ? parsed.uploadedImages : [],
    }
  } catch {
    return createInitialState()
  }
}

function writeDb(state: LocalDbState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(state))
    notifyLocalChange()
  } catch (err) {
    console.warn("[LocalStore] Failed saving to localStorage:", err)
  }
}

export function getLocalSession(): LocalSessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as LocalSessionUser
    if (session?.email?.toLowerCase() === "demo@nutrimentor.com") {
      return null
    }
    return session
  } catch {
    return null
  }
}

function setLocalSession(user: LocalSessionUser | null) {
  if (typeof window === "undefined") return
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(SESSION_KEY)
  }
  notifyLocalChange()
}

export function updateLocalSessionUser(partial: { name?: string }): LocalSessionUser | null {
  const current = getLocalSession()
  if (!current) return null
  const updated: LocalSessionUser = {
    ...current,
    ...(partial.name ? { name: partial.name } : {}),
  }
  setLocalSession(updated)
  return updated
}

export function localLogin(email: string, password: string): { ok: boolean; user?: LocalSessionUser; error?: string } {
  const normalizedEmail = email.toLowerCase().trim()
  const rawPassword = password.trim()
  const db = readDb()

  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (!user || user.password !== rawPassword) {
    return { ok: false, error: "CredentialsSignin" }
  }

  const sessionUser: LocalSessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: null,
  }
  setLocalSession(sessionUser)
  return { ok: true, user: sessionUser }
}

export function localRegister(name: string, email: string, password: string): { ok: boolean; error?: string; status?: number } {
  const trimmedName = name.trim()
  const normalizedEmail = email.toLowerCase().trim()
  const trimmedPassword = password.trim()

  if (!trimmedName) return { ok: false, error: "Please enter your name", status: 400 }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Please enter a valid email address", status: 400 }
  }
  if (trimmedPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters", status: 400 }
  }

  const db = readDb()
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      ok: false,
      error: "An account with this email already exists. Please log in instead.",
      status: 409,
    }
  }

  const newUser: LocalUser = {
    id: generateId(),
    email: normalizedEmail,
    name: trimmedName,
    password: trimmedPassword,
    createdAt: new Date().toISOString(),
  }
  db.users.push(newUser)
  db.profiles[newUser.id] = {
    userId: newUser.id,
    dietaryPreference: "vegetarian",
    goal: "maintain",
    activityLevel: "moderately_active",
  }
  writeDb(db)

  return { ok: true }
}

export function localLogout() {
  setLocalSession(null)
}

export function getLocalFoodEntries(
  userId: string,
  date?: string,
  mealCategory?: string
): LocalFoodEntry[] {
  const db = readDb()
  let startMs: number | null = null
  let endMs: number | null = null

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    startMs = start.getTime()
    endMs = end.getTime()
  }

  return db.foodEntries
    .filter((entry) => {
      if (entry.userId !== userId) return false
      if (mealCategory && mealCategory !== "all" && entry.mealCategory !== mealCategory) return false
      if (startMs !== null && endMs !== null) {
        const loggedMs = new Date(entry.loggedAt).getTime()
        if (loggedMs < startMs || loggedMs > endMs) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
}

export function createLocalFoodEntries(
  userId: string,
  payload: CreateFoodEntryInput | CreateFoodEntryInput[],
  sourceImageDataUrl?: string | null
): LocalFoodEntry[] {
  const db = readDb()
  const items = Array.isArray(payload) ? payload : [payload]
  let imageRef: { id: string; storageUrl: string } | null = null

  if (sourceImageDataUrl) {
    const imageId = generateId()
    const approxKb = Math.max(1, Math.round((sourceImageDataUrl.length * 0.75) / 1024))
    const uploaded: LocalUploadedImage = {
      id: imageId,
      userId,
      storageKey: `meal-${new Date().toISOString().slice(0, 10)}-${imageId.slice(0, 6)}.jpg`,
      storageUrl: sourceImageDataUrl,
      fileSizeKb: approxKb,
      createdAt: new Date().toISOString(),
    }
    db.uploadedImages.unshift(uploaded)
    const userImages = db.uploadedImages.filter((i) => i.userId === userId)
    if (userImages.length > 20) {
      const oldestIds = new Set(userImages.slice(20).map((i) => i.id))
      db.uploadedImages = db.uploadedImages.filter((i) => !oldestIds.has(i.id))
    }
    imageRef = { id: imageId, storageUrl: sourceImageDataUrl }
  }

  const created: LocalFoodEntry[] = items.map((item) => {
    const entry: LocalFoodEntry = {
      id: generateId(),
      userId,
      mealCategory: String(item.mealCategory || "lunch"),
      foodName: String(item.foodName || "Meal Item"),
      estimatedPortionG: Number(item.estimatedPortionG) || 100,
      calories: Number(item.calories) || 0,
      proteinG: Number(item.proteinG) || 0,
      carbsG: Number(item.carbsG) || 0,
      fatG: Number(item.fatG) || 0,
      fibreG: Number(item.fibreG) || 0,
      aiConfidence: item.aiConfidence || null,
      isAiGenerated: Boolean(item.isAiGenerated),
      isConfirmedByUser: item.isConfirmedByUser !== undefined ? Boolean(item.isConfirmedByUser) : true,
      notes: item.notes || null,
      loggedAt: item.loggedAt ? new Date(item.loggedAt).toISOString() : new Date().toISOString(),
      sourceImageId: imageRef?.id || null,
      sourceImage: imageRef,
    }
    db.foodEntries.unshift(entry)
    return entry
  })

  writeDb(db)
  return created
}

export function updateLocalFoodEntry(userId: string, id: string, updates: Partial<LocalFoodEntry>): boolean {
  const db = readDb()
  const idx = db.foodEntries.findIndex((e) => e.id === id && e.userId === userId)
  if (idx === -1) return false
  db.foodEntries[idx] = { ...db.foodEntries[idx], ...updates }
  writeDb(db)
  return true
}

export function deleteLocalFoodEntry(userId: string, id: string) {
  const db = readDb()
  db.foodEntries = db.foodEntries.filter((e) => !(e.id === id && e.userId === userId))
  writeDb(db)
}

export function getLocalMealPlans(userId: string, date: string) {
  const db = readDb()
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const end = new Date(d)
  end.setDate(end.getDate() + 1)

  const items = db.mealPlanItems.filter((item) => {
    if (item.userId !== userId) return false
    const itemMs = new Date(item.planDate).getTime()
    return itemMs >= d.getTime() && itemMs < end.getTime()
  })

  return items.length > 0 ? [{ id: `plan-${date}`, planDate: d.toISOString(), items }] : []
}

export function createLocalMealPlanItem(userId: string, body: CreateMealPlanItemInput): LocalMealPlanItem {
  const db = readDb()
  const planDate =
    body.mealPlanId && !isNaN(Date.parse(body.mealPlanId))
      ? new Date(body.mealPlanId)
      : new Date()
  planDate.setHours(0, 0, 0, 0)

  const item: LocalMealPlanItem = {
    id: generateId(),
    mealPlanId: `plan-${planDate.toISOString().split("T")[0]}`,
    userId,
    planDate: planDate.toISOString(),
    mealCategory: String(body.mealCategory || "breakfast"),
    plannedTime: body.plannedTime || null,
    foodName: String(body.foodName || "Dish"),
    portionG: body.portionG ? parseFloat(String(body.portionG)) : null,
    notes: body.notes || null,
    isCompleted: false,
    completedAt: null,
  }
  db.mealPlanItems.push(item)
  writeDb(db)
  return item
}

export function updateLocalMealPlanItem(userId: string, id: string, body: Partial<LocalMealPlanItem>): boolean {
  const db = readDb()
  const idx = db.mealPlanItems.findIndex((i) => i.id === id && i.userId === userId)
  if (idx === -1) return false
  db.mealPlanItems[idx] = { ...db.mealPlanItems[idx], ...body }
  writeDb(db)
  return true
}

export function deleteLocalMealPlanItem(userId: string, id: string) {
  const db = readDb()
  db.mealPlanItems = db.mealPlanItems.filter((i) => !(i.id === id && i.userId === userId))
  writeDb(db)
}

function parseOptionalNumber(raw: unknown, integer = false): number | null {
  if (raw === undefined || raw === null) return null
  const str = String(raw).trim()
  if (!str) return null
  const num = Number(str)
  if (!Number.isFinite(num)) return null
  return integer ? Math.round(num) : Math.round(num * 10) / 10
}

export function getLocalProfileData(userId: string) {
  const db = readDb()
  const userRecord = db.users.find((u) => u.id === userId)
  const profile = db.profiles[userId] || { userId, dietaryPreference: "vegetarian" }
  const guidance = db.guidances[userId] || null
  return {
    user: userRecord
      ? { id: userRecord.id, name: userRecord.name, email: userRecord.email }
      : null,
    profile,
    guidance,
    targets: resolveNutritionTargets(guidance),
  }
}

export function saveLocalProfileData(userId: string, data: Record<string, unknown>) {
  const db = readDb()
  const type = typeof data.type === "string" ? data.type : ""
  const updateProfile = type === "profile" || type === "all"
  const updateTargets = type === "guidance" || type === "targets" || type === "all"

  if (!updateProfile && !updateTargets) {
    throw new Error("Invalid update type")
  }

  if (updateProfile) {
    if (typeof data.name === "string" && data.name.trim()) {
      const idx = db.users.findIndex((u) => u.id === userId)
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], name: data.name.trim() }
      }
      updateLocalSessionUser({ name: data.name.trim() })
    }

    const allergiesList = Array.isArray(data.allergies)
      ? data.allergies.map((s) => String(s).trim()).filter(Boolean)
      : []
    const restrictionsList = Array.isArray(data.restrictions)
      ? data.restrictions.map((s) => String(s).trim()).filter(Boolean)
      : []

    db.profiles[userId] = {
      userId,
      age: parseOptionalNumber(data.age, true),
      gender: typeof data.gender === "string" && data.gender ? data.gender : null,
      weightKg: parseOptionalNumber(data.weightKg, false),
      heightCm: parseOptionalNumber(data.heightCm, false),
      goal: typeof data.goal === "string" && data.goal ? data.goal : null,
      dietaryPreference:
        typeof data.dietaryPreference === "string" && data.dietaryPreference
          ? data.dietaryPreference
          : "vegetarian",
      allergies: allergiesList.length > 0 ? JSON.stringify(allergiesList) : null,
      restrictions: restrictionsList.length > 0 ? JSON.stringify(restrictionsList) : null,
      activityLevel:
        typeof data.activityLevel === "string" && data.activityLevel
          ? data.activityLevel
          : null,
    }
  }

  if (updateTargets) {
    const existing = db.guidances[userId] || { userId }
    const rawNotes = typeof data.sourceNotes === "string" ? data.sourceNotes.trim() : null
    db.guidances[userId] = {
      ...existing,
      userId,
      dailyCalorieRef: parseOptionalNumber(data.dailyCalorieRef, true),
      dailyProteinRef: parseOptionalNumber(data.dailyProteinRef, true),
      dailyCarbsRef: parseOptionalNumber(data.dailyCarbsRef, true),
      dailyFatRef: parseOptionalNumber(data.dailyFatRef, true),
      dailyFibreRef: parseOptionalNumber(data.dailyFibreRef, true),
      sourceNotes: rawNotes && rawNotes.length > 0 ? rawNotes.slice(0, 1000) : null,
      enteredByProfessional:
        typeof data.enteredByProfessional === "boolean"
          ? data.enteredByProfessional
          : existing.enteredByProfessional ?? false,
    }
  }

  writeDb(db)
  return getLocalProfileData(userId)
}

export function getLocalUploadedImages(userId: string): LocalUploadedImage[] {
  const db = readDb()
  return db.uploadedImages.filter((i) => i.userId === userId).slice(0, 20)
}

export function getLocalGeminiApiKey(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(GEMINI_KEY) || ""
}

export function hasBundledGeminiApiKey(): boolean {
  return Boolean(BUNDLED_GEMINI_KEY)
}

export function getEffectiveGeminiApiKey(): string {
  return getLocalGeminiApiKey() || BUNDLED_GEMINI_KEY
}

export function setLocalGeminiApiKey(key: string) {
  if (typeof window === "undefined") return
  const trimmed = key.trim()
  if (trimmed) {
    window.localStorage.setItem(GEMINI_KEY, trimmed)
  } else {
    window.localStorage.removeItem(GEMINI_KEY)
  }
  notifyLocalChange()
}

export function getLocalDashboardData(userId: string) {
  const db = readDb()
  const today = startOfDayIST()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const userEntries = db.foodEntries.filter((e) => e.userId === userId)
  const todayEntries = userEntries
    .filter((e) => new Date(e.loggedAt) >= today)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
  const weekEntries = userEntries.filter((e) => new Date(e.loggedAt) >= sevenDaysAgo)
  const { profile, user, guidance } = getLocalProfileData(userId)
  const needsOnboarding =
    !guidance?.dailyCalorieRef &&
    !profile?.weightKg &&
    !profile?.heightCm &&
    !profile?.age &&
    weekEntries.length === 0

  return {
    userName: user?.name || "there",
    entries: todayEntries,
    weekEntries,
    guidance,
    needsOnboarding,
  }
}

export function getLocalAnalyticsData(userId: string) {
  const db = readDb()
  const weekStart = startOfWeekIST()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const entries = db.foodEntries
    .filter((e) => {
      if (e.userId !== userId) return false
      const t = new Date(e.loggedAt).getTime()
      return t >= weekStart.getTime() && t <= weekEnd.getTime()
    })
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())

  const { guidance } = getLocalProfileData(userId)
  return { entries, guidance }
}

export async function analyzeFoodOnDevice(payload: {
  imageUrl?: string
  textPrompt?: string
  textDescription?: string
  barcode?: string
}) {
  const apiKey = getEffectiveGeminiApiKey()
  const model = BUNDLED_GEMINI_MODEL || undefined
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true

  const result = await analyzeFoodWithCascade(payload, {
    apiKey,
    model,
    isOnline,
    onDeviceTextParser: runOnDeviceMealTextParser,
    onDeviceImageClassifier: runOnDeviceFoodClassifier,
  })

  if (result.error) {
    throw new Error(result.error)
  }

  return result
}
