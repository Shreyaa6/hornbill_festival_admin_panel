import type { ReactNode } from 'react'
import { FolderOpen } from 'lucide-react'

export interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({
  title = 'No items found',
  description = 'There are currently no items available to display.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-500)',
          marginBottom: '16px',
        }}
      >
        {icon || <FolderOpen size={28} />}
      </div>
      <h4
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 600,
          color: 'var(--color-gray-900)',
          marginBottom: '6px',
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-gray-500)',
          maxWidth: '380px',
          marginBottom: action ? '20px' : 0,
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
