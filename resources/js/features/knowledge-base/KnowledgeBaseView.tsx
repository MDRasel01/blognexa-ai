import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { useApp } from '../../state/AppContext';

interface KnowledgeDoc {
  id: string;
  title: string;
  sourceUrl: string;
  type: string;
  chunks: number;
  lastIndexed: string;
  status: 'indexed' | 'syncing' | 'failed';
}

export const KnowledgeBaseView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [documents] = useState<KnowledgeDoc[]>([]);
  const isConnected = connectionStatus?.connected ?? false;
  const canManage = hasCapability('blognexa_manage_knowledge');

  const columns: Column<KnowledgeDoc>[] = [
    {
      key: 'title',
      header: 'Source Document',
      render: (doc) => (
        <div>
          <div style={{ fontWeight: 600 }}>{doc.title}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{doc.sourceUrl}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '120px',
      render: (doc) => <Badge label={doc.type} variant="empty" showDot={false} />,
    },
    {
      key: 'chunks',
      header: 'Vector Chunks',
      width: '130px',
      render: (doc) => <span style={{ fontWeight: 600 }}>{doc.chunks} chunks</span>,
    },
    {
      key: 'status',
      header: 'Index Status',
      width: '130px',
      render: (doc) => {
        const variantMap: Record<string, any> = {
          indexed: 'healthy',
          syncing: 'primary',
          failed: 'disconnected',
        };
        return <Badge label={doc.status} variant={variantMap[doc.status] || 'empty'} />;
      },
    },
    {
      key: 'lastIndexed',
      header: 'Last Indexed',
      width: '140px',
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: () => (
        <Button variant="ghost" size="sm" disabled={!canManage}>
          Re-index
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Knowledge Base & RAG Index"
        description="Persistent semantic knowledge repository enabling accurate AI citations and hallucination-free article generation."
        badge={
          <Badge
            label={isConnected ? 'Vector DB Ready' : 'Backend Required'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
        actions={
          <Button
            variant="secondary"
            size="md"
            disabled={!canManage || !isConnected}
            onClick={() => alert('Synchronizing knowledge base with backend vector repository...')}
          >
            Sync Knowledge
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Knowledge Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Indexed Documents</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#0f172a' }}>0</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Awaiting ingestion</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Vector Embeddings</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#0f172a' }}>0 chunks</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>PostgreSQL pgvector</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Knowledge Freshness</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#b45309' }}>Pending</div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Initial crawl required</span>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Embedding Privacy</div>
            <div style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0', color: '#15803d' }}>Isolated</div>
            <span style={{ fontSize: '11px', color: '#15803d' }}>Tenant site boundaries</span>
          </div>
        </div>

        {/* Source Table */}
        <Card
          title="Ingested Knowledge Sources"
          subtitle="Registered website documents, brand guides, and business facts available for RAG injection"
        >
          {documents.length === 0 ? (
            <EmptyState
              title="Knowledge Base is Empty"
              description="No documents or site pages have been ingested into the semantic knowledge base yet. Run a Website Intelligence crawl or connect the Cloud AI backend to populate your domain knowledge."
              badgeLabel="UNPOPULATED"
              actionLabel="Run Website Crawl"
              onAction={() => setActiveModule('website-intelligence')}
            />
          ) : (
            <DataTable columns={columns} data={documents} />
          )}
        </Card>
      </div>
    </div>
  );
};

