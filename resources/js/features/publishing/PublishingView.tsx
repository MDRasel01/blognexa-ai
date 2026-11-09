import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useApp } from '../../state/AppContext';

interface PublicationItem {
  id: string;
  title: string;
  postType: string;
  status: 'draft' | 'pending' | 'scheduled' | 'published';
  scheduledFor?: string;
  author: string;
  idempotencyKey: string;
}

export const PublishingView: React.FC = () => {
  const { hasCapability, setActiveModule } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending' | 'scheduled' | 'published'>('all');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'list'>('list');
  const [publications] = useState<PublicationItem[]>([]);
  const [confirmItem, setConfirmItem] = useState<PublicationItem | null>(null);

  const canPublish = hasCapability('blognexa_publish_blog');

  const columns: Column<PublicationItem>[] = [
    {
      key: 'title',
      header: 'Article Headline',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600 }}>{row.title}</span>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Key: {row.idempotencyKey.substring(0, 16)}...</div>
        </div>
      ),
    },
    {
      key: 'postType',
      header: 'Type',
      width: '100px',
      render: (row) => <Badge label={row.postType} variant="empty" showDot={false} />,
    },
    {
      key: 'status',
      header: 'Editorial Status',
      width: '130px',
      render: (row) => {
        const variantMap: Record<string, any> = {
          published: 'healthy',
          scheduled: 'primary',
          pending: 'warning',
          draft: 'empty',
        };
        return <Badge label={row.status} variant={variantMap[row.status] || 'empty'} />;
      },
    },
    {
      key: 'scheduledFor',
      header: 'Schedule / Date',
      width: '140px',
      render: (row) => <span>{row.scheduledFor || 'Immediate'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '140px',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="primary"
            size="sm"
            disabled={!canPublish}
            onClick={() => setConfirmItem(row)}
          >
            Publish Now
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Publishing & Editorial Calendar"
        description="Review drafts, manage scheduled release queues, and enforce editorial sign-off rules."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              {(['list', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarView(mode)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: calendarView === mode ? 600 : 500,
                    background: calendarView === mode ? '#f1f5f9' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveModule('blog-studio')}
            >
              Draft New Article
            </Button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Editorial Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { id: 'all', label: 'All Content' },
            { id: 'draft', label: 'Drafts' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'scheduled', label: 'Scheduled Queue' },
            { id: 'published', label: 'Published' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeTab === tab.id ? '#3b82f6' : '#e2e8f0',
                background: activeTab === tab.id ? '#eff6ff' : '#ffffff',
                color: activeTab === tab.id ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Table / Queue */}
        <Card
          title="Editorial Publishing Queue"
          subtitle="Idempotency-protected publishing jobs synchronized with WordPress posts table"
        >
          {publications.length === 0 ? (
            <EmptyState
              title="No Articles in Publishing Queue"
              description="Your editorial queue is currently clean. Create and finalize article drafts in Blog Studio to review, schedule, or publish them directly to your WordPress site."
              badgeLabel="QUEUE EMPTY"
              actionLabel="Open Blog Studio"
              onAction={() => setActiveModule('blog-studio')}
            />
          ) : (
            <DataTable columns={columns} data={publications} />
          )}
        </Card>

        {/* Publication Confirmation Dialog */}
        {confirmItem && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setConfirmItem(null)}
            onConfirm={() => {
              alert(`Publishing "${confirmItem.title}" to WordPress posts table with idempotency lock...`);
              setConfirmItem(null);
            }}
            title="Confirm Article Publication"
            message={`Are you sure you want to publish "${confirmItem.title}" immediately to your public WordPress site? This action creates an audit trail entry.`}
            confirmLabel="Confirm & Publish"
            variant="primary"
          />
        )}
      </div>
    </div>
  );
};

