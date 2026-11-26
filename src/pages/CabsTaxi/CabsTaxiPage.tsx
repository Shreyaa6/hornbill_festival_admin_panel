import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/common/CustomDropdown'
import { ImageModal } from '@/components/common/ImageModal'
import { INITIAL_CABS_DATA, SEATER_TYPES } from '@/data/cabsData'
import { NAGALAND_DISTRICTS, STATUS_OPTIONS } from '@/data/districts'
import type { CabTaxiItem } from '@/types'
import { subscribeTaxis, toggleTaxiStatus } from '@/services/firebase/taxis'

export function CabsTaxiPage() {
  const [cabs, setCabs] = useState<CabTaxiItem[]>(INITIAL_CABS_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [seaterTypeFilter, setSeaterTypeFilter] = useState('All')
  const [districtServingFilter, setDistrictServingFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)

  const handleToggleStatus = async (cab: CabTaxiItem) => {
    const nextActive = cab.status !== 'Active'
    setCabs((prev) =>
      prev.map((c) =>
        c.id === cab.id ? { ...c, status: nextActive ? 'Active' : 'Inactive' } : c
      )
    )
    try {
      await toggleTaxiStatus(cab.id, nextActive)
    } catch (err) {
      console.error('Error toggling taxi status:', err)
      setCabs((prev) =>
        prev.map((c) => (c.id === cab.id ? { ...c, status: cab.status } : c))
      )
      alert('Unable to update taxi status. Please try again.')
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeTaxis((liveTaxis) => {
      if (liveTaxis && liveTaxis.length > 0) {
        setCabs(liveTaxis)
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredCabs = useMemo(() => {
    return cabs.filter((cab) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        cab.carModel.toLowerCase().includes(q) ||
        cab.driverName.toLowerCase().includes(q) ||
        cab.phoneNumber.toLowerCase().includes(q) ||
        cab.address.toLowerCase().includes(q)

      // Seater type filter
      const matchesSeater =
        seaterTypeFilter === 'All' || cab.seaterType === seaterTypeFilter

      // District Serving filter
      const matchesDistrict =
        districtServingFilter === 'All' ||
        cab.districtsServing.some(
          (d) => d.toLowerCase() === districtServingFilter.toLowerCase()
        )

      // Status filter
      const matchesStatus = statusFilter === 'All' || cab.status === statusFilter

      return matchesSearch && matchesSeater && matchesDistrict && matchesStatus
    })
  }, [cabs, searchQuery, seaterTypeFilter, districtServingFilter, statusFilter])

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
        Cabs & Taxi
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
            placeholder="Search by Car Model, Driver's Name or Phone Number"
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
          {/* Seater Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Seater Type:</span>
            <CustomDropdown
              options={SEATER_TYPES}
              value={seaterTypeFilter}
              onChange={setSeaterTypeFilter}
              minWidth="140px"
            />
          </div>

          {/* District Serving Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>District Serving:</span>
            <CustomDropdown
              options={NAGALAND_DISTRICTS}
              value={districtServingFilter}
              onChange={setDistrictServingFilter}
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
              minWidth: '1150px',
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
                    width: '110px',
                  }}
                >
                  Car Model
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '190px',
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
                    width: '130px',
                  }}
                >
                  Driver's Name
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
                    width: '95px',
                  }}
                >
                  Seater Type
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '115px',
                  }}
                >
                  Driving License
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '240px',
                  }}
                >
                  Districts Serving
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '85px',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCabs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                    No cabs or taxis found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCabs.map((cab) => (
                  <tr
                    key={cab.id}
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
                      {cab.slNo}
                    </td>

                    {/* Car Model */}
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
                      {cab.carModel}
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
                      {cab.address}
                    </td>

                    {/* Driver's Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {cab.driverName}
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
                      {cab.phoneNumber}
                    </td>

                    {/* Seater Type */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {cab.seaterType}
                    </td>

                    {/* Driving License */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div
                        onClick={() => setSelectedImage({ src: cab.drivingLicensePhoto, title: `${cab.driverName} - Driving License` })}
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
                          src={cab.drivingLicensePhoto}
                          alt="Driving License"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>

                    {/* Districts Serving */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {cab.districtsServing.map((dist) => (
                          <span
                            key={dist}
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
                            {dist}
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
                        onClick={() => handleToggleStatus(cab)}
                        title={`Click to toggle status to ${cab.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: cab.status === 'Active' ? '#28a745' : '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, transform 0.1s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {cab.status}
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
