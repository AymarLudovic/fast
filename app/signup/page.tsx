"use client"

import type React from "react"
import { useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/lib/firebase-client"
import { Client, Databases } from "appwrite"

export default function SignupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signup" | "login" | "reset">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs] = useState(false) // Hidden for now as requested

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs((prev) => [...prev, logMessage])
    console.log(logMessage)
  }

  const copyLogs = async () => {
    const allLogs = logs.join("\n")
    try {
      await navigator.clipboard.writeText(allLogs)
      alert("Logs copiés!")
    } catch (err) {
      console.error("Erreur copie:", err)
    }
  }

  const createAppwriteSubscription = async (userId: string) => {
    addLog("📝 Configuration Appwrite...")
    const client = new Client()
    client.setEndpoint("https://fra.cloud.appwrite.io/v1")
    client.setProject("68802a5d00297352e520")
    const databases = new Databases(client)
    addLog("✅ Client Appwrite configuré")

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 3) // Updated trial period to 3 days instead of 3 minutes

    const documentData = {
      userId: userId,
      subscriptionType: "trial",
      expirationDate: expirationDate.toISOString(),
    }

    addLog("🔄 Création document Appwrite...")
    const response = await databases.createDocument("boodupy-3000", "subscription-300", userId, documentData)

    addLog("🎉 SUCCÈS! Document créé dans Appwrite")
    addLog(`📋 Document ID créé: ${response.$id}`)
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    setLogs([])

    try {
      addLog("🚀 Début connexion Google")
      const provider = new GoogleAuthProvider()

      addLog("🔥 Tentative authentification Google...")
      const userCredential = await signInWithPopup(auth, provider)
      addLog("✅ Connexion Google réussie!")
      addLog(`👤 User ID: ${userCredential.user.uid}`)
      addLog(`📧 Email: ${userCredential.user.email}`)

      // Check if this is a new user by trying to create subscription
      try {
        await createAppwriteSubscription(userCredential.user.uid)
        addLog("🆕 Nouvel utilisateur - abonnement créé")
      } catch (appwriteError: any) {
        if (appwriteError.message?.includes("already exists") || appwriteError.code === 409) {
          addLog("👤 Utilisateur existant - pas besoin de créer l'abonnement")
        } else {
          addLog(`⚠️ Erreur Appwrite: ${appwriteError.message}`)
        }
      }

      router.replace("/")
    } catch (err: any) {
      addLog("❌ ERREUR Google Auth!")
      addLog(`💬 Message: ${err.message}`)
      setError(err?.message || "Google authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess("Password reset email sent! Check your inbox.")
    } catch (err: any) {
      setError(err?.message || "Failed to send password reset email")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    setLogs([])

    if (mode === "reset") {
      return handlePasswordReset(e)
    }

    try {
      addLog(`🚀 Début ${mode === "login" ? "connexion" : "inscription"}`)
      addLog(`📧 Email: ${email}`)

      // Firebase Auth
      addLog("🔥 Tentative authentification Firebase...")
      let userCredential

      if (mode === "login") {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
        addLog("✅ Connexion Firebase réussie!")
        addLog(`👤 User ID: ${userCredential.user.uid}`)
        router.replace("/")
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        addLog("✅ Inscription Firebase réussie!")
        addLog(`👤 User ID: ${userCredential.user.uid}`)

        await createAppwriteSubscription(userCredential.user.uid)
        router.replace("/")
      }
    } catch (err: any) {
      addLog("❌ ERREUR DÉTECTÉE!")
      addLog(`💬 Message: ${err.message}`)
      addLog(`🔧 Détails: ${JSON.stringify(err, null, 2)}`)
      setError(err?.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "reset") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <div className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset email"}
              </Button>
            </form>
            <div className="mt-4 text-sm text-center">
              <button className="text-black underline" onClick={() => setMode("login")}>
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-gray-600 mt-2">
            {mode === "signup"
              ? "Sign up with email and password. A 3-day trial starts immediately."
              : "Log in with your email and password."}
          </p>
        </div>
        <div className="space-y-4">
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full bg-transparent" disabled={loading}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Sign up"
                  : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-sm text-center">
            {mode === "signup" ? (
              <button className="text-black underline block w-full" onClick={() => setMode("login")}>
                Already have an account? Sign in
              </button>
            ) : (
              <>
                <button className="text-black underline block w-full" onClick={() => setMode("signup")}>
                  New here? Create an account
                </button>
                <button className="text-gray-600 underline block w-full" onClick={() => setMode("reset")}>
                  Forgot your password?
                </button>
              </>
            )}
          </div>

          {showLogs && logs.length > 0 && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Logs détaillés:</h3>
                <button
                  onClick={copyLogs}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Copier
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto bg-white p-3 rounded border">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
