import { Client, Databases } from "node-appwrite"

export function getAppwriteAdmin() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const databaseId = process.env.APPWRITE_DATABASE_ID
  const subscriptionCollectionId = process.env.APPWRITE_SUBSCRIPTION_COLLECTION_ID

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY")
  }
  if (!databaseId || !subscriptionCollectionId) {
    throw new Error("Missing Appwrite env: APPWRITE_DATABASE_ID, APPWRITE_SUBSCRIPTION_COLLECTION_ID")
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
  const databases = new Databases(client)

  return { client, databases, databaseId, subscriptionCollectionId }
}
