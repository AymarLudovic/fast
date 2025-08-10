import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle()
    if (error) throw error

    return NextResponse.json({ subscription: data || null })
  } catch (err: any) {
    console.error("subscriptions/me error:", err)
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
