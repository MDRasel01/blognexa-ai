import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { useApp } from '../../state/AppContext';

interface PageInventoryItem {
  id: string;
  title: string;
  url: string;
  type: string;
  status: 'indexed' | 'pending' | 'failed' | 'excluded';
  lastModified: string;
  lastScanned: string;
}

export const WebsiteIntelligenceView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [includePosts, setIncludePosts] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [respectRobots, setRespectRobots] = useState(true);
  const [scanType, setScanType] = useState<'incremental' | 'full'>('incremental');
  const [excludePatterns, setExcludePatterns] = useState('/tag/*, /author/*');

  // Honest data: initially empty until scanned by backend
  const [inventory] = useState<PageInventoryItem[]>([]);

  const isConnected = connectionStatus?.connected ?? false;
  const canScan = hasCapability('blognexa_scan_website');

  const handleStartScan = () => {
    if (!isConnected) {
      alert('Cloud AI Backend is currently disconnected. Please configure backend credentials in Integrations.');
      return;
    }
    setIsScanning(true);
  };

  const columns: Column<PageInventoryItem>[] = [
    {
      key: 'title',
      header: 'Page / Post Title',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.title}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.url}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '100px',
      render: (row) => <Badge label={row.type} variant="empty" showDot={false} />,
    },
    {
      key: 'status',
      header: 'Intelligence Status',
      width: '140px',
      render: (row) => {
        const variantMap: Record<string, any> = {
          indexed: 'healthy',
          pending: 'warning',
          failed: 'disconnected',
          excluded: 'empty',
        };
        return <Badge label={row.status} variant={variantMap[row.status] || 'empty'} />;
      },
    },
    {
      key: 'lastModified',
      header: 'Modified',
      width: '120px',
    },
    {
      key: 'lastScanned',
      header: 'Scanned',
      width: '120px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Website Intelligence"
        description="Autonomous content discovery, structural sitemap crawl, and topic understanding engine."
        badge={
          <Badge
            label={isConnected ? 'Ready to Scan' : 'Backend Disconnected'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleStartScan}
            disabled={!canScan}
            isLoading={isScanning}
          >
            {isScanning ? 'Scan in Progress...' : 'Start Website Crawl'}
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Backend Warning Banner if Disconnected */}
        {!isConnected && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <div>
              <strong>Cloud Backend Connection Required:</strong> Website crawling, DOM parsing, and deep semantic analysis run on the secure cloud engine to protect your WordPress server resources.
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveModule('integrations')}
            >
              Connect Backend
            </Button>
          </div>
        )}

        {/* Scan Configuration & Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card
            title="Crawl & Discovery Configuration"
            subtitle="Configure scope and boundaries for website intelligence ingestion"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Content Scope
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includePosts}
                      onChange={(e) => setIncludePosts(e.target.checked)}
                    />
                    Include Published Posts (WordPress Post)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includePages}
                      onChange={(e) => setIncludePages(e.target.checked)}
                    />
                    Include Standard Pages (WordPress Page)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={respectRobots}
                      onChange={(e) => setRespectRobots(e.target.checked)}
                    />
                    Strictly Respect robots.txt Directives
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Scan Mode
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="scanType"
                      checked={scanType === 'incremental'}
                      onChange={() => setScanType('incremental')}
                    />
                    Incremental (New/Modified)
                  </label>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="scanType"
                      checked={scanType === 'full'}
                      onChange={() => setScanType('full')}
                    />
                    Full Rescan
                  </label>
                </div>

                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#475569' }}>
                  Excluded URL Patterns
                </label>
                <input
                  type="text"
                  value={excludePatterns}
                  onChange={(e) => setExcludePatterns(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                  }}
                  placeholder="e.g. /cart/*, /checkout/*"
                />
              </div>
            </div>
          </Card>

          <Card
            title="Crawl Engine Status"
            subtitle="Controlled asynchronous background job telemetry"
          >
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Active Job ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{isScanning ? 'job_crawl_01' : 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <Badge
                  label={isScanning ? 'CRAWLING' : 'IDLE'}
                  variant={isScanning ? 'primary' : 'empty'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Discovered URLs:</span>
                <span style={{ fontWeight: 600 }}>{isScanning ? 'Scanning...' : '0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Failed URLs:</span>
                <span>0</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Page Inventory Section */}
        <Card
          title="Discovered Page Inventory"
          subtitle="Inventory of indexed pages and content assets eligible for knowledge building"
        >
          {inventory.length === 0 ? (
            <EmptyState
              title="No Pages Scanned Yet"
              description="Your website content inventory is currently empty. Connect your Cloud AI backend and trigger your first crawl to discover published articles and structural pages."
              badgeLabel="UNINDEXED"
              actionLabel={isConnected ? 'Initiate First Scan' : 'Configure Backend Connection'}
              onAction={isConnected ? handleStartScan : () => setActiveModule('integrations')}
            />
          ) : (
            <DataTable columns={columns} data={inventory} />
          )}
        </Card>
      </div>
    </div>
  );
};
