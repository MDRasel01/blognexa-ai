import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useApp } from '../../state/AppContext';

interface TopicOpportunity {
  id: string;
  topic: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  primaryKeyword: string;
  difficulty: string;
}

export const ContentStrategyView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [topics] = useState<TopicOpportunity[]>([]);
  const isConnected = connectionStatus?.connected ?? false;
  const canManage = hasCapability('blognexa_manage_strategy');

  return (
    <div>
      <PageHeader
        title="Content Strategy & Topic Clusters"
        description="Data-driven content pillars, keyword clustering, and algorithmic gap discovery tailored to your niche."
        badge={
          <Badge
            label={isConnected ? 'Strategy Engine Ready' : 'Backend Required'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
        actions={
          <Button
            variant="primary"
            size="md"
            disabled={!canManage || !isConnected}
            onClick={() => alert('Analyzing content gaps and formulating new topic clusters...')}
          >
            Generate Topic Clusters
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Strategy Pillars & Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Card
            title="Strategic Content Pillars"
            subtitle="Core thematic clusters defining your site's organic search authority"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                  Pillar 01
                </div>
                <h4 style={{ margin: '6px 0 4px', fontSize: '14px', fontWeight: 600 }}>Core Product Guides</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Educational walkthroughs and foundational answers.
                </p>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>0 planned articles</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                  Pillar 02
                </div>
                <h4 style={{ margin: '6px 0 4px', fontSize: '14px', fontWeight: 600 }}>Commercial Comparisons</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  High-intent buyer guides and alternatives.
                </p>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>0 planned articles</div>
              </div>

              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>
                  Pillar 03
                </div>
                <h4 style={{ margin: '6px 0 4px', fontSize: '14px', fontWeight: 600 }}>Industry Trends</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Timely commentary and topical news updates.
                </p>
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>0 planned articles</div>
              </div>
            </div>
          </Card>

          <Card
            title="Content Gap Radar"
            subtitle="Competitor topic voids awaiting coverage"
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>0 Gaps</div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>
                Run website scan and SEO competitor analysis to detect untapped search opportunities.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModule('seo-research')}
              >
                Inspect SEO Research
              </Button>
            </div>
          </Card>
        </div>

        {/* Recommended Topics List */}
        <Card
          title="Editorial Topic Opportunities"
          subtitle="AI-recommended topic candidates ranked by priority and organic ranking potential"
        >
          {topics.length === 0 ? (
            <EmptyState
              title="No Topic Recommendations Yet"
              description="Strategic topic generation requires an active Cloud AI backend connection and knowledge base indexing. Generate topic clusters once your foundation data is synced."
              badgeLabel="STRATEGY PENDING"
              actionLabel={isConnected ? 'Formulate Initial Strategy' : 'Configure Backend Connection'}
              onAction={isConnected ? () => {} : () => setActiveModule('integrations')}
            />
          ) : (
            <div>Topics list</div>
          )}
        </Card>
      </div>
    </div>
  );
};
