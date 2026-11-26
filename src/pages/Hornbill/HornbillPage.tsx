import { useState, useMemo, useEffect } from 'react'
import Select from 'react-select'
import {
  Search,
  Pencil,
  Trash2,
  Clock,
  FileText,
  X,
  Plus,
  ExternalLink,
  BookOpen,
  CheckCircle,
} from 'lucide-react'
import type { HornbillDayItem, TimelineEntry } from '@/types'
import { initialHornbillData, iconOptions, getIconUrl, findIconOption, type IconOption } from '@/data/hornbillData'
import {
  subscribeHornbill,
  updateHornbillDays,
  subscribeMagazine,
  updateMagazine,
  DEFAULT_TIMELINE_ICON,
} from '@/services/firebase/hornbill'
import { uploadImageToStorage } from '@/services/firebase/storage'

export function HornbillPage() {
  const [data, setData] = useState<HornbillDayItem[]>(initialHornbillData)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Magazine state
  const [magazineUrl, setMagazineUrl] = useState('')
  const [isMagazineModalOpen, setIsMagazineModalOpen] = useState(false)
  const [tempMagazineUrl, setTempMagazineUrl] = useState('')
  const [magazineFile, setMagazineFile] = useState<File | null>(null)

  // Real-time Firestore sync for hornbill/latest
  useEffect(() => {
    const unsubscribeHornbill = subscribeHornbill(
      (liveDays) => {
        if (liveDays && liveDays.length > 0) {
          setData(liveDays)
        }
      },
      (err) => {
        console.error('Error in subscribeHornbill:', err)
      }
    )
    const unsubscribeMag = subscribeMagazine(
      (url) => {
        setMagazineUrl(url)
      },
      (err) => {
        console.error('Error in subscribeMagazine:', err)
      }
    )
    return () => {
      unsubscribeHornbill()
      unsubscribeMag()
    }
  }, [])

  // Inline row edit state
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editRowForm, setEditRowForm] = useState<Partial<HornbillDayItem>>({})
  const [inlinePdfFile, setInlinePdfFile] = useState<File | null>(null)

  // View Timeline Modal state
  const [viewingTimelineDay, setViewingTimelineDay] = useState<HornbillDayItem | null>(null)

  // Edit Timeline Modal state
  const [editingTimelineDay, setEditingTimelineDay] = useState<HornbillDayItem | null>(null)
  const [tempTimelineList, setTempTimelineList] = useState<TimelineEntry[]>([])

  // PDF Viewer Modal state
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null)

  // Add New Day form state
  const [newDay, setNewDay] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newPdfUrl, setNewPdfUrl] = useState('')
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null)
  const [newTimeline, setNewTimeline] = useState<TimelineEntry[]>([
    {
      id: 'entry-1',
      icon: '',
      time: '',
      title: '',
      description: '',
    },
  ])

  // Custom react-select styles matching hornbill-admin Netlify website
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? 'var(--hornbill-primary-color)' : 'var(--hornbill-border-color)',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '42px',
      backgroundColor: '#ffffff',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(36, 178, 149, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--hornbill-primary-color)',
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      color: state.isSelected ? 'white' : '#333333',
      cursor: 'pointer',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--hornbill-border-color)',
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '4px',
      maxHeight: '260px',
    }),
  }

  // Format option label matching the original website
  const formatOptionLabel = ({ label, iconUrl }: IconOption) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
      {iconUrl && (
        <img
          src={iconUrl}
          alt={label || ''}
          style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0, pointerEvents: 'none' }}
          onError={(e) => {
            ;(e.target as HTMLElement).style.display = 'none'
          }}
        />
      )}
      <span style={{ pointerEvents: 'none' }}>{label}</span>
    </div>
  )

  // --- Inline Row Edit Handlers ---
  const handleStartRowEdit = (item: HornbillDayItem) => {
    setEditingRowId(item.id)
    setEditRowForm({ ...item })
    setInlinePdfFile(null)
  }

  const handleCancelRowEdit = () => {
    setEditingRowId(null)
    setEditRowForm({})
    setInlinePdfFile(null)
  }

  const handleSaveRowEdit = async (id: string) => {
    setIsSaving(true)
    try {
      let finalPdf = editRowForm.pdfUrl ?? ''
      if (inlinePdfFile) {
        finalPdf = await uploadImageToStorage(
          inlinePdfFile,
          'PDFs',
          `Day_${(editRowForm.day || '').replace(/\D/g, '') || Date.now()}_${Date.now()}.pdf`
        )
      }

      const updated = data.map((item) =>
        item.id === id
          ? {
              ...item,
              day: editRowForm.day ? (editRowForm.day.startsWith('Day') ? editRowForm.day.trim() : `Day ${editRowForm.day.trim()}`) : item.day,
              date: editRowForm.date !== undefined ? editRowForm.date.trim() : item.date,
              title: editRowForm.title !== undefined ? editRowForm.title.trim() : item.title,
              pdfUrl: finalPdf || item.pdfUrl,
            }
          : item
      )
      setData(updated)
      await updateHornbillDays(updated)
      setEditingRowId(null)
      setEditRowForm({})
      setInlinePdfFile(null)
      showToast('Day details updated and saved to Firestore!')
    } catch (err: any) {
      console.error('Error saving row edit to Firestore:', err)
      alert(`Failed to save changes: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRow = async (id: string) => {
    const targetItem = data.find((item) => item.id === id)
    if (!window.confirm(`Are you sure you want to delete ${targetItem?.day || 'this day'} from the schedule?`)) {
      return
    }
    const updated = data
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, slNo: idx + 1 }))
    setData(updated)
    try {
      await updateHornbillDays(updated)
      showToast(`Deleted ${targetItem?.day || 'day'} from schedule!`)
    } catch (err: any) {
      console.error('Error deleting day from Firestore:', err)
      alert(`Failed to delete day from Firestore: ${err.message || 'Error occurred'}`)
    }
  }

  // --- Edit Timeline Modal Handlers ---
  const handleOpenEditTimeline = (dayItem: HornbillDayItem) => {
    setEditingTimelineDay(dayItem)
    setTempTimelineList(JSON.parse(JSON.stringify(dayItem.timeline || [])))
  }

  const handleCloseEditTimeline = () => {
    setEditingTimelineDay(null)
    setTempTimelineList([])
  }

  const handleAddTimelineEntry = () => {
    const newEntry: TimelineEntry = {
      id: `entry-${Date.now()}`,
      icon: DEFAULT_TIMELINE_ICON,
      time: '',
      title: '',
      description: '',
    }
    setTempTimelineList((prev) => [...prev, newEntry])
  }

  const handleRemoveTimelineEntry = (index: number) => {
    setTempTimelineList((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateTimelineField = (
    index: number,
    field: keyof TimelineEntry,
    value: string
  ) => {
    setTempTimelineList((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    )
  }

  const handleSaveTimelineModal = async () => {
    if (!editingTimelineDay) return
    setIsSaving(true)
    try {
      // Clean up entries: keep entries with title or time, ensure valid icon
      const cleanList = tempTimelineList
        .filter((entry) => (entry.title && entry.title.trim()) || (entry.time && entry.time.trim()))
        .map((entry, idx) => ({
          ...entry,
          id: entry.id || `entry-${idx + 1}`,
          icon: entry.icon && entry.icon.trim() ? entry.icon.trim() : DEFAULT_TIMELINE_ICON,
          time: (entry.time || '').trim(),
          title: (entry.title || '').trim(),
          description: (entry.description || '').trim(),
        }))

      const updated = data.map((item) =>
        item.id === editingTimelineDay.id ? { ...item, timeline: cleanList } : item
      )
      setData(updated)
      await updateHornbillDays(updated)
      handleCloseEditTimeline()
      showToast(`Timeline for ${editingTimelineDay.day} updated and saved to Firestore!`)
    } catch (err: any) {
      console.error('Error syncing timeline to Firestore:', err)
      alert(`Failed to save timeline to Firestore: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // --- Add New Form Handlers ---
  const handleAddNewTimelineRow = () => {
    const newEntry: TimelineEntry = {
      id: `entry-${Date.now()}`,
      icon: DEFAULT_TIMELINE_ICON,
      time: '',
      title: '',
      description: '',
    }
    setNewTimeline((prev) => [...prev, newEntry])
  }

  const handleRemoveNewTimelineRow = (index: number) => {
    if (newTimeline.length === 1) return
    setNewTimeline((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateNewTimelineRow = (
    index: number,
    field: keyof TimelineEntry,
    value: string
  ) => {
    setNewTimeline((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    )
  }

  const handleSubmitNewDay = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      let finalPdf = newPdfUrl.trim()
      if (newPdfFile) {
        finalPdf = await uploadImageToStorage(
          newPdfFile,
          'PDFs',
          `Day_${newDay.replace(/\D/g, '') || Date.now()}_${Date.now()}.pdf`
        )
      }

      const rawDayNum = newDay.replace(/^Day\s*/i, '').trim()
      const formattedDay = `Day ${rawDayNum || newDay.trim()}`

      const cleanTimeline = newTimeline
        .filter((t) => (t.title && t.title.trim() !== '') || (t.time && t.time.trim() !== ''))
        .map((t, idx) => ({
          ...t,
          id: t.id || `entry-${Date.now()}-${idx + 1}`,
          icon: t.icon && t.icon.trim() ? t.icon.trim() : DEFAULT_TIMELINE_ICON,
          time: (t.time || '').trim(),
          title: (t.title || '').trim(),
          description: (t.description || '').trim(),
        }))

      const newItem: HornbillDayItem = {
        id: `day-${Date.now()}`,
        slNo: data.length + 1,
        day: formattedDay,
        date: newDate.trim(),
        title: newTitle.trim(),
        pdfUrl: finalPdf || 'https://nititechnologies.in/files/Day_1.pdf',
        timeline: cleanTimeline,
      }

      const updated = [...data, newItem]
      setData(updated)
      await updateHornbillDays(updated)

      setNewDay('')
      setNewDate('')
      setNewTitle('')
      setNewPdfUrl('')
      setNewPdfFile(null)
      setNewTimeline([
        {
          id: 'entry-1',
          icon: DEFAULT_TIMELINE_ICON,
          time: '',
          title: '',
          description: '',
        },
      ])
      setIsAddingNew(false)
      showToast(`Added ${formattedDay} (${newTitle.trim()}) to Hornbill schedule!`)
    } catch (err: any) {
      console.error('Error saving new day to Firestore:', err)
      alert(`Failed to add new day: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // --- Magazine Handlers ---
  const handleSaveMagazine = async () => {
    setIsSaving(true)
    try {
      let finalUrl = tempMagazineUrl.trim()
      if (magazineFile) {
        finalUrl = await uploadImageToStorage(
          magazineFile,
          'PDFs',
          `magazine_${Date.now()}.pdf`
        )
      }
      await updateMagazine(finalUrl)
      setMagazineUrl(finalUrl)
      setIsMagazineModalOpen(false)
      setMagazineFile(null)
      showToast('Official Festival Magazine PDF updated successfully!')
    } catch (err: any) {
      console.error('Error saving magazine to Firestore:', err)
      alert(`Failed to save magazine: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Filter logic
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase()
    return data.filter(
      (item) =>
        item.day.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.timeline.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.time.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
        )
    )
  }, [data, searchQuery])

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
        Hornbill
      </h1>

      {/* Official Festival Magazine Eye-Catching Banner */}
      {!isAddingNew && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #0b8462 55%, #10b981 100%)',
              borderRadius: '12px',
              padding: '14px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(11, 132, 98, 0.16)',
              gap: '16px',
              flexWrap: 'wrap',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Left Info: Icon Badge + Title + Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                }}
              >
                <BookOpen size={22} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Official Festival Magazine
                  </h3>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    2026 Edition
                  </span>
                </div>
                <p
                  style={{
                    margin: '3px 0 0 0',
                    fontSize: '12.5px',
                    color: 'rgba(255, 255, 255, 0.88)',
                    lineHeight: 1.3,
                  }}
                >
                  Official festival schedule, events & visitor guide publication
                </p>
              </div>
            </div>

            {/* Right Actions: View Magazine & Edit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {magazineUrl ? (
                <button
                  type="button"
                  onClick={() => setViewingPdfUrl(magazineUrl)}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#065f46',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <FileText size={15} /> View Magazine
                </button>
              ) : (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                  }}
                >
                  No PDF set
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setTempMagazineUrl(magazineUrl)
                  setIsMagazineModalOpen(true)
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.28)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Row: Add Data Button */}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#096b4f')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
          >
            <Plus size={16} /> Add Data
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
            {/* Search Input Bar */}
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
                placeholder="Search by Title, Timeline, Day or Date"
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
                        width: '55px',
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
                        width: '95px',
                      }}
                    >
                      Day
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
                      Date
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '170px',
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
                        width: '190px',
                      }}
                    >
                      Timeline
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
                      PDF
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
                  {filteredData.map((item) => {
                    const isEditing = editingRowId === item.id

                    return (
                      <tr
                        key={item.id}
                        style={{
                          height: '68px',
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

                        {/* Day */}
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
                              value={editRowForm.day ?? ''}
                              onChange={(e) =>
                                setEditRowForm((prev) => ({ ...prev, day: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.day
                          )}
                        </td>

                        {/* Date */}
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
                              value={editRowForm.date ?? ''}
                              onChange={(e) =>
                                setEditRowForm((prev) => ({ ...prev, date: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          ) : (
                            item.date
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
                              value={editRowForm.title ?? ''}
                              onChange={(e) =>
                                setEditRowForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
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

                        {/* Timeline Column */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              Edit timeline via form
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => setViewingTimelineDay(item)}
                                style={{
                                  backgroundColor: '#14b8a6',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
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
                                <Clock size={13} />
                                View ({item.timeline.length})
                              </button>
                              <button
                                onClick={() => handleOpenEditTimeline(item)}
                                style={{
                                  backgroundColor: '#4b5563',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
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
                                <Pencil size={12} />
                                Edit
                              </button>
                            </div>
                          )}
                        </td>

                        {/* PDF Column */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                type="text"
                                value={editRowForm.pdfUrl ?? ''}
                                onChange={(e) =>
                                  setEditRowForm((prev) => ({ ...prev, pdfUrl: e.target.value }))
                                }
                                placeholder="PDF URL"
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  border: '1px solid #93c5fd',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                }}
                              />
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: '#0b8462',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Plus size={12} /> Upload PDF
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setInlinePdfFile(file)
                                      setEditRowForm((prev) => ({ ...prev, pdfUrl: file.name }))
                                    }
                                  }}
                                />
                              </label>
                              {inlinePdfFile && (
                                <span style={{ fontSize: '10.5px', color: '#16a34a', wordBreak: 'break-all' }}>
                                  Selected: {inlinePdfFile.name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setViewingPdfUrl(
                                  item.pdfUrl ||
                                    'https://nititechnologies.in/files/hornbill_schedule.pdf'
                                )
                              }
                              style={{
                                backgroundColor: '#14b8a6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
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
                              <FileText size={13} />
                              View PDF
                            </button>
                          )}
                        </td>

                        {/* Action Column */}
                        <td
                          style={{
                            border: '1px solid #d5e6de',
                            padding: '10px 14px',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleSaveRowEdit(item.id)}
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
                                onClick={handleCancelRowEdit}
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
                                onClick={() => handleStartRowEdit(item)}
                                title="Edit row"
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
                                onClick={() => handleDeleteRow(item.id)}
                                title="Delete row"
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
          /* Add New Hornbill Data View (Screenshot 10 & 11) */
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
                Add New Hornbill Data
              </h2>
              <button
                onClick={() => setIsAddingNew(false)}
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
            <form onSubmit={handleSubmitNewDay}>
              {/* Row 1: Day & Date */}
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
                    Day *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter day number"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
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
                    Date *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
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

              {/* Title Field */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0b8462',
                    marginBottom: '8px',
                  }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter title for this day"
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

              {/* PDF URL Field */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0b8462',
                    marginBottom: '8px',
                  }}
                >
                  PDF URL or Upload PDF (Optional)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter PDF URL (or select a file to upload)"
                    value={newPdfUrl}
                    onChange={(e) => setNewPdfUrl(e.target.value)}
                    style={{
                      flex: 1,
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
                  <label
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #0b8462',
                      color: '#0b8462',
                      borderRadius: '6px',
                      padding: '9px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Plus size={14} /> Upload PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewPdfFile(file)
                          setNewPdfUrl(file.name)
                        }
                      }}
                    />
                  </label>
                </div>
                {newPdfFile && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#16a34a' }}>
                    Selected file to upload: <strong>{newPdfFile.name}</strong>
                  </div>
                )}
              </div>

              {/* Timeline Section Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <label
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0b8462',
                  }}
                >
                  Timeline *
                </label>
                <button
                  type="button"
                  onClick={handleAddNewTimelineRow}
                  style={{
                    backgroundColor: '#14b8a6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#14b8a6')}
                >
                  <Plus size={14} />
                  Add Timeline Entry
                </button>
              </div>

              {/* Timeline Entries List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {newTimeline.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1fae5',
                      borderRadius: '8px',
                      padding: '18px',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0b8462' }}>
                        Timeline Entry {idx + 1}
                      </span>
                      {newTimeline.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveNewTimelineRow(idx)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '14px',
                      }}
                    >
                      {/* Icon selector with React-Select matching the website */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0b8462',
                            marginBottom: '6px',
                          }}
                        >
                          Icon *
                        </label>
                        <Select<IconOption>
                          value={findIconOption(entry.icon) || null}
                          onChange={(selected) =>
                            handleUpdateNewTimelineRow(idx, 'icon', selected?.value || '')
                          }
                          options={iconOptions}
                          formatOptionLabel={formatOptionLabel}
                          styles={selectStyles}
                          isSearchable={true}
                          placeholder="Select an icon"
                          classNamePrefix="hornbill-icon-select"
                        />
                        {/* Preview box matching Screenshots 4 & 8 */}
                        {entry.icon && (
                          <div className="hornbill-selected-icon-preview">
                            <img
                              src={getIconUrl(entry.icon)}
                              alt="Selected icon"
                              onError={(e) => {
                                ;(e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Time input */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0b8462',
                            marginBottom: '6px',
                          }}
                        >
                          Time
                        </label>
                        <input
                          type="text"
                          placeholder="Enter time (e.g., 10:00 AM - 12:00 PM)"
                          value={entry.time}
                          onChange={(e) =>
                            handleUpdateNewTimelineRow(idx, 'time', e.target.value)
                          }
                          style={{
                            width: '100%',
                            height: '42px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            color: '#111827',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                      }}
                    >
                      {/* Title input */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0b8462',
                            marginBottom: '6px',
                          }}
                        >
                          Title
                        </label>
                        <input
                          type="text"
                          placeholder="Enter title"
                          value={entry.title}
                          onChange={(e) =>
                            handleUpdateNewTimelineRow(idx, 'title', e.target.value)
                          }
                          style={{
                            width: '100%',
                            height: '42px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            color: '#111827',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Description optional */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#0b8462',
                            marginBottom: '6px',
                          }}
                        >
                          Description (Optional)
                        </label>
                        <textarea
                          placeholder="Enter description (optional)"
                          value={entry.description || ''}
                          onChange={(e) =>
                            handleUpdateNewTimelineRow(idx, 'description', e.target.value)
                          }
                          rows={2}
                          style={{
                            width: '100%',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#111827',
                            outline: 'none',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: isSaving ? '#6ee7b7' : '#16a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 48px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background-color 0.15s ease',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#0b8462'
                  }}
                  onMouseOut={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#16a37f'
                  }}
                >
                  {isSaving ? 'Saving to Firestore...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- Modal 1: View Timeline Modal (Screenshot 2 & 3) --- */}
      {viewingTimelineDay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => setViewingTimelineDay(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
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
                Timeline - {viewingTimelineDay.day}
              </h2>
              <button
                onClick={() => setViewingTimelineDay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Metadata */}
            <div
              style={{
                padding: '16px 24px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '13.5px',
                color: '#374151',
                lineHeight: 1.6,
              }}
            >
              <div>
                <strong>Date:</strong> {viewingTimelineDay.date}
              </div>
              <div>
                <strong>Title:</strong> {viewingTimelineDay.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong>PDF:</strong>
                <button
                  onClick={() =>
                    setViewingPdfUrl(
                      viewingTimelineDay.pdfUrl ||
                        'https://nititechnologies.in/files/hornbill_schedule.pdf'
                    )
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0b8462',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '13.5px',
                  }}
                >
                  View PDF
                </button>
              </div>
            </div>

            {/* Modal Timeline Items List */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {viewingTimelineDay.timeline.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Icon */}
                  <img
                    src={getIconUrl(entry.icon)}
                    alt={entry.icon}
                    style={{
                      width: '46px',
                      height: '46px',
                      objectFit: 'contain',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#0b8462',
                        fontSize: '13px',
                        fontWeight: 700,
                        marginBottom: '3px',
                      }}
                    >
                      {entry.time}
                    </div>
                    <div
                      style={{
                        color: '#111827',
                        fontSize: '15px',
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    >
                      {entry.title}
                    </div>
                    {entry.description && (
                      <div
                        style={{
                          color: '#6b7280',
                          fontSize: '12.5px',
                          marginTop: '4px',
                          lineHeight: 1.4,
                        }}
                      >
                        {entry.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal 2: Edit Timeline Modal (Screenshot 4, 5, 6, 7 & 8) --- */}
      {editingTimelineDay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={handleCloseEditTimeline}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
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
                Edit Timeline - {editingTimelineDay.day}
              </h2>
              <button
                onClick={handleCloseEditTimeline}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Entries Body */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {tempTimelineList.map((entry, index) => (
                <div
                  key={entry.id || index}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '20px',
                    position: 'relative',
                  }}
                >
                  {/* Entry Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#0b8462' }}>
                      Timeline Entry {index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveTimelineEntry(index)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Delete entry"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Grid 1: Icon & Time */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Icon column with React-Select matching Screenshot 4, 5, 6, 7 & 8 */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0b8462',
                          marginBottom: '6px',
                        }}
                      >
                        Icon *
                      </label>
                      <Select<IconOption>
                        value={findIconOption(entry.icon) || null}
                        onChange={(selected) =>
                          handleUpdateTimelineField(index, 'icon', selected?.value || '')
                        }
                        options={iconOptions}
                        formatOptionLabel={formatOptionLabel}
                        styles={selectStyles}
                        isSearchable={true}
                        placeholder="Select an icon"
                        classNamePrefix="hornbill-icon-select"
                      />

                      {/* Icon preview box (matches Screenshot 4 & 8) */}
                      {entry.icon && (
                        <div className="hornbill-selected-icon-preview">
                          <img
                            src={getIconUrl(entry.icon)}
                            alt="Selected icon"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Time column */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0b8462',
                          marginBottom: '6px',
                        }}
                      >
                        Time *
                      </label>
                      <input
                        type="text"
                        value={entry.time}
                        onChange={(e) =>
                          handleUpdateTimelineField(index, 'time', e.target.value)
                        }
                        placeholder="Enter time (e.g., 9:00 AM)"
                        style={{
                          width: '100%',
                          height: '42px',
                          backgroundColor: '#ffffff',
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

                  {/* Grid 2: Title & Description */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0b8462',
                          marginBottom: '6px',
                        }}
                      >
                        Title *
                      </label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) =>
                          handleUpdateTimelineField(index, 'title', e.target.value)
                        }
                        placeholder="Enter title"
                        style={{
                          width: '100%',
                          height: '42px',
                          backgroundColor: '#ffffff',
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
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0b8462',
                          marginBottom: '6px',
                        }}
                      >
                        Description (Optional)
                      </label>
                      <textarea
                        value={entry.description || ''}
                        onChange={(e) =>
                          handleUpdateTimelineField(index, 'description', e.target.value)
                        }
                        rows={2}
                        placeholder="Enter description (optional)"
                        style={{
                          width: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px 12px',
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
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                type="button"
                onClick={handleAddTimelineEntry}
                style={{
                  backgroundColor: '#14b8a6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#14b8a6')}
              >
                <Plus size={15} />
                Add Timeline Entry
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseEditTimeline}
                  style={{
                    backgroundColor: '#4b5563',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTimelineModal}
                  style={{
                    backgroundColor: '#16a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '9px 24px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#16a37f')}
                >
                  Save Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal 3: PDF Viewer Modal --- */}
      {viewingPdfUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '24px',
          }}
          onClick={() => setViewingPdfUrl(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0b8462" />
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>
                  Hornbill Schedule Document
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                  href={viewingPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#0b8462',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Open in Tab <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => setViewingPdfUrl(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <FileText size={64} color="#0b8462" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
                Hornbill Festival Schedule PDF
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  maxWidth: '460px',
                  margin: '0 0 20px 0',
                  lineHeight: 1.5,
                }}
              >
                Official Hornbill daily itinerary document URL:
                <br />
                <code
                  style={{
                    backgroundColor: '#e5e7eb',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'inline-block',
                    marginTop: '6px',
                    wordBreak: 'break-all',
                  }}
                >
                  {viewingPdfUrl}
                </code>
              </p>
              <a
                href={viewingPdfUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: '#0b8462',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <ExternalLink size={15} /> Download / Open Document
              </a>
            </div>
          </div>
        </div>
      )}
      {/* --- Modal 4: Magazine Edit Modal --- */}
      {isMagazineModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px',
          }}
          onClick={() => {
            setIsMagazineModalOpen(false)
            setMagazineFile(null)
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ color: '#0b8462', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Official Hornbill Magazine PDF
              </h2>
              <button
                onClick={() => {
                  setIsMagazineModalOpen(false)
                  setMagazineFile(null)
                }}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Magazine PDF URL
              </label>
              <input
                type="text"
                value={tempMagazineUrl}
                onChange={(e) => setTempMagazineUrl(e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/.../magazine.pdf"
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                Or Upload New Magazine PDF
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setMagazineFile(file)
                    setTempMagazineUrl(file.name)
                  }
                }}
                style={{ fontSize: '13px' }}
              />
              {magazineFile && (
                <p style={{ fontSize: '12px', color: '#16a34a', margin: '6px 0 0 0' }}>
                  Selected: <strong>{magazineFile.name}</strong>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsMagazineModalOpen(false)
                  setMagazineFile(null)
                }}
                style={{
                  backgroundColor: '#4b5563',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMagazine}
                disabled={isSaving}
                style={{
                  backgroundColor: '#0b8462',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Magazine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#065f46',
            color: '#ffffff',
            padding: '12px 22px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 99999,
            fontSize: '14px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <CheckCircle size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
