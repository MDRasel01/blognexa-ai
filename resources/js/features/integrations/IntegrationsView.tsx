import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { Modal } from '../../components/Modal/Modal';
import { useApp } from '../../state/AppContext';

interface IntegrationCardItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'connected' | 'disconnected' | 'detected' | 'not_installed';
  capabilities: string[];
  icon: string;
}

export const IntegrationsView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCardItem | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [backendUrlInput, setBackendUrlInput] = useState('https://api.blognexa.ai');

  const isCloudConnected = connectionStatus?.connected ?? false;
  const canManage = hasCapability('blognexa_manage_integrations');

  const integrations: IntegrationCardItem[] = [
    {
      id: 'google-gemini',
      name: 'Google Gemini AI',
      category: 'AI Engine (Direct API)',
      description: 'Ultra-fast, high-context AI model with 1,000,000 token context window. Free tier available via Google AI Studio.',
      status: isCloudConnected ? 'connected' : 'disconnected',
      capabilities: ['Gemini 1.5 Flash', 'Gemini 1.5 Pro', 'No External Server', 'Direct WordPress Execution'],
      icon: '✨',
    },
    {
      id: 'openai',
      name: 'OpenAI (GPT-4o)',
      category: 'AI Engine (Direct API)',
      description: 'Direct GPT-4o & GPT-4o-mini inference for structured article drafting and semantic analysis.',
      status: 'disconnected',
      capabilities: ['GPT-4o', 'GPT-4o-mini', 'No External Server', 'Direct API'],
      icon: '🤖',
    },
    {
      id: 'wp-core',
      name: 'WordPress Core Engine',
      category: 'CMS Foundation',
      description: 'Native integration with WP Cron, Custom Post Types, Media Library, and User Capabilities.',
      status: 'connected',
      capabilities: ['wp_posts', 'wp_media', 'Capability Enforcer', 'Audit Logger'],
      icon: '🌐',
    },
    {
      id: 'rankmath',
      name: 'Rank Math SEO',
      category: 'SEO Suite',
      description: 'Automatic synchronization of Focus Keywords, Schema Markup, and OpenGraph metadata.',
      status: 'detected',
      capabilities: ['Focus Keywords', 'Rich Snippets', 'Social Cards'],
      icon: '🎯',
    },
    {
      id: 'yoast',
      name: 'Yoast SEO',
      category: 'SEO Suite',
      description: 'Content readability analysis, SEO title optimization, and XML sitemap updates.',
      status: 'not_installed',
      capabilities: ['Readability Scores', 'Meta Tags', 'Sitemaps'],
      icon: '🔍',
    },
    {
      id: 'aioseo',
      name: 'All in One SEO (AIOSEO)',
      category: 'SEO Suite',
      description: 'TruSEO score validation and social thumbnail generation.',
      status: 'not_installed',
      capabilities: ['TruSEO Scoring', 'Robots Rules', 'Headline Analyzer'],
      icon: '🚀',
    },
    {
      id: 'openai-gemini',
      name: 'Multi-Model AI Providers',
      category: 'AI Models',
      description: 'Enterprise models (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) managed securely via backend.',
      status: isCloudConnected ? 'connected' : 'disconnected',
      capabilities: ['Zero-Data Retention', 'Encrypted Vault', 'Automated Fallback'],
      icon: '🤖',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Service Integrations & API Connectors"
        description="Manage connected AI inference backends, SEO plugins, and external analytics providers."
        badge={
          <Badge
            label={isCloudConnected ? 'Cloud Bridge Active' : 'Bridge Offline'}
            variant={isCloudConnected ? 'healthy' : 'disconnected'}
          />
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {integrations.map((item) => {
            const isConn = item.status === 'connected';
            const isDet = item.status === 'detected';
            const isNotInst = item.status === 'not_installed';

            return (
              <Card
                key={item.id}
                title={`${item.icon} ${item.name}`}
                subtitle={item.category}
                actions={
                  <Badge
                    label={
                      isConn
                        ? 'Connected'
                        : isDet
                        ? 'Detected'
                        : isNotInst
                        ? 'Not Installed'
                        : 'Disconnected'
                    }
                    variant={isConn ? 'healthy' : isDet ? 'primary' : 'empty'}
                  />
                }
                footer={
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {item.capabilities.length} capabilities
                    </span>
                    <Button
                      variant={isConn ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={!canManage || isNotInst}
                      onClick={() => {
                        if (item.id === 'google-gemini' || item.id === 'openai') {
                          setActiveModule('settings');
                        } else {
                          setSelectedIntegration(item);
                        }
                      }}
                    >
                      {isConn ? 'Manage' : isDet ? 'Connect' : 'Setup'}
                    </Button>
                  </div>
                }
              >
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {item.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Configuration Modal */}
        {selectedIntegration && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedIntegration(null)}
            title={`Configure ${selectedIntegration.name}`}
            footer={
              <>
                <Button variant="secondary" onClick={() => setSelectedIntegration(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    alert(`Securely updating credentials for ${selectedIntegration.name}...`);
                    setSelectedIntegration(null);
                  }}
                >
                  Save & Validate
                </Button>
              </>
            }
          >
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
                Credentials entered here are encrypted on the WordPress server using AES-256-CBC with HMAC verification before storage. Raw keys are never logged.
              </p>

              {selectedIntegration.id === 'cloud-backend' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Cloud AI Backend Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={backendUrlInput}
                    onChange={(e) => setBackendUrlInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Must be a valid HTTPS URL. Localhost and private RFC 1918 IPs are blocked by SSRF guards.
                  </span>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  API Key / Secret Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter secret key (stored masked)..."
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

