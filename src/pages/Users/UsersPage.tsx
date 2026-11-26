import { Card, Button, Badge, DataTable, type Column } from '@/components/common'
import type { User } from '@/types'
import { Plus } from 'lucide-react'
import { formatDate } from '@/utils'

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Festival Director', email: 'director@tourismnagaland.com', role: 'superadmin', createdAt: '2026-01-10' },
  { id: 'u2', name: 'Cultural Committee Lead', email: 'cultural@hornbill.gov.in', role: 'admin', createdAt: '2026-03-01' },
  { id: 'u3', name: 'Media Coordinator', email: 'press@hornbill.gov.in', role: 'editor', createdAt: '2026-04-15' },
]

export function UsersPage() {
  const columns: Column<User>[] = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    {
      key: 'role',
      title: 'Access Role',
      render: (row) => <Badge variant="warning">{row.role}</Badge>,
    },
    {
      key: 'createdAt',
      title: 'Joined Date',
      render: (row) => formatDate(row.createdAt),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Admin Access & User Roles
          </h2>
          <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            Manage staff credentials and role-based permissions
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Invite Member</Button>
      </div>

      <Card>
        <DataTable columns={columns} data={MOCK_USERS} />
      </Card>
    </div>
  )
}
