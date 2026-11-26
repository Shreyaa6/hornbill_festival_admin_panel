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
import type { ContestItem } from '@/types'

const COLLECTION_NAME = 'contests'

function mapDocToContest(docSnap: any, index: number): ContestItem {
  const d = docSnap.data()
  return {
    id: docSnap.id,
    slNo: index + 1,
    type: d.type === 'banner' ? 'Banner' : (d.type || 'Banner'),
    posterImage: d.poster || '',
    title: d.title || 'Untitled Contest',
    description: d.description || '',
    location: d.location || '—',
    date: d.date || '—',
    time: d.time || '—',
  }
}

export function subscribeContests(
  onData: (contests: ContestItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToContest(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching contests from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addContest(data: Omit<ContestItem, 'id' | 'slNo'>) {
  const id = Date.now()
  return addDoc(collection(db, COLLECTION_NAME), {
    id,
    title: data.title,
    poster: data.posterImage,
    date: data.date,
    time: data.time === '—' ? null : data.time,
    location: data.location,
    description: data.description,
    type: (data.type || 'banner').toLowerCase(),
  })
}

export async function updateContest(id: string, data: Partial<ContestItem>) {
  const ref = doc(db, COLLECTION_NAME, id)
  const updates: any = {}
  if (data.title !== undefined) updates.title = data.title
  if (data.posterImage !== undefined) updates.poster = data.posterImage
  if (data.date !== undefined) updates.date = data.date
  if (data.time !== undefined) updates.time = data.time === '—' ? null : data.time
  if (data.location !== undefined) updates.location = data.location
  if (data.description !== undefined) updates.description = data.description
  if (data.type !== undefined) updates.type = data.type.toLowerCase()
  return updateDoc(ref, updates)
}

export async function deleteContest(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
