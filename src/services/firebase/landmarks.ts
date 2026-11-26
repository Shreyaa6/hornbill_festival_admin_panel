import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
} from 'firebase/firestore'
import { db } from './index'
import type { LandmarkItem } from '@/types'

const COLLECTION_NAME = 'landmark'

function mapDocToLandmark(docSnap: any, index: number): LandmarkItem {
  const d = docSnap.data()
  return {
    id: docSnap.id,
    slNo: index + 1,
    photo: d.photo || null,
    title: d.title || 'Untitled Landmark',
    category: d.category || 'Landmark',
    longitude: d.longitude !== undefined ? String(d.longitude) : '0',
    latitude: d.latitude !== undefined ? String(d.latitude) : '0',
  }
}

export function subscribeLandmarks(
  onData: (landmarks: LandmarkItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToLandmark(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching landmarks from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addLandmark(data: Omit<LandmarkItem, 'id' | 'slNo'>) {
  return addDoc(collection(db, COLLECTION_NAME), {
    title: data.title,
    category: data.category,
    longitude: parseFloat(data.longitude) || 0,
    latitude: parseFloat(data.latitude) || 0,
    photo: data.photo || null,
  })
}

export async function updateLandmark(id: string, data: Partial<LandmarkItem>) {
  const ref = doc(db, COLLECTION_NAME, id)
  const updates: any = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.category !== undefined) updates.category = data.category
  if (data.longitude !== undefined) updates.longitude = parseFloat(data.longitude) || 0
  if (data.latitude !== undefined) updates.latitude = parseFloat(data.latitude) || 0
  if (data.photo !== undefined) updates.photo = data.photo
  return updateDoc(ref, updates)
}

export async function deleteLandmark(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
