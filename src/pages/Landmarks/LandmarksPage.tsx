import { useState, useRef, useMemo, useEffect } from 'react'
import { Search, Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { LandmarkItem } from '@/types'
import { initialLandmarksData } from '@/data/landmarksData'
import { ImageModal } from '@/components/common/ImageModal'
import {
  subscribeLandmarks,
  addLandmark,
  updateLandmark,
  deleteLandmark,
} from '@/services/firebase/landmarks'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function LandmarksPage() {
  const [landmarks, setLandmarks] = useState<LandmarkItem[]>(initialLandmarksData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeLandmarks((liveLandmarks) => {
      if (liveLandmarks && liveLandmarks.length > 0) {
        setLandmarks(liveLandmarks)
      }
    })
    return () => unsubscribe()
  }, [])

  // Modal preview
  const [modalImage, setModalImage] = useState<string | null>(null)

  // Inline row edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<LandmarkItem>>({})
  const [inlineFile, setInlineFile] = useState<File | null>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)

  // Add new landmark form state
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLatitude, setNewLatitude] = useState('')
  const [newLongitude, setNewLongitude] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'All',
    'Attraction',
    'Finance',
    'Landmark',
    'Medical',
    'Morung',
    'Restroom',
  ]

  const handleStartEdit = (item: LandmarkItem) => {
    setEditingId(item.id)
    setEditForm({ ...item })
    setInlineFile(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setInlineFile(null)
  }

  const handleSaveEdit = async (id: string) => {
    setIsUploading(true)
    try {
      let finalPhoto = editForm.photo
      if (inlineFile) {
        finalPhoto = await uploadImageToStorage(
          inlineFile,
          'landmarks',
          `landmark_${Date.now()}.jpg`
        )
      }

      const updatedData = {
        ...editForm,
        ...(finalPhoto ? { photo: finalPhoto } : {}),
      }

      await updateLandmark(id, updatedData)

      setLandmarks((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                photo: finalPhoto !== undefined ? finalPhoto : l.photo,
                title: editForm.title ?? l.title,
                category: editForm.category ?? l.category,
                longitude: editForm.longitude ?? l.longitude,
                latitude: editForm.latitude ?? l.latitude,
              }
            : l
        )
      )
      setEditingId(null)
      setEditForm({})
      setInlineFile(null)
    } catch (err: any) {
      console.error('Error updating landmark in Firestore/Storage:', err)
      alert(`Failed to update landmark: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this landmark?')) {
      try {
        await deleteLandmark(id)
      } catch (err) {
        console.error('Error deleting landmark from Firestore:', err)
      }
      setLandmarks((prev) =>
        prev.filter((l) => l.id !== id).map((l, idx) => ({ ...l, slNo: idx + 1 }))
      )
    }
  }

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInlineFile(file)
      const url = URL.createObjectURL(file)
      setEditForm((prev) => ({ ...prev, photo: url }))
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

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    try {
      let finalPhoto = newImagePreview || ''
      if (selectedFile) {
        finalPhoto = await uploadImageToStorage(
          selectedFile,
          'landmarks',
          `landmark_${Date.now()}.jpg`
        )
      }

      const newItemData = {
        photo: finalPhoto,
        title: newTitle || 'Untitled Landmark',
        category: newCategory || 'Landmark',
        latitude: newLatitude || '25.6184',
        longitude: newLongitude || '94.1166',
      }

      await addLandmark(newItemData)

      setNewTitle('')
      setNewCategory('')
      setNewLatitude('')
      setNewLongitude('')
      setSelectedFile(null)
      setNewImagePreview(null)
      setIsAddingNew(false)
      alert('Landmark and photo uploaded successfully!')
    } catch (err: any) {
      console.error('Error adding landmark to Firestore/Storage:', err)
      alert(`Error uploading landmark: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Filtered landmarks
  const filteredLandmarks = useMemo(() => {
    return landmarks.filter((l) => {
      // Category filter
      if (selectedCategory !== 'All' && l.category !== selectedCategory) {
        return false
      }

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        l.title.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.longitude.toLowerCase().includes(q) ||
        l.latitude.toLowerCase().includes(q)
      )
    })
  }, [landmarks, searchQuery, selectedCategory])

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
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
        Landmarks
      </h1>

      {/* Top Action Button (only in list view) */}
      {!isAddingNew && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={() => setIsAddingNew(true)}
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
            Add Landmark
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
        {!isAddingNew ? (
          <div>
            {/* Search and Category Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Search Input */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by Title, Category, Longitude or Latitude"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px 8px 38px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#111827',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Category Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0b8462',
                  }}
                >
                  Category:
                </span>
                <div style={{ position: 'relative', width: '160px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen((v) => !v)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{selectedCategory}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: '#9ca3af',
                        transform: isCategoryOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>

                  {isCategoryOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        zIndex: 30,
                        overflow: 'hidden',
                      }}
                    >
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat
                        return (
                          <div
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat)
                              setIsCategoryOpen(false)
                            }}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              color: isSelected ? '#ffffff' : '#374151',
                              fontWeight: isSelected ? 600 : 400,
                              backgroundColor: isSelected ? '#16a37f' : '#ffffff',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff'
                            }}
                          >
                            {cat}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #d5e6de',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#e2f6ee', height: '44px' }}>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '60px',
                      }}
                    >
                      Sl No.
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '110px',
                      }}
                    >
                      Photo
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        minWidth: '180px',
                      }}
                    >
                      Title
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '140px',
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '140px',
                      }}
                    >
                      Longitude
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '140px',
                      }}
                    >
                      Latitude
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '90px',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLandmarks.map((item, index) => {
                    const isEditing = editingId === item.id
                    const currentPhoto = isEditing
                      ? editForm.photo !== undefined
                        ? editForm.photo
                        : item.photo
                      : item.photo

                    return (
                      <tr
                        key={item.id}
                        style={{
                          height: isEditing ? '100px' : '65px',
                          borderBottom: '1px solid #d5e6de',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {/* Sl No. */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 500,
                          }}
                        >
                          {index + 1}
                        </td>

                        {/* Photo */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                onClick={() => {
                                  if (inlineFileInputRef.current) {
                                    inlineFileInputRef.current.click()
                                  }
                                }}
                                style={{
                                  width: '78px',
                                  height: '46px',
                                  backgroundColor: '#f0fdf4',
                                  border: '1.5px dashed #a7f3d0',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                }}
                              >
                                {currentPhoto ? (
                                  <img
                                    src={currentPhoto}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      color: '#6b7280',
                                      textAlign: 'center',
                                      padding: '2px',
                                    }}
                                  >
                                    Click to add photo
                                  </span>
                                )}
                              </div>
                              <span
                                onClick={() => {
                                  if (inlineFileInputRef.current) {
                                    inlineFileInputRef.current.click()
                                  }
                                }}
                                style={{
                                  fontSize: '11px',
                                  color: '#0b8462',
                                  marginTop: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                Click to upload
                              </span>
                            </div>
                          ) : currentPhoto ? (
                            <img
                              src={currentPhoto}
                              alt={item.title}
                              onClick={() => setModalImage(currentPhoto)}
                              style={{
                                width: '65px',
                                height: '38px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb',
                                cursor: 'zoom-in',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                              title="Click to preview"
                            />
                          ) : (
                            <span style={{ color: '#4b5563', fontSize: '13px' }}>No image</span>
                          )}
                        </td>

                        {/* Title */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 500,
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.title ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.title
                          )}
                        </td>

                        {/* Category */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.category ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, category: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.category
                          )}
                        </td>

                        {/* Longitude */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.longitude ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, longitude: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.longitude
                          )}
                        </td>

                        {/* Latitude */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.latitude ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, latitude: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.latitude
                          )}
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                style={{
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
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
                                  padding: '6px 12px',
                                  fontSize: '12px',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Edit landmark"
                                style={{
                                  width: '28px',
                                  height: '28px',
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
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                title="Delete landmark"
                                style={{
                                  width: '28px',
                                  height: '28px',
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
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Hidden file input for inline edit */}
              <input
                ref={inlineFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleInlineFileChange}
              />
            </div>
          </div>
        ) : (
          /* Add New Landmark View (Screenshot 3) */
          <div>
            {/* Header */}
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
                Add New Landmark
              </h2>
              <button
                onClick={() => {
                  setIsAddingNew(false)
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
            <form onSubmit={handleSubmitNew}>
              {/* Row 1: Title & Category */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Enter category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
              </div>

              {/* Row 2: Latitude & Longitude */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Latitude
                  </label>
                  <input
                    type="text"
                    placeholder="Enter latitude"
                    value={newLatitude}
                    onChange={(e) => setNewLatitude(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Longitude
                  </label>
                  <input
                    type="text"
                    placeholder="Enter longitude"
                    value={newLongitude}
                    onChange={(e) => setNewLongitude(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
              </div>

              {/* Photo Field */}
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
                  Photo
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
                      alt="Landmark Preview"
                      style={{
                        width: '120px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Centered Submit Button */}
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
                  {isUploading ? 'Uploading Photo...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Preview for Photos */}
      {modalImage && (
        <ImageModal
          src={modalImage}
          title="Landmark Photo Preview"
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
