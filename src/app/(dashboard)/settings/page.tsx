import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui/index"
import { Mail, ShieldCheck, Lock, Image as ImageIcon, Database } from "lucide-react"

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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 w-full">
      <div className="pb-1 border-b border-[#253745]/40">
        <h1 className="text-xl sm:text-2xl font-bold text-[#CCD0CF] tracking-tight">
          Settings & Privacy
        </h1>
        <p className="text-xs text-[#9BA8AB] mt-0.5">
          Account credentials, data isolation, and stored meal photos.
        </p>
      </div>

      {/* Account Details Card */}
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#182C3D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] font-bold text-sm">
              {(session.user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#CCD0CF]">
                {session.user.name || "User"}
              </p>
              <p className="text-xs text-[#9BA8AB]">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#253745]/30 flex items-start gap-2 text-xs text-[#9BA8AB]">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              All your meal logs, nutritional parameters, and profile details are encrypted and strictly isolated to your account.
            </span>
          </div>
        </div>
      </Card>

      {/* Uploaded Meal Photos */}
      <Card className="p-4 sm:p-5 bg-[#0f1b24] border border-[#253745]/60">
        <div className="flex items-center justify-between pb-3 border-b border-[#253745]/40">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#9BA8AB]" />
            <h3 className="text-sm font-semibold text-[#CCD0CF]">
              Stored Meal Photos ({images.length})
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Private Cloud
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
            <div className="space-y-2 max-h-60 overflow-y-auto">
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
