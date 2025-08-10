import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"

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
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApp()
}

export const auth = getAuth(app)
