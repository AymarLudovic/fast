import { NextResponse } from "next/server"
import { getAppwriteAdmin } from "@/lib/appwrite/server"

// Minimal token parsing (not cryptographically verifying).
// For production, prefer verifying the token signature with firebase-admin.
function decodeFirebaseUidFromAuthHeader(req: Request): string {
  const hdr = req.headers.get("authorization") || ""
  const [, token] = hdr.split(" ")
  if (!token) throw new Error("Missing bearer token")

  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid token")
  const base64UrlToObj = (b64url: string) => {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(b64, "base64").toString("utf8")
    return JSON.parse(json)
  }
  const payload = base64UrlToObj(parts[1])
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gloopin-374f1"
  const iss = `https://securetoken.google.com/${projectId}`
  if (payload.aud !== projectId || payload.iss !== iss) {
    throw new Error("Invalid Firebase token audience/issuer")
  }
  const uid = payload.sub
  if (!uid) throw new Error("Invalid token payload")
  return uid
}

export async function POST(req: Request) {
  try {
    const uid = decodeFirebaseUidFromAuthHeader(req)
    const { databases, databaseId, subscriptionCollectionId } = getAppwriteAdmin()

    const now = new Date()
    const expiration = new Date(now.getTime() + 3 * 60 * 1000) // 3 minutes

    // Upsert pattern by ID = uid
    let exists = true
    try {
      await databases.getDocument(databaseId, subscriptionCollectionId, uid)
    } catch {
      exists = false
    }

    if (!exists) {
      await databases.createDocument(databaseId, subscriptionCollectionId, uid, {
        userId: uid,
        subscriptionType: "trial",
        expirationDate: expiration.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
    } else {
      await databases.updateDocument(databaseId, subscriptionCollectionId, uid, {
        subscriptionType: "trial",
        expirationDate: expiration.toISOString(),
        updatedAt: now.toISOString(),
      })
    }

    return NextResponse.json({
      ok: true,
      subscription: { userId: uid, subscriptionType: "trial", expirationDate: expiration.toISOString() },
    })
  } catch (err: any) {
    console.error("trial route error:", err)
    const msg = err?.message || "Internal error"
    return NextResponse.json({ error: msg }, { status: msg.includes("token") ? 401 : 500 })
  }
}
