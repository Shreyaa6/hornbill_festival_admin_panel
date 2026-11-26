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
import type { CarouselSlideItem } from '@/types'

const COLLECTION_NAME = 'carousel'

function mapDocToSlide(docSnap: any, index: number): CarouselSlideItem {
  const d = docSnap.data()
  // Ensure ID is a clean sequential number (1, 2, 3...)
  const cleanId =
    typeof d.id === 'number' && d.id > 0 && d.id < 10000 ? d.id : index + 1
  return {
    id: docSnap.id,
    slNo: cleanId,
    type: d.type === 'thumbnail' ? 'Thumbnail' : (d.type || 'Thumbnail'),
    image: d.thumbnailImg || d.image || '',
  }
}

export function subscribeCarousel(
  onData: (slides: CarouselSlideItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap, idx) => mapDocToSlide(docSnap, idx))
      list.sort((a, b) => a.slNo - b.slNo)
      onData(list)
    },
    (err) => {
      console.error('Error fetching carousel from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function addCarouselSlide(data: { image: string; type?: string }, slideId?: number) {
  let targetId = slideId
  if (!targetId) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME))
      let maxId = 0
      snap.forEach((d) => {
        const idVal = d.data().id
        if (typeof idVal === 'number' && idVal < 10000 && idVal > maxId) {
          maxId = idVal
        }
      })
      targetId = maxId + 1
    } catch {
      targetId = 1
    }
  }

  return addDoc(collection(db, COLLECTION_NAME), {
    id: targetId,
    thumbnailImg: data.image,
    type: (data.type || 'thumbnail').toLowerCase(),
  })
}

export async function updateCarouselSlide(id: string, data: { image: string }) {
  const ref = doc(db, COLLECTION_NAME, id)
  return updateDoc(ref, { thumbnailImg: data.image })
}

export async function deleteCarouselSlide(id: string) {
  const ref = doc(db, COLLECTION_NAME, id)
  return deleteDoc(ref)
}
