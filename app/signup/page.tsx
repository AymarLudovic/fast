"use client"

import type React from "react"

import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase-client"
import { Client, Databases } from "appwrite"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setLogs([])
    setShowSuccess(false)

    try {
      addLog(`🚀 Début ${isLogin ? "connexion" : "inscription"}`)
      addLog(`📧 Email: ${email}`)

      // Firebase Auth
      addLog("🔥 Tentative authentification Firebase...")
      let userCredential

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password)
        addLog("✅ Connexion Firebase réussie!")
        addLog(`👤 User ID: ${userCredential.user.uid}`)
        setShowSuccess(true)
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        addLog("✅ Inscription Firebase réussie!")
        addLog(`👤 User ID: ${userCredential.user.uid}`)

        // Appwrite Subscription
        addLog("📝 Configuration Appwrite...")
        const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("68802a5d00297352e520")

        const databases = new Databases(client)
        addLog("✅ Client Appwrite configuré")

        addLog("⏰ Création date expiration (3 minutes)...")
        const expirationDate = new Date()
        expirationDate.setMinutes(expirationDate.getMinutes() + 3)
        addLog(`📅 Expiration: ${expirationDate.toISOString()}`)

        const documentData = {
          userId: userCredential.user.uid,
          subscriptionType: "trial",
          expirationDate: expirationDate.toISOString(),
        }
        addLog(`📄 Données document: ${JSON.stringify(documentData, null, 2)}`)

        addLog("🔄 Création document Appwrite...")
        addLog("🗂️ Database: boodupy-3000")
        addLog("📁 Collection: subscription-300")
        addLog(`🆔 Document ID: ${userCredential.user.uid}`)

        const response = await databases.createDocument(
          "boodupy-3000",
          "subscription-300",
          userCredential.user.uid,
          documentData,
        )

        addLog("🎉 SUCCÈS! Document créé dans Appwrite")
        addLog(`📋 Réponse: ${JSON.stringify(response, null, 2)}`)
        setShowSuccess(true)
      }
    } catch (error: any) {
      addLog("❌ ERREUR DÉTECTÉE!")
      addLog(`🔍 Type erreur: ${error.constructor.name}`)
      addLog(`💬 Message: ${error.message}`)
      addLog(`🔢 Code: ${error.code || "Aucun code"}`)
      addLog(`📊 Status: ${error.status || "Aucun status"}`)
      addLog(`🌐 Response: ${JSON.stringify(error.response || {}, null, 2)}`)
      addLog(`📚 Stack: ${error.stack || "Aucune stack"}`)
      addLog(`🔧 Objet complet: ${JSON.stringify(error, null, 2)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">{isLogin ? "Connexion" : "Inscription"}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Traitement..." : isLogin ? "Se connecter" : "S'inscrire"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-blue-600 hover:underline"
        >
          {isLogin ? "Créer un compte" : "Déjà un compte ?"}
        </button>

        {logs.length > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Logs détaillés:</h3>
              <button onClick={copyLogs} className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
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

        {showSuccess && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-800 font-semibold">✅ Processus terminé avec succès!</p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Aller à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
