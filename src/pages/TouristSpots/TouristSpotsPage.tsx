import { useState, useMemo } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import type { TouristSpotItem } from '@/types'
import { initialTouristSpotsData } from '@/data/touristSpotsData'

export function TouristSpotsPage() {
  const [spots, setSpots] = useState<TouristSpotItem[]>(initialTouristSpotsData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All')
  const [isDistrictOpen, setIsDistrictOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Add new tourist spot form state
  const [formDistrict, setFormDistrict] = useState('')
  const [isFormDistrictOpen, setIsFormDistrictOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [startHour, setStartHour] = useState('9:00')
  const [startPeriod, setStartPeriod] = useState('AM')
  const [endHour, setEndHour] = useState('6:00')
  const [endPeriod, setEndPeriod] = useState('PM')
  const [closedDays, setClosedDays] = useState<string[]>([])
  const [newMapsLink, setNewMapsLink] = useState('')
  const [newImageFile, setNewImageFile] = useState<string | null>(null)

  const districts = [
    'All',
    'Chumoukedima',
    'Dimapur',
    'Kiphire',
    'Kohima',
    'Longleng',
    'Mokokchung',
    'Mon',
    'Niuland',
    'Noklak',
    'Peren',
    'Phek',
    'Shamator',
    'Tuensang',
    'Tseminyü',
    'Wokha',
    'Zünheboto',
  ]

  const timeOptions = [
    '6:00',
    '6:30',
    '7:00',
    '7:30',
    '8:00',
    '8:30',
    '9:00',
    '9:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '1:00',
    '1:30',
    '2:00',
    '2:30',
    '3:00',
    '3:30',
    '4:00',
    '4:30',
    '5:00',
    '5:30',
    '6:00',
    '6:30',
    '7:00',
    '7:30',
    '8:00',
  ]

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  const getWordCount = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
  }

  const handleToggleDay = (day: string) => {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setNewImageFile(url)
    }
  }

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault()
    const visitingHours = `${startHour} ${startPeriod} to ${endHour} ${endPeriod}`
    const closedDayStr = closedDays.length > 0 ? closedDays.join(', ') : '-'

    const newItem: TouristSpotItem = {
      id: Date.now().toString(),
      slNo: spots.length + 1,
      spotImage: newImageFile || 'placeholder',
      touristSpot: newName || 'New Tourist Spot',
      description: newDescription || '',
      visitingHours: visitingHours,
      closedDay: closedDayStr,
      district: formDistrict || 'Kohima',
      googleMapsLink:
        newMapsLink ||
        `https://maps.google.com/?q=${encodeURIComponent(newName || 'Nagaland')}+Nagaland`,
    }

    setSpots((prev) => [...prev, newItem])
    setNewName('')
    setFormDistrict('')
    setNewDescription('')
    setStartHour('9:00')
    setStartPeriod('AM')
    setEndHour('6:00')
    setEndPeriod('PM')
    setClosedDays([])
    setNewMapsLink('')
    setNewImageFile(null)
    setIsAddingNew(false)
  }

  // Filtered tourist spots
  const filteredSpots = useMemo(() => {
    return spots.filter((item) => {
      // District filter
      if (selectedDistrict !== 'All' && item.district !== selectedDistrict) {
        return false
      }

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.touristSpot.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
      )
    })
  }, [spots, searchQuery, selectedDistrict])

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
        Tourist Spots
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
            Add Tourist Spot
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
            {/* Search and District Filter Bar */}
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
                  placeholder="Search by Tourist Spot Name"
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

              {/* District Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0b8462',
                  }}
                >
                  District:
                </span>
                <div style={{ position: 'relative', width: '160px' }}>
                  <button
                    type="button"
                    onClick={() => setIsDistrictOpen((v) => !v)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      border: isDistrictOpen ? '1.5px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: '#111827',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{selectedDistrict}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: '#6b7280',
                        transform: isDistrictOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>

                  {isDistrictOpen && (
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
                        maxHeight: '260px',
                        overflowY: 'auto',
                      }}
                    >
                      {districts.map((dist) => {
                        const isSelected = selectedDistrict === dist
                        return (
                          <div
                            key={dist}
                            onClick={() => {
                              setSelectedDistrict(dist)
                              setIsDistrictOpen(false)
                            }}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              color: isSelected ? '#ffffff' : '#111827',
                              fontWeight: isSelected ? 600 : 400,
                              backgroundColor: isSelected ? '#16a37f' : '#ffffff',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#e6f9f2'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff'
                            }}
                          >
                            {dist}
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
                        padding: '10px 12px',
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
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '95px',
                      }}
                    >
                      Spot Image
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '160px',
                      }}
                    >
                      Tourist Spot
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        minWidth: '280px',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '140px',
                      }}
                    >
                      Visiting Hours
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '90px',
                      }}
                    >
                      Closed Day
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '95px',
                      }}
                    >
                      District
                    </th>
                    <th
                      style={{
                        border: '1px solid #d5e6de',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#111827',
                        width: '120px',
                      }}
                    >
                      Google Maps Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpots.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        height: '85px',
                        borderBottom: '1px solid #d5e6de',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {/* Sl No. */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          fontWeight: 500,
                        }}
                      >
                        {item.slNo}
                      </td>

                      {/* Spot Image */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                        }}
                      >
                        {!item.spotImage ? (
                          <div
                            style={{
                              width: '68px',
                              height: '68px',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              color: '#6b7280',
                            }}
                          >
                            No Image
                          </div>
                        ) : item.spotImage === 'placeholder' ? (
                          <div
                            style={{
                              width: '68px',
                              height: '68px',
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
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.touristSpot}
                          </div>
                        ) : (
                          <img
                            src={item.spotImage}
                            alt={item.touristSpot}
                            style={{
                              width: '68px',
                              height: '68px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                      </td>

                      {/* Tourist Spot */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          fontWeight: 500,
                        }}
                      >
                        {item.touristSpot}
                      </td>

                      {/* Description */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#374151',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.description}
                      </td>

                      {/* Visiting Hours */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#111827',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.visitingHours}
                      </td>

                      {/* Closed Day */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#111827',
                        }}
                      >
                        {item.closedDay}
                      </td>

                      {/* District */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                          fontSize: '12px',
                          color: '#111827',
                        }}
                      >
                        {item.district}
                      </td>

                      {/* Google Maps Link */}
                      <td
                        style={{
                          border: '1px solid #d5e6de',
                          padding: '10px 12px',
                        }}
                      >
                        <a
                          href={item.googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#0d9488',
                            fontSize: '13px',
                            fontWeight: 500,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View on Maps
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Add New Tourist Spot View */
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
                Add New Tourist Spot
              </h2>
              <button
                onClick={() => {
                  setIsAddingNew(false)
                  setNewImageFile(null)
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

            {/* Form matching Screenshot exactly */}
            <form onSubmit={handleSubmitNew}>
              {/* Row 1: District & Tourist Spot Name */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '20px',
                }}
              >
                {/* District Dropdown */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0b8462',
                      marginBottom: '8px',
                    }}
                  >
                    District:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setIsFormDistrictOpen((v) => !v)}
                      style={{
                        width: '100%',
                        height: '42px',
                        backgroundColor: '#ffffff',
                        border: isFormDistrictOpen ? '1.5px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        color: formDistrict ? '#111827' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span>{formDistrict || 'Select District'}</span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: '#6b7280',
                          transform: isFormDistrictOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </button>

                    {isFormDistrictOpen && (
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
                          zIndex: 40,
                          maxHeight: '220px',
                          overflowY: 'auto',
                        }}
                      >
                        {districts
                          .filter((d) => d !== 'All')
                          .map((d) => (
                            <div
                              key={d}
                              onClick={() => {
                                setFormDistrict(d)
                                setIsFormDistrictOpen(false)
                              }}
                              style={{
                                padding: '8px 14px',
                                fontSize: '13px',
                                color: formDistrict === d ? '#ffffff' : '#111827',
                                backgroundColor: formDistrict === d ? '#16a37f' : '#ffffff',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                if (formDistrict !== d) e.currentTarget.style.backgroundColor = '#e6f9f2'
                              }}
                              onMouseLeave={(e) => {
                                if (formDistrict !== d) e.currentTarget.style.backgroundColor = '#ffffff'
                              }}
                            >
                              {d}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tourist Spot Name */}
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
                    Tourist Spot Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tourist spot name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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

              {/* Row 2: Description */}
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
                    ({getWordCount(newDescription)}/100 words)
                  </span>
                </label>
                <textarea
                  placeholder="Enter description (max 100 words)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
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

              {/* Row 3: Visiting Hours & Closed Days (Optional) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '20px',
                }}
              >
                {/* Visiting Hours */}
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
                    Visiting Hours:
                  </label>

                  {/* Start time */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <select
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '6px 28px 6px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        {timeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '12px',
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    <div style={{ position: 'relative', width: '90px' }}>
                      <select
                        value={startPeriod}
                        onChange={(e) => setStartPeriod(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '6px 28px 6px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <ChevronDown
                        size={15}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '12px',
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* 'to' in center */}
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      margin: '6px 0',
                    }}
                  >
                    to
                  </div>

                  {/* End time */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <select
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '6px 28px 6px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        {timeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '12px',
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    <div style={{ position: 'relative', width: '90px' }}>
                      <select
                        value={endPeriod}
                        onChange={(e) => setEndPeriod(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '6px 28px 6px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <ChevronDown
                        size={15}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '12px',
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Closed Days (Optional) Checkboxes Box */}
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
                    Closed Days (Optional):
                  </label>
                  <div
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      height: '98px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '12px 18px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {daysOfWeek.map((day) => {
                      const isChecked = closedDays.includes(day)
                      return (
                        <label
                          key={day}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#111827',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleDay(day)}
                            style={{
                              width: '15px',
                              height: '15px',
                              accentColor: '#0b8462',
                              cursor: 'pointer',
                            }}
                          />
                          <span>{day}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 4: Spot Image & Google Maps Link */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '28px',
                }}
              >
                {/* Spot Image */}
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
                    Spot Image:
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '42px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
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
                  </div>
                </div>

                {/* Google Maps Link */}
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
                    Google Maps Link:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Google Maps link"
                    value={newMapsLink}
                    onChange={(e) => setNewMapsLink(e.target.value)}
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

              {/* Centered Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#16a37f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 48px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0b8462')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#16a37f')}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
