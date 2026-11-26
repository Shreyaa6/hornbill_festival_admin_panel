import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>404</h1>
      <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Page Not Found</h3>
      <p style={{ color: 'var(--color-gray-600)', maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Button leftIcon={<Home size={16} />} onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
