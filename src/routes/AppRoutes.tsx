import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout'
import {
  DashboardPage,
  EventsPage,
  TribesPage,
  StallsPage,
  LandmarksPage,
  UsersPage,
  SettingsPage,
  NotFoundPage,
} from '@/pages'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="festivals" element={<Navigate to="/events" replace />} />
        <Route path="tribes" element={<TribesPage />} />
        <Route path="stalls" element={<StallsPage />} />
        <Route path="landmarks" element={<LandmarksPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
