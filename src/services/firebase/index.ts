import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

export * from './cafes'
export * from './hotels'
export * from './taxis'
export * from './tourGuides'
export * from './tourOperators'
export * from './carousel'
export * from './contests'
export * from './landmarks'
export * from './stalls'
export * from './hornbill'
export * from './submissions'
export * from './storage'
export * from './tribes'
export * from './tribalFestivals'
export * from './emergencyHelplines'
export * from './destinations'
export * from './culturalCalendar'
