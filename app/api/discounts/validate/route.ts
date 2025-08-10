import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")?.trim().toUpperCase()
    if (!code) return NextResponse.json({ valid: false, reason: "Missing code" }, { status: 400 })

    const supabase = createAdminClient()
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .gte("expires_at", nowIso)
      .maybeSingle()
    if (error) throw error

    if (!data) return NextResponse.json({ valid: false, reason: "Not found or expired" })
    return NextResponse.json({ valid: true, discount: data })
  } catch (err: any) {
    console.error("discount validate error:", err)
    return NextResponse.json({ valid: false, reason: err?.message || "Internal error" }, { status: 500 })
  }
}
