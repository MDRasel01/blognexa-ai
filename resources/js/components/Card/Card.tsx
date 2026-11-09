import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  className = '',
  style,
}) => {
  return (
    <div
      className={`bnx-card ${className}`}
      style={{
        background: 'var(--bnx-color-surface, #ffffff)',
        border: '1px solid var(--bnx-color-border, #e2e8f0)',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        ...style,
      }}
    >
      {(title || subtitle || actions) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            paddingBottom: subtitle ? '12px' : '0',
            borderBottom: subtitle ? '1px solid var(--bnx-color-border, #e2e8f0)' : 'none',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  margin: 0,
                  color: 'var(--bnx-color-text, #0f172a)',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--bnx-color-text-muted, #64748b)',
                  margin: '4px 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}

      <div>{children}</div>

      {footer && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--bnx-color-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--bnx-color-text-muted, #64748b)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

