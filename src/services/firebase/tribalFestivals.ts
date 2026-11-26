import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
} from 'firebase/firestore'
import { db } from './index'
import type { TribalFestivalItem } from '@/types'

const COLLECTION_NAME = 'festivals'

export function toSnakeCase(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

export function mapDocToFestival(docSnap: any, index: number): TribalFestivalItem {
  const d = docSnap.data()
  const festivalName = (d.festivalName || d.name || 'Unnamed Festival').trim()
  const tribeName = (d.tribeName || d.tribe || '').trim()
  const image = d.image || d.banner || d.bannerPhoto || null
  const id = d.id || docSnap.id || toSnakeCase(festivalName)
  const serialno = d.serialno !== undefined ? Number(d.serialno) : index + 1
  const slNo = serialno

  return {
    id,
    serialno,
    slNo,
    festivalName,
    tribeName,
    tribe: tribeName,
    image,
    bannerPhoto: image,
    description: (d.description || '').trim(),
  }
}

/**
 * Real-time listener for the `festivals` collection sorted by serialno.
 */
export function subscribeTribalFestivals(
  onData: (festivals: TribalFestivalItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToFestival(docSnap, idx))
      // Sort in order by serialno
      list.sort((a, b) => (a.serialno ?? a.slNo) - (b.serialno ?? b.slNo))
      onData(list)
    },
    (err) => {
      console.error('Error fetching festivals from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Add a new festival to Firestore `festivals` collection with snake_case ID and serialno.
 */
export async function addTribalFestival(data: {
  festivalName: string
  tribeName?: string
  tribe?: string
  description: string
  image?: string | null
  bannerPhoto?: string | null
}) {
  const snap = await getDocs(collection(db, COLLECTION_NAME))
  let maxSerial = 0
  snap.docs.forEach((d) => {
    const num = Number(d.data().serialno)
    if (!isNaN(num) && num > maxSerial) {
      maxSerial = num
    }
  })

  const nextSerial = maxSerial + 1
  const snakeId = toSnakeCase(data.festivalName)
  const festivalDocRef = doc(db, COLLECTION_NAME, snakeId)

  await setDoc(festivalDocRef, {
    id: snakeId,
    serialno: nextSerial,
    festivalName: data.festivalName.trim(),
    tribeName: (data.tribeName || data.tribe || '').trim(),
    image: data.image || data.bannerPhoto || '',
    description: data.description.trim(),
  }, { merge: false })

  return festivalDocRef
}

/**
 * Update an existing festival document in Firestore.
 */
export async function updateTribalFestival(
  id: string,
  data: Partial<TribalFestivalItem>
) {
  const ref = doc(db, COLLECTION_NAME, id)
  const updates: Record<string, any> = {}
  if (data.festivalName !== undefined) {
    updates.festivalName = data.festivalName.trim()
  }
  if (data.tribeName !== undefined || data.tribe !== undefined) {
    updates.tribeName = (data.tribeName || data.tribe || '').trim()
  }
  if (data.description !== undefined) {
    updates.description = data.description.trim()
  }
  if (data.image !== undefined || data.bannerPhoto !== undefined) {
    updates.image = data.image || data.bannerPhoto || ''
  }
  return updateDoc(ref, updates)
}

/**
 * Delete a festival document from Firestore.
 */
export async function deleteTribalFestival(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
