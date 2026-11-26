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
import type { RestaurantCafeItem } from '@/types'

const COLLECTION_NAME = 'cafes'

function mapDocToCafe(docSnap: any, index: number): RestaurantCafeItem {
  const d = docSnap.data()
  const cuisines: string[] = []
  if (d.isChinese) cuisines.push('Chinese')
  if (d.isFastFood) cuisines.push('Fast Food')
  if (d.isContinental) cuisines.push('Continental')
  if (d.isNagaDishes) cuisines.push('Naga Dishes')
  if (d.isNorthIndian) cuisines.push('North Indian')
  if (d.isSouthIndian) cuisines.push('South Indian')
  if (d.isVegetarian) cuisines.push('Vegetarian')
  if (cuisines.length === 0) cuisines.push('Multi-Cuisine')

  const menuList = Array.isArray(d.menu) ? d.menu : []

  return {
    id: docSnap.id,
    slNo: index + 1,
    bannerPhoto:
      d.photo ||
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600',
    name: d.cafeName || 'Unnamed Café',
    address: d.address || '—',
    phoneNumber: d.phoneNumber || '—',
    district: d.district || 'Kohima',
    googleMapsLink: d.gmaps || '',
    menuImage: menuList[0] || '',
    menuCount: menuList.length,
    cuisines,
    status: d.isActive === false ? 'Inactive' : 'Active',
  }
}

export function subscribeCafes(
  onData: (cafes: RestaurantCafeItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToCafe(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching cafes from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addCafe(data: any) {
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

export async function updateCafe(id: string, data: any) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, data)
}

export async function toggleCafeStatus(id: string, isActive: boolean) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { isActive })
}

export async function deleteCafe(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
