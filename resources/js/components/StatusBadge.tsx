import React from 'react';

export type BadgeVariant = 'healthy' | 'disconnected' | 'empty' | 'warning' | 'primary' | 'running';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'empty' }) => {
  const getBadgeStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'healthy':
        return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
      case 'disconnected':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' };
      case 'warning':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
      case 'primary':
        return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'running':
        return { background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' };
      case 'empty':
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        ...getBadgeStyle(),
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
};
