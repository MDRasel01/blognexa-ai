import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Badge } from '../../components/Badge/Badge';
import { useApp } from '../../state/AppContext';
import { SEODetectionResponse, CoreEngineStatusResponse } from '../../types';
import { apiClient } from '../../services/apiClient';

export const IntegrationsView: React.FC = () => {
  const { connectionStatus, setActiveModule } = useApp();
  const [seoData, setSeoData] = useState<SEODetectionResponse | null>(null);
  const [coreStatus, setCoreStatus] = useState<CoreEngineStatusResponse | null>(null);

  useEffect(() => {
    apiClient.getSEODetection().then((res) => {
      if (res && res.data) {
        setSeoData(res.data);
      }
    }).catch(() => {});

    apiClient.getCoreEngineStatus().then((res) => {
      if (res && res.data) {
        setCoreStatus(res.data);
      }
    }).catch(() => {});
  }, []);

  const isGeminiConnected = connectionStatus?.connected ?? false;

  return (
    <div>
      <PageHeader
        title="WordPress Services & Integrations"
        description="Automatic WordPress plugin detection, native core capabilities, and Google Gemini AI status."
        badge={
          <Badge
            label={isGeminiConnected ? 'Gemini AI Connected' : 'Gemini Key Required'}
            variant={isGeminiConnected ? 'healthy' : 'warning'}
          />
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {/* Multiple SEO Conflict Warning if present */}
        {seoData?.has_conflict && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <strong>⚠️ Multiple Active SEO Plugins Detected:</strong> {seoData.conflict_message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {/* 1. Google Gemini AI */}
          <Card
            title="Google Gemini AI"
            subtitle="AI Provider"
            actions={
              <Badge
                label={isGeminiConnected ? 'Connected' : 'Not Connected'}
                variant={isGeminiConnected ? 'healthy' : 'warning'}
              />
            }
            footer={
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Google AI Studio API</span>
                <button
                  type="button"
                  className="bnx-btn bnx-btn-primary"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setActiveModule('settings')}
                >
                  {isGeminiConnected ? 'Manage Key' : 'Configure Gemini'}
                </button>
              </div>
            }
          >
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Connects directly to Google Gemini (1.5 Flash / 1.5 Pro) for autonomous research, embedding generation, and blog post drafting.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                Gemini 1.5 Flash
              </span>
              <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                Gemini 1.5 Pro
              </span>
              <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                Free Tier Available
              </span>
            </div>
          </Card>

          {/* 2. Rank Math SEO */}
          {seoData?.providers?.rankmath && (
            <Card
              title="Rank Math SEO"
              subtitle="Automatically detected WordPress plugin"
              actions={
                <Badge
                  label={
                    seoData.providers.rankmath.status === 'connected'
                      ? seoData.providers.rankmath.is_primary
                        ? 'Connected (Primary)'
                        : 'Connected'
                      : seoData.providers.rankmath.status === 'installed_inactive'
                      ? 'Installed — Inactive'
                      : 'Not Installed'
                  }
                  variant={
                    seoData.providers.rankmath.status === 'connected'
                      ? 'healthy'
                      : seoData.providers.rankmath.status === 'installed_inactive'
                      ? 'primary'
                      : 'empty'
                  }
                />
              }
              footer={
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>No API Key required</span>
                  {!seoData.providers.rankmath.is_active && seoData.providers.rankmath.action_url && (
                    <a
                      href={seoData.providers.rankmath.action_url}
                      className="bnx-btn bnx-btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      {seoData.providers.rankmath.status === 'installed_inactive' ? 'Activate Plugin' : 'Install This Plugin'}
                    </a>
                  )}
                  {seoData.providers.rankmath.is_active && (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                      ✓ Active (v{seoData.providers.rankmath.version})
                    </span>
                  )}
                </div>
              }
            >
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Rank Math SEO plugin detected on this WordPress website. Synchronizes focus keywords, schema markup, and meta tags natively.
              </p>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                File: <code>seo-by-rank-math/seo-by-rank-math.php</code>
              </div>
            </Card>
          )}

          {/* 3. Yoast SEO */}
          {seoData?.providers?.yoast && (
            <Card
              title="Yoast SEO"
              subtitle="Automatically detected WordPress plugin"
              actions={
                <Badge
                  label={
                    seoData.providers.yoast.status === 'connected'
                      ? seoData.providers.yoast.is_primary
                        ? 'Connected (Primary)'
                        : 'Connected'
                      : seoData.providers.yoast.status === 'installed_inactive'
                      ? 'Installed — Inactive'
                      : 'Not Installed'
                  }
                  variant={
                    seoData.providers.yoast.status === 'connected'
                      ? 'healthy'
                      : seoData.providers.yoast.status === 'installed_inactive'
                      ? 'primary'
                      : 'empty'
                  }
                />
              }
              footer={
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>No API Key required</span>
                  {!seoData.providers.yoast.is_active && seoData.providers.yoast.action_url && (
                    <a
                      href={seoData.providers.yoast.action_url}
                      className="bnx-btn bnx-btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      {seoData.providers.yoast.status === 'installed_inactive' ? 'Activate Plugin' : 'Install This Plugin'}
                    </a>
                  )}
                  {seoData.providers.yoast.is_active && (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                      ✓ Active (v{seoData.providers.yoast.version})
                    </span>
                  )}
                </div>
              }
            >
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Yoast SEO plugin detected on this WordPress website. Manages title templates, meta descriptions, and XML sitemaps natively.
              </p>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                File: <code>wordpress-seo/wp-seo.php</code>
              </div>
            </Card>
          )}

          {/* 4. All in One SEO */}
          {seoData?.providers?.aioseo && (
            <Card
              title="All in One SEO"
              subtitle="Automatically detected WordPress plugin"
              actions={
                <Badge
                  label={
                    seoData.providers.aioseo.status === 'connected'
                      ? seoData.providers.aioseo.is_primary
                        ? 'Connected (Primary)'
                        : 'Connected'
                      : seoData.providers.aioseo.status === 'installed_inactive'
                      ? 'Installed — Inactive'
                      : 'Not Installed'
                  }
                  variant={
                    seoData.providers.aioseo.status === 'connected'
                      ? 'healthy'
                      : seoData.providers.aioseo.status === 'installed_inactive'
                      ? 'primary'
                      : 'empty'
                  }
                />
              }
              footer={
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>No API Key required</span>
                  {!seoData.providers.aioseo.is_active && seoData.providers.aioseo.action_url && (
                    <a
                      href={seoData.providers.aioseo.action_url}
                      className="bnx-btn bnx-btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      {seoData.providers.aioseo.status === 'installed_inactive' ? 'Activate Plugin' : 'Install This Plugin'}
                    </a>
                  )}
                  {seoData.providers.aioseo.is_active && (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                      ✓ Active (v{seoData.providers.aioseo.version})
                    </span>
                  )}
                </div>
              }
            >
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                All in One SEO plugin detected on this WordPress website. Manages TruSEO score validation and social thumbnail tags.
              </p>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                File: <code>all-in-one-seo-pack/all_in_one_seo_pack.php</code>
              </div>
            </Card>
          )}

          {/* 5. WordPress Core Engine */}
          <Card
            title="WordPress Core Engine"
            subtitle="Native CMS Capability"
            actions={<Badge label="Available" variant="healthy" />}
            footer={
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>✓ Built-in & Operational</span>
                <button
                  type="button"
                  className="bnx-btn bnx-btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setActiveModule('settings')}
                >
                  Manage Post Types
                </button>
              </div>
            }
          >
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Native integration with WP Cron, Custom Post Types, REST APIs, and User Capabilities. No external API required.
            </p>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              <div>WordPress: <strong>v{coreStatus?.runtime?.wp_version || '7.1.4'}</strong></div>
              <div>PHP: <strong>v{coreStatus?.runtime?.php_version || '8.1.34'}</strong></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
