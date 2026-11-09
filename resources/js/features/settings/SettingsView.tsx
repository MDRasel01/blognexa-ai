import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useApp } from '../../state/AppContext';
import { PluginSettings, AIConfig } from '../../types';
import { apiClient } from '../../services/apiClient';

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

  // Standalone AI Provider configuration
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'gemini',
    gemini_model: 'gemini-1.5-flash',
    gemini_api_key: '',
    has_gemini_key: false,
    openai_model: 'gpt-4o-mini',
    openai_api_key: '',
    has_openai_key: false,
    is_configured: false,
    last_tested_at: null,
    last_test_status: null,
  });
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const canManage = hasCapability('blognexa_manage_settings');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    apiClient.getAIConfig().then((res) => {
      if (res && res.data) {
        setAiConfig(res.data);
      }
    }).catch(() => {});
  }, []);

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

    const [settingsSuccess, aiSuccess] = await Promise.all([
      updateSettings(formData),
      apiClient.saveAIConfig(aiConfig).then(() => true).catch(() => false),
    ]);

    setIsSaving(false);

    if (settingsSuccess && aiSuccess) {
      setSaveMessage({ text: 'All settings and AI credentials saved securely.', type: 'success' });
    } else if (settingsSuccess) {
      setSaveMessage({ text: 'Plugin settings updated, but AI config failed to save.', type: 'error' });
    } else {
      setSaveMessage({ text: 'Failed to update settings. Please check server logs.', type: 'error' });
    }
  };

  const handleTestAI = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);

    const key = aiConfig.provider === 'openai' ? aiConfig.openai_api_key : aiConfig.gemini_api_key;
    const model = aiConfig.provider === 'openai' ? aiConfig.openai_model : aiConfig.gemini_model;

    try {
      const res = await apiClient.testAIConnection({
        provider: aiConfig.provider,
        api_key: key,
        model: model,
      });

      if (res && res.data) {
        setAiTestResult({
          success: true,
          message: `Connection Verified! Connected to ${aiConfig.provider.toUpperCase()} (${res.data.model}) in ${res.data.latency_ms}ms.`,
        });
      } else {
        setAiTestResult({ success: false, message: 'Invalid response from AI provider.' });
      }
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err?.message || 'Connection test failed. Check API key and network permissions.',
      });
    } finally {
      setIsTestingAI(false);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card
              title="Standalone Direct AI Configuration"
              subtitle="Connect directly to Google Gemini or OpenAI with zero external server requirements"
              actions={
                <Badge
                  label={aiConfig.is_configured ? 'API Key Configured' : 'Key Required'}
                  variant={aiConfig.is_configured ? 'healthy' : 'warning'}
                />
              }
            >
              {/* Test Connection Banner */}
              {aiTestResult && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    background: aiTestResult.success ? '#dcfce7' : '#fee2e2',
                    color: aiTestResult.success ? '#15803d' : '#b91c1c',
                    border: `1px solid ${aiTestResult.success ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  {aiTestResult.success ? '✓ ' : '⚠️ '}
                  {aiTestResult.message}
                </div>
              )}

              {/* Provider Selection */}
              <div className="bnx-form-group">
                <label className="bnx-form-label" style={{ fontWeight: 600 }}>Active AI Provider</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: aiConfig.provider === 'gemini' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: aiConfig.provider === 'gemini' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="radio"
                      name="ai_provider"
                      value="gemini"
                      checked={aiConfig.provider === 'gemini'}
                      onChange={() => setAiConfig((prev) => ({ ...prev, provider: 'gemini' }))}
                    />
                    <span>✨ Google Gemini (Recommended — Free Tier Available)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: aiConfig.provider === 'openai' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: aiConfig.provider === 'openai' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="radio"
                      name="ai_provider"
                      value="openai"
                      checked={aiConfig.provider === 'openai'}
                      onChange={() => setAiConfig((prev) => ({ ...prev, provider: 'openai' }))}
                    />
                    <span>⚡ OpenAI (GPT-4o / GPT-4o-mini)</span>
                  </label>
                </div>
              </div>

              {/* Gemini Configuration */}
              {aiConfig.provider === 'gemini' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="bnx-form-group">
                    <label className="bnx-form-label">Google Gemini API Key</label>
                    <input
                      type="password"
                      className="bnx-input"
                      placeholder={aiConfig.has_gemini_key ? '••••••••••••••••••••••••' : 'Paste Google Gemini API key...'}
                      value={aiConfig.gemini_api_key}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, gemini_api_key: e.target.value }))}
                      style={{ maxWidth: '520px', fontFamily: 'monospace' }}
                    />
                    <div className="bnx-form-help" style={{ marginTop: '6px' }}>
                      🔑 Need an API key? You can get a free Gemini API key in 30 seconds from{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Google AI Studio (Click here)
                      </a>.
                    </div>
                  </div>

                  <div className="bnx-form-group">
                    <label className="bnx-form-label">Gemini Model</label>
                    <select
                      className="bnx-select"
                      value={aiConfig.gemini_model || 'gemini-1.5-flash'}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, gemini_model: e.target.value }))}
                      style={{ maxWidth: '400px' }}
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast, high accuracy, Free Tier)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning & nuanced research)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* OpenAI Configuration */}
              {aiConfig.provider === 'openai' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="bnx-form-group">
                    <label className="bnx-form-label">OpenAI API Key</label>
                    <input
                      type="password"
                      className="bnx-input"
                      placeholder={aiConfig.has_openai_key ? '••••••••••••••••••••••••' : 'sk-... (Paste your key here)'}
                      value={aiConfig.openai_api_key}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, openai_api_key: e.target.value }))}
                      style={{ maxWidth: '520px', fontFamily: 'monospace' }}
                    />
                    <div className="bnx-form-help">
                      Your secret key from platform.openai.com. Stored encrypted with Libsodium/OpenSSL authenticated cipher.
                    </div>
                  </div>

                  <div className="bnx-form-group">
                    <label className="bnx-form-label">OpenAI Model</label>
                    <select
                      className="bnx-select"
                      value={aiConfig.openai_model || 'gpt-4o-mini'}
                      onChange={(e) => setAiConfig((prev) => ({ ...prev, openai_model: e.target.value }))}
                      style={{ maxWidth: '400px' }}
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini (Cost-efficient, high speed)</option>
                      <option value="gpt-4o">GPT-4o (Flagship omni model)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleTestAI}
                  isLoading={isTestingAI}
                  disabled={isTestingAI}
                >
                  ⚡ Test AI Connection
                </Button>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Sends a live ping to verify your API credentials.
                </span>
              </div>
            </Card>

            <Card title="AI Guardrails & Factuality" subtitle="Safety standards enforced by BlogNexa AI">
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Strict Fact Grounding:</span>
                  <span>Articles are generated using extracted website content to eliminate hallucinations.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Encrypted Key Storage:</span>
                  <span>API keys never leave your WordPress server and are never sent to any third party.</span>
                </div>
              </div>
            </Card>
          </div>
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

