import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('blognexa-ai-admin');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
