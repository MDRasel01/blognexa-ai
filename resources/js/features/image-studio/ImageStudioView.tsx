import React, { useState } from 'react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Badge } from '../../components/Badge/Badge';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { useApp } from '../../state/AppContext';

interface GeneratedImage {
  id: string;
  prompt: string;
  aspectRatio: string;
  preset: string;
  altText: string;
  status: 'ready' | 'generating' | 'failed';
  url?: string;
  createdAt: string;
}

export const ImageStudioView: React.FC = () => {
  const { connectionStatus, hasCapability, setActiveModule } = useApp();
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [altText, setAltText] = useState('');
  const [images] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isConnected = connectionStatus?.connected ?? false;
  const canGenerate = hasCapability('blognexa_create_blog');

  const handleGenerate = () => {
    if (!isConnected) {
      alert('Cloud AI Backend connection is required to run generative image models.');
      return;
    }
    setIsGenerating(true);
  };

  return (
    <div>
      <PageHeader
        title="AI Image Studio"
        description="Generate contextual featured images, custom illustrations, and accessibility-compliant alt texts."
        badge={
          <Badge
            label={isConnected ? 'Image Engine Ready' : 'Backend Disconnected'}
            variant={isConnected ? 'healthy' : 'disconnected'}
          />
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Prompt & Config Card */}
          <Card
            title="Image Generation Prompt"
            subtitle="Describe the visual asset or let the AI extract context from your article topic"
          >
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Image Description / Creative Brief
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Modern editorial workspace with holographic neural networks and clean lighting, minimalist aesthetic..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Art Style Preset
                </label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="Photorealistic">Photorealistic Editorial</option>
                  <option value="VectorIllustration">Vector Modern Flat</option>
                  <option value="3DRender">3D Isometric Render</option>
                  <option value="MinimalistLine">Minimalist Line Art</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="16:9">16:9 (Recommended for Featured Hero)</option>
                  <option value="1:1">1:1 (Square / Social Share)</option>
                  <option value="4:3">4:3 (Traditional Post Image)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Accessibility Alt Text
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for visually impaired readers & Google Image SEO..."
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!canGenerate || !isConnected || !prompt.trim()}
              isLoading={isGenerating}
              onClick={handleGenerate}
            >
              Generate Image Asset
            </Button>
          </Card>

          {/* Media Library Integration Status */}
          <Card
            title="WordPress Media Integration"
            subtitle="Automatic import and attachment to WordPress uploads directory"
          >
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Uploads Target:</span>
                <span style={{ fontWeight: 600 }}>wp-content/uploads/</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Attachment Mode:</span>
                <span>Direct Media Library Injection</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>WebP Optimization:</span>
                <Badge label="Supported" variant="healthy" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Engine Status:</span>
                <Badge
                  label={isConnected ? 'Engine Online' : 'Backend Required'}
                  variant={isConnected ? 'healthy' : 'empty'}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Gallery Section */}
        <Card
          title="Generated Visual Assets"
          subtitle="Gallery of generated images ready to assign as featured images or inline media"
        >
          {images.length === 0 ? (
            <EmptyState
              title="No Images Generated Yet"
              description="Craft your first prompt above or generate visual assets directly from Blog Studio articles once your Cloud AI backend is connected."
              badgeLabel="GALLERY EMPTY"
              actionLabel={isConnected ? 'Create First Image' : 'Configure Cloud Backend'}
              onAction={isConnected ? () => {} : () => setActiveModule('integrations')}
            />
          ) : (
            <div>Gallery Grid</div>
          )}
        </Card>
      </div>
    </div>
  );
};
