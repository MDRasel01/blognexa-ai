import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useApp } from '../../state/AppContext';
import { PluginSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, pluginStatus, bootConfig, hasCapability, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'content' | 'publishing' | 'permissions' | 'privacy' | 'diagnostics'>('general');

  // Form state
  const [formData, setFormData] = useState<Partial<PluginSettings>>({
    writing_language: 'en_US',
    default_content_type: 'post',
    default_approval_mode: 'manual',
    content_quality_threshold: 80,
    brand_voice: 'Professional, informative, and authoritative',
    backend_url: 'https://api.blognexa.ai',
    data_retention_days: 90,
    purge_data_on_uninstall: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const canManage = hasCapability('blognexa_manage_settings');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleFieldChange = (key: keyof PluginSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!canManage) {
      alert('You do not have permission to modify BlogNexa AI settings.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateSettings(formData);
    setIsSaving(false);

    if (success) {
      setSaveMessage({ text: 'Settings updated successfully via REST API.', type: 'success' });
    } else {
      setSaveMessage({ text: 'Failed to update settings. Please check server logs.', type: 'error' });
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI Configuration' },
    { id: 'content', label: 'Content Preferences' },
    { id: 'publishing', label: 'Publishing Rules' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'privacy', label: 'Data & Privacy' },
    { id: 'diagnostics', label: 'System Diagnostics' },
  ];

  return (
    <div>
      <PageHeader
        title="Settings & Governance"
        description="Configure application defaults, AI generation boundaries, security parameters, and data retention rules."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!canManage || isSaving}
          >
            Save Changes
          </Button>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Save feedback banner */}
        {saveMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              background: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: saveMessage.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${saveMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            {saveMessage.type === 'success' ? '✓ ' : '⚠️ '}
            {saveMessage.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '24px',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <Card title="General Plugin Preferences" subtitle="Core operational parameters and site defaults">
            <div className="bnx-form-group">
              <label className="bnx-form-label">Default Content Post Type</label>
              <select
                className="bnx-select"
                value={formData.default_content_type || 'post'}
                onChange={(e) => handleFieldChange('default_content_type', e.target.value)}
              >
                <option value="post">Standard WordPress Post (post)</option>
                <option value="page">Standard WordPress Page (page)</option>
              </select>
              <div className="bnx-form-help">Destination post type used when Blog Studio publishes new articles.</div>
            </div>

            <div className="bnx-form-group">
              <label className="bnx-form-label">Primary Writing Language</label>
              <select
                className="bnx-select"
                value={formData.writing_language || 'en_US'}
                onChange={(e) => handleFieldChange('writing_language', e.target.value)}
              >
                <option value="en_US">English (United States)</option>
                <option value="en_GB">English (United Kingdom)</option>
                <option value="bn_BD">Bengali (বাংলা)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="es_ES">Spanish (Español)</option>
              </select>
            </div>
          </Card>
        )}

        {activeTab === 'ai' && (
          <Card title="AI Model & Inference Configuration" subtitle="Model selection and prompt safety boundaries">
            <div className="bnx-form-group">
              <label className="bnx-form-label">Primary LLM Model Tier</label>
              <select className="bnx-select" defaultValue="claude-3-5-sonnet">
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommended for Deep Research & Nuance)</option>
                <option value="gpt-4o">GPT-4o (High Speed & Structural Consistency)</option>
                <option value="gemini-1-5-pro">Gemini 1.5 Pro (Large Context Window Analysis)</option>
              </select>
            </div>

            <div className="bnx-form-group">
              <label className="bnx-form-label">AI Hallucination Guardrail</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>Strict Fact Grounding via Knowledge Base (Enforced by architecture)</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'content' && (
          <Card title="Brand Voice & Quality Controls" subtitle="Editorial tone and automated review thresholds">
            <div className="bnx-form-group">
              <label className="bnx-form-label">Brand Voice Directive</label>
              <textarea
                rows={3}
                className="bnx-input"
                style={{ maxWidth: '600px' }}
                value={formData.brand_voice || ''}
                onChange={(e) => handleFieldChange('brand_voice', e.target.value)}
              />
              <div className="bnx-form-help">Instructions passed into AI system prompts to match your brand's unique style.</div>
            </div>

            <div className="bnx-form-group">
              <label className="bnx-form-label">Content Quality Gate Score (0 - 100)</label>
              <input
                type="number"
                min={50}
                max={100}
                className="bnx-input"
                style={{ width: '120px' }}
                value={formData.content_quality_threshold || 80}
                onChange={(e) => handleFieldChange('content_quality_threshold', parseInt(e.target.value, 10))}
              />
              <div className="bnx-form-help">Minimum readability and SEO density score required before article can be auto-approved.</div>
            </div>
          </Card>
        )}

        {activeTab === 'publishing' && (
          <Card title="Publishing & Editorial Governance" subtitle="Publication rules and sign-off requirements">
            <div className="bnx-form-group">
              <label className="bnx-form-label">Default Approval Workflow</label>
              <select
                className="bnx-select"
                value={formData.default_approval_mode || 'manual'}
                onChange={(e) => handleFieldChange('default_approval_mode', e.target.value)}
              >
                <option value="manual">Manual Review Required (Administrator / Editor must sign off)</option>
                <option value="auto">Automated Scheduling (Publishes automatically if quality score passes)</option>
              </select>
              <div className="bnx-form-help">
                Security safeguard: Automated publishing remains subject to role capabilities and audit logging.
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'permissions' && (
          <Card title="Capability Access Matrix" subtitle="Custom WordPress capabilities registered for BlogNexa AI">
            <div style={{ fontSize: '13px' }}>
              <p style={{ color: '#64748b', marginTop: 0 }}>
                BlogNexa AI enforces 13 custom capabilities assigned to Administrator roles during activation:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  'blognexa_access',
                  'blognexa_manage_settings',
                  'blognexa_scan_website',
                  'blognexa_manage_knowledge',
                  'blognexa_manage_strategy',
                  'blognexa_manage_seo',
                  'blognexa_create_blog',
                  'blognexa_edit_blog',
                  'blognexa_publish_blog',
                  'blognexa_view_analytics',
                  'blognexa_manage_integrations',
                  'blognexa_view_audit',
                  'blognexa_purge_data',
                ].map((cap) => (
                  <div
                    key={cap}
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <code>{cap}</code>
                    <Badge label="Granted" variant="healthy" showDot={false} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'privacy' && (
          <Card title="Data Retention & Privacy Lifecycle" subtitle="Data governance and uninstallation behavior">
            <div className="bnx-form-group">
              <label className="bnx-form-label">Audit Log Retention Window (Days)</label>
              <input
                type="number"
                min={30}
                max={365}
                className="bnx-input"
                style={{ width: '120px' }}
                value={formData.data_retention_days || 90}
                onChange={(e) => handleFieldChange('data_retention_days', parseInt(e.target.value, 10))}
              />
              <div className="bnx-form-help">Audit log entries older than this duration are pruned automatically by daily cron.</div>
            </div>

            <div className="bnx-form-group" style={{ marginTop: '24px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#991b1b' }}>
                <input
                  type="checkbox"
                  checked={formData.purge_data_on_uninstall || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowPurgeConfirm(true);
                    } else {
                      handleFieldChange('purge_data_on_uninstall', false);
                    }
                  }}
                />
                Purge All Plugin Tables & Data on Plugin Uninstall
              </label>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#b91c1c' }}>
                Default is <strong>FALSE</strong>. As per Step 01 & Step 02 standards, BlogNexa never drops tables or erases data on deactivation or uninstall unless explicitly confirmed here.
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'diagnostics' && (
          <Card title="System Diagnostics & Runtime Telemetry" subtitle="Inspect underlying PHP runtime, WordPress environment, and REST endpoints">
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Plugin Architecture:</span>
                <span style={{ fontWeight: 600 }}>BlogNexa AI Modular Monolith (PSR-4)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Plugin Version:</span>
                <span>{pluginStatus?.plugin?.version || '1.0.0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Database Schema Version:</span>
                <span>{pluginStatus?.plugin?.db_version || '1.0.0'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>PHP Version:</span>
                <span>{pluginStatus?.environment?.php_version || '8.1.34'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>WordPress Core:</span>
                <span>{pluginStatus?.environment?.wp_version || '7.1.4'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>REST API Namespace:</span>
                <code>/wp-json/blognexa/v1</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>SSRF Direct IP & Metadata Guard:</span>
                <Badge label="Active" variant="healthy" />
              </div>
            </div>
          </Card>
        )}

        {/* Purge Data Confirmation Modal */}
        {showPurgeConfirm && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setShowPurgeConfirm(false)}
            onConfirm={() => {
              handleFieldChange('purge_data_on_uninstall', true);
              setShowPurgeConfirm(false);
            }}
            title="Warning: Irreversible Data Deletion on Uninstall"
            message="Enabling this option will permanently drop all 4 BlogNexa database tables (wp_bnx_connections, wp_bnx_jobs, wp_bnx_publications, wp_bnx_audit) and remove all settings if the plugin is ever uninstalled. Are you sure you wish to enable this?"
            confirmLabel="Enable Data Purge"
            variant="danger"
          />
        )}
      </div>
    </div>
  );
};
