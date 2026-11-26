import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './index'
import type { CulturalCalendarItem } from '@/types'

const COLLECTION_NAME = 'cultural_calendar'

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * Generates an intuitive document ID matching the user's existing format:
 * e.g., 2026_nov_ahuna, 2026_dec_hornbill_festival
 */
function generateCalendarDocId(item: { startDate: string; title: string }): string {
  const parts = (item.startDate || '').split('-')
  const year = parts[0] || '2026'
  const monthNum = parseInt(parts[1], 10)
  const monthStr = monthNum >= 1 && monthNum <= 12 ? MONTH_NAMES[monthNum - 1] : 'event'
  const cleanTitle = (item.title || 'festival')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return `${year}_${monthStr}_${cleanTitle}`
}

/**
 * Subscribes to real-time updates from 'cultural_calendar' collection in Firestore.
 */
export function subscribeCulturalCalendar(
  onData: (items: CulturalCalendarItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME)
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CulturalCalendarItem[] = []
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data()
        items.push({
          id: docSnap.id,
          title: d.title || '',
          tribe: d.tribe || '',
          startDate: d.startDate || '',
          endDate: d.endDate || '',
          location: d.location || '',
          description: d.description || '',
          isConfirmed: Boolean(d.isConfirmed),
        })
      })

      // Sort chronologically by startDate
      items.sort((a, b) => {
        if (!a.startDate) return 1
        if (!b.startDate) return -1
        return a.startDate.localeCompare(b.startDate)
      })

      // Assign sequential slNo
      const withSlNo = items.map((it, idx) => ({
        ...it,
        slNo: idx + 1,
      }))

      onData(withSlNo)
    },
    (err) => {
      console.error('Error fetching cultural_calendar from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Adds a new entry into 'cultural_calendar'.
 */
export async function addCulturalCalendarItem(
  data: Omit<CulturalCalendarItem, 'id' | 'slNo'>
) {
  const docId = generateCalendarDocId(data)
  const docRef = doc(db, COLLECTION_NAME, docId)

  const payload = {
    title: (data.title || '').trim(),
    tribe: (data.tribe || '').trim(),
    startDate: (data.startDate || '').trim(),
    endDate: (data.endDate || data.startDate || '').trim(),
    location: (data.location || '').trim(),
    description: (data.description || '').trim(),
    isConfirmed: Boolean(data.isConfirmed),
  }

  await setDoc(docRef, payload)
  return docId
}

/**
 * Updates an existing entry in 'cultural_calendar'.
 */
export async function updateCulturalCalendarItem(
  id: string,
  updates: Partial<Omit<CulturalCalendarItem, 'id' | 'slNo'>>
) {
  const docRef = doc(db, COLLECTION_NAME, id)
  const payload: Record<string, any> = {}

  if (updates.title !== undefined) payload.title = updates.title.trim()
  if (updates.tribe !== undefined) payload.tribe = updates.tribe.trim()
  if (updates.startDate !== undefined) payload.startDate = updates.startDate.trim()
  if (updates.endDate !== undefined) payload.endDate = updates.endDate.trim()
  if (updates.location !== undefined) payload.location = updates.location.trim()
  if (updates.description !== undefined) payload.description = updates.description.trim()
  if (updates.isConfirmed !== undefined) payload.isConfirmed = Boolean(updates.isConfirmed)

  await setDoc(docRef, payload, { merge: true })
  return true
}

/**
 * Deletes an entry from 'cultural_calendar'.
 */
export async function deleteCulturalCalendarItem(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
  return true
}
