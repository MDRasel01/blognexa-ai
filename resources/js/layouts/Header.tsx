import React from 'react';
import { Badge } from '../components/Badge/Badge';

export interface HeaderProps {
  siteName: string;
  version: string;
  userName?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

export const Header: React.FC<HeaderProps> = ({
  siteName,
  version,
  userName = 'Administrator',
  connectionStatus = 'disconnected',
}) => {
  return (
    <header
      className="bnx-header"
      style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1e293b',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          B
        </div>
        <div>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 700,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            BlogNexa AI
          </h1>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {siteName} • v{version}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Badge
          label={connectionStatus === 'connected' ? 'Cloud Connected' : 'Cloud Disconnected'}
          variant={connectionStatus === 'connected' ? 'healthy' : 'disconnected'}
        />
        <Badge label="System Ready" variant="healthy" />
        <span style={{ fontSize: '12px', color: '#cbd5e1', borderLeft: '1px solid #334155', paddingLeft: '12px' }}>
          {userName}
        </span>
      </div>
    </header>
  );
};

