import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users2,
  Store,
  MapPin,
  Users,
  Settings,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
  badge?: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Events & Schedule',
    path: '/events',
    icon: Calendar,
  },
  {
    label: 'Festivals',
    path: '/festivals',
    icon: Sparkles,
  },
  {
    label: 'Tribes & Morungs',
    path: '/tribes',
    icon: Users2,
  },
  {
    label: 'Stalls & Vendors',
    path: '/stalls',
    icon: Store,
  },
  {
    label: 'Landmarks & Map',
    path: '/landmarks',
    icon: MapPin,
  },
  {
    label: 'User Management',
    path: '/users',
    icon: Users,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]
