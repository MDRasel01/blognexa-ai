import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useApp } from '../../state/AppContext';
import {
  PluginSettings,
  AIConfig,
  SEODetectionResponse,
  PostTypesResponse,
  CoreEngineStatusResponse,
} from '../../types';
import { apiClient } from '../../services/apiClient';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, pluginStatus, bootConfig, hasCapability, refreshStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'ai' | 'seo' | 'core_cpt' | 'backend' | 'general'>('ai');

  // Form state for general settings
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

  // Section A: Gemini AI Configuration
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
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Section B: SEO Plugin Auto-Detection
  const [seoData, setSeoData] = useState<SEODetectionResponse | null>(null);
  const [isLoadingSEO, setIsLoadingSEO] = useState(false);

  // Section C & D: WordPress Core & Custom Post Types
  const [coreStatus, setCoreStatus] = useState<CoreEngineStatusResponse | null>(null);
  const [postTypesData, setPostTypesData] = useState<PostTypesResponse | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['post', 'page']);
  const [isSavingPostTypes, setIsSavingPostTypes] = useState(false);

  // General state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const canManage = hasCapability('blognexa_manage_settings');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Load all server-side integration metadata on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [aiRes, seoRes, coreRes, cptRes] = await Promise.allSettled([
        apiClient.getAIConfig(),
        apiClient.getSEODetection(),
        apiClient.getCoreEngineStatus(),
        apiClient.getPostTypes(),
      ]);

      if (aiRes.status === 'fulfilled' && aiRes.value?.data) {
        setAiConfig(aiRes.value.data);
      }
      if (seoRes.status === 'fulfilled' && seoRes.value?.data) {
        setSeoData(seoRes.value.data);
      }
      if (coreRes.status === 'fulfilled' && coreRes.value?.data) {
        setCoreStatus(coreRes.value.data);
      }
      if (cptRes.status === 'fulfilled' && cptRes.value?.data) {
        setPostTypesData(cptRes.value.data);
        setSelectedTypes(cptRes.value.data.enabled_types || ['post', 'page']);
      }
    } catch (err) {
      console.error('Failed to load integration settings:', err);
    }
  };

  const handleFieldChange = (key: keyof PluginSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  };

  // Section A: Save / Connect Gemini API
  const handleSaveGeminiKey = async () => {
    if (!canManage) return;
    setIsSaving(true);
    setSaveMessage(null);

    const payload: Partial<AIConfig> = {
      provider: 'gemini',
      gemini_model: aiConfig.gemini_model,
    };

    if (geminiKeyInput.trim()) {
      payload.gemini_api_key = geminiKeyInput.trim();
    }

    try {
      const res = await apiClient.saveAIConfig(payload);
      if (res && res.data) {
        setAiConfig(res.data.config);
        setIsEditingKey(false);
        setGeminiKeyInput('');
        setSaveMessage({ text: 'Google Gemini API credentials saved securely.', type: 'success' });
        refreshStatus();
      }
    } catch (err: any) {
      setSaveMessage({ text: err.message || 'Failed to save Gemini API key.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Section A: Test Gemini Connection
  const handleTestGemini = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);

    const keyToTest = geminiKeyInput.trim() || undefined;

    try {
      const res = await apiClient.testAIConnection({
        provider: 'gemini',
        api_key: keyToTest,
        model: aiConfig.gemini_model,
      });

      if (res && res.data) {
        setAiTestResult({
          success: true,
          message: `Connection Verified! Connected to Google Gemini (${res.data.model}) in ${res.data.latency_ms}ms.`,
        });
        refreshStatus();
      } else {
        setAiTestResult({ success: false, message: 'Invalid response from Google Gemini API.' });
      }
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err.message || 'Connection test failed. Check API key and network permissions.',
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  // Section B: Switch Primary SEO Provider
  const handleSetPrimarySEO = async (providerKey: string) => {
    setIsLoadingSEO(true);
    try {
      const res = await apiClient.setPrimarySEO(providerKey);
      if (res && res.data) {
        setSeoData(res.data);
      }
    } catch (err) {
      console.error('Failed to set primary SEO:', err);
    } finally {
      setIsLoadingSEO(false);
    }
  };

  // Section D: Toggle and Save Post Types
  const handleTogglePostType = (slug: string) => {
    setSelectedTypes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSavePostTypes = async () => {
    setIsSavingPostTypes(true);
    try {
      const res = await apiClient.savePostTypes(selectedTypes);
      if (res && res.data) {
        setPostTypesData(res.data);
        setSelectedTypes(res.data.enabled_types);
        setSaveMessage({ text: 'Custom Post Type authorization rules saved.', type: 'success' });
      }
    } catch (err: any) {
      setSaveMessage({ text: err.message || 'Failed to save post types.', type: 'error' });
    } finally {
      setIsSavingPostTypes(false);
    }
  };

  // Save General Preferences
  const handleSaveGeneral = async () => {
    if (!canManage) return;
    setIsSaving(true);
    setSaveMessage(null);

    const success = await updateSettings(formData);
    setIsSaving(false);

    if (success) {
      setSaveMessage({ text: 'General preferences updated successfully.', type: 'success' });
    } else {
      setSaveMessage({ text: 'Failed to update preferences.', type: 'error' });
    }
  };

  const tabs = [
    { id: 'ai', label: 'AI Provider (Gemini)' },
    { id: 'seo', label: 'SEO Integrations' },
    { id: 'core_cpt', label: 'WordPress Core & Content' },
    { id: 'backend', label: 'Backend Service' },
    { id: 'general', label: 'General & Editorial' },
  ];

  return (
    <div>
      <PageHeader
        title="Settings & System Governance"
        description="Manage Google Gemini AI, auto-detected SEO suites, native WordPress capabilities, and content policies."
        actions={
          activeTab === 'general' ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveGeneral}
              isLoading={isSaving}
              disabled={!canManage || isSaving}
            >
              Save Preferences
            </Button>
          ) : undefined
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Save message banner */}
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
                padding: '10px 18px',
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

        {/* ========================================================================= */}
        {/* SECTION A — AI PROVIDER (GEMINI ONLY) */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card
              title="Google Gemini API"
              subtitle="Connect your Google Gemini API to enable AI-powered content processing, embedding generation, and automated article drafting."
              actions={
                <Badge
                  label={aiConfig.has_gemini_key ? 'Connected' : 'Not Connected'}
                  variant={aiConfig.has_gemini_key ? 'healthy' : 'warning'}
                />
              }
            >
              {/* Test result alert */}
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

              <div style={{ maxWidth: '640px' }}>
                {/* Masked API Key or Input Field */}
                <div className="bnx-form-group">
                  <label className="bnx-form-label" style={{ fontWeight: 600 }}>Gemini API Key</label>
                  {aiConfig.has_gemini_key && !isEditingKey ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <code
                        style={{
                          padding: '8px 14px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '13px',
                          letterSpacing: '0.1em',
                          color: '#0f172a',
                          fontWeight: 600,
                        }}
                      >
                        {aiConfig.gemini_api_key || 'AIza••••••••••••••••••••••••'}
                      </code>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsEditingKey(true);
                          setGeminiKeyInput('');
                        }}
                      >
                        Replace API Key
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleTestGemini}
                        isLoading={isTestingAI}
                        disabled={isTestingAI}
                      >
                        ⚡ Test Connection
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="password"
                        className="bnx-input"
                        placeholder="AIza... (Paste your Google Gemini API key)"
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        style={{ width: '100%', fontFamily: 'monospace' }}
                      />
                      <div className="bnx-form-help" style={{ marginTop: '8px', lineHeight: 1.5 }}>
                        🔑 Need an API key? You can generate a free Gemini API key in 30 seconds at{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                        >
                          Google AI Studio (aistudio.google.com)
                        </a>.
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveGeminiKey}
                          isLoading={isSaving}
                          disabled={!geminiKeyInput.trim() || isSaving}
                        >
                          Connect Gemini API
                        </Button>
                        {isEditingKey && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setIsEditingKey(false);
                              setGeminiKeyInput('');
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleTestGemini}
                          isLoading={isTestingAI}
                          disabled={!geminiKeyInput.trim() || isTestingAI}
                        >
                          ⚡ Test Connection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gemini Model Selector */}
                <div className="bnx-form-group" style={{ marginTop: '20px' }}>
                  <label className="bnx-form-label" style={{ fontWeight: 600 }}>Active Gemini Model</label>
                  <select
                    className="bnx-select"
                    value={aiConfig.gemini_model || 'gemini-1.5-flash'}
                    onChange={(e) => setAiConfig((prev) => ({ ...prev, gemini_model: e.target.value }))}
                    style={{ maxWidth: '420px' }}
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast, high accuracy, Free Tier)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning & nuanced research)</option>
                  </select>
                  <div className="bnx-form-help">
                    Gemini 1.5 Flash provides optimal throughput for content indexing and rapid drafting.
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Security & Credential Vault" subtitle="Strict protection of AI keys on your WordPress server">
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Server-Side Encryption:</span>
                  <span>API keys are stored encrypted via authenticated Libsodium/OpenSSL cipher. Plaintext keys are never stored in options or database tables.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Zero Browser Exposure:</span>
                  <span>JavaScript and public REST APIs only receive masked representations (e.g. AIza••••••••). Keys never touch client-side logs.</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION B — SEO INTEGRATIONS (RANK MATH, YOAST, AIOSEO) */}
        {/* ========================================================================= */}
        {activeTab === 'seo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                WordPress SEO Suite Auto-Detection
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                BlogNexa AI automatically detects supported SEO plugins installed on this WordPress website. No external API keys or separate accounts required.
              </p>
            </div>

            {/* Multiple SEO Conflict Warning */}
            {seoData?.has_conflict && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>⚠️ Multiple Active SEO Plugins Detected</div>
                <div>{seoData.conflict_message}</div>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600 }}>Primary SEO Metadata Provider:</span>
                  <select
                    className="bnx-select"
                    value={seoData.primary_provider || ''}
                    onChange={(e) => handleSetPrimarySEO(e.target.value)}
                    disabled={isLoadingSEO}
                    style={{ padding: '4px 10px', fontSize: '12px', width: 'auto' }}
                  >
                    {Object.values(seoData.providers)
                      .filter((p) => p.is_active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* 3 SEO Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {seoData?.providers &&
                Object.values(seoData.providers).map((item) => {
                  const isConn = item.status === 'connected';
                  const isInactive = item.status === 'installed_inactive';

                  return (
                    <Card
                      key={item.id}
                      title={item.name}
                      subtitle="Automatically detected WordPress plugin"
                      actions={
                        <Badge
                          label={
                            isConn
                              ? item.is_primary
                                ? 'Connected (Primary)'
                                : 'Connected'
                              : isInactive
                              ? 'Installed — Inactive'
                              : 'Not Installed'
                          }
                          variant={isConn ? 'healthy' : isInactive ? 'primary' : 'empty'}
                        />
                      }
                      footer={
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                            No API Key required
                          </span>
                          {!isConn && item.action_url && (
                            <a
                              href={item.action_url}
                              className={`bnx-btn bnx-btn-${isInactive ? 'primary' : 'secondary'}`}
                              style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none' }}
                            >
                              {isInactive ? 'Activate Plugin' : 'Install This Plugin'}
                            </a>
                          )}
                          {isConn && (
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                              ✓ Active (v{item.version})
                            </span>
                          )}
                        </div>
                      }
                    >
                      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                        {item.description} Synchronizes focus keywords, meta descriptions, and schema markup natively.
                      </p>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        File: <code>{item.file}</code>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION C & D — WORDPRESS CORE & CUSTOM POST TYPES */}
        {/* ========================================================================= */}
        {activeTab === 'core_cpt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section C: WordPress Core Engine */}
            <Card
              title="WordPress Core Engine"
              subtitle="Native WordPress functionality, capability enforcer, and REST API bridge"
              actions={<Badge label="Available" variant="healthy" />}
            >
              <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>WordPress Core Version:</span>
                  <span style={{ fontWeight: 600 }}>{coreStatus?.runtime?.wp_version || '7.1.4'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>PHP Runtime Version:</span>
                  <span style={{ fontWeight: 600 }}>{coreStatus?.runtime?.php_version || '8.1.34'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>REST API Status:</span>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>Available ({coreStatus?.runtime?.rest_namespace || 'blognexa/v1'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>Architecture & Integration Model:</span>
                  <span style={{ fontWeight: 600 }}>Native In-Process WordPress Service (No external API needed)</span>
                </div>
              </div>
            </Card>

            {/* Section D: Custom Post Types Discovery */}
            <Card
              title="Custom Post Types Discovery"
              subtitle="Automatically discovered post types on your site. Choose which post types BlogNexa AI can index, research, and publish to."
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePostTypes}
                  isLoading={isSavingPostTypes}
                  disabled={isSavingPostTypes}
                >
                  Save Post Types
                </Button>
              }
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '8px 12px' }}>Enable</th>
                      <th style={{ padding: '8px 12px' }}>Post Type</th>
                      <th style={{ padding: '8px 12px' }}>Slug</th>
                      <th style={{ padding: '8px 12px' }}>Public Status</th>
                      <th style={{ padding: '8px 12px' }}>REST API</th>
                      <th style={{ padding: '8px 12px' }}>Published Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postTypesData?.post_types &&
                      postTypesData.post_types.map((cpt) => {
                        const isChecked = selectedTypes.includes(cpt.slug);
                        return (
                          <tr key={cpt.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePostType(cpt.slug)}
                              />
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{cpt.label}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <code>{cpt.slug}</code>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <Badge label={cpt.is_public ? 'Public' : 'Private'} variant={cpt.is_public ? 'healthy' : 'warning'} />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <Badge label={cpt.show_in_rest ? 'REST Enabled' : 'Non-REST'} variant={cpt.show_in_rest ? 'healthy' : 'empty'} />
                            </td>
                            <td style={{ padding: '10px 12px' }}>{cpt.published_count} items</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION E — BACKEND SERVICE */}
        {/* ========================================================================= */}
        {activeTab === 'backend' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card
              title="Backend Service Architecture"
              subtitle="Automatic background data synchronization and processing engine"
              actions={<Badge label="Operational" variant="healthy" />}
            >
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                BlogNexa AI operates via automatic backend synchronization. No manual API keys, external connection credentials, or separate cloud setup is required from the user.
              </p>

              <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>Backend Status:</span>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>Synchronization Mode:</span>
                  <span>Automatic (Event-driven & WP Cron fallback)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>Security Transport:</span>
                  <span>HMAC-SHA256 Authenticated Request Signing with Replay Guard</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>SSRF Protection:</span>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>Active (RFC 1918 & Cloud Metadata Protected)</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GENERAL & EDITORIAL PREFERENCES */}
        {/* ========================================================================= */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="Editorial Preferences" subtitle="Destination post type and primary language">
              <div className="bnx-form-group">
                <label className="bnx-form-label">Default Publishing Post Type</label>
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

              <div className="bnx-form-group">
                <label className="bnx-form-label">Brand Voice Directive</label>
                <textarea
                  rows={3}
                  className="bnx-input"
                  style={{ maxWidth: '600px' }}
                  value={formData.brand_voice || ''}
                  onChange={(e) => handleFieldChange('brand_voice', e.target.value)}
                />
                <div className="bnx-form-help">Instructions passed into AI prompts to match your site's tone.</div>
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
              </div>
            </Card>

            <Card title="Data Retention & Uninstall" subtitle="Audit log retention and data cleanup behavior">
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
              </div>

              <div className="bnx-form-group" style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
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
              </div>
            </Card>
          </div>
        )}

        {/* Purge Confirmation */}
        {showPurgeConfirm && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setShowPurgeConfirm(false)}
            onConfirm={() => {
              handleFieldChange('purge_data_on_uninstall', true);
              setShowPurgeConfirm(false);
            }}
            title="Warning: Irreversible Data Deletion on Uninstall"
            message="Enabling this option will permanently drop all BlogNexa database tables and remove all settings if the plugin is ever uninstalled. Are you sure?"
            confirmLabel="Enable Data Purge"
            variant="danger"
          />
        )}
      </div>
    </div>
  );
};
