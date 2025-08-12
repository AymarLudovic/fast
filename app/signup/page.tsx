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
  const [subscriptionError, setSubscriptionError] = useState<string>("")
  const [isCreatingSubscription, setIsCreatingSubscription] = useState<boolean>(false)
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<boolean>(false)
  const router = useRouter()

  const copyErrorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionError)
      alert("Error details copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = subscriptionError
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Error details copied to clipboard!")
    }
  }

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setResetMessage("")
    setSubscriptionError("")
    setSubscriptionSuccess(false)

    try {
      let userCredential
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
        const userId = userCredential.user.uid
        localStorage.setItem("userId", userId)
        router.push("/")
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const userId = userCredential.user.uid
        localStorage.setItem("userId", userId)

        setIsCreatingSubscription(true)
        try {
          const expirationDate = new Date()
          expirationDate.setMinutes(expirationDate.getMinutes() + 3)

          const response = await databases.createDocument("boodupy-3000", "subscription-300", userCredential.user.uid, {
            userId: userCredential.user.uid,
            subscriptionType: "trial",
            expirationDate: expirationDate.toISOString(),
          })

          console.log("Trial subscription created:", response)
          setSubscriptionSuccess(true)
          setIsCreatingSubscription(false)

          setTimeout(() => {
            router.push("/")
          }, 1500)
        } catch (subscriptionErr: any) {
          setIsCreatingSubscription(false)
          const errorDetails = {
            message: subscriptionErr?.message || "Unknown error",
            code: subscriptionErr?.code || "No code",
            type: subscriptionErr?.type || "No type",
            response: subscriptionErr?.response || "No response",
            stack: subscriptionErr?.stack || "No stack trace",
            fullError: JSON.stringify(subscriptionErr, null, 2),
          }

          const formattedError = `Subscription Creation Error:
Message: ${errorDetails.message}
Code: ${errorDetails.code}
Type: ${errorDetails.type}
Response: ${typeof errorDetails.response === "object" ? JSON.stringify(errorDetails.response, null, 2) : errorDetails.response}
Stack: ${errorDetails.stack}

Full Error Object:
${errorDetails.fullError}`

          setSubscriptionError(formattedError)
          console.error("Detailed subscription error:", errorDetails)
        }
      }
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

        {!isLoginMode && !isForgotPasswordMode && (
          <>
            {isCreatingSubscription && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700 text-sm">Creating your trial subscription...</p>
              </div>
            )}

            {subscriptionSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">✓ Trial subscription created successfully! Redirecting...</p>
              </div>
            )}

            {subscriptionError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-semibold mb-2">Subscription Creation Failed</h3>
                <div className="max-h-40 overflow-y-auto mb-3">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">{subscriptionError}</pre>
                </div>
                <button
                  onClick={copyErrorToClipboard}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Copy Error Details
                </button>
              </div>
            )}
          </>
        )}

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
              disabled={isCreatingSubscription}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSubscription ? "Creating Account..." : isLoginMode ? "Login" : "Sign Up"}
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
