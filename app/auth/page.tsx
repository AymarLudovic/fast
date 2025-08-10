"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signupWithEmailPassword, loginWithEmailPassword } from "@/lib/firebase"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "signup") {
        await signupWithEmailPassword(email, password) // creates 3-minute trial if missing
      } else {
        await loginWithEmailPassword(email, password)
      }
      router.replace("/")
    } catch (err: any) {
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
        </CardContent>
      </Card>
    </main>
  )
}
