import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/index"
import { Button } from "@/components/ui/index"
import { Mail, ShieldCheck, Lock, Image as ImageIcon, Trash2 } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const images = await prisma.uploadedImage.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Settings & Privacy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account credentials, image storage, and data privacy.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" /> Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-900 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                {(session.user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {session.user.name || "User"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {session.user.email}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data isolation: All your meal records and personal details are strictly isolated to your user ID.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" /> Uploaded Food Photos ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Photos uploaded for AI vision meal analysis. You have full control over your food images.
            </p>
            {images.length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                No images stored yet. Images analyzed ephemerally are not kept without your consent.
              </div>
            ) : (
              <div className="space-y-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={img.storageUrl}
                        alt="Uploaded food"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {img.storageKey}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {img.fileSizeKb} KB
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Privacy & Teen Nutrition Guardrails
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              DietScan adheres strictly to adolescent health standards. We never calculate calorie deficits, enforce weight-loss targets, or evaluate meals as "bad" or "excessive".
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your nutritional entries are private and never shared with third-party advertisers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
