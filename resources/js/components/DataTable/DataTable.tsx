import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = 'No records found.',
  isLoading = false,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '2px solid #3b82f6',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 12px',
            animation: 'bnx-spin 0.75s linear infinite',
          }}
        />
        Loading data...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--bnx-color-text-muted, #64748b)',
          fontSize: '13px',
          background: 'var(--bnx-color-surface-subtle, #f8fafc)',
          borderRadius: '6px',
          border: '1px dashed var(--bnx-color-border, #e2e8f0)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`bnx-table-container ${className}`}
      style={{
        overflowX: 'auto',
        border: '1px solid var(--bnx-color-border, #e2e8f0)',
        borderRadius: '6px',
      }}
    >
      <table
        className="bnx-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '13px',
        }}
      >
        <thead>
          <tr style={{ background: 'var(--bnx-color-surface-subtle, #f1f5f9)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 14px',
                  fontWeight: 600,
                  color: 'var(--bnx-color-text-secondary, #475569)',
                  borderBottom: '1px solid var(--bnx-color-border, #e2e8f0)',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom:
                  index === data.length - 1
                    ? 'none'
                    : '1px solid var(--bnx-color-border, #e2e8f0)',
                background: index % 2 === 0 ? '#ffffff' : '#fcfdfe',
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 14px',
                    color: 'var(--bnx-color-text, #0f172a)',
                  }}
                >
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
