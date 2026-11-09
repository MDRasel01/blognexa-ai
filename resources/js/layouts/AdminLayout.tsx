import React from 'react';

interface AdminLayoutProps {
  activeModule: string;
  onSelectModule: (id: string) => void;
  siteName: string;
  version: string;
  children: React.ReactNode;
}

const MODULE_LIST = [
  { id: 'overview', name: 'Overview' },
  { id: 'website-intelligence', name: 'Website Intelligence' },
  { id: 'knowledge-base', name: 'Knowledge Base' },
  { id: 'content-strategy', name: 'Content Strategy' },
  { id: 'seo-research', name: 'SEO Research' },
  { id: 'blog-studio', name: 'Blog Studio' },
  { id: 'image-studio', name: 'AI Image Studio' },
  { id: 'publishing', name: 'Publishing & Scheduling' },
  { id: 'analytics', name: 'Performance Analytics' },
  { id: 'integrations', name: 'Integrations' },
  { id: 'settings', name: 'Settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeModule,
  onSelectModule,
  siteName,
  version,
  children,
}) => {
  return (
    <div className="blognexa-layout">
      <header className="blognexa-header">
        <div>
          <h1>BlogNexa AI — Content Intelligence & Automation</h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {siteName} • Foundation v{version}
          </span>
        </div>
        <div>
          <span className="blognexa-badge blognexa-badge-healthy">System Healthy</span>
        </div>
      </header>

      <div className="blognexa-body">
        <aside className="blognexa-sidebar">
          {MODULE_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`blognexa-nav-item ${activeModule === item.id ? 'active' : ''}`}
              onClick={() => onSelectModule(item.id)}
            >
              {item.name}
            </button>
          ))}
        </aside>

        <main className="blognexa-content">
          {children}
        </main>
      </div>
    </div>
  );
};

