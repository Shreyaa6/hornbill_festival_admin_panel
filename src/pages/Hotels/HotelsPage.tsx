import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/common/CustomDropdown'
import { ImageModal } from '@/components/common/ImageModal'
import { INITIAL_HOTELS_DATA } from '@/data/hotelsData'
import { NAGALAND_DISTRICTS, PROPERTY_TYPES, STATUS_OPTIONS } from '@/data/districts'
import type { HotelPG } from '@/types'
import { subscribeHotels, toggleHotelStatus } from '@/services/firebase/hotels'

export function HotelsPage() {
  const [hotels, setHotels] = useState<HotelPG[]>(INITIAL_HOTELS_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)

  const handleToggleStatus = async (hotel: HotelPG) => {
    const nextActive = hotel.status !== 'Active'
    setHotels((prev) =>
      prev.map((h) =>
        h.id === hotel.id ? { ...h, status: nextActive ? 'Active' : 'Inactive' } : h
      )
    )
    try {
      await toggleHotelStatus(hotel.id, nextActive)
    } catch (err) {
      console.error('Error toggling hotel status:', err)
      setHotels((prev) =>
        prev.map((h) => (h.id === hotel.id ? { ...h, status: hotel.status } : h))
      )
      alert('Unable to update hotel status. Please try again.')
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeHotels((liveHotels) => {
      if (liveHotels && liveHotels.length > 0) {
        setHotels(liveHotels)
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      // Search
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        h.name.toLowerCase().includes(query) ||
        h.ownerName.toLowerCase().includes(query) ||
        h.phoneNumber.toLowerCase().includes(query) ||
        h.townVillage.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query)

      // Property Type
      const matchesType = propertyTypeFilter === 'All' || h.propertyType === propertyTypeFilter

      // District
      const matchesDistrict = districtFilter === 'All' || h.district === districtFilter

      // Status
      const matchesStatus = statusFilter === 'All' || h.status === statusFilter

      return matchesSearch && matchesType && matchesDistrict && matchesStatus
    })
  }, [hotels, searchQuery, propertyTypeFilter, districtFilter, statusFilter])

  return (
    <div style={{ maxWidth: '1540px', margin: '0 auto' }}>
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
        Hotels & Guest House
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
            placeholder="Search by Hotel/PG Name, Owner's Name or Phone Number"
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
          {/* Property Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Property Type:</span>
            <CustomDropdown
              options={PROPERTY_TYPES}
              value={propertyTypeFilter}
              onChange={setPropertyTypeFilter}
              minWidth="140px"
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
              minWidth: '1300px',
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
                    width: '125px',
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
                    width: '130px',
                  }}
                >
                  Hotel/PG Name
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '210px',
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
                    width: '105px',
                  }}
                >
                  Town/Village
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
                    width: '110px',
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
                    width: '95px',
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
                    width: '110px',
                  }}
                >
                  Property Type
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
                  Google Maps Link
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '135px',
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
                    width: '155px',
                  }}
                >
                  Amenities
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
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                    No hotels or guest houses match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((hotel) => (
                  <tr
                    key={hotel.id}
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
                      {hotel.slNo}
                    </td>

                    {/* Banner/Cover Photo */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div
                        onClick={() => setSelectedImage({ src: hotel.bannerPhoto, title: hotel.name })}
                        style={{
                          width: '92px',
                          height: '58px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={hotel.bannerPhoto}
                          alt={hotel.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>

                    {/* Hotel Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        fontWeight: 700,
                        color: '#00a877',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.3,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.name}
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
                      {hotel.address}
                    </td>

                    {/* Town/Village */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.townVillage}
                    </td>

                    {/* District */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.district}
                    </td>

                    {/* Owner Name */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.ownerName}
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
                      {hotel.phoneNumber}
                    </td>

                    {/* Property Type */}
                    <td
                      style={{
                        padding: '16px 14px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.propertyType}
                    </td>

                    {/* Google Maps Link */}
                    <td
                      style={{
                        padding: '16px 14px',
                        border: '1px solid #e2ece7',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hotel.googleMapsLink ? (
                        <a
                          href={hotel.googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#00a877', textDecoration: 'none', fontWeight: 500 }}
                        >
                          View on Map
                        </a>
                      ) : (
                        <span style={{ color: '#00a877', fontWeight: 500 }}>—</span>
                      )}
                    </td>

                    {/* Govt ID */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {hotel.govtIdPhoto ? (
                        <div
                          onClick={() => setSelectedImage({ src: hotel.govtIdPhoto!, title: `${hotel.name} - Govt ID` })}
                          style={{
                            width: '92px',
                            height: '58px',
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
                            src={hotel.govtIdPhoto}
                            alt="Govt ID"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '92px',
                            height: '58px',
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

                    {/* Amenities */}
                    <td
                      style={{
                        padding: '14px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {hotel.amenities.map((amenity) => (
                          <span
                            key={amenity}
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
                            {amenity}
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
                        onClick={() => handleToggleStatus(hotel)}
                        title={`Click to toggle status to ${hotel.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: hotel.status === 'Active' ? '#28a745' : '#dc3545',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, transform 0.1s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {hotel.status}
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
