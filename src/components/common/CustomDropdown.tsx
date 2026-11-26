import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface CustomDropdownProps {
  options: readonly string[] | string[]
  value: string
  onChange: (val: string) => void
  minWidth?: string
  padding?: string
}

export function CustomDropdown({
  options,
  value,
  onChange,
  minWidth = '140px',
  padding,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display: minWidth === '100%' ? 'block' : 'inline-block',
        minWidth,
        width: minWidth === '100%' ? '100%' : 'auto',
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: padding || '6px 12px',
          backgroundColor: '#ffffff',
          border: isOpen ? '1px solid #3b82f6' : '1px solid #d1d5db',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1f2937',
          textAlign: 'left',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        <ChevronDown size={16} color="#6b7280" style={{ flexShrink: 0, marginLeft: '8px' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            maxHeight: '260px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 100,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 14px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#0b8462' : 'transparent',
                  color: isSelected ? '#ffffff' : '#1f2937',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#e6f9f2'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {opt}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
