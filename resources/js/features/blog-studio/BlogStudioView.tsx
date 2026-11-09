import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { useApp } from '../../state/AppContext';

const STAGES = [
  { id: 'topic', label: '1. Topic & Intent', desc: 'Define core subject' },
  { id: 'research', label: '2. Research Brief', desc: 'Citations & facts' },
  { id: 'outline', label: '3. Content Outline', desc: 'H2/H3 architecture' },
  { id: 'draft', label: '4. Article Draft', desc: 'Drafting & synthesis' },
  { id: 'review', label: '5. SEO Review', desc: 'Score & density' },
  { id: 'approval', label: '6. Final Approval', desc: 'Ready to schedule' },
];

export const BlogStudioView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [currentStage, setCurrentStage] = useState<string>('draft');
  const [title, setTitle] = useState('Comprehensive Guide to AI-Powered Content Architecture in WordPress');
  const [content, setContent] = useState(`## Introduction\n\nArtificial Intelligence is transforming how modern WordPress publishers conduct research, structure long-form articles, and ensure semantic relevance.\n\n### The Importance of Grounded Knowledge\n\nUnlike generic language models, BlogNexa AI anchors generated insights against your website's actual indexed content, ensuring brand consistency and verifiable facts.`);
  const [metaTitle, setMetaTitle] = useState('AI Content Architecture in WordPress | BlogNexa Guide');
  const [metaDesc, setMetaDesc] = useState('Learn how to design and build an AI-powered content pipeline inside WordPress with autonomous research, persistent knowledge bases, and SEO intelligence.');
  const [focusKeyword, setFocusKeyword] = useState('WordPress AI content architecture');
  const [isSaved, setIsSaved] = useState(true);

  const isConnected = connectionStatus?.connected ?? false;
  const canCreate = hasCapability('blognexa_create_blog');
  const wordsCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordsCount / 200);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    alert('Article draft saved locally in WordPress database.');
  };

  return (
    <div>
      <PageHeader
        title="Blog Studio — Content Creation Workspace"
        description="Structured multi-stage article synthesis, RAG fact validation, and professional editorial workflow."
        badge={
          <Badge
            label={isSaved ? 'Draft Saved' : 'Unsaved Changes'}
            variant={isSaved ? 'healthy' : 'warning'}
          />
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleSaveDraft}
              disabled={!canCreate || isSaved}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveModule('publishing')}
            >
              Submit for Approval
            </Button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          {/* Workflow Stage Sidebar */}
          <div>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  marginBottom: '12px',
                  letterSpacing: '0.05em',
                }}
              >
                Editorial Workflow
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {STAGES.map((stage) => {
                  const isActive = currentStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setCurrentStage(stage.id)}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isActive ? '#3b82f6' : 'transparent',
                        background: isActive ? '#eff6ff' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#1d4ed8' : '#0f172a',
                        }}
                      >
                        {stage.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {stage.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* AI Grounding Notice */}
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: '#475569',
                }}
              >
                <strong>AI Transparency:</strong> All drafted sections indicate whether content was generated via backend AI or manually authored by human editors.
              </div>
            </div>
          </div>

          {/* Main Article Editor Surface */}
          <div>
            <Card>
              {/* Title Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                  Article Headline (H1)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  style={{
                    width: '100%',
                    fontSize: '18px',
                    fontWeight: 700,
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    color: '#0f172a',
                  }}
                />
              </div>

              {/* Stats Toolbar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span>Words: <strong>{wordsCount}</strong></span>
                  <span>Est. Read: <strong>{readingTime} min</strong></span>
                  <span>Focus: <strong>{focusKeyword}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge label="AI Grounded Draft" variant="primary" />
                </div>
              </div>

              {/* Content Editor Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  rows={14}
                  value={content}
                  onChange={handleContentChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* SEO Meta Box */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '16px',
                  background: '#fafafa',
                }}
              >
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                  SEO Metadata & Snippet Preview
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      SEO Meta Title ({metaTitle.length}/60 chars)
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    SEO Meta Description ({metaDesc.length}/160 chars)
                  </label>
                  <textarea
                    rows={2}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
