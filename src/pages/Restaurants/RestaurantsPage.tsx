import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import { CustomDropdown } from '@/components/common/CustomDropdown'
import { ImageModal } from '@/components/common/ImageModal'
import { INITIAL_RESTAURANTS_DATA, CUISINE_OPTIONS } from '@/data/restaurantsData'
import { NAGALAND_DISTRICTS, STATUS_OPTIONS } from '@/data/districts'
import type { RestaurantCafeItem } from '@/types'
import { subscribeCafes, toggleCafeStatus } from '@/services/firebase/cafes'

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantCafeItem[]>(INITIAL_RESTAURANTS_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [districtFilter, setDistrictFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null)

  const handleToggleStatus = async (rest: RestaurantCafeItem) => {
    const nextActive = rest.status !== 'Active'
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === rest.id ? { ...r, status: nextActive ? 'Active' : 'Inactive' } : r
      )
    )
    try {
      await toggleCafeStatus(rest.id, nextActive)
    } catch (err) {
      console.error('Error toggling cafe status:', err)
      setRestaurants((prev) =>
        prev.map((r) => (r.id === rest.id ? { ...r, status: rest.status } : r))
      )
      alert('Unable to update restaurant status. Please try again.')
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeCafes((liveCafes) => {
      if (liveCafes && liveCafes.length > 0) {
        setRestaurants(liveCafes)
      }
    })
    return () => unsubscribe()
  }, [])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.phoneNumber.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)

      // Cuisine filter
      const matchesCuisine =
        cuisineFilter === 'All' || r.cuisines.includes(cuisineFilter)

      // District filter
      const matchesDistrict =
        districtFilter === 'All' || r.district.toLowerCase() === districtFilter.toLowerCase()

      // Status filter
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter

      return matchesSearch && matchesCuisine && matchesDistrict && matchesStatus
    })
  }, [restaurants, searchQuery, cuisineFilter, districtFilter, statusFilter])

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
        Restaurants & Cafes
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
            placeholder="Search by Restaurant/Cafe Name or Phone Number"
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
          {/* Cuisines/Dishes Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#0b8462', fontWeight: 700, fontSize: '15px' }}>Cuisines/Dishes:</span>
            <CustomDropdown
              options={CUISINE_OPTIONS}
              value={cuisineFilter}
              onChange={setCuisineFilter}
              minWidth="160px"
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
              fontSize: '12.5px',
              textAlign: 'left',
              backgroundColor: '#ffffff',
              border: '1px solid #d5e6de',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#e2f6ee' }}>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '50px',
                    textAlign: 'center',
                  }}
                >
                  Sl No.
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '95px',
                  }}
                >
                  Banner/Cover Photo
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '130px',
                  }}
                >
                  Restaurant/Cafe Name
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '110px',
                  }}
                >
                  Address
                </th>
                <th
                  style={{
                    padding: '10px 8px',
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
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '75px',
                  }}
                >
                  District
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '90px',
                  }}
                >
                  Google Maps Link
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '85px',
                    textAlign: 'center',
                  }}
                >
                  Menu Images
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '125px',
                  }}
                >
                  Cuisines/Dishes
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 700,
                    color: '#000000',
                    border: '1px solid #d5e6de',
                    width: '75px',
                    textAlign: 'center',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#6b7280', border: '1px solid #e2ece7' }}>
                    No restaurants or cafes found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((rest) => (
                  <tr
                    key={rest.id}
                    style={{
                      verticalAlign: 'middle',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {/* Sl No. */}
                    <td
                      style={{
                        padding: '10px 8px',
                        color: '#000000',
                        fontWeight: 400,
                        border: '1px solid #e2ece7',
                        textAlign: 'center',
                      }}
                    >
                      {rest.slNo}
                    </td>

                    {/* Banner/Cover Photo */}
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div
                        onClick={() => setSelectedImage({ src: rest.bannerPhoto, title: rest.name })}
                        style={{
                          width: '80px',
                          height: '50px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={rest.bannerPhoto}
                          alt={rest.name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>

                    {/* Restaurant/Cafe Name */}
                    <td
                      style={{
                        padding: '10px 8px',
                        fontWeight: 500,
                        color: '#111827',
                        border: '1px solid #e2ece7',
                        wordBreak: 'break-word',
                      }}
                    >
                      {rest.name}
                    </td>

                    {/* Address */}
                    <td
                      style={{
                        padding: '10px 8px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.35,
                        border: '1px solid #e2ece7',
                        wordBreak: 'break-word',
                        maxWidth: '120px',
                      }}
                    >
                      {rest.address}
                    </td>

                    {/* Phone Number */}
                    <td
                      style={{
                        padding: '10px 8px',
                        color: '#111827',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.3,
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {rest.phoneNumber}
                    </td>

                    {/* District */}
                    <td
                      style={{
                        padding: '10px 8px',
                        color: '#111827',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      {rest.district}
                    </td>

                    {/* Google Maps Link */}
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #e2ece7',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rest.googleMapsLink ? (
                        <a
                          href={rest.googleMapsLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#00a877', textDecoration: 'none', fontWeight: 500 }}
                        >
                          View on Map
                        </a>
                      ) : (
                        <span style={{ color: '#00a877' }}>—</span>
                      )}
                    </td>

                    {/* Menu Images */}
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #e2ece7',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (rest.menuImage) {
                            setSelectedImage({ src: rest.menuImage, title: `${rest.name} - Menu` })
                          }
                        }}
                        style={{
                          backgroundColor: '#e2f6ee',
                          color: '#00a877',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rest.menuCount} {rest.menuCount > 1 ? 'Menus' : 'Menu'}
                      </button>
                    </td>

                    {/* Cuisines/Dishes */}
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #e2ece7',
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {rest.cuisines.map((c) => (
                          <span
                            key={c}
                            style={{
                              backgroundColor: '#e2f6ee',
                              color: '#00a877',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              fontWeight: 500,
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: '10px 8px',
                        border: '1px solid #e2ece7',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(rest)}
                        title={`Click to toggle status to ${rest.status === 'Active' ? 'Inactive' : 'Active'}`}
                        style={{
                          display: 'inline-block',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          backgroundColor: rest.status === 'Active' ? '#28a745' : '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, transform 0.1s ease',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {rest.status}
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
