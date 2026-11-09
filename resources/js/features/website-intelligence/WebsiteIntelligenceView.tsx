import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { useApp } from '../../state/AppContext';
import { apiClient } from '../../services/apiClient';

interface PageInventoryItem {
  id: string;
  title: string;
  url: string;
  type: string;
  status: 'indexed' | 'pending' | 'failed' | 'excluded';
  wordCount?: number;
  lastModified: string;
  lastScanned: string;
}

interface CrawlProgress {
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalDiscovered: number;
  totalProcessed: number;
  totalFailed: number;
  totalSkipped: number;
}

export const WebsiteIntelligenceView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string>('');
  const [includePosts, setIncludePosts] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [respectRobots, setRespectRobots] = useState(true);
  const [scanType, setScanType] = useState<'incremental' | 'full'>('incremental');
  const [excludePatterns, setExcludePatterns] = useState('/tag/*, /author/*');

  const [progress, setProgress] = useState<CrawlProgress>({
    status: 'idle',
    totalDiscovered: 0,
    totalProcessed: 0,
    totalFailed: 0,
    totalSkipped: 0,
  });

  const [inventory, setInventory] = useState<PageInventoryItem[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const isConnected = connectionStatus?.connected ?? false;
  const canScan = hasCapability('blognexa_scan_website');

  // Load existing documents & status on initial mount
  useEffect(() => {
    loadInventory();
    checkInitialStatus();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const checkInitialStatus = async () => {
    try {
      const res = await apiClient.get<any>('/crawler/status');
      if (res && res.status) {
        setProgress({
          status: res.status,
          totalDiscovered: res.total_discovered || 0,
          totalProcessed: res.total_processed || 0,
          totalFailed: res.total_failed || 0,
          totalSkipped: res.total_skipped || 0,
        });

        if (res.status === 'running' || res.status === 'queued') {
          setIsScanning(true);
          startPolling();
        }
      }
    } catch {
      // Ignore initial error when backend is offline
    }
  };

  const loadInventory = async () => {
    try {
      const res = await apiClient.get<{ documents: any[] }>('/crawler/documents');
      if (res && Array.isArray(res.documents)) {
        const items: PageInventoryItem[] = res.documents.map((d: any) => ({
          id: d.id,
          title: d.title || 'Untitled Document',
          url: d.url || d.canonical_url,
          type: d.document_type || 'article',
          status: 'indexed',
          wordCount: d.word_count || 0,
          lastModified: d.modified_at ? new Date(d.modified_at).toLocaleDateString() : 'N/A',
          lastScanned: d.last_extracted_at ? new Date(d.last_extracted_at * 1000).toLocaleDateString() : 'Just now',
        }));
        setInventory(items);
      }
    } catch {
      // Offline fallback
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const res = await apiClient.get<any>('/crawler/status');
        if (res) {
          setProgress({
            status: res.status,
            totalDiscovered: res.total_discovered || 0,
            totalProcessed: res.total_processed || 0,
            totalFailed: res.total_failed || 0,
            totalSkipped: res.total_skipped || 0,
          });

          if (res.status === 'completed' || res.status === 'failed' || res.status === 'cancelled') {
            setIsScanning(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            loadInventory();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const res = await apiClient.post<any>('/crawler/scan', {
        scan_type: scanType,
        respect_robots: respectRobots,
        exclude_patterns: excludePatterns,
      });

      if (res && res.job_id) {
        setActiveJobId(res.job_id);
      }
      await loadInventory();
      await checkInitialStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to start scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelScan = async () => {
    try {
      await apiClient.post('/crawler/cancel', { job_id: activeJobId });
      setIsScanning(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setProgress((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel crawl job.');
    }
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
      key: 'wordCount',
      header: 'Word Count',
      width: '110px',
      render: (row) => <span>{row.wordCount ? `${row.wordCount.toLocaleString()} words` : '—'}</span>,
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
            label={isScanning ? 'Scan in Progress' : 'Native Crawler Ready'}
            variant={isScanning ? 'warning' : 'healthy'}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {isScanning && (
              <Button
                variant="danger"
                size="md"
                onClick={handleCancelScan}
              >
                Cancel Crawl
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleStartScan}
              disabled={!canScan || isScanning}
              isLoading={isScanning}
            >
              {isScanning ? 'Scanning Website...' : 'Start Website Crawl'}
            </Button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px' }}>
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

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Exclude Patterns (Comma-separated)
                </label>
                <input
                  type="text"
                  value={excludePatterns}
                  onChange={(e) => setExcludePatterns(e.target.value)}
                  placeholder="/tag/*, /author/*"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </Card>

          <Card title="Live Crawl Metrics" subtitle="Status and throughput">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Crawl State:</span>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', color: progress.status === 'running' ? '#0284c7' : '#1e293b' }}>
                  {progress.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Discovered URLs:</span>
                <span style={{ fontWeight: 600 }}>{progress.totalDiscovered.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Extracted Documents:</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{progress.totalProcessed.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Failed / Inaccessible:</span>
                <span style={{ fontWeight: 600, color: progress.totalFailed > 0 ? '#dc2626' : '#64748b' }}>
                  {progress.totalFailed.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Robots Excluded:</span>
                <span style={{ fontWeight: 600 }}>{progress.totalSkipped.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Inventory Table */}
        <Card
          title="Discovered Content Inventory"
          subtitle="Indexed pages, articles, and semantic document structures extracted from your website"
        >
          {inventory.length === 0 ? (
            <EmptyState
              title={isScanning ? 'Extracting Content...' : 'No Website Content Ingested Yet'}
              description={
                isScanning
                  ? 'The crawler is currently fetching sitemaps and articles. Extracted documents will appear here.'
                  : 'Start your first website crawl to discover sitemaps, index published articles, and build your Topic Graph for Step 06 Knowledge Base.'
              }
              actionLabel={!isScanning && canScan && isConnected ? 'Start Initial Crawl' : undefined}
              onAction={!isScanning && canScan && isConnected ? handleStartScan : undefined}
            />
          ) : (
            <DataTable data={inventory} columns={columns} />
          )}
        </Card>
      </div>
    </div>
  );
};
