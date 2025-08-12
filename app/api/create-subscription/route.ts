import { type NextRequest, NextResponse } from "next/server"
import { Client, Databases } from "node-appwrite"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Début création abonnement serveur")

    const { userId, email } = await request.json()
    console.log("📧 API: Email reçu:", email)
    console.log("👤 API: User ID reçu:", userId)

    // Configuration Appwrite serveur
    console.log("📝 API: Configuration client Appwrite...")
    const client = new Client()
      .setEndpoint("https://fra.cloud.appwrite.io/v1")
      .setProject("68802a5d00297352e520")
      .setKey(process.env.APPWRITE_API_KEY || "demo-key") // Vous devrez ajouter cette clé

    console.log("✅ API: Client Appwrite configuré")

    const databases = new Databases(client)

    // Création date expiration (3 minutes)
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 3)
    console.log("⏰ API: Date expiration créée:", expirationDate.toISOString())

    // Données du document
    const documentData = {
      userId: userId,
      subscriptionType: "trial",
      expirationDate: expirationDate.toISOString(),
    }
    console.log("📄 API: Données document:", JSON.stringify(documentData, null, 2))

    // Création du document
    console.log("🔄 API: Tentative création document...")
    console.log("🗂️ API: Database:", "boodupy-3000")
    console.log("📁 API: Collection:", "subscription-300")
    console.log("🆔 API: Document ID:", userId)

    const response = await databases.createDocument("boodupy-3000", "subscription-300", userId, documentData)

    console.log("✅ API: Document créé avec succès!")
    console.log("📊 API: Réponse Appwrite:", JSON.stringify(response, null, 2))

    return NextResponse.json({
      success: true,
      message: "Abonnement créé avec succès",
      data: response,
    })
  } catch (error: any) {
    console.error("❌ API: ERREUR DÉTECTÉE!")
    console.error("🔍 API: Type erreur:", error.constructor.name)
    console.error("💬 API: Message:", error.message)
    console.error("🔢 API: Code:", error.code || "Aucun code")
    console.error("📊 API: Status:", error.status || "Aucun status")
    console.error("🌐 API: Response:", error.response || {})
    console.error("📚 API: Stack:", error.stack)

    return NextResponse.json(
      {
        success: false,
        error: {
          type: error.constructor.name,
          message: error.message,
          code: error.code || null,
          status: error.status || null,
          response: error.response || {},
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}
