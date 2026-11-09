import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { OverviewPage } from '../pages/OverviewPage';

interface BootConfig {
  api: {
    restUrl: string;
    nonce: string;
    namespace: string;
  };
  site: {
    name: string;
    url: string;
    version: string;
  };
  user: {
    id: number;
    name: string;
    capabilities: Record<string, boolean>;
  };
}

declare global {
  interface Window {
    blognexaBootConfig?: BootConfig;
  }
}

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [bootConfig, setBootConfig] = useState<BootConfig | null>(null);

  useEffect(() => {
    if (window.blognexaBootConfig) {
      setBootConfig(window.blognexaBootConfig);
    }
  }, []);

  const renderContent = () => {
    switch (activeModule) {
      case 'overview':
        return <OverviewPage version={bootConfig?.site.version ?? '1.0.0'} />;

      case 'website-intelligence':
        return (
          <div className="blognexa-card">
            <h3>Website Intelligence</h3>
            <p style={{ color: '#64748b' }}>No website crawl configured yet. Connect cloud backend to start initial scan.</p>
            <span className="blognexa-badge blognexa-badge-empty">Unconfigured</span>
          </div>
        );

      case 'knowledge-base':
        return (
          <div className="blognexa-card">
            <h3>Knowledge Base</h3>
            <p style={{ color: '#64748b' }}>No knowledge documents or vector chunks ingested yet.</p>
            <span className="blognexa-badge blognexa-badge-empty">Empty State</span>
          </div>
        );

      case 'publishing':
        return (
          <div className="blognexa-card">
            <h3>Publishing & Scheduling</h3>
            <p style={{ color: '#64748b' }}>No articles scheduled or pending publication.</p>
            <span className="blognexa-badge blognexa-badge-empty">Empty State</span>
          </div>
        );

      case 'analytics':
        return (
          <div className="blognexa-card">
            <h3>Performance Analytics</h3>
            <p style={{ color: '#64748b' }}>No published content performance data available.</p>
            <span className="blognexa-badge blognexa-badge-empty">Empty State</span>
          </div>
        );

      case 'integrations':
        return (
          <div className="blognexa-card">
            <h3>Integrations</h3>
            <p style={{ color: '#64748b' }}>Cloud backend connection status: Disconnected.</p>
            <span className="blognexa-badge blognexa-badge-empty">Not Connected</span>
          </div>
        );

      case 'settings':
        return (
          <div className="blognexa-card">
            <h3>Plugin Settings</h3>
            <p style={{ color: '#64748b' }}>Foundation settings configuration managed via REST API <code>/wp-json/blognexa/v1/settings</code>.</p>
            <span className="blognexa-badge blognexa-badge-healthy">Configured</span>
          </div>
        );

      default:
        return (
          <div className="blognexa-card">
            <h3>{activeModule.replace('-', ' ').toUpperCase()}</h3>
            <p style={{ color: '#64748b' }}>This module foundation is registered and scheduled for Phase 03 implementation.</p>
            <span className="blognexa-badge blognexa-badge-empty">Upcoming Module</span>
          </div>
        );
    }
  };

  return (
    <AdminLayout
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      siteName={bootConfig?.site.name ?? 'Connected WordPress'}
      version={bootConfig?.site.version ?? '1.0.0'}
    >
      {renderContent()}
    </AdminLayout>
  );
};

