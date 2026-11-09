import React from 'react';
import { AppProvider, useApp } from '../state/AppContext';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { ErrorState } from '../components/ErrorState/ErrorState';

// Feature Views
import { OverviewView } from '../features/overview/OverviewView';
import { WebsiteIntelligenceView } from '../features/website-intelligence/WebsiteIntelligenceView';
import { KnowledgeBaseView } from '../features/knowledge-base/KnowledgeBaseView';
import { ContentStrategyView } from '../features/content-strategy/ContentStrategyView';
import { SEOResearchView } from '../features/seo-research/SEOResearchView';
import { BlogStudioView } from '../features/blog-studio/BlogStudioView';
import { ImageStudioView } from '../features/image-studio/ImageStudioView';
import { PublishingView } from '../features/publishing/PublishingView';
import { AnalyticsView } from '../features/analytics/AnalyticsView';
import { IntegrationsView } from '../features/integrations/IntegrationsView';
import { SettingsView } from '../features/settings/SettingsView';

const MODULE_CAPABILITIES: Record<string, string> = {
  'overview': 'blognexa_access',
  'website-intelligence': 'blognexa_scan_website',
  'knowledge-base': 'blognexa_manage_knowledge',
  'content-strategy': 'blognexa_manage_strategy',
  'seo-research': 'blognexa_manage_seo',
  'blog-studio': 'blognexa_create_blog',
  'image-studio': 'blognexa_create_blog',
  'publishing': 'blognexa_publish_blog',
  'analytics': 'blognexa_view_analytics',
  'integrations': 'blognexa_manage_integrations',
  'settings': 'blognexa_manage_settings',
};

const MainRouter: React.FC = () => {
  const {
    bootConfig,
    activeModule,
    setActiveModule,
    connectionStatus,
    hasCapability,
    isLoading,
    error,
    refreshStatus,
  } = useApp();

  const requiredCap = MODULE_CAPABILITIES[activeModule];
  const isPermitted = !requiredCap || hasCapability(requiredCap);

  const renderModule = () => {
    if (isLoading && !bootConfig) {
      return <LoadingState message="Connecting to WordPress REST API..." />;
    }

    if (!isPermitted) {
      return (
        <div style={{ padding: '32px' }}>
          <div
            style={{
              padding: '32px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#991b1b', margin: '0 0 8px' }}>
              Permission Denied
            </h3>
            <p style={{ fontSize: '13px', color: '#b91c1c', maxWidth: '480px', margin: '0 auto 16px' }}>
              Your WordPress user account lacks the <code>{requiredCap}</code> capability required to access this module.
            </p>
            <button
              type="button"
              className="bnx-btn bnx-btn-secondary"
              onClick={() => setActiveModule('overview')}
            >
              Return to Overview
            </button>
          </div>
        </div>
      );
    }

    switch (activeModule) {
      case 'overview':
        return <OverviewView />;
      case 'website-intelligence':
        return <WebsiteIntelligenceView />;
      case 'knowledge-base':
        return <KnowledgeBaseView />;
      case 'content-strategy':
        return <ContentStrategyView />;
      case 'seo-research':
        return <SEOResearchView />;
      case 'blog-studio':
        return <BlogStudioView />;
      case 'image-studio':
        return <ImageStudioView />;
      case 'publishing':
        return <PublishingView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
              Module Not Found (404)
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              The requested module <code>{activeModule}</code> does not exist or has been relocated.
            </p>
            <button
              type="button"
              className="bnx-btn bnx-btn-primary"
              onClick={() => setActiveModule('overview')}
            >
              Return to Overview
            </button>
          </div>
        );
    }
  };

  return (
    <AdminLayout
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      siteName={bootConfig?.site?.name || 'BlogNexa AI'}
      version={bootConfig?.site?.version || '1.0.0'}
      userName={bootConfig?.user?.name || 'Administrator'}
      connectionStatus={connectionStatus?.connected ? 'connected' : 'disconnected'}
      userCapabilities={bootConfig?.user?.capabilities || {}}
    >
      {error && (
        <div style={{ padding: '16px 32px 0' }}>
          <ErrorState
            title="Communication Notice"
            message={error}
            onRetry={refreshStatus}
          />
        </div>
      )}
      {renderModule()}
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
};
