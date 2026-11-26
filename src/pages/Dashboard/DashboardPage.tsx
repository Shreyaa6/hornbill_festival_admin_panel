import { useEffect, useState } from 'react'
import { Card, Badge, DataTable, type Column } from '@/components/common'
import { eventService } from '@/services'
import type { FestivalEvent } from '@/types'
import { formatDate } from '@/utils'
import { Calendar, Users2, Store, Eye, ArrowUpRight } from 'lucide-react'

export function DashboardPage() {
  const [events, setEvents] = useState<FestivalEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    eventService.getEvents().then((data) => {
      setEvents(data)
      setIsLoading(false)
    })
  }, [])

  const stats = [
    { title: 'Total Events', value: '48', icon: Calendar, change: '+12% from 2025', color: '#e04f16' },
    { title: 'Recognized Tribes', value: '18', icon: Users2, change: 'All 18 active', color: '#0d5c3a' },
    { title: 'Registered Stalls', value: '124', icon: Store, change: '96% occupied', color: '#3b82f6' },
    { title: 'Expected Footfall', value: '250K+', icon: Eye, change: '10-day celebration', color: '#8b5cf6' },
  ]

  const columns: Column<FestivalEvent>[] = [
    { key: 'title', title: 'Event Name', width: '30%' },
    { key: 'venue', title: 'Venue' },
    {
      key: 'date',
      title: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'startTime',
      title: 'Time',
      render: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
          Festival Overview
        </h2>
        <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
          Hornbill Festival 2026 • Live Monitoring & Event Operations
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {stat.title}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-gray-900)', marginTop: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <ArrowUpRight size={14} />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: `${stat.color}15`,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Upcoming Events Table */}
      <Card
        title="Featured Events"
        subtitle="Current high-priority cultural ceremonies and competitions"
      >
        <DataTable columns={columns} data={events} isLoading={isLoading} />
      </Card>
    </div>
  )
}
