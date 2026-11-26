import type { ReactNode, CSSProperties } from 'react'

export interface CardProps {
  children: ReactNode
  title?: ReactNode
  subtitle?: string
  actions?: ReactNode
  style?: CSSProperties
  className?: string
}

export function Card({ children, title, subtitle, actions, style }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-gray-200)',
        boxShadow: 'var(--shadow-card)',
        padding: '20px',
        ...style,
      }}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-gray-100)',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  color: 'var(--color-gray-900)',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-gray-500)',
                  marginTop: '4px',
                  marginBottom: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
