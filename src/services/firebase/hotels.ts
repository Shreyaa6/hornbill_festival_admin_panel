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
import type { HotelPG } from '@/types'

const COLLECTION_NAME = 'hotels'

function mapDocToHotel(docSnap: any, index: number): HotelPG {
  const d = docSnap.data()
  const amenities: string[] = []
  if (d.isWifi) amenities.push('Free Wifi')
  if (d.isAC) amenities.push('AC')
  if (d.isFooding) amenities.push('Fooding')
  if (d.isParking) amenities.push('Parking')
  if (d.isPowerBackup) amenities.push('Power Backup')
  if (d.isFridge) amenities.push('Fridge')
  if (d.isSwimming) amenities.push('Swimming')

  const propType = (d.property || 'Hotel').includes('Guest') ? 'Guest House' : 'Hotel'

  return {
    id: docSnap.id,
    slNo: index + 1,
    bannerPhoto:
      d.photo ||
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
    name: d.hotelName || 'Unnamed Hotel',
    ownerName: d.owner || '—',
    phoneNumber: d.phoneNumber || '—',
    townVillage: d.town || d.district || '—',
    district: d.district || 'Kohima',
    address: d.address || '—',
    propertyType: propType as any,
    govtIdPhoto: d.document || '',
    status: d.isActive === false ? 'Inactive' : 'Active',
    amenities,
    googleMapsLink: d.gmaps || '',
  }
}

export function subscribeHotels(
  onData: (hotels: HotelPG[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToHotel(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching hotels from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addHotel(data: any) {
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

export async function updateHotel(id: string, data: any) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, data)
}

export async function toggleHotelStatus(id: string, isActive: boolean) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { isActive })
}

export async function deleteHotel(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
