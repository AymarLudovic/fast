import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date()
    const expiration = new Date(now.getTime() + 3 * 60 * 1000) // 3 minutes trial

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        subscription_type: "trial",
        expiration_at: expiration.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (error) throw error

    return NextResponse.json({
      ok: true,
      subscription: { user_id: userId, expiration_at: expiration.toISOString(), subscription_type: "trial" },
    })
  } catch (err: any) {
    console.error("trial error:", err)
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
