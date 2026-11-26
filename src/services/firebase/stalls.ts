import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
} from 'firebase/firestore'
import { db } from './index'
import type { StallItem } from '@/types'

const COLLECTION_NAME = 'stalls'

function mapDocToStall(docSnap: any, index: number): StallItem {
  const d = docSnap.data()
  // Ensure Sl No is a sequential number (not a millisecond timestamp)
  const cleanSlNo =
    typeof d.order === 'number' && d.order > 0 && d.order < 10000 ? d.order : index + 1
  return {
    id: docSnap.id,
    slNo: cleanSlNo,
    stallName: d.stallName || '—',
    ownerName: d.owner || '—',
    phoneNumber: d.phone || '—',
  }
}

export function subscribeStalls(
  onData: (stalls: StallItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToStall(docSnap, idx))
      list.sort((a, b) => a.slNo - b.slNo)
      onData(list)
    },
    (err) => {
      console.error('Error fetching stalls from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addStall(data: Omit<StallItem, 'id' | 'slNo'>, orderNumber?: number) {
  let targetOrder = orderNumber
  if (!targetOrder) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      let maxOrder = 0
      snap.forEach((d) => {
        const o = d.data().order
        if (typeof o === 'number' && o < 10000 && o > maxOrder) {
          maxOrder = o
        }
      })
      targetOrder = maxOrder + 1
    } catch {
      targetOrder = 1
    }
  }

  return addDoc(collection(db, COLLECTION_NAME), {
    stallName: data.stallName,
    owner: data.ownerName,
    phone: data.phoneNumber,
    category: 'Main',
    order: targetOrder,
  })
}

export async function updateStall(id: string, data: Partial<StallItem>) {
  const ref = doc(db, COLLECTION_NAME, id)
  const updates: any = {}
  if (data.stallName !== undefined) updates.stallName = data.stallName
  if (data.ownerName !== undefined) updates.owner = data.ownerName
  if (data.phoneNumber !== undefined) updates.phone = data.phoneNumber
  return updateDoc(ref, updates)
}

export async function deleteStall(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
