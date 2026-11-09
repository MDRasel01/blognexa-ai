import React from 'react';
import { StatusBadge, BadgeVariant } from './StatusBadge';

interface StatCardProps {
  title: string;
  value: string | number;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  description?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  badgeLabel,
  badgeVariant,
  description,
  icon,
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>{title}</span>
        {icon && <div style={{ color: '#94a3b8' }}>{icon}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>{value}</span>
        {badgeLabel && <StatusBadge label={badgeLabel} variant={badgeVariant} />}
      </div>

      {description && (
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </div>
  );
};

