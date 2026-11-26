import type { TourOperatorItem } from '@/types'

export const TOUR_OPERATOR_SERVICES = [
  'All',
  'Dzükou Valley Tours',
  'Nagaland Tours',
  'Northeast Tours',
] as const

export const INITIAL_TOUR_OPERATORS_DATA: TourOperatorItem[] = [
  {
    id: 'to-1',
    slNo: 1,
    bannerPhoto: '/images/logo_abode_venture.png',
    businessName: 'Abode Venture',
    address: 'NagaBazar Colony',
    district: 'Kohima',
    ownerName: 'Vimeto Vakha',
    phoneNumber: '+91-\n7005638258',
    govtIdPhoto: '/images/touroperators/abode_govtid.jpg',
    services: ['Dzükou Valley Tours', 'Nagaland Tours'],
    status: 'Active',
  },
  {
    id: 'to-2',
    slNo: 2,
    bannerPhoto: '/images/touroperators/sheanghah_logo.jpg',
    businessName: 'Sheanghah\nTravels',
    address: 'Sheanghah\nChingnyu\nVillage, Mon\nNagaland',
    district: 'Mon',
    ownerName: 'Mankhat N\nKonyak',
    phoneNumber: '+91-\n6009174657',
    govtIdPhoto: '/images/touroperators/sheanghah_govtid.jpg',
    services: ['Nagaland Tours'],
    status: 'Inactive',
  },
  {
    id: 'to-3',
    slNo: 3,
    bannerPhoto: '/images/logo_tribal_odyssey.png',
    businessName: 'Tribal Odyssey',
    address: 'Kohima',
    district: 'Kohima',
    ownerName: 'Veshehu Kezo',
    phoneNumber: '+91-\n9862568055',
    govtIdPhoto: '/images/touroperators/tribal_govtid.jpg',
    services: ['Dzükou Valley Tours', 'Nagaland Tours', 'Northeast Tours'],
    status: 'Active',
  },
]
