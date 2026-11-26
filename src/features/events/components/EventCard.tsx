import type { FestivalEvent } from '@/types'
import { Card, Badge } from '@/components/common'
import { MapPin, Clock, Calendar } from 'lucide-react'
import { formatDate } from '@/utils'

export interface EventCardProps {
  event: FestivalEvent
  onEdit?: (event: FestivalEvent) => void
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card
      title={event.title}
      actions={<Badge status={event.status}>{event.status}</Badge>}
    >
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: '14px' }}>
        {event.description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--color-primary)" />
          <span>{formatDate(event.date)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--color-primary)" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--color-primary)" />
          <span>{event.venue}</span>
        </div>
      </div>
    </Card>
  )
}
