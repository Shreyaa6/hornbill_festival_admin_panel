import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
        }
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: '#ffffff',
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          border: '1px solid var(--color-gray-300)',
          color: 'var(--color-gray-800)',
        }
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: '#ffffff',
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-gray-700)',
        }
      default:
        return {}
    }
  }

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: 'var(--font-size-xs)' }
      case 'lg':
        return { padding: '12px 24px', fontSize: 'var(--font-size-base)' }
      case 'md':
      default:
        return { padding: '8px 16px', fontSize: 'var(--font-size-sm)' }
    }
  }

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 500,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  }

  return (
    <button style={baseStyles} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
