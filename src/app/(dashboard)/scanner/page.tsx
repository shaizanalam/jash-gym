"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  Loader2,
  Sparkles,
  Info,
  ArrowLeft,
  Check,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Input } from "@/components/ui/index"
import { MEAL_CATEGORIES } from "@/lib/constants"

interface AnalyzedItem {
  id?: string
  foodName: string
  estimatedPortionG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fibreG?: number
  confidence?: string
  notes?: string
  mealCategory: string
  basePortion?: number
  baseCalories?: number
  baseProtein?: number
  baseCarbs?: number
  baseFat?: number
}

export default function Scanner() {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "camera" | "preview" | "review">("upload")
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [items, setItems] = useState<AnalyzedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const startCamera = async () => {
    setError(null)
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError("Camera is not supported by your browser. Please select or drag a photo.")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      setStep("camera")
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch (err) {
      setError("Camera permission denied or camera not found. Please upload a photo instead.")
      setStep("upload")
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      setImageSrc(canvas.toDataURL("image/jpeg", 0.85))
      stopCamera()
      setStep("preview")
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please drop or select a valid image file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file must be under 10MB.")
      return
    }
    stopCamera()
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
      setStep("preview")
    }
    reader.readAsDataURL(file)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const analyzeMeal = async () => {
    if (!imageSrc) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageSrc }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      const analyzedItems: AnalyzedItem[] = (data.items || []).map((it: any) => ({
        foodName: it.foodName || "Meal Item",
        estimatedPortionG: it.estimatedPortionG || 150,
        calories: it.calories || 200,
        proteinG: it.proteinG || 10,
        carbsG: it.carbsG || 25,
        fatG: it.fatG || 6,
        fibreG: it.fibreG || 2,
        confidence: it.confidence || "approximate",
        notes: it.notes || "",
        mealCategory: "lunch",
        basePortion: it.estimatedPortionG || 150,
        baseCalories: it.calories || 200,
        baseProtein: it.proteinG || 10,
        baseCarbs: it.carbsG || 25,
        baseFat: it.fatG || 6,
      }))

      if (analyzedItems.length === 0) {
        analyzedItems.push({
          foodName: "Identified Meal",
          estimatedPortionG: 200,
          calories: 320,
          proteinG: 14,
          carbsG: 40,
          fatG: 10,
          mealCategory: "lunch",
          basePortion: 200,
          baseCalories: 320,
          baseProtein: 14,
          baseCarbs: 40,
          baseFat: 10,
        })
      }

      setItems(analyzedItems)
      setStep("review")
    } catch (err) {
      setError("Failed to analyze image. Please verify your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    stopCamera()
    setImageSrc(null)
    setItems([])
    setError(null)
    setStep("upload")
  }

  // Portion scaling handler
  const handlePortionChange = (index: number, newGrams: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const ratio = newGrams > 0 && item.basePortion ? newGrams / item.basePortion : 1
        return {
          ...item,
          estimatedPortionG: newGrams,
          calories: Math.round((item.baseCalories || item.calories) * ratio),
          proteinG: Number(((item.baseProtein || item.proteinG) * ratio).toFixed(1)),
          carbsG: Number(((item.baseCarbs || item.carbsG) * ratio).toFixed(1)),
          fatG: Number(((item.baseFat || item.fatG) * ratio).toFixed(1)),
        }
      })
    )
  }

  const handleFieldChange = (index: number, field: keyof AnalyzedItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const saveEntries = async () => {
    if (items.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const payload = items.map((it) => ({
        foodName: it.foodName,
        estimatedPortionG: Number(it.estimatedPortionG) || 100,
        calories: Number(it.calories) || 0,
        proteinG: Number(it.proteinG) || 0,
        carbsG: Number(it.carbsG) || 0,
        fatG: Number(it.fatG) || 0,
        fibreG: Number(it.fibreG) || 0,
        mealCategory: it.mealCategory || "lunch",
        isAiGenerated: true,
        isConfirmedByUser: true,
        notes: it.notes || null,
      }))

      const res = await fetch("/api/food-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to save meal entries")
      }

      router.push("/journal")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Failed to save to journal. Please try again.")
      setSaving(false)
    }
  }

  // Summary calculations for review screen
  const totalCal = items.reduce((s, it) => s + (it.calories || 0), 0)
  const totalProtein = items.reduce((s, it) => s + (it.proteinG || 0), 0)
  const totalCarbs = items.reduce((s, it) => s + (it.carbsG || 0), 0)
  const totalFat = items.reduce((s, it) => s + (it.fatG || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-[#253745]/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
            Scan & Analyze Food
          </h1>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Identify meal dishes and compute nutritional breakdowns from your plate photo.
          </p>
        </div>

        {step !== "upload" && (
          <Button variant="ghost" size="sm" onClick={resetAll} className="self-start sm:self-auto text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Start Over
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: Upload or Camera Trigger */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-150 flex flex-col items-center justify-center min-h-[260px] ${
              isDragging
                ? "border-[#CCD0CF] bg-[#182C3D]/50"
                : "border-[#253745] bg-[#0f1b24] hover:border-[#4A5C6A]"
            }`}
          >
            <div className="h-12 w-12 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] mb-4">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-[#CCD0CF]">
              Drag and drop meal photo here
            </h3>
            <p className="text-xs text-[#9BA8AB] mt-1 max-w-sm">
              Supports JPEG, PNG, WEBP files up to 10MB.
            </p>

            <div className="flex items-center gap-2.5 mt-5">
              <Button
                variant="accent"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Browse Photo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={startCamera}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Use Camera
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Step 1.B: Active Camera View */}
      {step === "camera" && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video sm:aspect-[4/3] w-full bg-[#06141B] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="absolute top-3 right-3">
              <button
                onClick={() => {
                  stopCamera()
                  setStep("upload")
                }}
                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between border-t border-[#253745]/40 bg-[#09131a]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                stopCamera()
                setStep("upload")
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" size="default" onClick={capturePhoto}>
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Image Preview & Analyze Action */}
      {step === "preview" && imageSrc && (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            <div className="md:col-span-6 relative aspect-video md:aspect-square bg-[#06141B]">
              <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setImageSrc(null)
                  setStep("upload")
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black transition-colors"
                title="Replace image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="md:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Image Ready
                </Badge>
                <h3 className="text-base font-semibold text-[#CCD0CF]">
                  Ready to analyze your meal
                </h3>
                <p className="text-xs text-[#9BA8AB] mt-1.5 leading-relaxed">
                  Our nutritional intelligence will detect dishes, estimate portion sizes, and calculate macronutrients. You will be able to review and adjust portions before saving.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-[#253745]/40">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={analyzeMeal}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing Meal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Nutrition
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-xs"
                >
                  Replace with Different Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Review Nutrition & Adjust Portions */}
      {step === "review" && (
        <div className="space-y-5">
          {/* Summary Rollup Bar */}
          <Card className="p-4 bg-[#09131a] border border-[#253745]/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#253745]/40">
              <div>
                <h3 className="text-sm font-semibold text-[#CCD0CF]">
                  Total Meal Nutrition
                </h3>
                <p className="text-[11px] text-[#9BA8AB]">
                  Calculated from {items.length} detected item{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <Badge variant="success" className="self-start sm:self-auto text-[10px]">
                Editable Before Saving
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 text-center">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-medium block">Calories</span>
                <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{Math.round(totalCal)}</span>
                <span className="text-[10px] text-[#9BA8AB] block">kcal</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 font-medium block">Protein</span>
                <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totalProtein.toFixed(1)}</span>
                <span className="text-[10px] text-[#9BA8AB] block">g</span>
              </div>
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[10px] text-cyan-400 font-medium block">Carbs</span>
                <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totalCarbs.toFixed(1)}</span>
                <span className="text-[10px] text-[#9BA8AB] block">g</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 font-medium block">Fat</span>
                <span className="text-base font-bold text-[#CCD0CF] tabular-nums font-mono">{totalFat.toFixed(1)}</span>
                <span className="text-[10px] text-[#9BA8AB] block">g</span>
              </div>
            </div>
          </Card>

          {/* Editable Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#CCD0CF] uppercase tracking-wider">
                Adjust Portion & Confirm Items
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      foodName: "Additional Dish",
                      estimatedPortionG: 100,
                      calories: 150,
                      proteinG: 5,
                      carbsG: 20,
                      fatG: 5,
                      mealCategory: "lunch",
                      basePortion: 100,
                      baseCalories: 150,
                      baseProtein: 5,
                      baseCarbs: 20,
                      baseFat: 5,
                    },
                  ])
                }
                className="text-[11px]"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Dish
              </Button>
            </div>

            {items.map((item, idx) => (
              <Card key={idx} className="p-4 space-y-3 bg-[#0f1b24]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <Input
                      value={item.foodName}
                      onChange={(e) => handleFieldChange(idx, "foodName", e.target.value)}
                      className="font-medium text-sm text-[#CCD0CF]"
                      placeholder="Food item name"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.mealCategory}
                      onChange={(e) => handleFieldChange(idx, "mealCategory", e.target.value)}
                      className="h-10 rounded-xl bg-[#081219] px-2.5 text-xs text-[#CCD0CF] border border-[#253745]/60 focus:outline-none"
                    >
                      {MEAL_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeItem(idx)}
                      className="p-2 text-[#9BA8AB] hover:text-rose-400 hover:bg-[#11212D] rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Portion Slider & Value Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-[#9BA8AB] font-medium block mb-1">
                      Portion (grams)
                    </label>
                    <Input
                      type="number"
                      value={item.estimatedPortionG}
                      onChange={(e) => handlePortionChange(idx, Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400 font-medium block mb-1">
                      Calories (kcal)
                    </label>
                    <Input
                      type="number"
                      value={item.calories}
                      onChange={(e) => handleFieldChange(idx, "calories", Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 font-medium block mb-1">
                      Protein (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.proteinG}
                      onChange={(e) => handleFieldChange(idx, "proteinG", Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cyan-400 font-medium block mb-1">
                      Carbs (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.carbsG}
                      onChange={(e) => handleFieldChange(idx, "carbsG", Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400 font-medium block mb-1">
                      Fat (g)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.fatG}
                      onChange={(e) => handleFieldChange(idx, "fatG", Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button variant="outline" size="default" onClick={resetAll} className="w-full sm:w-auto">
              Discard
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={saveEntries}
              disabled={saving || items.length === 0}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving to Journal...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save to Food Journal
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
