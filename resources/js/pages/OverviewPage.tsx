import React from 'react';

interface OverviewPageProps {
  version: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ version }) => {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: 0, marginBottom: '16px' }}>
        Operational Overview
      </h2>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        System status and foundation readiness summary.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="blognexa-card">
          <div style={{ fontSize: '13px', color: '#64748b' }}>Plugin Foundation</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>v{version}</div>
          <span className="blognexa-badge blognexa-badge-healthy">Phase 02 Ready</span>
        </div>

        <div className="blognexa-card">
          <div style={{ fontSize: '13px', color: '#64748b' }}>Cloud Connection</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>Configured</div>
          <span className="blognexa-badge blognexa-badge-empty">Disconnected</span>
        </div>

        <div className="blognexa-card">
          <div style={{ fontSize: '13px', color: '#64748b' }}>Database Tables</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>4 / 4</div>
          <span className="blognexa-badge blognexa-badge-healthy">Migrated</span>
        </div>
      </div>
    </div>
  );
};

