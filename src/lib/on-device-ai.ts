import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core"

export type OnDeviceModelType = "llm" | "vision"

export interface OnDeviceCapabilities {
  supported: boolean
  isNativeAndroid: boolean
  abi: string
  totalRamMb: number
  availableStorageMb: number
  llmModelReady: boolean
  llmModelSizeMb: number
  visionModelReady: boolean
  visionModelSizeMb: number
  reason?: string
}

export interface OnDeviceDownloadProgress {
  modelType: OnDeviceModelType
  progress: number
  downloadedMb: number
  totalMb: number
}

export interface OnDeviceVisionLabel {
  label: string
  confidence: number
}

export interface OnDeviceAiPluginInterface {
  getDeviceCapabilities(): Promise<OnDeviceCapabilities>
  downloadModel(options: {
    modelType: OnDeviceModelType
    url: string
  }): Promise<{ path: string; sizeBytes: number }>
  deleteModel(options: { modelType: OnDeviceModelType }): Promise<{ deleted: boolean }>
  parseMealText(options: { prompt: string }): Promise<{ text: string; latencyMs: number }>
  classifyFoodImage(options: {
    base64Image: string
  }): Promise<{ labels: OnDeviceVisionLabel[]; latencyMs: number }>
  addListener(
    eventName: "modelDownloadProgress",
    listenerFunc: (event: OnDeviceDownloadProgress) => void
  ): Promise<PluginListenerHandle>
}

const OnDeviceAiPlugin = registerPlugin<OnDeviceAiPluginInterface>("OnDeviceAi")

const MODEL_URLS_STORAGE_KEY = "nutrimentor_tier2_model_urls_v1"

export interface Tier2ModelUrls {
  llmUrl: string
  visionUrl: string
}

export const DEFAULT_TIER2_MODEL_URLS: Tier2ModelUrls = {
  llmUrl: "",
  visionUrl: "",
}

export function isNativeAndroidRuntime(): boolean {
  if (typeof window === "undefined") return false
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  } catch {
    return false
  }
}

export function getSavedTier2ModelUrls(): Tier2ModelUrls {
  if (typeof window === "undefined") return DEFAULT_TIER2_MODEL_URLS
  try {
    const raw = window.localStorage.getItem(MODEL_URLS_STORAGE_KEY)
    if (!raw) return DEFAULT_TIER2_MODEL_URLS
    const parsed = JSON.parse(raw) as Partial<Tier2ModelUrls>
    return {
      llmUrl: typeof parsed.llmUrl === "string" ? parsed.llmUrl.trim() : "",
      visionUrl: typeof parsed.visionUrl === "string" ? parsed.visionUrl.trim() : "",
    }
  } catch {
    return DEFAULT_TIER2_MODEL_URLS
  }
}

export function saveTier2ModelUrls(urls: Partial<Tier2ModelUrls>) {
  if (typeof window === "undefined") return
  const current = getSavedTier2ModelUrls()
  const next: Tier2ModelUrls = {
    llmUrl: typeof urls.llmUrl === "string" ? urls.llmUrl.trim() : current.llmUrl,
    visionUrl: typeof urls.visionUrl === "string" ? urls.visionUrl.trim() : current.visionUrl,
  }
  window.localStorage.setItem(MODEL_URLS_STORAGE_KEY, JSON.stringify(next))
}

export async function getOnDeviceAiCapabilities(): Promise<OnDeviceCapabilities> {
  if (!isNativeAndroidRuntime()) {
    return {
      supported: false,
      isNativeAndroid: false,
      abi: "web",
      totalRamMb: 0,
      availableStorageMb: 0,
      llmModelReady: false,
      llmModelSizeMb: 0,
      visionModelReady: false,
      visionModelSizeMb: 0,
      reason: "Tier 2 on-device MediaPipe models are only available in the Android APK.",
    }
  }
  try {
    return await OnDeviceAiPlugin.getDeviceCapabilities()
  } catch (err) {
    return {
      supported: false,
      isNativeAndroid: true,
      abi: "unknown",
      totalRamMb: 0,
      availableStorageMb: 0,
      llmModelReady: false,
      llmModelSizeMb: 0,
      visionModelReady: false,
      visionModelSizeMb: 0,
      reason: err instanceof Error ? err.message : "Native OnDeviceAi plugin unavailable.",
    }
  }
}

export async function downloadOnDeviceModel(
  modelType: OnDeviceModelType,
  url: string
): Promise<{ path: string; sizeBytes: number }> {
  if (!isNativeAndroidRuntime()) {
    throw new Error("On-device model downloads are only available in the Android app.")
  }
  return OnDeviceAiPlugin.downloadModel({ modelType, url })
}

export async function deleteOnDeviceModel(
  modelType: OnDeviceModelType
): Promise<{ deleted: boolean }> {
  if (!isNativeAndroidRuntime()) {
    return { deleted: false }
  }
  return OnDeviceAiPlugin.deleteModel({ modelType })
}

export async function subscribeOnDeviceDownloadProgress(
  listener: (event: OnDeviceDownloadProgress) => void
): Promise<PluginListenerHandle | null> {
  if (!isNativeAndroidRuntime()) return null
  try {
    return await OnDeviceAiPlugin.addListener("modelDownloadProgress", listener)
  } catch {
    return null
  }
}

export async function runOnDeviceMealTextParser(
  prompt: string
): Promise<{ text: string; latencyMs: number } | null> {
  if (!isNativeAndroidRuntime()) return null
  try {
    const caps = await getOnDeviceAiCapabilities()
    if (!caps.supported || !caps.llmModelReady) return null
    return await OnDeviceAiPlugin.parseMealText({ prompt })
  } catch (err) {
    console.warn("[OnDeviceAi] parseMealText fallback:", err)
    return null
  }
}

export async function runOnDeviceFoodClassifier(
  imageUrl: string
): Promise<{ labels: OnDeviceVisionLabel[]; latencyMs: number } | null> {
  if (!isNativeAndroidRuntime()) return null
  try {
    const caps = await getOnDeviceAiCapabilities()
    if (!caps.supported || !caps.visionModelReady) return null
    const base64Image = imageUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
    return await OnDeviceAiPlugin.classifyFoodImage({ base64Image })
  } catch (err) {
    console.warn("[OnDeviceAi] classifyFoodImage fallback:", err)
    return null
  }
}
