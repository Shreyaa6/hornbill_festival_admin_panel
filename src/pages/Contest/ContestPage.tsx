import { useState, useRef, useMemo, useEffect } from 'react'
import { Search, Pencil, Trash2, ChevronDown } from 'lucide-react'
import type { ContestItem } from '@/types'
import { initialContestData } from '@/data/contestData'
import { ImageModal } from '@/components/common/ImageModal'
import {
  subscribeContests,
  addContest,
  updateContest,
  deleteContest,
} from '@/services/firebase/contests'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function ContestPage() {
  const [contests, setContests] = useState<ContestItem[]>(initialContestData)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'date' | 'slNo'>('title-asc')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isAddingSlide, setIsAddingSlide] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeContests((liveContests) => {
      if (liveContests && liveContests.length > 0) {
        setContests(liveContests)
      }
    })
    return () => unsubscribe()
  }, [])

  // Expanded descriptions state
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})

  // Modal preview
  const [modalImage, setModalImage] = useState<string | null>(null)

  // Inline row edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ContestItem>>({})
  const [inlineFile, setInlineFile] = useState<File | null>(null)
  const inlineFileInputRef = useRef<HTMLInputElement>(null)

  // Add new slide form state
  const [newTitle, setNewTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleDesc = (id: string) => {
    setExpandedDescIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStartEdit = (item: ContestItem) => {
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
      let finalPoster = editForm.posterImage
      if (inlineFile) {
        // Upload to Firebase Storage
        finalPoster = await uploadImageToStorage(
          inlineFile,
          'posters',
          `poster_${Date.now()}.jpg`
        )
      }

      const updatedData = {
        ...editForm,
        ...(finalPoster ? { posterImage: finalPoster } : {}),
      }

      await updateContest(id, updatedData)

      setContests((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                posterImage: finalPoster || c.posterImage,
                title: editForm.title ?? c.title,
                description: editForm.description ?? c.description,
                location: editForm.location ?? c.location,
                date: editForm.date ?? c.date,
                time: editForm.time ?? c.time,
              }
            : c
        )
      )
      setEditingId(null)
      setEditForm({})
      setInlineFile(null)
    } catch (err: any) {
      console.error('Error updating contest in Firestore/Storage:', err)
      alert(`Failed to update contest: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contest item?')) {
      try {
        await deleteContest(id)
      } catch (err) {
        console.error('Error deleting contest from Firestore:', err)
      }
      setContests((prev) =>
        prev.filter((c) => c.id !== id).map((c, idx) => ({ ...c, slNo: idx + 1 }))
      )
    }
  }

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInlineFile(file)
      const url = URL.createObjectURL(file)
      setEditForm((prev) => ({ ...prev, posterImage: url }))
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
      alert('Please select a poster image file to upload.')
      return
    }

    setIsUploading(true)
    try {
      let finalPoster = newImagePreview || '/images/contests/contest_1.png'
      if (selectedFile) {
        // Upload poster directly to Firebase Storage
        finalPoster = await uploadImageToStorage(
          selectedFile,
          'posters',
          `poster_${Date.now()}.jpg`
        )
      }

      const newItemData = {
        type: 'Banner',
        posterImage: finalPoster,
        title: newTitle || 'Untitled Contest',
        description: newDescription || '',
        location: newLocation || '—',
        date: newDate || '—',
        time: newTime || '—',
      }

      await addContest(newItemData)

      setNewTitle('')
      setNewLocation('')
      setNewDate('')
      setNewTime('')
      setNewDescription('')
      setSelectedFile(null)
      setNewImagePreview(null)
      setIsAddingSlide(false)
      alert('Contest event and poster uploaded successfully!')
    } catch (err: any) {
      console.error('Error adding contest to Firestore/Storage:', err)
      alert(`Error uploading contest: ${err.message || 'Upload failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Filter and sort
  const filteredContests = useMemo(() => {
    let list = contests.filter((c) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.date.toLowerCase().includes(q) ||
        c.time.toLowerCase().includes(q)
      )
    })

    if (sortBy === 'title-asc') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'title-desc') {
      list = [...list].sort((a, b) => b.title.localeCompare(a.title))
    } else if (sortBy === 'slNo') {
      list = [...list].sort((a, b) => a.slNo - b.slNo)
    }

    return list
  }, [contests, searchQuery, sortBy])

  const sortLabelMap = {
    'title-asc': 'Sort by Title (A-Z)',
    'title-desc': 'Sort by Title (Z-A)',
    date: 'Sort by Date',
    slNo: 'Sort by Sl No.',
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
        Contest
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
          <div>
            {/* Search and Sort Filter Bar */}
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
                  placeholder="Search by Title, Description, Location, Date or Time"
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

              {/* Sort Dropdown */}
              <div style={{ position: 'relative', width: '200px' }}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen((v) => !v)}
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
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sortLabelMap[sortBy]}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: '#9ca3af',
                      transform: isSortOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                      marginLeft: '6px',
                    }}
                  />
                </button>

                {isSortOpen && (
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
                    {(['title-asc', 'title-desc', 'slNo'] as const).map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setSortBy(opt)
                          setIsSortOpen(false)
                        }}
                        style={{
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: sortBy === opt ? '#0b8462' : '#374151',
                          fontWeight: sortBy === opt ? 600 : 400,
                          backgroundColor: sortBy === opt ? '#e6f9f2' : '#ffffff',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== opt) e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          if (sortBy !== opt) e.currentTarget.style.backgroundColor = '#ffffff'
                        }}
                      >
                        {sortLabelMap[opt]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Compact Table (fits 100% with no horizontal scroll) */}
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
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '50px',
                      }}
                    >
                      Sl No.
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '65px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '88px',
                      }}
                    >
                      Poster Image
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '125px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Title
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        minWidth: '180px',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '115px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Location
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '125px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '115px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 6px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '78px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContests.map((item, index) => {
                    const isEditing = editingId === item.id
                    const currentImg = isEditing
                      ? editForm.posterImage || item.posterImage
                      : item.posterImage
                    const isExpanded = !!expandedDescIds[item.id]

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
                            padding: '10px 8px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 500,
                          }}
                        >
                          {index + 1}
                        </td>

                        {/* Type */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            lineHeight: 1.2,
                          }}
                        >
                          {item.type}
                        </td>

                        {/* Poster Image */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
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
                              alt={item.title}
                              onClick={() => {
                                if (!isEditing) setModalImage(item.posterImage)
                              }}
                              onDoubleClick={() => {
                                if (isEditing && inlineFileInputRef.current) {
                                  inlineFileInputRef.current.click()
                                }
                              }}
                              style={{
                                width: '68px',
                                height: '40px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb',
                                cursor: isEditing ? 'pointer' : 'zoom-in',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                              title={
                                isEditing ? 'Double-click to change image' : 'Click to preview'
                              }
                            />
                            {isEditing && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: '#0b8462',
                                  marginTop: '4px',
                                  lineHeight: 1.1,
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  if (inlineFileInputRef.current) {
                                    inlineFileInputRef.current.click()
                                  }
                                }}
                              >
                                Double-click to change
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Title */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '13px',
                            color: '#111827',
                            fontWeight: 500,
                            wordBreak: 'break-word',
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
                                padding: '5px 6px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.title
                          )}
                        </td>

                        {/* Description */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '12px',
                            color: '#374151',
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                          }}
                        >
                          {isEditing ? (
                            <textarea
                              value={editForm.description ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, description: e.target.value }))
                              }
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '5px 6px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '11px',
                                outline: 'none',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            <div>
                              <div>
                                {isExpanded
                                  ? item.description
                                  : item.description.length > 50
                                  ? `${item.description.slice(0, 48)}...`
                                  : item.description}
                              </div>
                              {item.description.length > 50 && (
                                <button
                                  type="button"
                                  onClick={() => toggleDesc(item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0b8462',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                    marginTop: '3px',
                                  }}
                                >
                                  {isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Location (Thinner) */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '12px',
                            color: '#111827',
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.location ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, location: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '5px 6px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.location
                          )}
                        </td>

                        {/* Date */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '12px',
                            color: '#111827',
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.date ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, date: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '5px 6px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.date
                          )}
                        </td>

                        {/* Time */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 8px',
                            fontSize: '12px',
                            color: '#111827',
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.time ?? ''}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, time: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '5px 6px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.time
                          )}
                        </td>

                        {/* Action */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 6px',
                            textAlign: 'center',
                          }}
                        >
                          {isEditing ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                alignItems: 'center',
                              }}
                            >
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                style={{
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  width: '100%',
                                  maxWidth: '54px',
                                  textAlign: 'center',
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
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  width: '100%',
                                  maxWidth: '54px',
                                  textAlign: 'center',
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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Edit slide"
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
                                title="Delete slide"
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
          /* Add New Slide Form View (Screenshot 4) */
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
                  Banner (auto)
                </div>
              </div>

              {/* Row 1: Title & Location */}
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
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
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

              {/* Row 2: Date & Time */}
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
                    Date (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
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
                    Time (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
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

              {/* Description Field */}
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
                  Description
                </label>
                <textarea
                  placeholder="Enter description"
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

              {/* Poster Image Field */}
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
                  Poster Image
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
                      alt="Poster Preview"
                      style={{
                        width: '100px',
                        height: '130px',
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
                  {isUploading ? 'Uploading Poster...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Preview for Poster Images */}
      {modalImage && (
        <ImageModal
          src={modalImage}
          title="Contest Poster Preview"
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
