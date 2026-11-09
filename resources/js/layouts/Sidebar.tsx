import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  capability?: string;
  badge?: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface SidebarProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  userCapabilities?: Record<string, boolean>;
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: '📊', capability: 'blognexa_access' },
    ],
  },
  {
    title: 'Website Intelligence',
    items: [
      { id: 'website-intelligence', label: 'Website Intelligence', icon: '🌐', capability: 'blognexa_scan_website' },
      { id: 'knowledge-base', label: 'Knowledge Base', icon: '📚', capability: 'blognexa_manage_knowledge' },
    ],
  },
  {
    title: 'Content Operations',
    items: [
      { id: 'content-strategy', label: 'Content Strategy', icon: '🎯', capability: 'blognexa_manage_strategy' },
      { id: 'seo-research', label: 'SEO Research', icon: '🔍', capability: 'blognexa_manage_seo' },
      { id: 'blog-studio', label: 'Blog Studio', icon: '✍️', capability: 'blognexa_create_blog' },
      { id: 'image-studio', label: 'AI Image Studio', icon: '🎨', capability: 'blognexa_create_blog' },
    ],
  },
  {
    title: 'Publishing',
    items: [
      { id: 'publishing', label: 'Publishing & Scheduling', icon: '📅', capability: 'blognexa_publish_blog' },
      { id: 'analytics', label: 'Performance Analytics', icon: '📈', capability: 'blognexa_view_analytics' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'integrations', label: 'Integrations', icon: '🔌', capability: 'blognexa_manage_integrations' },
      { id: 'settings', label: 'Settings', icon: '⚙️', capability: 'blognexa_manage_settings' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  userCapabilities = {},
}) => {
  return (
    <aside
      className="bnx-sidebar"
      style={{
        width: '240px',
        background: 'var(--bnx-color-background, #f8fafc)',
        borderRight: '1px solid var(--bnx-color-border, #e2e8f0)',
        padding: '16px 0',
        flexShrink: 0,
        minHeight: '100%',
      }}
      aria-label="BlogNexa Navigation"
    >
      {NAVIGATION_GROUPS.map((group, groupIdx) => (
        <div key={groupIdx} style={{ marginBottom: '16px' }}>
          {group.title && (
            <div
              className="bnx-nav-group-title"
              style={{
                padding: '6px 20px 4px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--bnx-color-text-muted, #64748b)',
              }}
            >
              {group.title}
            </div>
          )}

          <nav>
            {group.items.map((item) => {
              const isActive = activeModule === item.id;
              const hasPermission =
                !item.capability ||
                userCapabilities[item.capability] === undefined ||
                userCapabilities[item.capability] === true;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`bnx-nav-item ${isActive ? 'active' : ''} ${!hasPermission ? 'disabled' : ''}`}
                  onClick={() => {
                    if (hasPermission) {
                      onSelectModule(item.id);
                      // Update URL query parameter without full page reload
                      if (typeof window !== 'undefined' && window.history) {
                        const url = new URL(window.location.href);
                        url.searchParams.set(
                          'page',
                          item.id === 'overview' ? 'blognexa-ai' : `blognexa-ai-${item.id}`
                        );
                        window.history.pushState({}, '', url.toString());
                      }
                    }
                  }}
                  disabled={!hasPermission}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? '#ffffff'
                      : hasPermission
                      ? 'var(--bnx-color-text-secondary, #475569)'
                      : '#94a3b8',
                    background: isActive ? 'var(--bnx-color-primary, #3b82f6)' : 'transparent',
                    border: 'none',
                    cursor: hasPermission ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    transition: 'all 0.15s ease-in-out',
                    borderLeft: isActive ? '4px solid #1d4ed8' : '4px solid transparent',
                  }}
                  title={!hasPermission ? 'Permission required' : item.label}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        padding: '1px 6px',
                        fontSize: '10px',
                        borderRadius: '9999px',
                        background: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        color: isActive ? '#ffffff' : '#475569',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
};
