import { useApp } from '@/context/AppContext'

export function TopNav() {
  const { topTab, setTopTab } = useApp()

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Top Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setTopTab('services')}
          style={{
            padding: '6px 18px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: topTab === 'services' ? '#e2f6ee' : 'transparent',
            color: topTab === 'services' ? '#0b8462' : '#222222',
            transition: 'all 0.15s ease',
          }}
        >
          Services
        </button>

        <button
          type="button"
          onClick={() => setTopTab('festival')}
          style={{
            padding: '6px 18px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: topTab === 'festival' ? '#e2f6ee' : 'transparent',
            color: topTab === 'festival' ? '#0b8462' : '#222222',
            transition: 'all 0.15s ease',
          }}
        >
          Festival
        </button>
      </div>
    </header>
  )
}
