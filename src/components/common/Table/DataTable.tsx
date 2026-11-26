import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  title: string
  render?: (row: T) => ReactNode
  width?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField?: keyof T
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-500)' }}>
        Loading data...
      </div>
    )
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-gray-200)', backgroundColor: 'var(--color-gray-50)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 16px',
                  fontWeight: 600,
                  color: 'var(--color-gray-700)',
                  width: col.width,
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--color-gray-500)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowKey = String(row[keyField] ?? index)
              return (
                <tr
                  key={rowKey}
                  style={{
                    borderBottom: '1px solid var(--color-gray-100)',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        color: 'var(--color-gray-800)',
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
