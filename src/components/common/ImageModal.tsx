import { X } from 'lucide-react'

interface ImageModalProps {
  src: string | null
  title?: string
  onClose: () => void
}

export function ImageModal({ src, title, onClose }: ImageModalProps) {
  if (!src) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{title || 'Image Preview'}</span>
          <button onClick={onClose} style={{ padding: '4px', color: '#6b7280' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <img
            src={src}
            alt={title || 'Preview'}
            style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
          />
        </div>
      </div>
    </div>
  )
}
