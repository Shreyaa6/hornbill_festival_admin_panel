import { Card, Button } from '@/components/common'
import { APP_CONFIG } from '@/config/appConfig'

export function SettingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
          System Settings
        </h2>
        <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
          Configure festival edition parameters and API endpoints
        </p>
      </div>

      <Card title="Festival Edition Metadata">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '6px' }}>
              Festival Year
            </label>
            <input
              type="text"
              defaultValue={APP_CONFIG.festivalYear}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-gray-300)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: '6px' }}>
              Main Venue Location
            </label>
            <input
              type="text"
              defaultValue={APP_CONFIG.venue}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-gray-300)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
          <div>
            <Button>Save Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
