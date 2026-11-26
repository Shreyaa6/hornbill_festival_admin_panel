import {
  Home,
  Package,
  Bus,
  Users,
  UtensilsCrossed,
  Film,
  Trophy,
  MapPin,
  Store,
  Users2,
  Box,
  Layers,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Compass,
  Calendar,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'

export function Sidebar() {
  const { topTab, activeMenu, setActiveMenu, isSidebarCollapsed, toggleSidebar, logout } = useApp()

  const servicesMenu = [
    { label: 'Hotels & Guest House', icon: Home },
    { label: 'Tour Operators', icon: Package },
    { label: 'Cabs & Taxi', icon: Bus },
    { label: 'Tour Guides', icon: Users },
    { label: 'Restaurants & Cafes', icon: UtensilsCrossed },
    { label: 'Emergency Helpline', icon: PhoneCall },
    { label: 'Carousel', icon: Film },
    { label: 'Contest', icon: Trophy },
    { label: 'Landmark', icon: MapPin },
  ]

  const festivalMenu = [
    { label: 'Stalls', icon: Store },
    { label: 'Destinations', icon: Compass },
    { label: 'Cultural Calendar', icon: Calendar },
    { label: 'Tribes', icon: Users2 },
    { label: 'Tribal Festival', icon: Box },
    { label: 'Hornbill', icon: Layers },
    { label: 'Submissions', icon: FileText },
  ]

  const currentMenu = topTab === 'services' ? servicesMenu : festivalMenu

  return (
    <aside
      style={{
        width: isSidebarCollapsed ? '64px' : '230px',
        backgroundColor: '#0b8462',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          padding: isSidebarCollapsed ? '0' : '0 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {!isSidebarCollapsed ? (
          <>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1.1 }}>Hornbill</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Admin Panel</div>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              style={{
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
              }}
              title="Collapse sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            style={{
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '4px',
            }}
            title="Expand sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, padding: isSidebarCollapsed ? '16px 8px' : '16px 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentMenu.map((item) => {
            const Icon = item.icon
            const isActive = activeMenu === item.label
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => setActiveMenu(item.label)}
                  title={item.label}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    gap: isSidebarCollapsed ? '0' : '12px',
                    padding: isSidebarCollapsed ? '10px 0' : '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? '#16a37f' : 'transparent',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Icon size={19} style={{ flexShrink: 0 }} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Logout at bottom */}
      <div
        style={{
          padding: isSidebarCollapsed ? '14px 8px' : '14px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Do you want to log out from Hornbill Admin Panel?')) {
              logout()
            }
          }}
          title="Logout"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: isSidebarCollapsed ? '0' : '12px',
            padding: isSidebarCollapsed ? '10px 0' : '10px 14px',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: 500,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={19} style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
