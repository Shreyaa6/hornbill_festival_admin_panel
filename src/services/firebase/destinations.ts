import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { db } from './index'
import type { DestinationItem, DestinationSpot, DestinationDetail } from '@/types'

const COLLECTION_NAME = 'destinations'

/**
 * Subscribes to real-time updates for all destinations from Firestore.
 */
export function subscribeDestinations(
  onData: (items: DestinationItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME)
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: DestinationItem[] = []
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data()
        items.push({
          id: docSnap.id,
          name: d.name || docSnap.id,
          imageUrl: d.imageUrl || '',
          details: Array.isArray(d.details) ? d.details : [],
          spots: Array.isArray(d.spots) ? d.spots : [],
        })
      })

      // Sort alphabetically by destination name
      items.sort((a, b) => a.name.localeCompare(b.name))

      onData(items)
    },
    (err) => {
      console.error('Error fetching destinations from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

/**
 * Adds a new destination document.
 */
export async function addDestination(data: {
  name: string
  imageUrl: string
  details?: DestinationDetail[]
  spots?: DestinationSpot[]
}) {
  const docId = data.name.trim()
  const docRef = doc(db, COLLECTION_NAME, docId)

  const payload = {
    name: data.name.trim(),
    imageUrl: (data.imageUrl || '').trim(),
    details: data.details || [],
    spots: data.spots || [],
  }

  await setDoc(docRef, payload)
  return docId
}

/**
 * Updates a destination document.
 */
export async function updateDestination(
  id: string,
  updates: Partial<Omit<DestinationItem, 'id'>>
) {
  const docRef = doc(db, COLLECTION_NAME, id)
  const payload: Record<string, any> = {}

  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl.trim()
  if (updates.details !== undefined) payload.details = updates.details
  if (updates.spots !== undefined) payload.spots = updates.spots

  await setDoc(docRef, payload, { merge: true })
  return true
}

/**
 * Deletes a destination document.
 */
export async function deleteDestination(id: string) {
  const docRef = doc(db, COLLECTION_NAME, id)
  await deleteDoc(docRef)
  return true
}

/**
 * Adds a new spot to a destination's spots array.
 */
export async function addSpotToDestination(destId: string, spot: DestinationSpot) {
  const docRef = doc(db, COLLECTION_NAME, destId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    throw new Error(`Destination "${destId}" not found.`)
  }

  const existingSpots: DestinationSpot[] = snap.data().spots || []
  const newSpots = [...existingSpots, spot]

  await setDoc(docRef, { spots: newSpots }, { merge: true })
  return newSpots
}

/**
 * Updates a specific spot by index in a destination's spots array.
 */
export async function updateSpotInDestination(
  destId: string,
  spotIndex: number,
  updatedSpot: DestinationSpot
) {
  const docRef = doc(db, COLLECTION_NAME, destId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    throw new Error(`Destination "${destId}" not found.`)
  }

  const existingSpots: DestinationSpot[] = snap.data().spots || []
  if (spotIndex < 0 || spotIndex >= existingSpots.length) {
    throw new Error(`Spot index ${spotIndex} out of range.`)
  }

  const newSpots = [...existingSpots]
  newSpots[spotIndex] = updatedSpot

  await setDoc(docRef, { spots: newSpots }, { merge: true })
  return newSpots
}

/**
 * Deletes a spot by index from a destination's spots array.
 */
export async function deleteSpotFromDestination(destId: string, spotIndex: number) {
  const docRef = doc(db, COLLECTION_NAME, destId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    throw new Error(`Destination "${destId}" not found.`)
  }

  const existingSpots: DestinationSpot[] = snap.data().spots || []
  const newSpots = existingSpots.filter((_, idx) => idx !== spotIndex)

  await setDoc(docRef, { spots: newSpots }, { merge: true })
  return newSpots
}
