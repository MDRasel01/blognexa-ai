import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const MOUNT_ID = 'blognexa-ai-admin';

function mountBlogNexaApp(): void {
  const container = document.getElementById(MOUNT_ID);
  if (!container) {
    return;
  }

  // Prevent duplicate mounts if script is enqueued multiple times
  if ((container as any).__blognexa_mounted) {
    return;
  }
  (container as any).__blognexa_mounted = true;

  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('[BlogNexa AI] Failed to mount Admin Application:', err);
    container.innerHTML = `
      <div style="padding: 24px; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px;">
        <h3 style="margin: 0 0 8px; font-size: 16px;">Application Initialization Error</h3>
        <p style="margin: 0; font-size: 13px;">Failed to initialize BlogNexa AI Admin interface. Please check browser console logs.</p>
      </div>
    `;
  }
}

// If container is already present in DOM (standard WordPress footer execution), mount immediately
if (document.getElementById(MOUNT_ID)) {
  mountBlogNexaApp();
} else {
  document.addEventListener('DOMContentLoaded', mountBlogNexaApp);
  window.addEventListener('load', mountBlogNexaApp);
}
