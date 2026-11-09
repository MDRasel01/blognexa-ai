import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { useApp } from '../../state/AppContext';

interface KeywordItem {
  id: string;
  keyword: string;
  intent: 'Informational' | 'Commercial' | 'Transactional';
  volume: number | null;
  difficulty: number | null;
  source: string;
  cluster: string;
}

export const SEOResearchView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [seedKeyword, setSeedKeyword] = useState('');
  const [activeIntent, setActiveIntent] = useState<string>('all');
  const [keywords] = useState<KeywordItem[]>([]);
  const isConnected = connectionStatus?.connected ?? false;
  const canResearch = hasCapability('blognexa_manage_seo');

  const columns: Column<KeywordItem>[] = [
    {
      key: 'keyword',
      header: 'Target Keyword',
      render: (kw) => (
        <div>
          <span style={{ fontWeight: 600 }}>{kw.keyword}</span>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Cluster: {kw.cluster}</div>
        </div>
      ),
    },
    {
      key: 'intent',
      header: 'Intent',
      width: '130px',
      render: (kw) => <Badge label={kw.intent} variant="primary" showDot={false} />,
    },
    {
      key: 'volume',
      header: 'Monthly Volume',
      width: '130px',
      render: (kw) => (
        <span style={{ fontWeight: 600 }}>
          {kw.volume !== null ? kw.volume.toLocaleString() : 'N/A (Unconnected)'}
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: 'KD %',
      width: '100px',
      render: (kw) => (
        <span>{kw.difficulty !== null ? `${kw.difficulty}%` : '—'}</span>
      ),
    },
    {
      key: 'source',
      header: 'Provider',
      width: '140px',
      render: (kw) => <Badge label={kw.source} variant="empty" showDot={false} />,
    },
    {
      key: 'action',
      header: 'Actions',
      width: '140px',
      render: (kw) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActiveModule('blog-studio')}
        >
          Draft in Studio
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SEO & Keyword Research Workspace"
        description="Comprehensive SERP intent analysis, competitor ranking discovery, and semantic keyword cluster mapping."
        badge={
          <Badge
            label={isConnected ? 'SERP Engine Ready' : 'Backend Disconnected'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Keyword Search Input Bar */}
        <Card
          title="Search Keyword Intent & SERP Landscape"
          subtitle="Query live search results or cluster opportunities from your knowledge base"
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter seed topic or keyword (e.g. halal travel tips, seo blog automation)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
            <Button
              variant="primary"
              size="md"
              disabled={!canResearch || !isConnected || !seedKeyword.trim()}
              onClick={() => alert(`Starting SERP research job for "${seedKeyword}"...`)}
            >
              Analyze SERP & Keywords
            </Button>
          </div>

          {/* Search Intent Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[
              { id: 'all', label: 'All Intents' },
              { id: 'informational', label: 'Informational' },
              { id: 'commercial', label: 'Commercial' },
              { id: 'transactional', label: 'Transactional' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveIntent(tab.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: activeIntent === tab.id ? 600 : 500,
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: activeIntent === tab.id ? '#3b82f6' : '#e2e8f0',
                  background: activeIntent === tab.id ? '#eff6ff' : '#ffffff',
                  color: activeIntent === tab.id ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Keyword Results Table */}
        <Card
          title="Discovered Keyword Clusters"
          subtitle="Algorithmic keyword opportunities with validated search intent and difficulty"
        >
          {keywords.length === 0 ? (
            <EmptyState
              title="No Keyword Research Performed"
              description="Enter a seed keyword or connect your Cloud AI backend to generate real-time SERP competitor benchmarks and search volume metrics."
              badgeLabel="NO DATA"
              actionLabel={isConnected ? 'Run First Keyword Analysis' : 'Connect Cloud Backend'}
              onAction={isConnected ? () => {} : () => setActiveModule('integrations')}
            />
          ) : (
            <DataTable columns={columns} data={keywords} />
          )}
        </Card>
      </div>
    </div>
  );
};
