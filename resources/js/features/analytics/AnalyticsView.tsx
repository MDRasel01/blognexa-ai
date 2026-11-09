import React from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useApp } from '../../state/AppContext';

export const AnalyticsView: React.FC = () => {
  const { setActiveModule } = useApp();

  return (
    <div>
      <PageHeader
        title="Performance Analytics & Content Freshness"
        description="Monitor published content decay, search visibility, organic ranking trends, and automated refresh triggers."
        badge={<Badge label="Telemetry Standby" variant="empty" />}
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Metric Cards Grid - Real zero state with honest source indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Published via BlogNexa</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#0f172a' }}>0</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Source: Local Database</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Search Impressions</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#94a3b8' }}>—</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>GSC Integration Required</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Organic Clicks</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#94a3b8' }}>—</div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>GSC Integration Required</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Content Decay Alerts</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#15803d' }}>0</div>
            <span style={{ fontSize: '11px', color: '#15803d' }}>All Content Fresh</span>
          </div>
        </div>

        {/* Content Refresh & Decay Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card
            title="Content Freshness & Refresh Radar"
            subtitle="Identifies published posts whose rankings or facts may be decaying over time"
          >
            <EmptyState
              title="No Articles Require Refresh Yet"
              description="BlogNexa tracks publication timestamps and SERP drift to recommend automated article updates. As articles mature, refresh candidates will appear here."
              badgeLabel="FRESH REPOSITORY"
            />
          </Card>

          <Card
            title="Analytics Data Providers"
            subtitle="External performance connections"
          >
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '8px 0' }}>
                <span style={{ fontWeight: 600 }}>Google Search Console:</span>
                <Badge label="Not Connected" variant="empty" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '8px 0' }}>
                <span style={{ fontWeight: 600 }}>Google Analytics 4:</span>
                <Badge label="Not Connected" variant="empty" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontWeight: 600 }}>WordPress Internal Hits:</span>
                <Badge label="Active" variant="healthy" />
              </div>
              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModule('integrations')}
                >
                  Configure Integrations
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
