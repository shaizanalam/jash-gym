"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Check,
  Cpu,
  Download,
  Trash2,
  Loader2,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card, Badge, Button, Input } from "@/components/ui/index"
import { useAppSession } from "@/components/providers"
import { isLocalAppMode } from "@/lib/app-env"
import {
  getLocalGeminiApiKey,
  getLocalStoreVersion,
  getLocalUploadedImages,
  hasBundledGeminiApiKey,
  setLocalGeminiApiKey,
  subscribeLocalStore,
} from "@/lib/local-store"
import {
  deleteOnDeviceModel,
  downloadOnDeviceModel,
  getOnDeviceAiCapabilities,
  getSavedTier2ModelUrls,
  saveTier2ModelUrls,
  subscribeOnDeviceDownloadProgress,
  type OnDeviceCapabilities,
  type OnDeviceModelType,
} from "@/lib/on-device-ai"

export interface SettingsInitialData {
  user: { name: string; email: string }
  images: Array<{
    id: string
    storageKey: string
    storageUrl: string
    fileSizeKb: number
  }>
}

const serverSnapshot = () => -1

export function SettingsView({ initialData }: { initialData?: SettingsInitialData }) {
  const { data: session } = useAppSession()
  const userId = session?.user?.id
  const storeVersion = React.useSyncExternalStore(
    subscribeLocalStore,
    getLocalStoreVersion,
    serverSnapshot
  )
  const localMode = isLocalAppMode()
  const [geminiKey, setGeminiKey] = React.useState(() =>
    localMode ? getLocalGeminiApiKey() : ""
  )
  const [savedKeyNotice, setSavedKeyNotice] = React.useState(false)
  const [capabilities, setCapabilities] = React.useState<OnDeviceCapabilities | null>(null)
  const [llmUrl, setLlmUrl] = React.useState(() =>
    localMode ? getSavedTier2ModelUrls().llmUrl : ""
  )
  const [visionUrl, setVisionUrl] = React.useState(() =>
    localMode ? getSavedTier2ModelUrls().visionUrl : ""
  )
  const [downloadingModel, setDownloadingModel] = React.useState<OnDeviceModelType | null>(null)
  const [downloadPct, setDownloadPct] = React.useState(0)
  const [modelNotice, setModelNotice] = React.useState<string | null>(null)
  const [showAdvancedAi, setShowAdvancedAi] = React.useState(false)

  React.useEffect(() => {
    if (!localMode) return
    let active = true
    void getOnDeviceAiCapabilities().then((caps) => {
      if (active) setCapabilities(caps)
    })
    let handle: { remove: () => Promise<void> } | null = null
    void subscribeOnDeviceDownloadProgress((evt) => {
      if (!active) return
      setDownloadingModel(evt.modelType)
      setDownloadPct(evt.progress)
    }).then((h) => {
      handle = h
    })
    return () => {
      active = false
      void handle?.remove()
    }
  }, [localMode])

  const handleModelDownload = async (modelType: OnDeviceModelType) => {
    const url = (modelType === "llm" ? llmUrl : visionUrl).trim()
    if (!url.startsWith("https://")) {
      setModelNotice("Enter a valid https:// URL for the model bundle before downloading.")
      return
    }
    saveTier2ModelUrls(modelType === "llm" ? { llmUrl: url } : { visionUrl: url })
    setModelNotice(null)
    setDownloadingModel(modelType)
    setDownloadPct(0)
    try {
      await downloadOnDeviceModel(modelType, url)
      setCapabilities(await getOnDeviceAiCapabilities())
      setModelNotice(
        `${modelType === "llm" ? "Tier 2 LLM (.task)" : "Tier 2 Vision (.tflite)"} downloaded and ready offline.`
      )
    } catch (err) {
      setModelNotice(err instanceof Error ? err.message : "Failed to download model.")
    } finally {
      setDownloadingModel(null)
    }
  }

  const handleModelDelete = async (modelType: OnDeviceModelType) => {
    setModelNotice(null)
    await deleteOnDeviceModel(modelType)
    setCapabilities(await getOnDeviceAiCapabilities())
    setModelNotice(
      `${modelType === "llm" ? "Tier 2 LLM" : "Tier 2 Vision"} model removed from device storage.`
    )
  }

  const images = React.useMemo(() => {
    if (initialData) return initialData.images
    if (storeVersion >= 0 && userId) {
      return getLocalUploadedImages(userId)
    }
    return []
  }, [initialData, storeVersion, userId])

  const displayName = initialData?.user.name || session?.user?.name || "User"
  const displayEmail = initialData?.user.email || session?.user?.email || ""

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalGeminiApiKey(geminiKey)
    setSavedKeyNotice(true)
    setTimeout(() => setSavedKeyNotice(false), 3000)
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 w-full">
      <div className="pb-1 border-b border-[#253745]/40">
        <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
          Settings &amp; Privacy
        </h1>
        <p className="text-xs text-[#9BA8AB] mt-0.5">
          Account credentials, data isolation, and stored meal photos.
        </p>
      </div>

      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60">
        <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#9BA8AB]" />
            <h3 className="text-sm font-semibold text-[#CCD0CF]">Account Details</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Verified
          </Badge>
        </div>

        <div className="pt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-[#182C3D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] font-bold text-sm shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#CCD0CF] truncate">
                  {displayName}
                </p>
                <p className="text-xs text-[#9BA8AB] truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-full shrink-0">
              <Link href="/profile">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                Edit Profile
              </Link>
            </Button>
          </div>

          <div className="pt-3 border-t border-[#253745]/30 flex items-start gap-2 text-xs text-[#9BA8AB]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              All your meal logs, nutritional parameters, and profile details are encrypted and strictly isolated to your account.
            </span>
          </div>
        </div>
      </Card>

      {localMode && (
        <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-[#CCD0CF]">Device &amp; AI Status</h3>
            </div>
            <Badge variant="success" className="text-[10px]">
              Ready
            </Badge>
          </div>

          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            Your meals, daily goals, and food library are stored privately on this phone so tracking works fast even offline.
          </p>

          <button
            type="button"
            onClick={() => setShowAdvancedAi((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#09131a] border border-[#253745]/60 text-xs font-medium text-[#9BA8AB] hover:text-[#CCD0CF] transition-colors cursor-pointer"
          >
            <span>Advanced AI &amp; Offline Model Settings</span>
            {showAdvancedAi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvancedAi && (
            <div className="space-y-4 pt-2">
              <form onSubmit={handleSaveGeminiKey} className="space-y-2.5 pt-2 border-t border-[#253745]/30">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-[#CCD0CF] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Gemini API Key (for Camera Photo AI)
                  </label>
                  {hasBundledGeminiApiKey() && !geminiKey.trim() && (
                    <Badge variant="success" className="text-[10px]">
                      Preconfigured
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={
                      hasBundledGeminiApiKey()
                        ? "Using built-in key (paste custom key to override)"
                        : "Paste Google AI Studio key (optional)"
                    }
                    className="flex-1 h-9 text-xs"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="rounded-xl shrink-0">
                    {savedKeyNotice ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Saved
                      </>
                    ) : (
                      "Save Key"
                    )}
                  </Button>
                </div>
              </form>

              {/* Tier 2 On-Device MediaPipe / TFLite Model Manager */}
              <div className="space-y-3 pt-3 border-t border-[#253745]/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-[#CCD0CF]">
                      Offline AI Models (Optional)
                    </span>
                  </div>
                  {capabilities && (
                    <Badge variant={capabilities.supported ? "outline" : "amber"} className="text-[10px]">
                      {capabilities.supported
                        ? `${capabilities.abi} • ${capabilities.totalRamMb} MB RAM`
                        : capabilities.isNativeAndroid
                          ? `${capabilities.abi} (Unsupported)`
                          : "Web Browser"}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                  Download optional on-device models over Wi-Fi for offline food recognition without internet.
                </p>

                {modelNotice && (
                  <div className="p-2.5 rounded-xl bg-[#06141B]/70 border border-[#253745] text-[11px] text-[#CCD0CF]">
                    {modelNotice}
                  </div>
                )}

                <div className="space-y-2 p-3 rounded-xl bg-[#06141B]/40 border border-[#253745]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#CCD0CF]">
                      1. Food Vision Classifier (.tflite, ~10 MB)
                    </span>
                    <Badge variant={capabilities?.visionModelReady ? "success" : "outline"} className="text-[10px]">
                      {capabilities?.visionModelReady ? `Ready (${capabilities.visionModelSizeMb} MB)` : "Not Downloaded"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={visionUrl}
                      onChange={(e) => setVisionUrl(e.target.value)}
                      placeholder="https://... food_classifier.tflite URL"
                      className="flex-1 h-8 text-[11px]"
                    />
                    {capabilities?.visionModelReady ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => handleModelDelete("vision")} className="rounded-xl shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={downloadingModel !== null || !capabilities?.supported}
                        onClick={() => handleModelDownload("vision")}
                        className="rounded-xl shrink-0"
                      >
                        {downloadingModel === "vision" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> {downloadPct}%
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 p-3 rounded-xl bg-[#06141B]/40 border border-[#253745]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#CCD0CF]">
                      2. On-Device Meal Parser (.task, ~550 MB)
                    </span>
                    <Badge variant={capabilities?.llmModelReady ? "success" : "outline"} className="text-[10px]">
                      {capabilities?.llmModelReady ? `Ready (${capabilities.llmModelSizeMb} MB)` : "Not Downloaded"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={llmUrl}
                      onChange={(e) => setLlmUrl(e.target.value)}
                      placeholder="https://... gemma3_1b_int4.task URL"
                      className="flex-1 h-8 text-[11px]"
                    />
                    {capabilities?.llmModelReady ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => handleModelDelete("llm")} className="rounded-xl shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={downloadingModel !== null || !capabilities?.supported}
                        onClick={() => handleModelDownload("llm")}
                        className="rounded-xl shrink-0"
                      >
                        {downloadingModel === "llm" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> {downloadPct}%
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60">
        <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#9BA8AB]" />
            <h3 className="text-sm font-semibold text-[#CCD0CF]">
              Stored Meal Photos ({images.length})
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {localMode ? "On Device" : "Private Cloud"}
          </Badge>
        </div>

        <div className="pt-3 space-y-3">
          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            Images uploaded during food scanning. Images analyzed ephemerally are never shared with external parties.
          </p>

          {images.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#9BA8AB] rounded-xl border border-dashed border-[#253745]/50 bg-[#06141B]/30">
              <ImageIcon className="h-5 w-5 mx-auto mb-1.5 opacity-40" />
              No photos currently retained in your storage.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto ios-scroll">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#253745]/40 bg-[#06141B]/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={img.storageUrl}
                      alt="Uploaded meal"
                      className="h-10 w-10 rounded-lg object-cover border border-[#253745] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#CCD0CF] truncate max-w-[200px]">
                        {img.storageKey}
                      </p>
                      <p className="text-[10px] text-[#9BA8AB]">
                        {img.fileSizeKb} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
