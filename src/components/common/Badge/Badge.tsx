import type { ReactNode } from 'react'
import { getStatusColor } from '@/utils'

export interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  status?: string
}

export function Badge({ children, variant, status }: BadgeProps) {
  let bg = '#f3f4f6'
  let text = '#374151'
  let border = '#e5e7eb'

  if (status) {
    const colors = getStatusColor(status)
    bg = colors.bg
    text = colors.text
    border = colors.border
  } else if (variant) {
    switch (variant) {
      case 'success':
        bg = 'var(--color-success-bg)'
        text = 'var(--color-success)'
        border = '#a7f3d0'
        break
      case 'warning':
        bg = 'var(--color-warning-bg)'
        text = '#b45309'
        border = '#fde68a'
        break
      case 'danger':
        bg = 'var(--color-danger-bg)'
        text = 'var(--color-danger)'
        border = '#fecaca'
        break
      case 'info':
        bg = 'var(--color-info-bg)'
        text = 'var(--color-info)'
        border = '#bfdbfe'
        break
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        textTransform: 'capitalize',
      }}
    >
      {children}
    </span>
  )
}
