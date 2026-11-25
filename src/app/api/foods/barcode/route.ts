import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isValidBarcode, lookupBarcodeNutrition, normalizeBarcode } from "@/lib/barcode-lookup"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawCode = searchParams.get("code") || ""
  const code = normalizeBarcode(rawCode)

  if (!isValidBarcode(code)) {
    return NextResponse.json(
      { error: "Please provide a valid 6–14 digit barcode." },
      { status: 400 }
    )
  }

  const result = await lookupBarcodeNutrition(code)
  if (!result.found || !result.item) {
    return NextResponse.json(
      { error: result.error || `No product found for barcode ${code}.`, barcode: code },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ...result,
    items: [result.item],
    analysisTier: result.source === "local_cache" ? "tier1_barcode_cache" : "tier1_barcode",
  })
}
