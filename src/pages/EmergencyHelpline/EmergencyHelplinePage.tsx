import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  PhoneCall,
  CheckCircle,
} from 'lucide-react'
import type { EmergencyHelplineItem, EmergencyCategory } from '@/types'
import { initialEmergencyHelplinesData } from '@/data/emergencyHelplinesData'
import {
  subscribeEmergencyHelplines,
  addEmergencyHelpline,
  updateEmergencyHelpline,
  deleteEmergencyHelpline,
} from '@/services/firebase/emergencyHelplines'
import { CustomDropdown } from '@/components/common/CustomDropdown'

const CATEGORY_OPTIONS = [
  'All Categories',
  'Police Station',
  'Nearby Hospitals',
  'Tourist Police',
]

const FORM_CATEGORY_OPTIONS = [
  'Police Station',
  'Nearby Hospital',
  'Tourist Police',
]

// Normalizes category to standard readable title
function formatCategory(cat: string): string {
  const lower = (cat || '').toLowerCase().trim()
  if (lower === 'police' || lower === 'police station') return 'Police Station'
  if (lower === 'hospital' || lower === 'nearby hospital' || lower === 'nearby hospitals') return 'Nearby Hospital'
  if (lower === 'tourist_police' || lower === 'tourist police') return 'Tourist Police'
  return cat || 'General'
}

// Converts readable title to db category key
function categoryToKey(label: string): EmergencyCategory {
  const lower = label.toLowerCase().trim()
  if (lower.includes('hospital')) return 'hospital'
  if (lower.includes('tourist')) return 'tourist_police'
  return 'police'
}

export function EmergencyHelplinePage() {
  const [helplines, setHelplines] = useState<EmergencyHelplineItem[]>(initialEmergencyHelplinesData)
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingItem, setEditingItem] = useState<EmergencyHelplineItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Real-time Firestore sync with 'emergency_helplines' collection
  useEffect(() => {
    const unsubscribe = subscribeEmergencyHelplines(
      (liveItems) => {
        if (liveItems && liveItems.length > 0) {
          setHelplines(liveItems)
        }
      },
      (err) => {
        console.error('Error subscribing to emergency_helplines:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Form fields for Add / Edit
  const [formCategory, setFormCategory] = useState<EmergencyCategory>('police')
  const [formName, setFormName] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formDistrict, setFormDistrict] = useState('Kohima')

  // Extract unique districts
  const districtOptions = useMemo(() => {
    const set = new Set<string>()
    helplines.forEach((h) => {
      if (h.district && h.district.trim()) set.add(h.district.trim())
    })
    return ['All Districts', ...Array.from(set).sort()]
  }, [helplines])

  // Filtered helplines
  const filteredHelplines = useMemo(() => {
    return helplines.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All Categories') {
        const itemCat = formatCategory(item.category)
        if (selectedCategory === 'Nearby Hospitals' && itemCat === 'Nearby Hospital') {
          // match
        } else if (itemCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false
        }
      }

      // District filter
      if (
        selectedDistrict !== 'All Districts' &&
        item.district.toLowerCase() !== selectedDistrict.toLowerCase()
      ) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesSubtitle = item.subtitle.toLowerCase().includes(q)
        const matchesPhone = item.phone.toLowerCase().includes(q)
        const matchesDistrict = item.district.toLowerCase().includes(q)
        const matchesCat = formatCategory(item.category).toLowerCase().includes(q)
        if (!matchesName && !matchesSubtitle && !matchesPhone && !matchesDistrict && !matchesCat) {
          return false
        }
      }
      return true
    })
  }, [helplines, selectedCategory, selectedDistrict, searchQuery])

  // Switch to Add View
  const handleStartAdd = () => {
    setFormCategory(
      selectedCategory === 'Nearby Hospitals'
        ? 'hospital'
        : selectedCategory === 'Tourist Police'
        ? 'tourist_police'
        : 'police'
    )
    setFormName('')
    setFormSubtitle('')
    setFormPhone('')
    setFormDistrict(selectedDistrict !== 'All Districts' ? selectedDistrict : 'Kohima')
    setEditingItem(null)
    setIsAddingNew(true)
  }

  // Switch to Edit View
  const handleStartEdit = (item: EmergencyHelplineItem) => {
    setIsAddingNew(false)
    setEditingItem(item)
    setFormCategory((item.category as EmergencyCategory) || 'police')
    setFormName(item.name)
    setFormSubtitle(item.subtitle)
    setFormPhone(item.phone)
    setFormDistrict(item.district || 'Kohima')
  }

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPhone.trim()) {
      alert('Please fill in the Name and Phone Number.')
      return
    }

    setIsSaving(true)
    try {
      const newDocId = await addEmergencyHelpline({
        category: formCategory,
        name: formName.trim(),
        subtitle: formSubtitle.trim(),
        phone: formPhone.trim(),
        district: formDistrict.trim(),
      })
      setFormName('')
      setFormSubtitle('')
      setFormPhone('')
      setIsAddingNew(false)
      showToast(`Added "${formName.trim()}" to Emergency Helplines (${newDocId})!`)
    } catch (err: any) {
      console.error('Error adding helpline to Firestore:', err)
      alert(`Failed to add helpline: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formName.trim() || !formPhone.trim()) {
      alert('Please fill in the Name and Phone Number.')
      return
    }

    setIsSaving(true)
    try {
      await updateEmergencyHelpline(editingItem.id, {
        category: formCategory,
        name: formName.trim(),
        subtitle: formSubtitle.trim(),
        phone: formPhone.trim(),
        district: formDistrict.trim(),
      })
      setEditingItem(null)
      showToast(`Updated "${formName.trim()}" successfully!`)
    } catch (err: any) {
      console.error('Error updating helpline in Firestore:', err)
      alert(`Failed to update helpline: ${err.message || 'Error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Helpline
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from Emergency Helplines?`)) {
      return
    }
    try {
      await deleteEmergencyHelpline(id)
      showToast(`Deleted "${name}" from Emergency Helplines.`)
    } catch (err: any) {
      console.error('Error deleting helpline from Firestore:', err)
      alert(`Failed to delete helpline: ${err.message || 'Error occurred'}`)
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
        Emergency Helpline
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
        {isAddingNew ? (
          /* =========================================================================
             Add New Helpline View (Matching Add Stall layout)
             ========================================================================= */
          <div>
            {/* Header with Title and Back Button */}
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
                Add New Helpline
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
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

            {/* Centered Form */}
            <form onSubmit={handleSubmitAdd} style={{ maxWidth: '960px', margin: '0 auto' }}>
              {/* Row 1: Category & Name */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Category: *
                  </label>
                  <CustomDropdown
                    options={FORM_CATEGORY_OPTIONS}
                    value={formatCategory(formCategory)}
                    onChange={(val) => setFormCategory(categoryToKey(val))}
                    minWidth="100%"
                    padding="10px 14px"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Name: *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter station or hospital name (e.g. North Police Station)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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

              {/* Row 2: Subtitle/Officer & District */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Officer / Subtitle / Locality:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter officer name or locality (e.g. Chumdemo Odyuo)"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
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
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    District: *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter district (e.g. Kohima, Dimapur)"
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
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

              {/* Row 3: Phone Number */}
              <div style={{ marginBottom: '32px', maxWidth: '48.5%' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#0b8462',
                    fontWeight: 700,
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                >
                  Phone Number: *
                </label>
                <input
                  type="text"
                  placeholder="Enter contact number (e.g. 8575045520, 112)"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
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
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#096b4f'
                  }}
                  onMouseOut={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#0b8462'
                  }}
                >
                  {isSaving ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        ) : editingItem ? (
          /* =========================================================================
             Edit Helpline View (Matching Add layout with prefilled data)
             ========================================================================= */
          <div>
            {/* Header with Title and Back Button */}
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
                Edit Helpline — {editingItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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

            {/* Centered Form */}
            <form onSubmit={handleSubmitEdit} style={{ maxWidth: '960px', margin: '0 auto' }}>
              {/* Row 1: Category & Name */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Category: *
                  </label>
                  <CustomDropdown
                    options={FORM_CATEGORY_OPTIONS}
                    value={formatCategory(formCategory)}
                    onChange={(val) => setFormCategory(categoryToKey(val))}
                    minWidth="100%"
                    padding="10px 14px"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Name: *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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

              {/* Row 2: Subtitle/Officer & District */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    Officer / Subtitle / Locality:
                  </label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
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
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    District: *
                  </label>
                  <input
                    type="text"
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
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

              {/* Row 3: Phone Number */}
              <div style={{ marginBottom: '32px', maxWidth: '48.5%' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#0b8462',
                    fontWeight: 700,
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                >
                  Phone Number: *
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
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
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#096b4f'
                  }}
                  onMouseOut={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#0b8462'
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =========================================================================
             Table View (Exact parity with Hotels, Restaurants, and Stalls)
             ========================================================================= */
          <div>
            {/* Top Row with Add Helpline Button */}
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
                <Plus size={16} /> Add Helpline
              </button>
            </div>

            {/* Search Input Box (Matching Hotels/Restaurants) */}
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
                placeholder="Search by Helpline Name / Officer / District / Phone"
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

            {/* Filters Row (Exact styling and component parity with Hotels, Restaurants, Cabs) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '36px',
                flexWrap: 'wrap',
                marginBottom: '24px',
              }}
            >
              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Category:</span>
                <CustomDropdown
                  options={CATEGORY_OPTIONS}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  minWidth="170px"
                />
              </div>

              {/* District Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>District:</span>
                <CustomDropdown
                  options={districtOptions}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  minWidth="170px"
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
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '70px' }}>
                      Sl No.
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '160px' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>
                      Helpline Name
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>
                      Officer / Locality / Subtitle
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '120px' }}>
                      District
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '170px' }}>
                      Phone Number
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '110px', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHelplines.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                        No helplines found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredHelplines.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          verticalAlign: 'middle',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafdfb',
                        }}
                      >
                        {/* Sl No. */}
                        <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7', fontWeight: 500 }}>
                          {item.slNo || index + 1}
                        </td>

                        {/* Category (Clean, normal text without weird badge overlays) */}
                        <td style={{ padding: '14px 16px', color: '#111827', border: '1px solid #e2ece7' }}>
                          {formatCategory(item.category)}
                        </td>

                        {/* Helpline Name */}
                        <td style={{ padding: '14px 16px', color: '#1f2937', fontWeight: 600, border: '1px solid #e2ece7' }}>
                          {item.name}
                        </td>

                        {/* Officer / Subtitle */}
                        <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7' }}>
                          {item.subtitle || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>}
                        </td>

                        {/* District */}
                        <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7' }}>
                          {item.district}
                        </td>

                        {/* Phone Number */}
                        <td style={{ padding: '14px 16px', color: '#0b8462', fontWeight: 600, border: '1px solid #e2ece7' }}>
                          <a
                            href={`tel:${item.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#0b8462',
                              textDecoration: 'none',
                            }}
                          >
                            <PhoneCall size={13} />
                            {item.phone}
                          </a>
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 16px', border: '1px solid #e2ece7', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              title="Edit Helpline"
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
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Delete Helpline"
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
