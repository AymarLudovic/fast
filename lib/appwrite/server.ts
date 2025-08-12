import { Client, Databases } from "node-appwrite"

export function getAppwriteAdmin() {
  // Fallbacks are taken from your working client files
  const endpoint = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
  const projectId = process.env.APPWRITE_PROJECT_ID || "68802a5d00297352e520"
  const apiKey = process.env.APPWRITE_API_KEY // optional
  const databaseId = process.env.APPWRITE_DATABASE_ID || "boodupy-3000"
  const subscriptionCollectionId = process.env.APPWRITE_SUBSCRIPTION_COLLECTION_ID || "subscription-300"

  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  if (apiKey) {
    client.setKey(apiKey)
  } else {
    // No key available; continue without throwing so routes don't crash.
    // Operations will succeed only if your Appwrite collection permissions allow them.
    console.warn("[Appwrite] No APPWRITE_API_KEY set; proceeding without admin key.")
  }

  const databases = new Databases(client)

  return {
    client,
    databases,
    databaseId,
    subscriptionCollectionId,
    hasAdminKey: Boolean(apiKey),
  }
}
