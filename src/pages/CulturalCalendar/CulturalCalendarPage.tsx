import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle,
  MapPin,
  Clock,
  Check,
} from 'lucide-react'
import type { CulturalCalendarItem } from '@/types'
import {
  subscribeCulturalCalendar,
  addCulturalCalendarItem,
  updateCulturalCalendarItem,
  deleteCulturalCalendarItem,
} from '@/services/firebase/culturalCalendar'
import { CustomDropdown } from '@/components/common/CustomDropdown'

// Helper to format date nicely: 2026-12-01 -> 01 Dec 2026
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parts[2]
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const mon = monthNames[monthIdx] || parts[1]
  return `${day} ${mon} ${year}`
}

function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate) return '—'
  const startFmt = formatDisplayDate(startDate)
  if (!endDate || startDate === endDate) return startFmt
  const endFmt = formatDisplayDate(endDate)
  return `${startFmt} – ${endFmt}`
}

export function CulturalCalendarPage() {
  const [calendarItems, setCalendarItems] = useState<CulturalCalendarItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTribe, setSelectedTribe] = useState('All Tribes')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  const [selectedYear, setSelectedYear] = useState('All Years')

  // Form states
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingItem, setEditingItem] = useState<CulturalCalendarItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeCulturalCalendar(
      (liveItems) => {
        setCalendarItems(liveItems)
      },
      (err) => {
        console.error('Error subscribing to cultural_calendar:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Form field states
  const [formTitle, setFormTitle] = useState('')
  const [formTribe, setFormTribe] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsConfirmed, setFormIsConfirmed] = useState(true)

  // Extract unique tribes for filter dropdown
  const tribeOptions = useMemo(() => {
    const set = new Set<string>()
    calendarItems.forEach((it) => {
      if (it.tribe && it.tribe.trim()) set.add(it.tribe.trim())
    })
    return ['All Tribes', ...Array.from(set).sort()]
  }, [calendarItems])

  // Extract unique years for filter dropdown
  const yearOptions = useMemo(() => {
    const set = new Set<string>()
    calendarItems.forEach((it) => {
      if (it.startDate) {
        const y = it.startDate.substring(0, 4)
        if (y) set.add(y)
      }
    })
    return ['All Years', ...Array.from(set).sort()]
  }, [calendarItems])

  // Filtered entries
  const filteredItems = useMemo(() => {
    return calendarItems.filter((item) => {
      // Tribe filter
      if (selectedTribe !== 'All Tribes' && item.tribe.toLowerCase() !== selectedTribe.toLowerCase()) {
        return false
      }
      // Status filter
      if (selectedStatus === 'Confirmed' && !item.isConfirmed) return false
      if (selectedStatus === 'Tentative' && item.isConfirmed) return false

      // Year filter
      if (selectedYear !== 'All Years') {
        const itemYear = (item.startDate || '').substring(0, 4)
        if (itemYear !== selectedYear) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(q)
        const matchesTribe = item.tribe.toLowerCase().includes(q)
        const matchesLoc = item.location.toLowerCase().includes(q)
        const matchesDesc = item.description.toLowerCase().includes(q)
        if (!matchesTitle && !matchesTribe && !matchesLoc && !matchesDesc) {
          return false
        }
      }

      return true
    })
  }, [calendarItems, selectedTribe, selectedStatus, selectedYear, searchQuery])

  // Switch to Add View
  const handleStartAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormTitle('')
    setFormTribe('')
    setFormStartDate(today)
    setFormEndDate(today)
    setFormLocation('Kisama, Nagaland')
    setFormDescription('')
    setFormIsConfirmed(true)
    setEditingItem(null)
    setIsAddingNew(true)
  }

  // Switch to Edit View
  const handleStartEdit = (item: CulturalCalendarItem) => {
    setIsAddingNew(false)
    setEditingItem(item)
    setFormTitle(item.title)
    setFormTribe(item.tribe)
    setFormStartDate(item.startDate)
    setFormEndDate(item.endDate || item.startDate)
    setFormLocation(item.location)
    setFormDescription(item.description)
    setFormIsConfirmed(Boolean(item.isConfirmed))
  }

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formStartDate.trim()) {
      alert('Please fill in Festival Title and Start Date.')
      return
    }

    setIsSaving(true)
    try {
      const docId = await addCulturalCalendarItem({
        title: formTitle.trim(),
        tribe: formTribe.trim(),
        startDate: formStartDate.trim(),
        endDate: (formEndDate || formStartDate).trim(),
        location: formLocation.trim(),
        description: formDescription.trim(),
        isConfirmed: formIsConfirmed,
      })
      setIsAddingNew(false)
      showToast(`Added "${formTitle.trim()}" to Cultural Calendar (${docId})!`)
    } catch (err: any) {
      console.error('Error adding cultural calendar entry:', err)
      alert(`Error saving entry: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formTitle.trim() || !formStartDate.trim()) {
      alert('Please fill in Festival Title and Start Date.')
      return
    }

    setIsSaving(true)
    try {
      await updateCulturalCalendarItem(editingItem.id, {
        title: formTitle.trim(),
        tribe: formTribe.trim(),
        startDate: formStartDate.trim(),
        endDate: (formEndDate || formStartDate).trim(),
        location: formLocation.trim(),
        description: formDescription.trim(),
        isConfirmed: formIsConfirmed,
      })
      setEditingItem(null)
      showToast(`Updated "${formTitle.trim()}" successfully!`)
    } catch (err: any) {
      console.error('Error updating cultural calendar entry:', err)
      alert(`Error updating entry: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Entry
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the Cultural Calendar?`)) {
      return
    }
    try {
      await deleteCulturalCalendarItem(id)
      showToast(`Deleted "${title}" from Cultural Calendar.`)
    } catch (err: any) {
      console.error('Error deleting entry:', err)
      alert(`Error deleting entry: ${err.message || 'Unknown error'}`)
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 32px' }}>
      {/* Centered Page Title */}
      <h2
        style={{
          textAlign: 'center',
          color: '#0b8462',
          fontSize: '26px',
          fontWeight: 700,
          margin: '0 0 24px 0',
        }}
      >
        Cultural Calendar
      </h2>

      {/* Main Container Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          padding: '24px',
        }}
      >
        {isAddingNew || editingItem ? (
          /* =========================================================================
             VIEW 1: ADD / EDIT CULTURAL CALENDAR ENTRY FORM
             ========================================================================= */
          <div>
            {/* Header with Title and Back button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '28px',
              }}
            >
              <h3 style={{ color: '#0b8462', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {editingItem ? `Edit Entry — ${editingItem.title}` : 'Add New Cultural Calendar Entry'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false)
                  setEditingItem(null)
                }}
                style={{
                  backgroundColor: '#4b5563',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 18px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
              >
                Back
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingItem ? handleSubmitEdit : handleSubmitAdd} style={{ maxWidth: '960px', margin: '0 auto' }}>
              {/* Row 1: Title & Tribe */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Festival Title: *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hornbill Festival, Ahuna, Moatsu"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Tribe / Community: *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sumi, Lotha, Angami, All Naga tribes"
                    value={formTribe}
                    onChange={(e) => setFormTribe(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Start Date & End Date */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Start Date: *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    End Date: *
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                    required
                  />
                </div>
              </div>

              {/* Row 3: Location & Confirmation Status */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Location / Venue:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Naga Heritage Village, Kisama, or Zunheboto"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Date Confirmation Status:
                  </label>
                  <CustomDropdown
                    options={['Confirmed', 'Tentative / Unconfirmed']}
                    value={formIsConfirmed ? 'Confirmed' : 'Tentative / Unconfirmed'}
                    onChange={(val) => setFormIsConfirmed(val === 'Confirmed')}
                    minWidth="100%"
                    padding="10px 14px"
                  />
                </div>
              </div>

              {/* Row 4: Description */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  Festival Description & Cultural Significance:
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter details about this festival, its traditions, dances, food, and rituals..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0b8462')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
              </div>

              {/* Centered Submit Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#0b8462',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '10px 48px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================================
             VIEW 2: CULTURAL CALENDAR TABLE VIEW
             ========================================================================= */
          <div>
            {/* Top Row: Add Festival Date Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleStartAdd}
                style={{
                  backgroundColor: '#0b8462',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
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
                <Plus size={16} /> Add Festival Date
              </button>
            </div>

            {/* Search Input Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '20px',
                backgroundColor: '#ffffff',
              }}
            >
              <Search size={18} color="#6b7280" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by Festival Title / Tribe / Location / Description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            {/* Filters Row (Using CustomDropdown) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                flexWrap: 'wrap',
                marginBottom: '24px',
              }}
            >
              {/* Tribe Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Tribe:</span>
                <CustomDropdown
                  options={tribeOptions}
                  value={selectedTribe}
                  onChange={setSelectedTribe}
                  minWidth="160px"
                />
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Status:</span>
                <CustomDropdown
                  options={['All Status', 'Confirmed', 'Tentative']}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  minWidth="140px"
                />
              </div>

              {/* Year Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Year:</span>
                <CustomDropdown
                  options={yearOptions}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  minWidth="130px"
                />
              </div>
            </div>

            {/* Responsive Table with Full Grid Borders */}
            <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '960px',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  textAlign: 'left',
                  border: '1px solid #d5e6de',
                  backgroundColor: '#ffffff',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#e2f6ee', height: '46px' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '60px' }}>
                      Sl No.
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '170px' }}>
                      Festival Title
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '130px' }}>
                      Tribe
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '190px' }}>
                      Dates
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '160px' }}>
                      Location
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '120px', textAlign: 'center' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '90px', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                        No festival entries found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          verticalAlign: 'middle',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafdfb',
                        }}
                      >
                        {/* Sl No. */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontWeight: 500 }}>
                          {item.slNo || index + 1}
                        </td>

                        {/* Festival Title */}
                        <td style={{ padding: '14px 14px', color: '#1f2937', fontWeight: 700, border: '1px solid #e2ece7' }}>
                          {item.title}
                        </td>

                        {/* Tribe */}
                        <td style={{ padding: '14px 14px', color: '#111827', border: '1px solid #e2ece7', fontWeight: 500 }}>
                          {item.tribe}
                        </td>

                        {/* Dates */}
                        <td style={{ padding: '14px 14px', color: '#0b8462', fontWeight: 600, border: '1px solid #e2ece7', fontSize: '13px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} color="#0b8462" />
                            {formatDateRange(item.startDate, item.endDate)}
                          </span>
                        </td>

                        {/* Location */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontSize: '13px' }}>
                          {item.location ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} color="#64748b" /> {item.location}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 14px', textAlign: 'center', border: '1px solid #e2ece7' }}>
                          {item.isConfirmed ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <Check size={12} /> Confirmed
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              <Clock size={12} /> Tentative
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontSize: '13px', lineHeight: 1.45 }}>
                          {item.description ? (
                            <div style={{ maxHeight: '68px', overflowY: 'auto' }}>
                              {item.description}
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 14px', border: '1px solid #e2ece7', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              title="Edit Entry"
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
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#14b8a6')}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.title)}
                              title="Delete Entry"
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
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
          }}
        >
          <CheckCircle size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
