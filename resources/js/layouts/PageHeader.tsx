import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
}) => {
  return (
    <div
      className="bnx-page-header"
      style={{
        padding: '24px 32px 18px',
        borderBottom: '1px solid var(--bnx-color-border, #e2e8f0)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: '#ffffff',
      }}
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--bnx-color-text-muted, #64748b)',
              marginBottom: '6px',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span>{crumb.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            className="bnx-page-title"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--bnx-color-text, #0f172a)',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {badge}
        </div>

        {description && (
          <p
            className="bnx-page-desc"
            style={{
              fontSize: '13px',
              color: 'var(--bnx-color-text-muted, #64748b)',
              margin: '4px 0 0',
              maxWidth: '680px',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
};
