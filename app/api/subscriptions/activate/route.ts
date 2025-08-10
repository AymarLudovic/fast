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

    // Fetch current subscription (if any) to extend from existing expiration
    const { data: existing, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
    if (fetchError) throw fetchError

    const now = new Date()
    const base = existing?.expiration_at ? new Date(existing.expiration_at) : now
    const startFrom = base.getTime() > now.getTime() ? base : now
    const newExpiration = new Date(startFrom.getTime())
    newExpiration.setDate(newExpiration.getDate() + 30) // +30 days

    const { error: upsertError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        subscription_type: "plan",
        expiration_at: newExpiration.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    )
    if (upsertError) throw upsertError

    return NextResponse.json({
      ok: true,
      subscription: { user_id: userId, subscription_type: "plan", expiration_at: newExpiration.toISOString() },
    })
  } catch (err: any) {
    console.error("activate error:", err)
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
