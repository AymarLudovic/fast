"use client"

import type React from "react"
import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase-client"
import { Client, Databases } from "appwrite"

const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("68802a5d00297352e520")

const databases = new Databases(client)

export default function SignupPage() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false)
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState<boolean>(false)
  const [resetMessage, setResetMessage] = useState<string>("")
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setResetMessage("")
    try {
      let userCredential
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)

        try {
          const expirationDate = new Date()
          expirationDate.setMinutes(expirationDate.getMinutes() + 3)

          const promise = databases.createDocument("boodupy-3000", "subscription-300", userCredential.user.uid, {
            userId: userCredential.user.uid,
            subscriptionType: "trial",
            expirationDate: expirationDate.toISOString(),
          })

          promise.then(
            (response) => {
              console.log("Trial subscription created:", response)
            },
            (error) => {
              console.warn("Trial creation failed (non-blocking):", error)
            },
          )
        } catch (err) {
          console.warn("Trial creation failed (non-blocking):", err)
        }
      }

      const userId = userCredential.user.uid
      localStorage.setItem("userId", userId)
      router.push("/")
    } catch (err: any) {
      setError(err?.message || "Authentication failed")
    }
  }

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setResetMessage("")
    if (!email) {
      setError("Please enter your email address.")
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setResetMessage("Password reset email sent. Check your inbox (and spam folder).")
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email address.")
      } else if (err.code === "auth/invalid-email") {
        setError("The email address is not valid.")
      } else {
        setError("Error sending reset email: " + err.message)
      }
    }
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setIsForgotPasswordMode(false)
    setError("")
    setResetMessage("")
  }

  const activateForgotPasswordMode = () => {
    setIsForgotPasswordMode(true)
    setError("")
    setResetMessage("")
    setPassword("")
  }

  const deactivateForgotPasswordMode = () => {
    setIsForgotPasswordMode(false)
    setError("")
    setResetMessage("")
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100"
      style={{ fontFamily: "sans-serif" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isForgotPasswordMode ? "Reset Password" : isLoginMode ? "Login" : "Sign Up"}
        </h2>

        {isForgotPasswordMode ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Send Reset Email
            </button>
            <button
              type="button"
              onClick={deactivateForgotPasswordMode}
              className="w-full mt-2 text-blue-600 hover:underline"
            >
              Back to {isLoginMode ? "Login" : "Sign Up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoginMode ? "Login" : "Sign Up"}
            </button>

            <button type="button" onClick={toggleMode} className="w-full mt-2 text-blue-600 hover:underline">
              {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Login"}
            </button>
            <button
              type="button"
              onClick={activateForgotPasswordMode}
              className="w-full mt-2 text-sm text-gray-600 hover:underline"
            >
              Forgot Password?
            </button>
          </form>
        )}
        {resetMessage && <p className="text-green-600 text-center mt-4">{resetMessage}</p>}
      </div>
    </div>
  )
}
