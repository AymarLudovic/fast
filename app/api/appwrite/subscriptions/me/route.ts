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

export async function GET(req: Request) {
  try {
    const uid = decodeFirebaseUidFromAuthHeader(req)
    const { databases, databaseId, subscriptionCollectionId } = getAppwriteAdmin()

    try {
      const doc = await databases.getDocument(databaseId, subscriptionCollectionId, uid)
      return NextResponse.json({
        subscription: doc
          ? {
              userId: doc.userId,
              subscriptionType: doc.subscriptionType,
              expirationDate: doc.expirationDate,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            }
          : null,
      })
    } catch {
      return NextResponse.json({ subscription: null })
    }
  } catch (err: any) {
    console.error("me route error:", err)
    const msg = err?.message || "Internal error"
    return NextResponse.json({ error: msg }, { status: msg.includes("token") ? 401 : 500 })
  }
}
