import type { FestivalEvent } from '@/types'

// Mock initial data reflecting the Hornbill Festival schedule
const MOCK_EVENTS: FestivalEvent[] = [
  {
    id: 'evt-01',
    title: 'Grand Inaugural Ceremony',
    description: 'Traditional blessing, vibrant folk dances, and official opening by dignitaries.',
    venue: 'Main Arena, Kisama',
    date: '2026-12-01',
    startTime: '09:30 AM',
    endTime: '01:00 PM',
    category: 'cultural',
    status: 'active',
    registeredCount: 4500,
  },
  {
    id: 'evt-02',
    title: 'Nagaland Hornbill International Rock Festival',
    description: 'Battle of the bands and headlining performances from across Southeast Asia.',
    venue: 'Indira Gandhi Stadium, Kohima',
    date: '2026-12-02',
    startTime: '05:00 PM',
    endTime: '10:30 PM',
    category: 'music',
    status: 'active',
    registeredCount: 8200,
  },
  {
    id: 'evt-03',
    title: 'Indigenous Traditional Archery Championship',
    description: 'Traditional Naga bow and arrow competition among indigenous tribesmen.',
    venue: 'Sports Pavilion, Kisama',
    date: '2026-12-03',
    startTime: '10:00 AM',
    endTime: '03:00 PM',
    category: 'sports',
    status: 'active',
    registeredCount: 120,
  },
  {
    id: 'evt-04',
    title: 'Naga King Chilli Eating Challenge',
    description: 'Annual contest featuring the fiery Raja Mircha.',
    venue: 'Horticulture Pavilion, Kisama',
    date: '2026-12-05',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    category: 'food',
    status: 'active',
    registeredCount: 45,
  },
]

export const eventService = {
  async getEvents(): Promise<FestivalEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_EVENTS]), 200)
    })
  },

  async getEventById(id: string): Promise<FestivalEvent | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_EVENTS.find((e) => e.id === id)), 150)
    })
  },
}
