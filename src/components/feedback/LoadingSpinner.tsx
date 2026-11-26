export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `3px solid var(--color-gray-200)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}
