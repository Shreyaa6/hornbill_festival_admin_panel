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
import type { TourGuideItem } from '@/types'

const COLLECTION_NAME = 'tour_guides'

function mapDocToTourGuide(docSnap: any, index: number): TourGuideItem {
  const d = docSnap.data()
  return {
    id: docSnap.id,
    slNo: index + 1,
    name: d.fullName || '—',
    phoneNumber: d.phoneNumber || '—',
    district: d.district || 'Kohima',
    address: d.address || '—',
    ntaIdCardPhoto: d.document || '',
    status: d.isActive === false ? 'Inactive' : 'Active',
  }
}

export function subscribeTourGuides(
  onData: (guides: TourGuideItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToTourGuide(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching tour guides from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addTourGuide(data: any) {
  return addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    created_at: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    isActive: true,
  })
}

export async function updateTourGuide(id: string, data: any) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, data)
}

export async function toggleTourGuideStatus(id: string, isActive: boolean) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { isActive })
}

export async function deleteTourGuide(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
