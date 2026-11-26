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
import type { TribeItem } from '@/types'

const COLLECTION_NAME = 'tribes'

function mapDocToTribe(docSnap: any, index: number): TribeItem {
  const d = docSnap.data()
  const photoUrl = d.photo || d.bannerPhoto || d.banner || null
  return {
    id: docSnap.id,
    slNo: index + 1,
    photo: photoUrl,
    bannerPhoto: photoUrl,
    tribe: (d.name || d.tribe || 'Unnamed Tribe').trim(),
    district: (d.district || d['district '] || '').trim(),
    description: (d.description || '').trim(),
  }
}

export function subscribeTribes(
  onData: (tribes: TribeItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToTribe(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching tribes from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addTribe(data: Omit<TribeItem, 'id' | 'slNo'>) {
  return addDoc(collection(db, COLLECTION_NAME), {
    name: data.tribe.trim(),
    photo: data.photo || data.bannerPhoto || '',
    district: (data.district || '').trim(),
    description: (data.description || '').trim(),
    createdAt: new Date().toISOString(),
  })
}

export async function updateTribe(id: string, data: Partial<TribeItem>) {
  const ref = doc(db, COLLECTION_NAME, id)
  const updates: Record<string, any> = {}
  if (data.tribe !== undefined) {
    updates.name = data.tribe.trim()
  }
  if (data.description !== undefined) {
    updates.description = data.description.trim()
  }
  if (data.photo !== undefined || data.bannerPhoto !== undefined) {
    updates.photo = data.photo || data.bannerPhoto || ''
  }
  if (data.district !== undefined) {
    updates.district = data.district.trim()
  }
  return updateDoc(ref, updates)
}

export async function deleteTribe(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
