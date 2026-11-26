import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './index'
import type { HornbillDayItem } from '@/types'
import { iconOptions } from '@/data/hornbillData'

const COLLECTION_NAME = 'hornbill'
const DOC_ID = 'latest'
const MAGAZINE_DOC_ID = 'Magazine'

export const DEFAULT_TIMELINE_ICON =
  'https://firebasestorage.googleapis.com/v0/b/hornbill-nagaland.appspot.com/o/icons%2Fwalking.png?alt=media&token=f435e903-d5aa-4cdf-b8a0-4f5fd04f380e'

export function subscribeHornbill(
  onData: (days: HornbillDayItem[]) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, COLLECTION_NAME, DOC_ID)
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data()
        if (Array.isArray(d.data)) {
          const list: HornbillDayItem[] = d.data.map((dayItem: any, index: number) => {
            const rawDay = dayItem.day !== undefined ? String(dayItem.day).trim() : String(index + 1)
            const formattedDay = rawDay.startsWith('Day') ? rawDay : `Day ${rawDay}`
            return {
              id: `day-${index + 1}`,
              slNo: index + 1,
              day: formattedDay,
              date: (dayItem.date || '').trim(),
              title: (dayItem.title || 'Cultural Shows').trim(),
              pdfUrl: (dayItem.pdf || dayItem.pdfUrl || '').trim(),
              timeline: Array.isArray(dayItem.timeline)
                ? dayItem.timeline.map((entry: any, eIdx: number) => ({
                    id: `entry-${index + 1}-${eIdx + 1}`,
                    icon:
                      entry.icon && entry.icon.trim()
                        ? entry.icon.trim()
                        : DEFAULT_TIMELINE_ICON,
                    time: (entry.time || '').trim(),
                    title: (entry.title || '').trim(),
                    description: (entry.description || '').trim(),
                  }))
                : [],
            }
          })
          onData(list)
          return
        }
      }
    },
    (err) => {
      console.error('Error fetching hornbill data from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function updateHornbillDays(days: HornbillDayItem[]) {
  const docRef = doc(db, COLLECTION_NAME, DOC_ID)
  
  const rawData = days.map((dayItem, index) => {
    // Clean day identifier: strip "Day " prefix if present, e.g. "Day 1" -> "1"
    const rawDay = dayItem.day ? String(dayItem.day).replace(/^Day\s*/i, '').trim() : String(index + 1)
    
    // Safely process timeline array
    const timelineList = Array.isArray(dayItem.timeline) ? dayItem.timeline : []
    const cleanTimeline = timelineList
      .filter((entry) => entry && ((entry.title && entry.title.trim()) || (entry.time && entry.time.trim())))
      .map((entry) => {
        let iconUrl = (entry.icon || '').trim()
        if (!iconUrl) {
          iconUrl = DEFAULT_TIMELINE_ICON
        } else if (!iconUrl.startsWith('http') && !iconUrl.startsWith('/')) {
          const matched = iconOptions.find((opt) => opt.id === iconUrl || opt.label === iconUrl)
          iconUrl = matched?.value || DEFAULT_TIMELINE_ICON
        }

        const tEntry: any = {
          icon: iconUrl,
          time: (entry.time || '').trim(),
          title: (entry.title || '').trim(),
        }
        if (entry.description && entry.description.trim()) {
          tEntry.description = entry.description.trim()
        }
        return tEntry
      })

    const item: any = {
      day: rawDay || String(index + 1),
      date: (dayItem.date || '').trim(),
      title: (dayItem.title || 'Cultural Shows').trim(),
      pdf: (dayItem.pdfUrl || (dayItem as any).pdf || '').trim(),
      timeline: cleanTimeline,
    }
    return item
  })

  // Ensure no undefined values are sent to Firestore
  const sanitized = JSON.parse(JSON.stringify(rawData))
  
  console.log('[hornbill.ts] Updating hornbill/latest with', sanitized.length, 'days...')
  await setDoc(docRef, { type: 'FINAL', data: sanitized }, { merge: true })
  console.log('[hornbill.ts] Successfully updated hornbill/latest!')
  return true
}

export function subscribeMagazine(
  onData: (url: string) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, COLLECTION_NAME, MAGAZINE_DOC_ID)
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data()
        onData(d.magazine || '')
      }
    },
    (err) => {
      console.error('Error fetching magazine from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function updateMagazine(magazineUrl: string) {
  const docRef = doc(db, COLLECTION_NAME, MAGAZINE_DOC_ID)
  return setDoc(docRef, { magazine: (magazineUrl || '').trim() }, { merge: true })
}
