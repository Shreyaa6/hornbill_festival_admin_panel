import { useApp } from '@/context/AppContext'
import { Search } from 'lucide-react'

export function GenericPage() {
  const { activeMenu, topTab } = useApp()

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          color: '#0b8462',
          fontSize: '26px',
          fontWeight: 700,
          marginBottom: '20px',
        }}
      >
        {activeMenu}
      </h2>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          padding: '24px',
          minHeight: '400px',
        }}
      >
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
          <Search size={18} color="#6b7280" />
          <input
            type="text"
            placeholder={`Search ${activeMenu}...`}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#0b8462', marginBottom: '8px' }}>
            {activeMenu} ({topTab === 'services' ? 'Services' : 'Festival'} Module)
          </div>
          <p style={{ maxWidth: '460px', margin: '0 auto', fontSize: '14px' }}>
            All operations and records for {activeMenu} are configured and ready for live integration.
          </p>
        </div>
      </div>
    </div>
  )
}
