import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/common/CustomDropdown'
import { ImageModal } from '@/components/common/ImageModal'
import { INITIAL_TOUR_GUIDES_DATA } from '@/data/tourGuidesData'
import { NAGALAND_DISTRICTS, STATUS_OPTIONS } from '@/data/districts'
import type { TourGuideItem } from '@/types'
import { subscribeTourGuides, toggleTourGuideStatus } from '@/services/firebase/tourGuides'

export function TourGuidesPage() {
  const [tourGuides, setTourGuides] = useState<TourGuideItem[]>(INITIAL_TOUR_GUIDES_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)

  const handleToggleStatus = async (guide: TourGuideItem) => {
    const nextActive = guide.status !== 'Active'
    setTourGuides((prev) =>
      prev.map((g) =>
        g.id === guide.id ? { ...g, status: nextActive ? 'Active' : 'Inactive' } : g
      )
    )
    try {
      await toggleTourGuideStatus(guide.id, nextActive)
    } catch (err) {
      console.error('Error toggling tour guide status:', err)
      setTourGuides((prev) =>
        prev.map((g) => (g.id === guide.id ? { ...g, status: guide.status } : g))
      )
      alert('Unable to update tour guide status. Please try again.')
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeTourGuides((liveGuides) => {
      if (liveGuides && liveGuides.length > 0) {
        setTourGuides(liveGuides)
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredGuides = useMemo(() => {
    return tourGuides.filter((guide) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        guide.name.toLowerCase().includes(q) ||
        guide.phoneNumber.toLowerCase().includes(q) ||
        guide.address.toLowerCase().includes(q)

      // District filter
      const matchesDistrict =
        districtFilter === 'All' ||
        guide.district.toLowerCase() === districtFilter.toLowerCase()

      // Status filter
      const matchesStatus = statusFilter === 'All' || guide.status === statusFilter

      return matchesSearch && matchesDistrict && matchesStatus
    })
  }, [tourGuides, searchQuery, districtFilter, statusFilter])

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
        Tour Guides
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
            placeholder="Search by Tour Guide's Name or Phone Number"
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

        {/* Filters Row - Only 2 Filters as shown in screenshots */}
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
              fontSize: '13.5px',
              textAlign: 'left',
              minWidth: '1000px',
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
                    width: '170px',
                  }}
                >
                  Tour Guide's Name
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '280px',
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
                    width: '110px',
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
                    width: '150px',
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
                  NTA ID Card
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
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                    No tour guides found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredGuides.map((guide) => (
                  <tr
                    key={guide.id}
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
                      {guide.slNo}
                    </td>

                    {/* Tour Guide's Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        fontWeight: 500,
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {guide.name}
                    </td>

                    {/* Address */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {guide.address}
                    </td>

                    {/* District */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {guide.district}
                    </td>

                    {/* Phone Number */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {guide.phoneNumber}
                    </td>

                    {/* NTA ID Card */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div
                        onClick={() => setSelectedImage({ src: guide.ntaIdCardPhoto, title: `${guide.name} - NTA ID Card` })}
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
                          src={guide.ntaIdCardPhoto}
                          alt="NTA ID Card"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
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
                        onClick={() => handleToggleStatus(guide)}
                        title={`Click to toggle status to ${guide.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: guide.status === 'Active' ? '#28a745' : '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, transform 0.1s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {guide.status}
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
