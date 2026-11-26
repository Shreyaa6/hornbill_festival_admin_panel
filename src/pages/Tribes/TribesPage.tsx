import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Pencil, Trash2, Plus, Sparkles, Loader2, Upload } from 'lucide-react'
import type { TribeItem } from '@/types'
import { initialTribesData } from '@/data/tribesData'
import {
  subscribeTribes,
  addTribe,
  updateTribe,
  deleteTribe,
} from '@/services/firebase/tribes'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function TribesPage() {
  const [tribes, setTribes] = useState<TribeItem[]>(initialTribesData)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeTribes(
      (liveTribes) => {
        if (liveTribes && liveTribes.length > 0) {
          setTribes(liveTribes)
        } else {
          // If Firestore collection has no documents yet, show local initialTribesData
          setTribes(initialTribesData)
        }
      },
      (err) => {
        console.error('Error in subscribeTribes:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<TribeItem>>({})
  const [inlineFile, setInlineFile] = useState<File | null>(null)
  const [inlinePreview, setInlinePreview] = useState<string | null>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)

  // Add new tribe form state
  const [newTribeName, setNewTribeName] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)

  const getWordCount = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }

  const handleStartEdit = (item: TribeItem) => {
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
      let finalBanner = editForm.bannerPhoto || ''
      if (inlineFile) {
        finalBanner = await uploadImageToStorage(
          inlineFile,
          'tribes',
          `tribe_${(editForm.tribe || 'tribe').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      const updates: Partial<TribeItem> = {
        tribe: editForm.tribe,
        district: editForm.district ?? '',
        description: editForm.description ?? '',
        bannerPhoto: finalBanner,
      }

      await updateTribe(id, updates)
      setEditingId(null)
      setEditForm({})
      setInlineFile(null)
      setInlinePreview(null)
    } catch (err: any) {
      console.error('Error updating tribe in Firestore:', err)
      alert(`Failed to update tribe: ${err.message || 'Error occurred. Please check Firestore rules.'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tribe from Firestore?')) {
      return
    }
    try {
      await deleteTribe(id)
    } catch (err: any) {
      console.error('Error deleting tribe from Firestore:', err)
      alert(`Failed to delete tribe: ${err.message || 'Error occurred. Please check Firestore rules.'}`)
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
      let finalBanner = ''
      if (newPhotoFile) {
        finalBanner = await uploadImageToStorage(
          newPhotoFile,
          'tribes',
          `tribe_${newTribeName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      await addTribe({
        tribe: newTribeName.trim() || 'New Tribe',
        district: newDistrict.trim() || '',
        description: newDescription.trim() || '',
        bannerPhoto: finalBanner,
      })

      setNewTribeName('')
      setNewDistrict('')
      setNewDescription('')
      setNewPhotoFile(null)
      setNewPhotoPreview(null)
      setIsAddingNew(false)
    } catch (err: any) {
      console.error('Error adding tribe to Firestore:', err)
      alert(`Failed to add tribe: ${err.message || 'Error occurred. Please check Firestore rules.'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Quick helper to populate all traditional Naga tribes into Firestore
  const handleSeedAllTribes = async () => {
    if (
      !window.confirm(
        'Would you like to import and sync all traditional Naga tribes into Firestore? Tribes already present will be skipped.'
      )
    ) {
      return
    }
    setIsSeeding(true)
    try {
      const existingNames = new Set(tribes.map((t) => t.tribe.toLowerCase().trim()))
      let addedCount = 0
      for (const item of initialTribesData) {
        if (!existingNames.has(item.tribe.toLowerCase().trim())) {
          await addTribe({
            tribe: item.tribe,
            district: item.district || '',
            description: item.description,
            bannerPhoto: item.bannerPhoto || '',
            isPublished: true,
          })
          addedCount++
        }
      }
      alert(`Successfully synced ${addedCount} traditional Naga tribes to Firestore!`)
    } catch (err: any) {
      console.error('Error seeding tribes:', err)
      alert(`Error syncing tribes: ${err.message || 'Check Firestore rules.'}`)
    } finally {
      setIsSeeding(false)
    }
  }

  // Filtered tribes
  const filteredTribes = useMemo(() => {
    if (!searchQuery.trim()) return tribes
    const q = searchQuery.toLowerCase()
    return tribes.filter(
      (t) =>
        t.tribe.toLowerCase().includes(q) ||
        (t.district && t.district.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
    )
  }, [tribes, searchQuery])

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
        Tribes
      </h1>

      {/* Top Action Bar (only in list view) */}
      {!isAddingNew && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Quick Info & Seed Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#065f46',
                backgroundColor: '#f0fdf4',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #bbf7d0',
              }}
            >
              Total Tribes: {tribes.length}
            </span>
            {tribes.length < 17 && (
              <button
                type="button"
                onClick={handleSeedAllTribes}
                disabled={isSeeding}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0b8462',
                  border: '1px solid #0b8462',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: isSeeding ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                {isSeeding ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {isSeeding ? 'Syncing...' : 'Sync All 17 Naga Tribes to Firebase'}
              </button>
            )}
          </div>

          {/* Add Tribe Button */}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#096b4f')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
          >
            <Plus size={16} /> Add Tribe
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
                placeholder="Search by Tribe Name, District, or Description"
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
                        width: '140px',
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
                        width: '150px',
                      }}
                    >
                      Tribe
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
                      District
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
                        width: '90px',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTribes.map((item) => {
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
                          {item.slNo}
                        </td>

                        {/* Banner/Cover Photo */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {inlinePreview || item.bannerPhoto ? (
                                <img
                                  src={inlinePreview || item.bannerPhoto || ''}
                                  alt={item.tribe}
                                  style={{
                                    width: '90px',
                                    height: '52px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    border: '1px solid #e5e7eb',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '90px',
                                    height: '52px',
                                    backgroundColor: '#20a37f',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                  }}
                                >
                                  No Image
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => inlineFileInputRef.current?.click()}
                                style={{
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #0b8462',
                                  color: '#0b8462',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Upload size={11} /> Change
                              </button>
                              <input
                                ref={inlineFileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleInlineFileChange}
                              />
                            </div>
                          ) : item.bannerPhoto ? (
                            <img
                              src={item.bannerPhoto}
                              alt={item.tribe}
                              style={{
                                width: '90px',
                                height: '52px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '90px',
                                height: '52px',
                                backgroundColor: '#20a37f',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '4px',
                                lineHeight: 1.2,
                                boxSizing: 'border-box',
                              }}
                            >
                              {item.tribe} Tribe
                            </div>
                          )}
                        </td>

                        {/* Tribe */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 600,
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.tribe ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, tribe: e.target.value }))
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
                            item.tribe
                          )}
                        </td>

                        {/* District */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                            fontSize: '12.5px',
                            color: '#4b5563',
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.district ?? ''}
                              placeholder="e.g. Kohima"
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, district: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.district || '—'
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
                                  opacity: isUploading ? 0.7 : 1,
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseOver={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#15803d')
                                }
                                onMouseOut={(e) =>
                                  (e.currentTarget.style.backgroundColor = '#16a34a')
                                }
                              >
                                {isUploading ? 'Saving...' : 'Save'}
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
                                title="Edit tribe"
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
                                title="Delete tribe"
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
            </div>
          </div>
        ) : (
          /* Add New Tribe View */
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
                Add New Tribe
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
              {/* Row 1: Tribe Name & District */}
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
                    Tribe Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tribe name (e.g., Angami, Ao)"
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
                    District / Region (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter district (e.g., Kohima, Mokokchung)"
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
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
                  placeholder="Enter description (e.g. history, festivals, cultural significance)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={5}
                  required
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

              {/* Banner/Cover Photo Field */}
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
                  Photo:
                </label>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
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
                    <div style={{ marginTop: '6px' }}>
                      <img
                        src={newPhotoPreview}
                        alt="Preview"
                        style={{
                          width: '160px',
                          height: '92px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #bbf7d0',
                        }}
                      />
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
                    opacity: isUploading ? 0.7 : 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#16a37f')}
                >
                  {isUploading && <Loader2 size={16} className="animate-spin" />}
                  {isUploading ? 'Uploading & Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
