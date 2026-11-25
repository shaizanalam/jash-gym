/**
 * Runtime detection for whether NutriMentor is running as a standalone
 * local app inside the installed Capacitor APK (vs Web/Next.js server).
 */
export function isLocalAppMode(): boolean {
  if (process.env.NEXT_PUBLIC_CAPACITOR_LOCAL === "true") {
    return true
  }
  if (typeof window !== "undefined") {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (cap?.isNativePlatform?.()) {
      return true
    }
  }
  return false
}
