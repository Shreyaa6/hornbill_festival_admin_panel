import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/common/CustomDropdown'
import { ImageModal } from '@/components/common/ImageModal'
import { INITIAL_TOUR_OPERATORS_DATA, TOUR_OPERATOR_SERVICES } from '@/data/tourOperatorsData'
import { NAGALAND_DISTRICTS, STATUS_OPTIONS } from '@/data/districts'
import type { TourOperatorItem } from '@/types'
import { subscribeTourOperators, toggleTourOperatorStatus } from '@/services/firebase/tourOperators'

export function TourOperatorsPage() {
  const [tourOperators, setTourOperators] = useState<TourOperatorItem[]>(INITIAL_TOUR_OPERATORS_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)

  const handleToggleStatus = async (op: TourOperatorItem) => {
    const nextActive = op.status !== 'Active'
    setTourOperators((prev) =>
      prev.map((o) =>
        o.id === op.id ? { ...o, status: nextActive ? 'Active' : 'Inactive' } : o
      )
    )
    try {
      await toggleTourOperatorStatus(op.id, nextActive)
    } catch (err) {
      console.error('Error toggling tour operator status:', err)
      setTourOperators((prev) =>
        prev.map((o) => (o.id === op.id ? { ...o, status: op.status } : o))
      )
      alert('Unable to update tour operator status. Please try again.')
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeTourOperators((liveOperators) => {
      if (liveOperators && liveOperators.length > 0) {
        setTourOperators(liveOperators)
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredOperators = useMemo(() => {
    return tourOperators.filter((op) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        op.businessName.toLowerCase().includes(q) ||
        op.ownerName.toLowerCase().includes(q) ||
        op.phoneNumber.toLowerCase().includes(q) ||
        op.address.toLowerCase().includes(q)

      // Service filter
      const matchesService =
        serviceFilter === 'All' || op.services.includes(serviceFilter)

      // District filter
      const matchesDistrict = districtFilter === 'All' || op.district === districtFilter

      // Status filter
      const matchesStatus = statusFilter === 'All' || op.status === statusFilter

      return matchesSearch && matchesService && matchesDistrict && matchesStatus
    })
  }, [tourOperators, searchQuery, serviceFilter, districtFilter, statusFilter])

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
        Tour Operators
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
            placeholder="Search by Business Name, Owner's Name or Phone Number"
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

        {/* Filters Row */}
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
          {/* Services Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Services:</span>
            <CustomDropdown
              options={TOUR_OPERATOR_SERVICES}
              value={serviceFilter}
              onChange={setServiceFilter}
              minWidth="150px"
            />
          </div>

          {/* District Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>District:</span>
            <CustomDropdown
              options={NAGALAND_DISTRICTS}
              value={districtFilter}
              onChange={setDistrictFilter}
              minWidth="170px"
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Status:</span>
            <CustomDropdown
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              minWidth="130px"
            />
          </div>
        </div>

        {/* Responsive Table with Full Grid Borders */}
        <div style={{ overflowX: 'auto', width: '100%', borderRadius: '4px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
              minWidth: '1100px',
              backgroundColor: '#ffffff',
              border: '1px solid #d5e6de',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#e2f6ee' }}>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '55px',
                  }}
                >
                  Sl No.
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '130px',
                  }}
                >
                  Banner/Cover Photo
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '140px',
                  }}
                >
                  Business Name
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '160px',
                  }}
                >
                  Address
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '90px',
                  }}
                >
                  District
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '120px',
                  }}
                >
                  Owner's Name
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '110px',
                  }}
                >
                  Phone Number
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '120px',
                  }}
                >
                  Govt ID
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '180px',
                  }}
                >
                  Services
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '90px',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                    No tour operators found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => (
                  <tr
                    key={op.id}
                    style={{
                      verticalAlign: 'middle',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {/* Sl No. */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#000000',
                        fontWeight: 400,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.slNo}
                    </td>

                    {/* Banner/Cover Photo */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div
                        onClick={() => setSelectedImage({ src: op.bannerPhoto, title: op.businessName })}
                        style={{
                          width: '92px',
                          height: '56px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                        }}
                      >
                        <img
                          src={op.bannerPhoto}
                          alt={op.businessName}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    </td>

                    {/* Business Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        fontWeight: 500,
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.3,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.businessName}
                    </td>

                    {/* Address */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.address}
                    </td>

                    {/* District */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.district}
                    </td>

                    {/* Owner's Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.ownerName}
                    </td>

                    {/* Phone Number */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.3,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.phoneNumber}
                    </td>

                    {/* Govt ID */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {op.govtIdPhoto ? (
                        <div
                          onClick={() => setSelectedImage({ src: op.govtIdPhoto!, title: `${op.businessName} - Govt ID` })}
                          style={{
                            width: '92px',
                            height: '56px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={op.govtIdPhoto}
                            alt="Govt ID"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '92px',
                            height: '56px',
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#9ca3af',
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </td>

                    {/* Services */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {op.services.map((svc) => (
                          <span
                            key={svc}
                            style={{
                              backgroundColor: '#e2f6ee',
                              color: '#00a877',
                              fontSize: '12px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              fontWeight: 500,
                            }}
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(op)}
                        title={`Click to toggle status to ${op.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: op.status === 'Active' ? '#28a745' : '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, transform 0.1s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {op.status}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImageModal
        src={selectedImage?.src || null}
        title={selectedImage?.title}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  )
}
