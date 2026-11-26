import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { CarouselSlideItem } from '@/types'
import { initialCarouselData } from '@/data/carouselData'
import { ImageModal } from '@/components/common/ImageModal'
import {
  subscribeCarousel,
  addCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
} from '@/services/firebase/carousel'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function CarouselPage() {
  const [slides, setSlides] = useState<CarouselSlideItem[]>(initialCarouselData)
  const [isAddingSlide, setIsAddingSlide] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editImageTemp, setEditImageTemp] = useState<string>('')
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeCarousel((liveSlides) => {
      if (liveSlides && liveSlides.length > 0) {
        setSlides(liveSlides)
      }
    })
    return () => unsubscribe()
  }, [])

  // New slide form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [inlineFile, setInlineFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = (slide: CarouselSlideItem) => {
    setEditingId(slide.id)
    setEditImageTemp(slide.image)
    setInlineFile(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditImageTemp('')
    setInlineFile(null)
  }

  const handleSaveEdit = async (id: string) => {
    setIsUploading(true)
    let finalUrl = editImageTemp
    try {
      if (inlineFile) {
        finalUrl = await uploadImageToStorage(
          inlineFile,
          'carousel',
          `thumbnail_${Date.now()}.jpg`
        )
      }
      if (finalUrl) {
        await updateCarouselSlide(id, { image: finalUrl })
      }
      setSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, image: finalUrl || s.image } : s))
      )
      setEditingId(null)
      setEditImageTemp('')
      setInlineFile(null)
    } catch (err: any) {
      console.error('Error updating slide in Firestore/Storage:', err)
      alert(`Error updating slide: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await deleteCarouselSlide(id)
      } catch (err) {
        console.error('Error deleting slide from Firestore:', err)
      }
      setSlides((prev) =>
        prev
          .filter((s) => s.id !== id)
          .map((s, idx) => ({ ...s, slNo: idx + 1 }))
      )
    }
  }

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInlineFile(file)
      const url = URL.createObjectURL(file)
      setEditImageTemp(url)
    }
  }

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setNewImagePreview(url)
    }
  }

  const handleSubmitNewSlide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !newImagePreview) {
      alert('Please choose an image file to upload.')
      return
    }

    setIsUploading(true)
    try {
      let finalUrl = newImagePreview || '/images/carousel/slide_1.png'
      if (selectedFile) {
        // Upload to Firebase Storage so real mobile apps receive a working public URL
        finalUrl = await uploadImageToStorage(
          selectedFile,
          'carousel',
          `thumbnail_${Date.now()}.jpg`
        )
      }

      await addCarouselSlide({ image: finalUrl, type: 'thumbnail' })
      setSelectedFile(null)
      setNewImagePreview(null)
      setIsAddingSlide(false)
      alert('Slide uploaded and added successfully!')
    } catch (err: any) {
      console.error('Error adding slide to Firestore/Storage:', err)
      alert(`Error uploading slide: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Centered Page Title */}
      <h1
        style={{
          textAlign: 'center',
          color: '#0b8462',
          fontSize: '26px',
          fontWeight: 700,
          margin: '0 0 24px 0',
        }}
      >
        Carousel
      </h1>

      {/* Top Action Button (only in list view) */}
      {!isAddingSlide && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => setIsAddingSlide(true)}
            style={{
              backgroundColor: '#0b8462',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 20px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#096b4f')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
          >
            Add Slide
          </button>
        </div>
      )}

      {/* Main Content Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
        }}
      >
        {!isAddingSlide ? (
          /* Table View */
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '8px',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: '950px',
                borderCollapse: 'collapse',
                border: '1px solid #d5e6de',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#e2f6ee', height: '44px' }}>
                  <th
                    style={{
                      border: '1px solid #d5e6de',
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#111827',
                      width: '70px',
                    }}
                  >
                    Sl No.
                  </th>
                  <th
                    style={{
                      border: '1px solid #d5e6de',
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#111827',
                      width: '240px',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      border: '1px solid #d5e6de',
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#111827',
                      width: '260px',
                    }}
                  >
                    Thumbnail Image
                  </th>
                  <th
                    style={{
                      border: '1px solid #d5e6de',
                      padding: '12px 18px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#111827',
                      width: '200px',
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide, index) => {
                  const isEditing = editingId === slide.id
                  const currentImg = isEditing ? editImageTemp || slide.image : slide.image

                  return (
                    <tr
                      key={slide.id}
                      style={{
                        height: isEditing ? '85px' : '65px',
                        borderBottom: '1px solid #d5e6de',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '12px 18px',
                          fontSize: '14px',
                          color: '#111827',
                          fontWeight: 500,
                        }}
                      >
                        {slide.slNo && slide.slNo < 10000 ? slide.slNo : index + 1}
                      </td>
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '12px 18px',
                          fontSize: '14px',
                          color: '#111827',
                          fontWeight: 600,
                        }}
                      >
                        {slide.type}
                      </td>
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '12px 18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                          }}
                        >
                          <img
                            src={currentImg}
                            alt={`Slide ${slide.slNo}`}
                            onClick={() => {
                              if (!isEditing) setModalImage(slide.image)
                            }}
                            onDoubleClick={() => {
                              if (isEditing && inlineFileInputRef.current) {
                                inlineFileInputRef.current.click()
                              }
                            }}
                            style={{
                              width: '68px',
                              height: '42px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                              cursor: isEditing ? 'pointer' : 'zoom-in',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                            }}
                            title={isEditing ? 'Double-click to change image' : 'Click to preview'}
                          />
                          {isEditing && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                marginTop: '4px',
                                userSelect: 'none',
                              }}
                            >
                              Double-click to change
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '12px 18px',
                        }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleSaveEdit(slide.id)}
                              style={{
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = '#15803d')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = '#16a34a')
                              }
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                backgroundColor: '#4b5563',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = '#374151')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = '#4b5563')
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleStartEdit(slide)}
                              title="Edit slide"
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: '#14b8a6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = '#0d9488')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = '#14b8a6')
                              }
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(slide.id)}
                              title="Delete slide"
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = '#dc2626')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = '#ef4444')
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Hidden input for inline edit double click */}
            <input
              ref={inlineFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleInlineFileChange}
            />
          </div>
        ) : (
          /* Add New Slide Form View */
          <div>
            {/* Form Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2
                style={{
                  color: '#0b8462',
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Add New Slide
              </h2>
              <button
                onClick={() => {
                  setIsAddingSlide(false)
                  setSelectedFile(null)
                  setNewImagePreview(null)
                }}
                style={{
                  backgroundColor: '#4b5563',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
              >
                Back
              </button>
            </div>

            {/* Divider Line */}
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                margin: '16px 0 24px 0',
              }}
            />

            {/* Form */}
            <form onSubmit={handleSubmitNewSlide}>
              {/* Type Field */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0b8462',
                    marginBottom: '8px',
                  }}
                >
                  Type
                </label>
                <div
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#eafaf3',
                    border: '1.5px dashed #34d399',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b8462',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Thumbnail (auto)
                </div>
              </div>

              {/* Thumbnail Image Field */}
              <div style={{ marginBottom: '28px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0b8462',
                    marginBottom: '8px',
                  }}
                >
                  Thumbnail Image
                </label>
                <div
                  style={{
                    width: '100%',
                    height: '42px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1fae5',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNewFileChange}
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  />
                </div>
                {newImagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={newImagePreview}
                      alt="Thumbnail Preview"
                      style={{
                        width: '120px',
                        height: '70px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    backgroundColor: isUploading ? '#9ca3af' : '#0b8462',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 48px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isUploading) e.currentTarget.style.backgroundColor = '#096b4f'
                  }}
                  onMouseOut={(e) => {
                    if (!isUploading) e.currentTarget.style.backgroundColor = '#0b8462'
                  }}
                >
                  {isUploading ? 'Uploading to Storage...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Preview for Thumbnails */}
      {modalImage && (
        <ImageModal
          src={modalImage}
          title="Carousel Slide Preview"
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
