import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle,
  Upload,
  Compass,
  ArrowRight,
  Clock,
} from 'lucide-react'
import type { DestinationItem, DestinationSpot, DestinationDetail } from '@/types'
import {
  subscribeDestinations,
  addDestination,
  updateDestination,
  deleteDestination,
  addSpotToDestination,
  updateSpotInDestination,
  deleteSpotFromDestination,
} from '@/services/firebase/destinations'
import { uploadImageToStorage } from '@/services/firebase/storage'
import { ImageModal } from '@/components/common/ImageModal'

export function DestinationsPage() {
  const [destinations, setDestinations] = useState<DestinationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null)

  // Sub-view states
  const [isAddingDestination, setIsAddingDestination] = useState(false)
  const [editingDestination, setEditingDestination] = useState<DestinationItem | null>(null)
  const [isAddingSpot, setIsAddingSpot] = useState(false)
  const [editingSpotIndex, setEditingSpotIndex] = useState<number | null>(null)

  // Loading & Toast
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeDestinations(
      (liveItems) => {
        setDestinations(liveItems)
      },
      (err) => {
        console.error('Error subscribing to destinations:', err)
      }
    )
    return () => unsubscribe()
  }, [])

  // Currently selected destination
  const activeDestination = useMemo(() => {
    if (!selectedDestId) return null
    return destinations.find((d) => d.id === selectedDestId) || null
  }, [destinations, selectedDestId])

  // Destination Form State
  const [destFormName, setDestFormName] = useState('')
  const [destFormImageUrl, setDestFormImageUrl] = useState('')
  const [destFormDistance, setDestFormDistance] = useState('')
  const [destFormTransport, setDestFormTransport] = useState('')
  const [destFormStay, setDestFormStay] = useState('Homestays Available')
  const [destFile, setDestFile] = useState<File | null>(null)
  const [destFilePreview, setDestFilePreview] = useState<string | null>(null)
  const destFileInputRef = useRef<HTMLInputElement>(null)

  // Spot Form State
  const [spotName, setSpotName] = useState('')
  const [spotTiming, setSpotTiming] = useState('')
  const [spotMap, setSpotMap] = useState('')
  const [spotDescription, setSpotDescription] = useState('')
  const [spotImageUrl, setSpotImageUrl] = useState('')
  const [spotFile, setSpotFile] = useState<File | null>(null)
  const [spotFilePreview, setSpotFilePreview] = useState<string | null>(null)
  const spotFileInputRef = useRef<HTMLInputElement>(null)

  // Start Adding Destination
  const handleStartAddDestination = () => {
    setDestFormName('')
    setDestFormImageUrl('')
    setDestFormDistance('')
    setDestFormTransport('Bus and Taxi Available')
    setDestFormStay('Homestays Available')
    setDestFile(null)
    setDestFilePreview(null)
    setIsAddingDestination(true)
    setEditingDestination(null)
  }

  // Start Editing Destination
  const handleStartEditDestination = (item: DestinationItem) => {
    setDestFormName(item.name)
    setDestFormImageUrl(item.imageUrl || '')
    const dist = item.details?.find((d) => d.icon === 'distance')?.text || ''
    const trans = item.details?.find((d) => d.icon === 'flight' || d.icon === 'bus')?.text || ''
    const stay = item.details?.find((d) => d.icon === 'stay')?.text || 'Homestays Available'
    setDestFormDistance(dist)
    setDestFormTransport(trans)
    setDestFormStay(stay)
    setDestFile(null)
    setDestFilePreview(null)
    setEditingDestination(item)
    setIsAddingDestination(false)
  }

  // Submit Add / Edit Destination
  const handleSubmitDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destFormName.trim()) {
      alert('Please enter a Destination name.')
      return
    }

    setIsSaving(true)
    try {
      let finalImg = destFormImageUrl.trim()
      if (destFile) {
        finalImg = await uploadImageToStorage(
          destFile,
          'destinations',
          `${destFormName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      const details: DestinationDetail[] = []
      if (destFormDistance.trim()) {
        details.push({ text: destFormDistance.trim(), icon: 'distance' })
      }
      if (destFormTransport.trim()) {
        const isFlight = destFormTransport.toLowerCase().includes('flight')
        details.push({ text: destFormTransport.trim(), icon: isFlight ? 'flight' : 'bus' })
      }
      if (destFormStay.trim()) {
        details.push({ text: destFormStay.trim(), icon: 'stay' })
      }

      if (editingDestination) {
        await updateDestination(editingDestination.id, {
          name: destFormName.trim(),
          imageUrl: finalImg,
          details,
        })
        showToast(`Updated destination "${destFormName.trim()}"!`)
        setEditingDestination(null)
      } else {
        await addDestination({
          name: destFormName.trim(),
          imageUrl: finalImg,
          details,
          spots: [],
        })
        showToast(`Created destination "${destFormName.trim()}"!`)
        setIsAddingDestination(false)
      }
    } catch (err: any) {
      console.error('Error saving destination:', err)
      alert(`Error saving destination: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Destination
  const handleDeleteDestination = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" and all of its suggested tourist spots?`)) {
      return
    }
    try {
      await deleteDestination(id)
      if (selectedDestId === id) setSelectedDestId(null)
      showToast(`Deleted destination "${name}".`)
    } catch (err: any) {
      console.error('Error deleting destination:', err)
      alert(`Failed to delete destination: ${err.message || 'Error occurred'}`)
    }
  }

  // Start Adding Spot
  const handleStartAddSpot = () => {
    setSpotName('')
    setSpotTiming('')
    setSpotMap('')
    setSpotDescription('')
    setSpotImageUrl('')
    setSpotFile(null)
    setSpotFilePreview(null)
    setIsAddingSpot(true)
    setEditingSpotIndex(null)
  }

  // Start Editing Spot
  const handleStartEditSpot = (spot: DestinationSpot, index: number) => {
    setSpotName(spot.name)
    setSpotTiming(spot.timing || '')
    setSpotMap(spot.map || '')
    setSpotDescription(spot.description || '')
    setSpotImageUrl(spot.imageUrl || '')
    setSpotFile(null)
    setSpotFilePreview(null)
    setEditingSpotIndex(index)
    setIsAddingSpot(false)
  }

  // Submit Add / Edit Spot
  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDestination) return
    if (!spotName.trim()) {
      alert('Please enter the Spot Name.')
      return
    }

    setIsSaving(true)
    try {
      let finalImg = spotImageUrl.trim()
      if (spotFile) {
        finalImg = await uploadImageToStorage(
          spotFile,
          'destinations',
          `spot_${spotName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`
        )
      }

      const spotData: DestinationSpot = {
        name: spotName.trim(),
        timing: spotTiming.trim(),
        map: spotMap.trim(),
        description: spotDescription.trim(),
        imageUrl: finalImg,
      }

      if (editingSpotIndex !== null) {
        await updateSpotInDestination(activeDestination.id, editingSpotIndex, spotData)
        showToast(`Updated "${spotName.trim()}" in ${activeDestination.name}!`)
        setEditingSpotIndex(null)
      } else {
        await addSpotToDestination(activeDestination.id, spotData)
        showToast(`Added "${spotName.trim()}" to ${activeDestination.name}!`)
        setIsAddingSpot(false)
      }
    } catch (err: any) {
      console.error('Error saving spot:', err)
      alert(`Error saving spot: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Spot
  const handleDeleteSpot = async (index: number, spotTitle: string) => {
    if (!activeDestination) return
    if (!window.confirm(`Are you sure you want to remove "${spotTitle}" from ${activeDestination.name}?`)) {
      return
    }
    try {
      await deleteSpotFromDestination(activeDestination.id, index)
      showToast(`Removed "${spotTitle}" from ${activeDestination.name}.`)
    } catch (err: any) {
      console.error('Error deleting spot:', err)
      alert(`Failed to delete spot: ${err.message || 'Error occurred'}`)
    }
  }

  // Filtered Destinations
  const filteredDestinations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return destinations
    return destinations.filter((d) => {
      const matchName = d.name.toLowerCase().includes(q)
      const matchSpot = d.spots.some((s) => s.name.toLowerCase().includes(q))
      return matchName || matchSpot
    })
  }, [destinations, searchQuery])

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 32px' }}>
      {/* Page Title */}
      <h2
        style={{
          textAlign: 'center',
          color: '#0b8462',
          fontSize: '26px',
          fontWeight: 700,
          margin: '0 0 24px 0',
        }}
      >
        Tourist Destinations
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
        {/* =========================================================================
           VIEW 1: ADD / EDIT DESTINATION FORM
           ========================================================================= */}
        {isAddingDestination || editingDestination ? (
          <div>
            {/* Header */}
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
                {editingDestination ? `Edit Destination — ${editingDestination.name}` : 'Add New Destination'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingDestination(false)
                  setEditingDestination(null)
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
                }}
              >
                Back
              </button>
            </div>

            {/* Destination Form */}
            <form onSubmit={handleSubmitDestination} style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                {/* Destination Name */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Destination / District Name: *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kohima, Dimapur, Chümoukedima"
                    value={destFormName}
                    onChange={(e) => setDestFormName(e.target.value)}
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
                    required
                  />
                </div>

                {/* Distance detail */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Distance / Travel Time:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20 Mins from Dimapur, or 2 Hrs from Kohima"
                    value={destFormDistance}
                    onChange={(e) => setDestFormDistance(e.target.value)}
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
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                {/* Transport detail */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Transport Modes Available:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flight and Train Available, or Bus and Taxi Available"
                    value={destFormTransport}
                    onChange={(e) => setDestFormTransport(e.target.value)}
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
                  />
                </div>

                {/* Accommodation detail */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Accommodation Note:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Homestays Available, or Hotels & Resorts"
                    value={destFormStay}
                    onChange={(e) => setDestFormStay(e.target.value)}
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
                  />
                </div>
              </div>

              {/* Cover Image Upload / URL */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  Destination Cover Photo:
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Paste image URL or upload image file below"
                    value={destFormImageUrl}
                    onChange={(e) => {
                      setDestFormImageUrl(e.target.value)
                      setDestFilePreview(null)
                    }}
                    style={{
                      flex: 1,
                      minWidth: '280px',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="file"
                    ref={destFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setDestFile(f)
                        setDestFilePreview(URL.createObjectURL(f))
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => destFileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '10px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={15} /> Upload Photo
                  </button>
                </div>

                {/* Preview */}
                {(destFilePreview || destFormImageUrl) && (
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '120px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img
                        src={destFilePreview || destFormImageUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {destFile && (
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                        Selected: {destFile.name} (will be uploaded to Firebase Storage)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
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
                  {isSaving ? 'Saving...' : editingDestination ? 'Save Changes' : 'Create Destination'}
                </button>
              </div>
            </form>
          </div>
        ) : isAddingSpot || editingSpotIndex !== null ? (
          /* =========================================================================
             VIEW 2: ADD / EDIT SPOT FORM
             ========================================================================= */
          <div>
            {/* Header */}
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
                {editingSpotIndex !== null
                  ? `Edit Spot — ${spotName || 'Suggested Place'}`
                  : `Add Suggested Spot to ${activeDestination?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingSpot(false)
                  setEditingSpotIndex(null)
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
                }}
              >
                Back to {activeDestination?.name} Spots
              </button>
            </div>

            {/* Spot Form */}
            <form onSubmit={handleSubmitSpot} style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                {/* Spot Name */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Spot Name: *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kisama Heritage Village, Kachari Ruins"
                    value={spotName}
                    onChange={(e) => setSpotName(e.target.value)}
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
                    required
                  />
                </div>

                {/* Visiting Timing */}
                <div>
                  <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                    Visiting Timing:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9AM to 5PM (Monday Closed), or Open 24/7"
                    value={spotTiming}
                    onChange={(e) => setSpotTiming(e.target.value)}
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
                  />
                </div>
              </div>

              {/* Google Maps Link */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  Google Maps URL:
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://www.google.com/maps/search/?api=1&query=..."
                  value={spotMap}
                  onChange={(e) => setSpotMap(e.target.value)}
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
                />
              </div>

              {/* Photo / Image */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  Spot Photo / Image:
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Paste image URL or upload image file"
                    value={spotImageUrl}
                    onChange={(e) => {
                      setSpotImageUrl(e.target.value)
                      setSpotFilePreview(null)
                    }}
                    style={{
                      flex: 1,
                      minWidth: '280px',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="file"
                    ref={spotFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setSpotFile(f)
                        setSpotFilePreview(URL.createObjectURL(f))
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => spotFileInputRef.current?.click()}
                    style={{
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '10px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={15} /> Upload Photo
                  </button>
                </div>

                {/* Preview */}
                {(spotFilePreview || spotImageUrl) && (
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '120px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img
                        src={spotFilePreview || spotImageUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {spotFile && (
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                        Selected: {spotFile.name} (will be uploaded to Firebase Storage)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', color: '#0b8462', fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
                  Description:
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed description about this tourist spot..."
                  value={spotDescription}
                  onChange={(e) => setSpotDescription(e.target.value)}
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
                />
              </div>

              {/* Submit */}
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
                  {isSaving ? 'Saving...' : editingSpotIndex !== null ? 'Save Changes' : 'Add Spot'}
                </button>
              </div>
            </form>
          </div>
        ) : activeDestination ? (
          /* =========================================================================
             VIEW 3: SPOTS TABLE FOR A SPECIFIC DESTINATION (e.g. KOHIMA)
             ========================================================================= */
          <div>
            {/* Top Bar with Back button and Add Spot button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDestId(null)}
                  style={{
                    backgroundColor: '#4b5563',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '6px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  &larr; Back to Destinations
                </button>
                <div>
                  <h3 style={{ color: '#0b8462', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                    {activeDestination.name} — Suggested Tourist Spots
                  </h3>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                    {activeDestination.spots.length} tourist spots currently shown in the app
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartAddSpot}
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
                }}
              >
                <Plus size={16} /> Add New Spot
              </button>
            </div>

            {/* Destination Info Summary Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 18px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              {activeDestination.imageUrl && (
                <img
                  src={activeDestination.imageUrl}
                  alt={activeDestination.name}
                  style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {activeDestination.details?.map((det, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      color: '#334155',
                      fontWeight: 500,
                    }}
                  >
                    <Compass size={13} color="#0b8462" />
                    {det.text.replace('\n', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Table of Spots */}
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
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '100px' }}>
                      Photo
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '220px' }}>
                      Spot Name
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '180px' }}>
                      Visiting Timing
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '80px', textAlign: 'center' }}>
                      Map
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '90px', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeDestination.spots.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                        No tourist spots added to {activeDestination.name} yet. Click "+ Add New Spot" above to add one.
                      </td>
                    </tr>
                  ) : (
                    activeDestination.spots.map((spot, index) => (
                      <tr
                        key={index}
                        style={{
                          verticalAlign: 'middle',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafdfb',
                        }}
                      >
                        {/* Sl No. */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontWeight: 500 }}>
                          {index + 1}
                        </td>

                        {/* Photo */}
                        <td style={{ padding: '10px 14px', border: '1px solid #e2ece7' }}>
                          {spot.imageUrl ? (
                            <img
                              src={spot.imageUrl}
                              alt={spot.name}
                              onClick={() => setPreviewImage({ src: spot.imageUrl, title: spot.name })}
                              style={{
                                width: '70px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: '1px solid #e5e7eb',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '70px',
                                height: '50px',
                                borderRadius: '4px',
                                backgroundColor: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                color: '#9ca3af',
                              }}
                            >
                              No Image
                            </div>
                          )}
                        </td>

                        {/* Spot Name */}
                        <td style={{ padding: '14px 14px', color: '#1f2937', fontWeight: 600, border: '1px solid #e2ece7' }}>
                          {spot.name}
                        </td>

                        {/* Visiting Timing */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontSize: '13px' }}>
                          {spot.timing ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} color="#0b8462" /> {spot.timing}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* Description */}
                        <td style={{ padding: '14px 14px', color: '#374151', border: '1px solid #e2ece7', fontSize: '13px', lineHeight: 1.45 }}>
                          {spot.description ? (
                            <div style={{ maxHeight: '72px', overflowY: 'auto' }}>
                              {spot.description}
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description provided</span>
                          )}
                        </td>

                        {/* Google Maps Link */}
                        <td style={{ padding: '14px 14px', textAlign: 'center', border: '1px solid #e2ece7' }}>
                          {spot.map ? (
                            <a
                              href={spot.map}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open in Google Maps"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#0b8462',
                                border: '1px solid #a7f3d0',
                                textDecoration: 'none',
                              }}
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '14px 14px', border: '1px solid #e2ece7', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditSpot(spot, index)}
                              title="Edit Spot"
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
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpot(index, spot.name)}
                              title="Delete Spot"
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
                              }}
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
        ) : (
          /* =========================================================================
             VIEW 4: ALL DESTINATIONS OVERVIEW (KOHIMA, DIMAPUR, CHUMOUKEDIMA, ETC.)
             ========================================================================= */
          <div>
            {/* Top Row: Add Destination button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleStartAddDestination}
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
                }}
              >
                <Plus size={16} /> Add Destination
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
                marginBottom: '24px',
                backgroundColor: '#ffffff',
              }}
            >
              <Search size={18} color="#6b7280" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by Destination Name (e.g. Kohima, Dimapur) or Tourist Spot Name"
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

            {/* Destinations Table */}
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
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '110px' }}>
                      Cover Photo
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '170px' }}>
                      Destination
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '130px', textAlign: 'center' }}>
                      Suggested Spots
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>
                      Travel & Stay Info
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '220px', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDestinations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                        No destinations found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredDestinations.map((dest, index) => (
                      <tr
                        key={dest.id}
                        style={{
                          verticalAlign: 'middle',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafdfb',
                        }}
                      >
                        {/* Sl No. */}
                        <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7', fontWeight: 500 }}>
                          {index + 1}
                        </td>

                        {/* Cover Photo */}
                        <td style={{ padding: '10px 16px', border: '1px solid #e2ece7' }}>
                          {dest.imageUrl ? (
                            <img
                              src={dest.imageUrl}
                              alt={dest.name}
                              onClick={() => setPreviewImage({ src: dest.imageUrl, title: dest.name })}
                              style={{
                                width: '80px',
                                height: '52px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: '1px solid #e5e7eb',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '80px',
                                height: '52px',
                                borderRadius: '4px',
                                backgroundColor: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                color: '#9ca3af',
                              }}
                            >
                              No Image
                            </div>
                          )}
                        </td>

                        {/* Destination Name */}
                        <td style={{ padding: '14px 16px', color: '#1f2937', fontWeight: 700, border: '1px solid #e2ece7', fontSize: '15px' }}>
                          {dest.name}
                        </td>

                        {/* Suggested Spots Count Badge */}
                        <td style={{ padding: '14px 16px', textAlign: 'center', border: '1px solid #e2ece7' }}>
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {dest.spots.length} Spots
                          </span>
                        </td>

                        {/* Travel & Stay Info */}
                        <td style={{ padding: '14px 16px', border: '1px solid #e2ece7' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {dest.details && dest.details.length > 0 ? (
                              dest.details.map((d, i) => (
                                <span
                                  key={i}
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#475569',
                                  }}
                                >
                                  {d.text.replace('\n', ' ')}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', border: '1px solid #e2ece7', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {/* Primary Button to Open Tourist Spots */}
                            <button
                              type="button"
                              onClick={() => setSelectedDestId(dest.id)}
                              style={{
                                backgroundColor: '#0b8462',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Manage Spots ({dest.spots.length}) <ArrowRight size={13} />
                            </button>

                            {/* Edit Destination */}
                            <button
                              type="button"
                              onClick={() => handleStartEditDestination(dest)}
                              title="Edit Destination Info"
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
                              }}
                            >
                              <Pencil size={13} />
                            </button>

                            {/* Delete Destination */}
                            <button
                              type="button"
                              onClick={() => handleDeleteDestination(dest.id, dest.name)}
                              title="Delete Destination"
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
                              }}
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

      {/* Image Modal Preview */}
      {previewImage && (
        <ImageModal
          src={previewImage.src}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
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
          }}
        >
          <CheckCircle size={18} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
