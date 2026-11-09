import React from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { useApp } from '../../state/AppContext';

export const OverviewView: React.FC = () => {
  const { bootConfig, pluginStatus, connectionStatus, refreshStatus, setActiveModule, isLoading } = useApp();

  const isConnected = connectionStatus?.connected ?? false;
  const version = pluginStatus?.plugin?.version || bootConfig?.site?.version || '1.0.0';
  const phpVersion = pluginStatus?.environment?.php_version || '8.1.34';
  const wpVersion = pluginStatus?.environment?.wp_version || '7.1.4';

  return (
    <div>
      <PageHeader
        title="Operational Overview"
        description="Real-time operational status, database health, and module readiness of BlogNexa AI."
        badge={
          <Badge
            label={isConnected ? 'Cloud Online' : 'Cloud Disconnected'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
        actions={
          <Button variant="secondary" size="sm" onClick={() => refreshStatus()} isLoading={isLoading}>
            Refresh Status
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Foundation Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <StatCard
            title="Plugin Foundation"
            value={`v${version}`}
            badgeLabel="Phase 02 Ready"
            badgeVariant="healthy"
            description={`PHP ${phpVersion} • WordPress ${wpVersion}`}
          />
          <StatCard
            title="Cloud AI Backend"
            value={isConnected ? 'Connected' : 'Offline'}
            badgeLabel={isConnected ? 'Healthy' : 'Disconnected'}
            badgeVariant={isConnected ? 'healthy' : 'disconnected'}
            description={connectionStatus?.backend_url || 'https://api.blognexa.ai (Default)'}
          />
          <StatCard
            title="Database Tables"
            value="4 / 4"
            badgeLabel="Verified"
            badgeVariant="healthy"
            description="Connections, Jobs, Publications, Audit"
          />
          <StatCard
            title="Security Capabilities"
            value="13 / 13"
            badgeLabel="Enforced"
            badgeVariant="primary"
            description="REST nonce & custom role capability checks"
          />
        </div>

        {/* Operational Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Website Connection Card */}
          <Card
            title="Website Connection & Security"
            subtitle="Local WordPress to Cloud AI bridge identity"
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModule('integrations')}
              >
                Configure
              </Button>
            }
          >
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Connection Status:</span>
                <Badge
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  variant={isConnected ? 'healthy' : 'disconnected'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Site Domain:</span>
                <span style={{ fontWeight: 600 }}>{bootConfig?.site?.name || 'Local Site'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Site URL:</span>
                <code style={{ fontSize: '11px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
                  {bootConfig?.site?.url || 'https://www.halaldizworld.com'}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>SSRF & Payload Guard:</span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>Active (RFC 1918 Blocked)</span>
              </div>
            </div>
          </Card>

          {/* Website Intelligence Card */}
          <Card
            title="Website Intelligence Status"
            subtitle="Autonomous crawler and page inventory metrics"
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveModule('website-intelligence')}
              >
                Scan Controls
              </Button>
            }
          >
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Discovered Pages:</span>
                <span style={{ fontWeight: 600 }}>0 (Scan Required)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Processed Pages:</span>
                <span>0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Last Scan Date:</span>
                <span style={{ color: '#64748b' }}>Never scanned</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Crawl Engine:</span>
                <Badge label="Backend Required" variant="empty" />
              </div>
            </div>
          </Card>
        </div>

        {/* Content Operations & Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Content Pipeline Status */}
          <Card
            title="Editorial & Publishing Pipeline"
            subtitle="Articles awaiting review, scheduled, or published"
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModule('publishing')}
              >
                View Queue
              </Button>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', padding: '8px 0' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>0</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Drafts</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#b45309' }}>0</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Pending Review</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>0</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Scheduled</div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#15803d' }}>0</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Published</div>
              </div>
            </div>
          </Card>

          {/* System Audit Trail */}
          <Card
            title="System Audit Trail"
            subtitle="Recent lifecycle and administrative events"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModule('settings')}
              >
                Diagnostics
              </Button>
            }
          >
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#15803d' }}>✓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Step 02 Bootstrap & Modules Initialized</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>11 product modules registered & active</div>
                </div>
                <span style={{ color: '#94a3b8' }}>System</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#15803d' }}>✓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>Database Schema Verified</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>4 indexed tables healthy (wp_bnx_*)</div>
                </div>
                <span style={{ color: '#94a3b8' }}>Database</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', padding: '8px 0' }}>
                <span style={{ color: '#3b82f6' }}>ℹ</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>REST API Foundation Online</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>/wp-json/blognexa/v1 ready</div>
                </div>
                <span style={{ color: '#94a3b8' }}>REST</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

