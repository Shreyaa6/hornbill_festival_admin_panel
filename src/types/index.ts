export type TopTab = 'services' | 'festival'

export interface HotelPG {
  id: string
  slNo: number
  bannerPhoto: string
  name: string
  address: string
  townVillage: string
  district: string
  ownerName: string
  phoneNumber: string
  propertyType: 'Hotel' | 'Guest House' | 'Resort'
  googleMapsLink?: string
  govtIdPhoto?: string
  amenities: string[]
  status: 'Active' | 'Inactive'
}

export interface TourOperatorItem {
  id: string
  slNo: number
  bannerPhoto: string
  businessName: string
  address: string
  district: string
  ownerName: string
  phoneNumber: string
  govtIdPhoto?: string
  services: string[]
  status: 'Active' | 'Inactive'
}

export interface CabTaxiItem {
  id: string
  slNo: number
  carModel: string
  address: string
  driverName: string
  phoneNumber: string
  seaterType: string
  drivingLicensePhoto: string
  districtsServing: string[]
  status: 'Active' | 'Inactive'
}

export interface TourGuideItem {
  id: string
  slNo: number
  name: string
  address: string
  district: string
  phoneNumber: string
  ntaIdCardPhoto: string
  status: 'Active' | 'Inactive'
}

export interface RestaurantCafeItem {
  id: string
  slNo: number
  bannerPhoto: string
  name: string
  address: string
  phoneNumber: string
  district: string
  googleMapsLink?: string
  menuCount: number
  menuImage?: string
  cuisines: string[]
  status: 'Active' | 'Inactive'
}

export interface StallItem {
  id: string
  slNo: number
  stallName: string
  ownerName: string
  phoneNumber: string
}

export type Status = 'active' | 'inactive' | 'pending' | 'draft' | 'archived'

export type UserRole = 'superadmin' | 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
  lastLogin?: string
}

export interface FestivalEvent {
  id: string
  title: string
  description: string
  venue: string
  date: string
  startTime: string
  endTime: string
  category: 'cultural' | 'music' | 'sports' | 'food' | 'traditional' | 'workshop'
  status: Status
  organizer?: string
  capacity?: number
  registeredCount?: number
}

export interface Tribe {
  id: string
  name: string
  district: string
  festivalName: string
  description: string
  morungLandmark?: string
  headCount?: number
  imageUrl?: string
}

export interface Landmark {
  id: string
  name: string
  category: 'morung' | 'stage' | 'restroom' | 'parking' | 'medical' | 'entrance' | 'info_booth'
  latitude?: number
  longitude?: number
  description?: string
}

export interface CarouselSlideItem {
  id: string
  slNo: number
  type: string
  image: string
}

export interface ContestItem {
  id: string
  slNo: number
  type: string
  posterImage: string
  title: string
  description: string
  location: string
  date: string
  time: string
}

export interface LandmarkItem {
  id: string
  slNo: number
  photo?: string | null
  title: string
  category: string
  longitude: string
  latitude: string
}

export interface TouristSpotItem {
  id: string
  slNo: number
  spotImage?: string | null
  touristSpot: string
  description: string
  visitingHours: string
  closedDay: string
  district: string
  googleMapsLink: string
}

export interface TribeItem {
  id: string
  slNo: number
  photo?: string | null
  bannerPhoto?: string | null
  tribe: string
  district?: string
  description: string
  isPublished?: boolean
}

export interface TribalFestivalItem {
  id: string
  serialno?: number
  slNo: number
  festivalName: string
  tribeName: string
  image?: string | null
  description: string
  bannerPhoto?: string | null
  tribe?: string
  isPublished?: boolean
}

export interface TimelineEntry {
  id: string
  icon: string
  time: string
  title: string
  description?: string
}

export interface HornbillDayItem {
  id: string
  slNo: number
  day: string
  date: string
  title: string
  pdfUrl?: string
  timeline: TimelineEntry[]
}

export interface SubmissionItem {
  docId: string
  id: string
  slNo?: number
  fullName: string
  localDateString: string
  votes: number
  photoUrl: string
}

export type EmergencyCategory = 'police' | 'hospital' | 'tourist_police'

export interface EmergencyHelplineItem {
  id: string
  name: string
  subtitle: string
  phone: string
  district: string
  category: EmergencyCategory | string
  order?: number
  slNo?: number
}

export interface DestinationDetail {
  text: string
  icon: 'distance' | 'flight' | 'bus' | 'stay' | string
}

export interface DestinationSpot {
  name: string
  description: string
  imageUrl: string
  timing?: string
  map?: string
}

export interface DestinationItem {
  id: string
  name: string
  imageUrl: string
  details?: DestinationDetail[]
  spots: DestinationSpot[]
}

export interface CulturalCalendarItem {
  id: string
  title: string
  tribe: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  location: string
  description: string
  isConfirmed: boolean
  slNo?: number
}







