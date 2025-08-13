"use client"

import type React from "react"
import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/firebase-client"
import { Client, Databases } from "appwrite"

export default function SignupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setLogs([])

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

        addLog("📝 Configuration Appwrite...")
        const client = new Client()
        client.setEndpoint("https://fra.cloud.appwrite.io/v1")
        client.setProject("68802a5d00297352e520")
        const databases = new Databases(client)
        addLog("✅ Client Appwrite configuré")

        const expirationDate = new Date()
        expirationDate.setMinutes(expirationDate.getMinutes() + 3)

        const documentData = {
          userId: userCredential.user.uid,
          subscriptionType: "trial",
          expirationDate: expirationDate.toISOString(),
        }

        addLog("🔄 Création document Appwrite...")
        const response = await databases.createDocument(
          "boodupy-3000",
          "subscription-300",
          userCredential.user.uid,
          documentData,
        )

        addLog("🎉 SUCCÈS! Document créé dans Appwrite")
        addLog(`📋 Document ID créé: ${response.$id}`)

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

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "signup" ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription>
            {mode === "signup"
              ? "Sign up with email and password. A 3-minute trial starts immediately."
              : "Log in with your email and password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          <div className="mt-4 text-sm text-center">
            {mode === "signup" ? (
              <button className="text-black underline" onClick={() => setMode("login")}>
                Already have an account? Sign in
              </button>
            ) : (
              <button className="text-black underline" onClick={() => setMode("signup")}>
                New here? Create an account
              </button>
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
        </CardContent>
      </Card>
    </main>
  )
}
