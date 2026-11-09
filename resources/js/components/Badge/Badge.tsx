import React from 'react';

export type BadgeVariant = 'healthy' | 'disconnected' | 'warning' | 'primary' | 'empty' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'empty',
  showDot = true,
  className = '',
}) => {
  const getStyles = (): { bg: string; color: string; border: string } => {
    switch (variant) {
      case 'healthy':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'disconnected':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
      case 'warning':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'primary':
        return { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
      case 'info':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'empty':
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const colors = getStyles();

  return (
    <span
      className={`bnx-badge bnx-badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        lineHeight: 1.4,
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
          }}
        />
      )}
      {label}
    </span>
  );
};

