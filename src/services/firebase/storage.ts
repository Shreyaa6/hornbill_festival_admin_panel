import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './index'

/**
 * Uploads a file or blob to Firebase Storage and returns its public HTTPS download URL.
 *
 * @param file The file or blob to upload
 * @param folder The storage folder (e.g. 'carousel', 'posters', 'landmarks')
 * @param customFileName Optional filename (e.g. 'thumbnail_1795...jpg')
 * @returns The public HTTPS download URL hosted on Firebase Storage
 */
export async function uploadImageToStorage(
  file: File | Blob,
  folder: string = 'general',
  customFileName?: string
): Promise<string> {
  const extension = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg'
  const fileName =
    customFileName || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`
  const storageRef = ref(storage, `${folder}/${fileName}`)

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  })

  const downloadUrl = await getDownloadURL(snapshot.ref)
  return downloadUrl
}
