export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatTime(timeString: string): string {
  return timeString
}

export function truncateText(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getStatusColor(status: string): { bg: string; text: string; border: string } {
  switch (status.toLowerCase()) {
    case 'active':
    case 'occupied':
      return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
    case 'pending':
    case 'reserved':
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
    case 'inactive':
    case 'archived':
      return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' }
    case 'draft':
    case 'available':
      return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
  }
}
