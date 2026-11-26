import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Pencil, Trash2, Plus, Loader2, Upload, X } from 'lucide-react'
import type { TribalFestivalItem } from '@/types'
import { initialTribalFestivalsData } from '@/data/tribalFestivalsData'
import {
  subscribeTribalFestivals,
  addTribalFestival,
  updateTribalFestival,
  deleteTribalFestival,
} from '@/services/firebase/tribalFestivals'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function TribalFestivalPage() {
  const [festivals, setFestivals] = useState<TribalFestivalItem[]>(initialTribalFestivalsData)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Real-time Firestore sync with 'festivals' collection
  useEffect(() => {
    const unsubscribe = subscribeTribalFestivals(
      (liveFestivals) => {
        if (liveFestivals && liveFestivals.length > 0) {
          setFestivals(liveFestivals)
        } else {
          setFestivals(initialTribalFestivalsData)
        }
      },
      (err) => {
        console.error('Error in subscribeTribalFestivals:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TribalFestivalItem>>({})
  const [inlineFile, setInlineFile] = useState<File | null>(null)
  const [inlinePreview, setInlinePreview] = useState<string | null>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)

  // Add new festival form state
  const [newTribeName, setNewTribeName] = useState('')
  const [newFestivalName, setNewFestivalName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)

  const getWordCount = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }

  const handleStartEdit = (item: TribalFestivalItem) => {
    setEditingId(item.id)
    setEditForm({ ...item })
    setInlineFile(null)
    setInlinePreview(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setInlineFile(null)
    setInlinePreview(null)
  }

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInlineFile(file)
      const url = URL.createObjectURL(file)
      setInlinePreview(url)
    }
  }

  const handleSaveEdit = async (id: string) => {
    setIsUploading(true)
    try {
      let finalImage = editForm.image || editForm.bannerPhoto || ''
      if (inlineFile) {
        finalImage = await uploadImageToStorage(
          inlineFile,
          'festivals',
          `festival_${(editForm.festivalName || 'fest').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      const updates: Partial<TribalFestivalItem> = {
        festivalName: editForm.festivalName,
        tribeName: editForm.tribeName || editForm.tribe,
        tribe: editForm.tribeName || editForm.tribe,
        description: editForm.description ?? '',
        image: finalImage,
        bannerPhoto: finalImage,
      }

      await updateTribalFestival(id, updates)
      setEditingId(null)
      setEditForm({})
      setInlineFile(null)
      setInlinePreview(null)
    } catch (err: any) {
      console.error('Error updating festival in Firestore:', err)
      alert(`Failed to update festival: ${err.message || 'Error occurred.'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this festival from Firestore?')) {
      return
    }
    try {
      await deleteTribalFestival(id)
    } catch (err: any) {
      console.error('Error deleting festival from Firestore:', err)
      alert(`Failed to delete festival: ${err.message || 'Error occurred.'}`)
    }
  }

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPhotoFile(file)
      const url = URL.createObjectURL(file)
      setNewPhotoPreview(url)
    }
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    try {
      let finalImage = ''
      if (newPhotoFile) {
        finalImage = await uploadImageToStorage(
          newPhotoFile,
          'festivals',
          `festival_${newFestivalName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      await addTribalFestival({
        festivalName: newFestivalName.trim() || 'New Festival',
        tribeName: newTribeName.trim() || 'New Tribe',
        description: newDescription.trim() || '',
        image: finalImage,
      })

      setNewTribeName('')
      setNewFestivalName('')
      setNewDescription('')
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      setIsAddingNew(false)
    } catch (err: any) {
      console.error('Error adding festival to Firestore:', err)
      alert(`Failed to add festival: ${err.message || 'Error occurred.'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Filtered festivals
  const filteredFestivals = useMemo(() => {
    if (!searchQuery.trim()) return festivals
    const q = searchQuery.toLowerCase()
    return festivals.filter(
      (f) =>
        f.festivalName.toLowerCase().includes(q) ||
        (f.tribeName && f.tribeName.toLowerCase().includes(q)) ||
        (f.tribe && f.tribe.toLowerCase().includes(q)) ||
        f.description.toLowerCase().includes(q)
    )
  }, [festivals, searchQuery])

  // Helper to render festival image
  const renderImageCell = (item: TribalFestivalItem, isEditing: boolean) => {
    const photoUrl = isEditing && inlinePreview ? inlinePreview : item.image || item.bannerPhoto
    const isRealUrl =
      photoUrl &&
      (photoUrl.startsWith('http://') ||
        photoUrl.startsWith('https://') ||
        photoUrl.startsWith('blob:') ||
        photoUrl.startsWith('data:'))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {isRealUrl ? (
          <img
            src={photoUrl}
            alt={item.festivalName}
            style={{
              width: '75px',
              height: '46px',
              borderRadius: '4px',
              objectFit: 'cover',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-tile')
              if (fallback) (fallback as HTMLElement).style.display = 'flex'
            }}
          />
        ) : item.festivalName ? (
          <div
            className="fallback-tile"
            style={{
              width: '75px',
              height: '46px',
              backgroundColor: '#20a37f',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 600,
              padding: '4px',
              lineHeight: 1.2,
              boxSizing: 'border-box',
            }}
          >
            {item.festivalName}
          </div>
        ) : (
          <div
            style={{
              width: '75px',
              height: '46px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '11px',
              fontWeight: 500,
              boxSizing: 'border-box',
            }}
          >
            No Image
          </div>
        )}

        {/* Change Photo button during inline edit */}
        {isEditing && (
          <div>
            <input
              type="file"
              ref={inlineFileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleInlineFileChange}
            />
            <button
              type="button"
              onClick={() => inlineFileInputRef.current?.click()}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <Upload size={10} /> Change
            </button>
          </div>
        )}
      </div>
    )
  }

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
        Tribal Festival
      </h1>

      {/* Top Action Button */}
      {!isAddingNew && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px',
          }}
        >
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#096b4f')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
          >
            <Plus size={16} /> Add Festival
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
            {/* Search Input Bar (Full Width) */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
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
                placeholder="Search by Festival Name or Tribe Name"
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
                        width: '130px',
                      }}
                    >
                      Image
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '160px',
                      }}
                    >
                      Festival Name
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '130px',
                      }}
                    >
                      Tribe Name
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        minWidth: '380px',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '95px',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFestivals.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '36px',
                          color: '#6b7280',
                          fontSize: '14px',
                        }}
                      >
                        No festivals found. Click &quot;Add Festival&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredFestivals.map((item, idx) => {
                      const isEditing = editingId === item.id

                      return (
                        <tr
                          key={item.id}
                          style={{
                            height: isEditing ? '110px' : '75px',
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
                            {item.serialno ?? item.slNo ?? idx + 1}
                          </td>

                          {/* Image */}
                          <td
                            style={{
                              border: '1px solid #d5e6de',
                              padding: '10px 14px',
                            }}
                          >
                            {renderImageCell(item, isEditing)}
                          </td>

                          {/* Festival Name */}
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
                                value={editForm.festivalName ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    festivalName: e.target.value,
                                  }))
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
                              item.festivalName
                            )}
                          </td>

                          {/* Tribe Name */}
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
                                value={editForm.tribeName ?? editForm.tribe ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    tribeName: e.target.value,
                                    tribe: e.target.value,
                                  }))
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
                              item.tribeName || item.tribe
                            )}
                          </td>

                          {/* Description */}
                          <td
                            style={{
                              border: '1px solid #d5e6de',
                              padding: '10px 14px',
                              fontSize: '12px',
                              color: '#374151',
                              lineHeight: 1.45,
                            }}
                          >
                            {isEditing ? (
                              <textarea
                                value={editForm.description ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                rows={3}
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  border: '1px solid #93c5fd',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  outline: 'none',
                                  resize: 'vertical',
                                  boxSizing: 'border-box',
                                }}
                              />
                            ) : (
                              item.description
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
                                  disabled={isUploading}
                                  style={{
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#15803d')
                                  }
                                  onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor = '#16a34a')
                                  }
                                >
                                  {isUploading ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" /> Saving...
                                    </>
                                  ) : (
                                    'Save'
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isUploading}
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
                                  title="Edit festival"
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
                                  title="Delete festival"
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Add New Festival View */
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
                Add New Festival
              </h2>
              <button
                onClick={() => {
                  setIsAddingNew(false)
                  setNewPhotoFile(null)
                  setNewPhotoPreview(null)
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
              {/* 2-Column Row: Tribe & Festival */}
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
                      fontWeight: 700,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Tribe Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tribe name (e.g. Angami)"
                    value={newTribeName}
                    onChange={(e) => setNewTribeName(e.target.value)}
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
                      fontWeight: 700,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    Festival Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter festival name (e.g. Sekrenyi Festival)"
                    value={newFestivalName}
                    onChange={(e) => setNewFestivalName(e.target.value)}
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

              {/* Description Field with Word Count */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#0b8462' }}>Description: </span>
                  <span style={{ color: '#4b5563', fontSize: '13px' }}>
                    ({getWordCount(newDescription)}/200 words)
                  </span>
                </label>
                <textarea
                  placeholder="Enter festival description (max 200 words)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#111827',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Image Field */}
              <div style={{ marginBottom: '28px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0b8462',
                    marginBottom: '8px',
                  }}
                >
                  Image:
                </label>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxSizing: 'border-box',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewFileChange}
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  />
                  {newPhotoPreview && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={newPhotoPreview}
                        alt="Preview"
                        style={{
                          width: '80px',
                          height: '50px',
                          borderRadius: '4px',
                          objectFit: 'cover',
                          border: '1px solid #d1d5db',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewPhotoFile(null)
                          setNewPhotoPreview(null)
                        }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    backgroundColor: '#16a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 48px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background-color 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#16a37f')}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading & Saving...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
