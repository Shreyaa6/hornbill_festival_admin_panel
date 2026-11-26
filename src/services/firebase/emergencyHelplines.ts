import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore'
import { db } from './index'
import type { EmergencyHelplineItem } from '@/types'

const COLLECTION_NAME = 'emergency_helplines'

export function subscribeEmergencyHelplines(
  onData: (items: EmergencyHelplineItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME)
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: EmergencyHelplineItem[] = []
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        items.push({
          id: docSnap.id,
          name: data.name || '',
          subtitle: data.subtitle || '',
          phone: data.phone || '',
          district: data.district || '',
          category: data.category || 'police',
          order: typeof data.order === 'number' ? data.order : 999,
        })
      })

      // Sort by order ascending if present, otherwise by name
      items.sort((a, b) => {
        const orderA = a.order ?? 999
        const orderB = b.order ?? 999
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })

      // Assign slNo
      const withSlNo = items.map((item, idx) => ({
        ...item,
        slNo: idx + 1,
      }))

      onData(withSlNo)
    },
    (err) => {
      console.error('Error fetching emergency helplines from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addEmergencyHelpline(item: Omit<EmergencyHelplineItem, 'id' | 'slNo'>) {
  // Generate next helpline ID if possible (e.g. helpline_17)
  const snap = await getDocs(collection(db, COLLECTION_NAME))
  let maxNum = 0
  snap.docs.forEach((d) => {
    const match = d.id.match(/^helpline_(\d+)$/)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > maxNum) maxNum = n
    }
  })

  const nextId = `helpline_${String(maxNum + 1).padStart(2, '0')}`
  const docRef = doc(db, COLLECTION_NAME, nextId)

  const payload: Record<string, any> = {
    name: (item.name || '').trim(),
    subtitle: (item.subtitle || '').trim(),
    phone: (item.phone || '').trim(),
    district: (item.district || '').trim(),
    category: (item.category || 'police').trim(),
  }

  if (typeof item.order === 'number' && !isNaN(item.order)) {
    payload.order = item.order
  } else {
    payload.order = maxNum + 1
  }

  await setDoc(docRef, payload)
  return nextId
}

export async function updateEmergencyHelpline(
  id: string,
  updates: Partial<Omit<EmergencyHelplineItem, 'id' | 'slNo'>>
) {
  const docRef = doc(db, COLLECTION_NAME, id)
  const payload: any = {}

  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle.trim()
  if (updates.phone !== undefined) payload.phone = updates.phone.trim()
  if (updates.district !== undefined) payload.district = updates.district.trim()
  if (updates.category !== undefined) payload.category = updates.category.trim()
  if (updates.order !== undefined && !isNaN(updates.order)) payload.order = Number(updates.order)

  await setDoc(docRef, payload, { merge: true })
  return true
}

export async function deleteEmergencyHelpline(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
  return true
}
