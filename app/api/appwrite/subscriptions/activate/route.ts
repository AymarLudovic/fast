import { NextResponse } from "next/server"
import { getAppwriteAdmin } from "@/lib/appwrite/server"

function decodeFirebaseUidFromAuthHeader(req: Request): string {
  const hdr = req.headers.get("authorization") || ""
  const [, token] = hdr.split(" ")
  if (!token) throw new Error("Missing bearer token")
  const [h, p, s] = token.split(".")
  if (!h || !p || !s) throw new Error("Invalid token")
  const base64UrlToObj = (b64url: string) => {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(b64, "base64").toString("utf8")
    return JSON.parse(json)
  }
  const payload = base64UrlToObj(p)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gloopin-374f1"
  const iss = `https://securetoken.google.com/${projectId}`
  if (payload.aud !== projectId || payload.iss !== iss) throw new Error("Invalid Firebase token audience/issuer")
  if (!payload.sub) throw new Error("Invalid token payload")
  return payload.sub
}

export async function POST(req: Request) {
  try {
    const uid = decodeFirebaseUidFromAuthHeader(req)
    const { databases, databaseId, subscriptionCollectionId } = getAppwriteAdmin()

    // Fetch existing expiration
    let base = new Date()
    try {
      const existing = await databases.getDocument(databaseId, subscriptionCollectionId, uid)
      if (existing?.expirationDate) {
        const exp = new Date(existing.expirationDate as string)
        if (exp.getTime() > base.getTime()) base = exp
      }
    } catch {
      // doc missing -> will create
    }

    const newExpiration = new Date(base.getTime())
    newExpiration.setDate(newExpiration.getDate() + 30)
    const now = new Date()

    // Upsert
    let exists = true
    try {
      await databases.getDocument(databaseId, subscriptionCollectionId, uid)
    } catch {
      exists = false
    }

    if (!exists) {
      await databases.createDocument(databaseId, subscriptionCollectionId, uid, {
        userId: uid,
        subscriptionType: "plan",
        expirationDate: newExpiration.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
    } else {
      await databases.updateDocument(databaseId, subscriptionCollectionId, uid, {
        subscriptionType: "plan",
        expirationDate: newExpiration.toISOString(),
        updatedAt: now.toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      subscription: { userId: uid, subscriptionType: "plan", expirationDate: newExpiration.toISOString() },
    })
  } catch (err: any) {
    console.error("activate route error:", err)
    const msg = err?.message || "Internal error"
    return NextResponse.json({ error: msg }, { status: msg.includes("token") ? 401 : 500 })
  }
}
