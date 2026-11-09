import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BadgeVariant } from '../components/Badge/Badge';

export interface AdminLayoutProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  siteName: string;
  version: string;
  userName?: string;
  connectionStatus?: string;
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  userCapabilities?: Record<string, boolean>;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeModule,
  onSelectModule,
  siteName,
  version,
  userName = 'Administrator',
  connectionStatus = 'disconnected',
  badgeLabel,
  badgeVariant,
  userCapabilities = {},
  children,
}) => {
  return (
    <div
      className="bnx-layout"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '80vh',
        background: 'var(--bnx-color-surface, #ffffff)',
        fontFamily: 'var(--bnx-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      <Header
        siteName={siteName}
        version={version}
        userName={userName}
        connectionStatus={connectionStatus}
        badgeLabel={badgeLabel}
        badgeVariant={badgeVariant}
      />

      <div
        className="bnx-shell"
        style={{
          display: 'flex',
          flex: 1,
          minHeight: '700px',
        }}
      >
        <Sidebar
          activeModule={activeModule}
          onSelectModule={onSelectModule}
          userCapabilities={userCapabilities}
        />

        <main
          className="bnx-main"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            background: 'var(--bnx-color-surface, #ffffff)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
