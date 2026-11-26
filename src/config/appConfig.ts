export const APP_CONFIG = {
  appName: 'Hornbill Festival Admin',
  shortName: 'Hornbill Admin',
  version: '1.0.0',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  festivalYear: 2026,
  venue: 'Kisama Heritage Village, Kohima, Nagaland',
  defaultPageSize: 10,
} as const
