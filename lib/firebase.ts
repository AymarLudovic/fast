import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth"

// Firebase client config (public)
const firebaseConfig = {
  apiKey: "AIzaSyDj0G6ztVSPdX2IBxSm_OTn49uOwYGoQ60",
  authDomain: "gloopin-374f1.firebaseapp.com",
  projectId: "gloopin-374f1",
  storageBucket: "gloopin-374f1.firebasestorage.app",
  messagingSenderId: "717792072207",
  appId: "1:717792072207:web:a5369e110ab3daad94497a",
  measurementId: "G-K5GHCYGF3E",
}

let app: FirebaseApp
if (!getApps().length) app = initializeApp(firebaseConfig)
else app = getApp()

export const auth = getAuth(app)

// ---------- Types kept compatible with existing UI ----------
type FakeTimestamp = { toDate: () => Date }

export type SubscriptionDoc = {
  userId: string
  subscriptionType: "trial" | "plan"
  // Mimic Firestore Timestamp shape used by pages:
  expirationAt: FakeTimestamp
  createdAt?: FakeTimestamp
  updatedAt?: FakeTimestamp
}

export type DiscountDoc = {
  code: string
  percent: number
  expiresAt: FakeTimestamp
}

// ---------- Auth helpers ----------
export function onAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signupWithEmailPassword(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  // Create a 3-minute trial via our Appwrite API
  try {
    const token = await cred.user.getIdToken()
    await fetch("/api/appwrite/subscriptions/trial", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (e) {
    // non-blocking
    console.warn("Trial creation failed (non-blocking):", e)
  }
  return cred
}

export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  await signOut(auth)
}

// ---------- Subscriptions via Appwrite API ----------
async function getIdTokenOrThrow(): Promise<string> {
  const u = auth.currentUser
  if (!u) throw new Error("Not authenticated")
  return u.getIdToken()
}

const toFakeTs = (iso?: string | null): FakeTimestamp => ({
  toDate: () => (iso ? new Date(iso) : new Date(0)),
})

export async function getSubscription(uid: string): Promise<SubscriptionDoc | null> {
  const token = await getIdTokenOrThrow()
  const res = await fetch("/api/appwrite/subscriptions/me", { headers: { Authorization: `Bearer ${token}` } })
  const j = await res.json()
  if (!res.ok) throw new Error(j?.error || "Failed to load subscription")
  if (!j.subscription) return null
  return {
    userId: String(j.subscription.userId || uid),
    subscriptionType: j.subscription.subscriptionType === "plan" ? "plan" : "trial",
    expirationAt: toFakeTs(j.subscription.expirationDate),
    createdAt: j.subscription.createdAt ? toFakeTs(j.subscription.createdAt) : undefined,
    updatedAt: j.subscription.updatedAt ? toFakeTs(j.subscription.updatedAt) : undefined,
  }
}

export async function activatePaid(uid: string, days = 30) {
  const token = await getIdTokenOrThrow()
  const res = await fetch("/api/appwrite/subscriptions/activate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ days }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j?.error || "Activation failed")
  return true
}

// ---------- Discounts (reuse existing Supabase-backed route) ----------
export async function fetchDiscount(codeRaw: string): Promise<DiscountDoc | null> {
  const code = codeRaw.trim()
  if (!code) return null
  const res = await fetch(`/api/discounts/validate?code=${encodeURIComponent(code)}`)
  const j = await res.json()
  if (!res.ok || !j.valid || !j.discount) return null
  const expiresIso = j.discount.expires_at as string
  return {
    code: j.discount.code,
    percent: Number(j.discount.percent),
    expiresAt: toFakeTs(expiresIso),
  }
}
