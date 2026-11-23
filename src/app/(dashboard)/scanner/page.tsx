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
  Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/index"
import { Card, CardContent } from "@/components/ui/index"
import { Badge } from "@/components/ui/index"

export default function Scanner() {
  const router = useRouter()
  const [mode, setMode] = useState<"camera" | "result">("camera")
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError("Camera access is not supported by this browser. Please upload an image.")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err) {
      setCameraActive(false)
      setError("Camera permission not granted or camera not found. You can upload a photo of your meal directly.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      setImageSrc(canvas.toDataURL("image/jpeg", 0.85))
      stopCamera()
    }
  }, [stopCamera])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.")
      return
    }
    stopCamera()
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async () => {
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
      setAnalysis(data)
      setMode("result")
    } catch (err) {
      setError("Analysis failed. Please check your network connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const retake = () => {
    setImageSrc(null)
    setAnalysis(null)
    setError(null)
    setMode("camera")
    startCamera()
  }

  const confirmMeal = () => {
    if (!analysis) return
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "dietscan_pending_scan",
          JSON.stringify({ analysis, imageSrc })
        )
      }
    } catch (err) {
      console.warn("Could not save to sessionStorage", err)
    }
    router.push("/results")
  }

  if (mode === "camera") {
    return (
      <div className="flex flex-1 flex-col bg-slate-950 min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  AI Vision Powered
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Scan Your Meal
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Capture your plate or upload a photo for instant nutritional breakdown.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs text-emerald-400 hover:text-emerald-300 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Viewfinder Target Container */}
          <div className="relative aspect-video sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl flex items-center justify-center">
            {imageSrc ? (
              <div className="relative w-full h-full">
                <img src={imageSrc} alt="Captured Meal" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={retake}
                  className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 active:scale-95 transition-all backdrop-blur-md"
                  aria-label="Cancel and retake"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />

                {/* Cyberpunk/Clean Target Framing Overlay with Scanning Beam */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-72 sm:h-72 border border-emerald-400/40 rounded-3xl relative backdrop-blur-[1px]">
                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-xl shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-xl shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-xl shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-xl shadow-[0_0_8px_rgba(52,211,153,0.5)]" />

                    <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-scan-beam" />

                    <div className="absolute bottom-3 left-0 right-0 text-center">
                      <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Align Plate in Frame
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="font-semibold text-slate-200 text-sm">Camera Offline or Permission Needed</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Allow camera permissions in your browser or select an existing photo from your gallery.
                </p>
              </div>
            )}
          </div>

          {/* Action Bar in Thumb Zone */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {imageSrc ? (
              <>
                <Button
                  onClick={analyzeImage}
                  disabled={loading}
                  className="w-full sm:flex-1 h-12 text-base font-semibold shadow-md shadow-emerald-600/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Analyzing Nutrition with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analyze This Meal
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={retake}
                  className="w-full sm:w-auto h-12 border-slate-700 text-slate-300 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Retake
                </Button>
              </>
            ) : cameraActive ? (
              <Button
                onClick={capturePhoto}
                className="w-full h-12 text-base font-bold shadow-lg shadow-emerald-600/35 active:scale-[0.98]"
              >
                <Camera className="h-5 w-5 mr-2" /> Capture Meal Photo
              </Button>
            ) : (
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-12 text-base font-bold shadow-md shadow-emerald-600/25"
              >
                <Upload className="h-5 w-5 mr-2" /> Select Photo from Gallery
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Result View
  const totalCal = analysis?.items?.reduce((sum: number, it: any) => sum + (it.calories || 0), 0) || 0
  const totalProtein = analysis?.items?.reduce((sum: number, it: any) => sum + (it.proteinG || 0), 0) || 0
  const totalCarbs = analysis?.items?.reduce((sum: number, it: any) => sum + (it.carbsG || 0), 0) || 0
  const totalFat = analysis?.items?.reduce((sum: number, it: any) => sum + (it.fatG || 0), 0) || 0

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={retake}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Scan Another Meal
        </button>
        <Badge variant="success" className="text-xs font-mono">
          <Sparkles className="h-3 w-3 mr-1" /> AI Detection Completed
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Top Hero Grid: Photo + AI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <img src={imageSrc || ""} alt="Scanned Meal" className="w-full h-48 md:h-52 object-cover" />
            <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Input image preview</span>
              <span className="font-mono text-[11px]">{analysis?.items?.length || 0} items identified</span>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between">
            <Card className="h-full flex flex-col justify-between border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> AI Nutrition Summary
                  </h3>
                  <Badge variant="outline" className="text-xs">Approximate</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {analysis?.uncertainty || "Nutrient figures are approximate estimates computed from visual cues. You can adjust the portions and confirm below before saving to your journal."}
                </p>

                {/* Quick macro roll-up */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">Calories</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{Math.round(totalCal)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">Protein</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{totalProtein.toFixed(1)}g</span>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-500/10">
                    <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold block">Carbs</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{totalCarbs.toFixed(1)}g</span>
                  </div>
                  <div className="p-2 rounded-xl bg-orange-500/10">
                    <span className="text-[10px] text-orange-700 dark:text-orange-400 font-semibold block">Fat</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{totalFat.toFixed(1)}g</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Identified Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Identified Dishes & Food Items ({analysis?.items?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">Review & confirm</span>
          </div>

          {analysis?.items?.map((item: any, idx: number) => (
            <Card key={idx} className="border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.foodName}
                    </h4>
                    {item.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.notes}</p>
                    )}
                  </div>
                  <Badge variant="success" className="text-xs">
                    {item.confidence || "estimated"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Portion</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5 tabular-nums">{item.estimatedPortionG}g</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Calories</span>
                    <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 tabular-nums">{item.calories} kcal</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Protein</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 tabular-nums">{item.proteinG}g</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Carbs</span>
                    <p className="font-semibold text-sky-600 dark:text-sky-400 text-sm mt-0.5 tabular-nums">{item.carbsG}g</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Fat</span>
                    <p className="font-semibold text-orange-600 dark:text-orange-400 text-sm mt-0.5 tabular-nums">{item.fatG}g</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Actions in Thumb Zone */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
          <Button variant="outline" onClick={retake} className="w-full sm:w-auto h-12">
            Retake or Change
          </Button>
          <Button onClick={confirmMeal} className="w-full sm:flex-1 h-12 font-bold text-base shadow-lg shadow-emerald-600/30">
            Confirm & Save to Journal
          </Button>
        </div>
      </div>
    </div>
  )
}
