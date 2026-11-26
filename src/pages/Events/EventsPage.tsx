import { useEffect, useState, useMemo } from 'react'
import { Card, Button, Badge, DataTable, type Column } from '@/components/common'
import { eventService } from '@/services'
import type { FestivalEvent } from '@/types'
import { formatDate } from '@/utils'
import { Plus, Search, Filter } from 'lucide-react'

export function EventsPage() {
  const [events, setEvents] = useState<FestivalEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    eventService.getEvents().then((data) => {
      setEvents(data)
      setIsLoading(false)
    })
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [events, searchTerm])

  const columns: Column<FestivalEvent>[] = [
    { key: 'title', title: 'Title', width: '25%' },
    {
      key: 'category',
      title: 'Category',
      render: (row) => <Badge variant="info">{row.category}</Badge>,
    },
    { key: 'venue', title: 'Venue' },
    {
      key: 'date',
      title: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'time',
      title: 'Timing',
      render: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Events & Schedule
          </h2>
          <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            Manage the official 10-day Hornbill Festival itinerary
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Add New Event</Button>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-gray-50)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              flex: 1,
            }}
          >
            <Search size={16} color="var(--color-gray-500)" />
            <input
              type="text"
              placeholder="Search by title, venue, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
            />
          </div>
          <Button variant="outline" leftIcon={<Filter size={16} />}>
            Filter
          </Button>
        </div>

        <DataTable columns={columns} data={filteredEvents} isLoading={isLoading} />
      </Card>
    </div>
  )
}
