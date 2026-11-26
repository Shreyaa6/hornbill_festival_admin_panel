import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './index'
import type { SubmissionItem } from '@/types'

const COLLECTION_NAME = 'submissions'

function mapDocToSubmission(docSnap: any): SubmissionItem {
  const d = docSnap.data()
  return {
    id: docSnap.id,
    docId: docSnap.id,
    fullName: d.fullName || '—',
    photoUrl: d.photoUrl || '',
    votes: typeof d.votes === 'number' ? d.votes : Number(d.votes) || 0,
    localDateString: d.localDateString || '—',
  }
}

export function subscribeSubmissions(
  onData: (submissions: SubmissionItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME), orderBy('localDateString', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => mapDocToSubmission(docSnap))
      onData(list)
    },
    (err) => {
      console.error('Error fetching submissions from Firestore:', err)
      if (onError) onError(err)
    }
  )
}

export async function deleteSubmission(docId: string) {
  const ref = doc(db, COLLECTION_NAME, docId)
  return deleteDoc(ref)
}

export async function deleteSubmissionsBulk(docIds: string[]) {
  return Promise.all(docIds.map((id) => deleteSubmission(id)))
}
