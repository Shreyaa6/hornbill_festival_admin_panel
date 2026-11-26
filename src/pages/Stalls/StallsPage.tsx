import { useState, useEffect } from 'react'
import { Search, Edit3, Trash2 } from 'lucide-react'
import { INITIAL_STALLS_DATA } from '@/data/stallsData'
import type { StallItem } from '@/types'
import {
  subscribeStalls,
  addStall,
  updateStall,
  deleteStall,
} from '@/services/firebase/stalls'

export function StallsPage() {
  const [stalls, setStalls] = useState<StallItem[]>(INITIAL_STALLS_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeStalls((liveStalls) => {
      if (liveStalls && liveStalls.length > 0) {
        setStalls(liveStalls)
      }
    })
    return () => unsubscribe()
  }, [])

  // Add form fields
  const [newStallName, setNewStallName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newPhoneNumber, setNewPhoneNumber] = useState('')

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStallName, setEditStallName] = useState('')
  const [editOwnerName, setEditOwnerName] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')

  const handleStartEdit = (stall: StallItem) => {
    setEditingId(stall.id)
    setEditStallName(stall.stallName)
    setEditOwnerName(stall.ownerName)
    setEditPhoneNumber(stall.phoneNumber.replace('+91-', ''))
  }

  const handleSaveEdit = async (id: string) => {
    const phoneVal = editPhoneNumber ? `+91-${editPhoneNumber}` : '+91-'
    try {
      await updateStall(id, {
        stallName: editStallName,
        ownerName: editOwnerName,
        phoneNumber: phoneVal,
      })
    } catch (err) {
      console.error('Error updating stall in Firestore:', err)
    }
    setStalls((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              stallName: editStallName,
              ownerName: editOwnerName,
              phoneNumber: phoneVal,
            }
          : s
      )
    )
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stall?')) {
      try {
        await deleteStall(id)
      } catch (err) {
        console.error('Error deleting stall from Firestore:', err)
      }
      setStalls((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStallName.trim() || !newOwnerName.trim()) {
      alert('Please enter stall name and owner name.')
      return
    }

    const phoneVal = newPhoneNumber.trim() ? `+91-${newPhoneNumber.trim()}` : '+91-'
    const newStallData = {
      stallName: newStallName.trim(),
      ownerName: newOwnerName.trim(),
      phoneNumber: phoneVal,
    }

    try {
      await addStall(newStallData)
      setNewStallName('')
      setNewOwnerName('')
      setNewPhoneNumber('')
      setIsAddingNew(false)
    } catch (err: any) {
      console.error('Error adding stall to Firestore:', err)
      alert(`Error adding stall: ${err.message || 'Unknown error'}`)
    }
  }

  const filteredStalls = stalls.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      s.stallName.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q) ||
      s.phoneNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Title */}
      <h2
        style={{
          textAlign: 'center',
          color: '#0b8462',
          fontSize: '26px',
          fontWeight: 700,
          marginBottom: '20px',
        }}
      >
        Stalls
      </h2>

      {/* Main Card */}
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
          /* Add New Stall View */
          <div>
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
              <h3 style={{ color: '#0b8462', fontSize: '20px', fontWeight: 700 }}>Add New Stall</h3>
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
                }}
              >
                Back
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit} style={{ maxWidth: '960px', margin: '0 auto' }}>
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
                      marginBottom: '6px',
                    }}
                  >
                    Stall Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter stall name"
                    value={newStallName}
                    onChange={(e) => setNewStallName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#0b8462',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '6px',
                    }}
                  >
                    Owner's Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter owner's name"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '32px', maxWidth: '48%' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#0b8462',
                    fontWeight: 700,
                    fontSize: '14px',
                    marginBottom: '6px',
                  }}
                >
                  Phone Number:
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0b8462',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '10px 48px',
                    borderRadius: '6px',
                  }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Stalls Table View with Full Grid Borders */
          <div>
            {/* Top Row with Add Stall Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                style={{
                  backgroundColor: '#0b8462',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '8px 20px',
                  borderRadius: '6px',
                }}
              >
                Add Stall
              </button>
            </div>

            {/* Search Input */}
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
                placeholder="Search by Stall Name/Owner's Name/Phone Number"
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

            {/* Table with Grid Borders */}
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
                  <tr style={{ backgroundColor: '#e2f6ee' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '80px' }}>Sl No.</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '28%' }}>Stall Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '32%' }}>Owner's Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de' }}>Phone Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#000000', border: '1px solid #d5e6de', width: '130px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStalls.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                        No stalls found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStalls.map((stall, index) => {
                      const isEditing = editingId === stall.id

                      return (
                        <tr
                          key={stall.id}
                          style={{
                            verticalAlign: 'middle',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          {/* Sl No. */}
                          <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7' }}>
                            {stall.slNo && stall.slNo < 10000 ? stall.slNo : index + 1}
                          </td>

                          {/* Stall Name */}
                          <td style={{ padding: '14px 16px', color: '#1f2937', fontWeight: 500, border: '1px solid #e2ece7' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editStallName}
                                onChange={(e) => setEditStallName(e.target.value)}
                                style={{
                                  width: '90%',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #3b82f6',
                                  outline: 'none',
                                  fontSize: '13.5px',
                                }}
                              />
                            ) : (
                              stall.stallName
                            )}
                          </td>

                          {/* Owner's Name */}
                          <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editOwnerName}
                                onChange={(e) => setEditOwnerName(e.target.value)}
                                style={{
                                  width: '90%',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #3b82f6',
                                  outline: 'none',
                                  fontSize: '13.5px',
                                }}
                              />
                            ) : (
                              stall.ownerName
                            )}
                          </td>

                          {/* Phone Number */}
                          <td style={{ padding: '14px 16px', color: '#374151', border: '1px solid #e2ece7' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                placeholder="10 digits"
                                value={editPhoneNumber}
                                onChange={(e) => setEditPhoneNumber(e.target.value)}
                                style={{
                                  width: '140px',
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #3b82f6',
                                  outline: 'none',
                                  fontSize: '13.5px',
                                }}
                              />
                            ) : (
                              stall.phoneNumber
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ padding: '14px 16px', border: '1px solid #e2ece7' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(stall.id)}
                                  style={{
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  style={{
                                    backgroundColor: '#4b5563',
                                    color: '#ffffff',
                                    padding: '5px 12px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(stall)}
                                  title="Edit Stall"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    backgroundColor: '#14b8a6',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(stall.id)}
                                  title="Delete Stall"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Trash2 size={16} />
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
        )}
      </div>
    </div>
  )
}
