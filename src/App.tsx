import { AppProvider, useApp } from '@/context/AppContext'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { HotelsPage } from '@/pages/Hotels/HotelsPage'
import { TourOperatorsPage } from '@/pages/TourOperators/TourOperatorsPage'
import { CabsTaxiPage } from '@/pages/CabsTaxi/CabsTaxiPage'
import { TourGuidesPage } from '@/pages/TourGuides/TourGuidesPage'
import { RestaurantsPage } from '@/pages/Restaurants/RestaurantsPage'
import { CarouselPage } from '@/pages/Carousel/CarouselPage'
import { ContestPage } from '@/pages/Contest/ContestPage'
import { LandmarksPage } from '@/pages/Landmarks/LandmarksPage'
import { StallsPage } from '@/pages/Stalls/StallsPage'
import { TribesPage } from '@/pages/Tribes/TribesPage'
import { TribalFestivalPage } from '@/pages/TribalFestival/TribalFestivalPage'
import { HornbillPage } from '@/pages/Hornbill/HornbillPage'
import { SubmissionsPage } from '@/pages/Submissions/SubmissionsPage'
import { EmergencyHelplinePage } from '@/pages/EmergencyHelpline/EmergencyHelplinePage'
import { DestinationsPage } from '@/pages/Destinations/DestinationsPage'
import { CulturalCalendarPage } from '@/pages/CulturalCalendar/CulturalCalendarPage'
import { LoginPage } from '@/pages/Login/LoginPage'
import { GenericPage } from '@/pages/GenericPage'

function AdminContent() {
  const { activeMenu } = useApp()

  switch (activeMenu) {
    case 'Hotels & Guest House':
      return <HotelsPage />
    case 'Tour Operators':
      return <TourOperatorsPage />
    case 'Cabs & Taxi':
      return <CabsTaxiPage />
    case 'Tour Guides':
      return <TourGuidesPage />
    case 'Restaurants & Cafes':
      return <RestaurantsPage />
    case 'Emergency Helpline':
      return <EmergencyHelplinePage />
    case 'Carousel':
      return <CarouselPage />
    case 'Contest':
      return <ContestPage />
    case 'Landmark':
    case 'Landmarks':
      return <LandmarksPage />
    case 'Stalls':
      return <StallsPage />
    case 'Destinations':
    case 'Tourist Destinations':
    case 'Tourist Spots':
    case 'Events':
      return <DestinationsPage />
    case 'Cultural Calendar':
    case 'Cultural Calender':
    case 'Calendar':
      return <CulturalCalendarPage />
    case 'Tribes':
      return <TribesPage />
    case 'Tribal Festival':
      return <TribalFestivalPage />
    case 'Hornbill':
      return <HornbillPage />
    case 'Submissions':
      return <SubmissionsPage />
    default:
      return <GenericPage />
  }
}

function MainApp() {
  const { isAuthenticated } = useApp()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AdminLayout>
      <AdminContent />
    </AdminLayout>
  )
}

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  )
}

export default App
