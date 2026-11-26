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
import type { CabTaxiItem } from '@/types'

const COLLECTION_NAME = 'taxis'

function mapDocToTaxi(docSnap: any, index: number): CabTaxiItem {
  const d = docSnap.data()
  const districtList: string[] = []
  if (d.isKohima) districtList.push('Kohima')
  if (d.isDimapur) districtList.push('Dimapur')
  if (d.isMokokchung) districtList.push('Mokokchung')
  if (d.isPhek) districtList.push('Phek')
  if (d.isWokha) districtList.push('Wokha')
  if (d.isZunheboto) districtList.push('Zunheboto')
  if (d.isMon) districtList.push('Mon')
  if (d.isTuensang) districtList.push('Tuensang')
  if (d.isLongleng) districtList.push('Longleng')
  if (d.isKiphire) districtList.push('Kiphire')
  if (d.isPeren) districtList.push('Peren')
  if (d.isNoklak) districtList.push('Noklak')
  if (d.isShamator) districtList.push('Shamator')
  if (d.isTseminyu) districtList.push('Tseminyu')
  if (d.isNiuland) districtList.push('Niuland')
  if (d.isMeluri) districtList.push('Meluri')
  if (districtList.length === 0) districtList.push('All Nagaland')

  return {
    id: docSnap.id,
    slNo: index + 1,
    driverName: d.driver || '—',
    carModel: d.carModel || 'Standard Cab',
    phoneNumber: d.phoneNumber || '—',
    seaterType: d.seater || '4 seater',
    address: d.address || '—',
    drivingLicensePhoto: d.document || '',
    districtsServing: districtList,
    status: d.isActive === false ? 'Inactive' : 'Active',
  }
}

export function subscribeTaxis(
  onData: (taxis: CabTaxiItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToTaxi(docSnap, idx))
      onData(list)
    },
    (err) => {
      console.error('Error fetching taxis from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addTaxi(data: any) {
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

export async function updateTaxi(id: string, data: any) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, data)
}

export async function toggleTaxiStatus(id: string, isActive: boolean) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { isActive })
}

export async function deleteTaxi(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
