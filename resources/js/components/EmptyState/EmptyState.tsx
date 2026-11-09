import React from 'react';
import { Button } from '../Button/Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  badgeLabel?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  badgeLabel,
  className = '',
}) => {
  return (
    <div
      className={`bnx-empty-state ${className}`}
      style={{
        textAlign: 'center',
        padding: '40px 24px',
        border: '1px dashed var(--bnx-color-border-subtle, #cbd5e1)',
        borderRadius: '8px',
        background: 'var(--bnx-color-surface-subtle, #f8fafc)',
      }}
    >
      {badgeLabel && (
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '9999px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              textTransform: 'uppercase',
            }}
          >
            {badgeLabel}
          </span>
        </div>
      )}

      {icon && (
        <div
          style={{
            fontSize: '32px',
            color: 'var(--bnx-color-text-muted, #94a3b8)',
            marginBottom: '12px',
          }}
        >
          {icon}
        </div>
      )}

      <h4
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--bnx-color-text, #0f172a)',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: '13px',
          color: 'var(--bnx-color-text-muted, #64748b)',
          maxWidth: '460px',
          margin: '0 auto 20px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

