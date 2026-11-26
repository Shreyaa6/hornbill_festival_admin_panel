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
import type { TourOperatorItem } from '@/types'

const COLLECTION_NAME = 'tour_operators'

function mapDocToTourOperator(docSnap: any, index: number): TourOperatorItem {
  const d = docSnap.data()
  const tourList: string[] = []
  if (d.isNagalandTour) tourList.push('Nagaland Tour')
  if (d.isDzukoTour) tourList.push('Dzukou Tour')
  if (d.isNorthEastTour) tourList.push('North East Tour')
  if (tourList.length === 0) tourList.push('Full Nagaland Tour')

  return {
    id: docSnap.id,
    slNo: index + 1,
    bannerPhoto:
      d.photo ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600',
    businessName: d.businessName || '—',
    ownerName: d.owner || '—',
    phoneNumber: d.phoneNumber || '—',
    district: d.district || 'Kohima',
    address: d.address || '—',
    govtIdPhoto: d.document || '',
    services: tourList,
    status: d.isActive === false ? 'Inactive' : 'Active',
  }
}

export function subscribeTourOperators(
  onData: (operators: TourOperatorItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToTourOperator(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching tour operators from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addTourOperator(data: any) {
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

export async function updateTourOperator(id: string, data: any) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, data)
}

export async function toggleTourOperatorStatus(id: string, isActive: boolean) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { isActive })
}

export async function deleteTourOperator(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
