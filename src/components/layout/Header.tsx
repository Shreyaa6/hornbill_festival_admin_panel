import { Search, Bell, Shield } from 'lucide-react'
import { useAuth } from '@/context'
import { APP_CONFIG } from '@/config/appConfig'

export function Header() {
  const { user } = useAuth()

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-gray-100)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            width: '100%',
          }}
        >
          <Search size={16} color="var(--color-gray-500)" />
          <input
            type="text"
            placeholder="Search events, stalls, tribes..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              color: 'var(--color-gray-800)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button
          aria-label="Notifications"
          style={{
            position: 'relative',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-gray-600)',
          }}
        >
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
            }}
          />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '1px solid var(--color-gray-200)',
            paddingLeft: '18px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {user?.name ? user.name.charAt(0) : <Shield size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-900)' }}>
              {user?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
              {APP_CONFIG.festivalYear} Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
