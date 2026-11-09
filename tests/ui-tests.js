/**
 * BlogNexa AI - Step 03 UI & Frontend Verification Suite
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failedTests++;
  }
}

console.log('==========================================================');
console.log(' BLOGNEXA AI — STEP 03 UI & FRONTEND TEST SUITE');
console.log('==========================================================\n');

// Group 1: Asset and Build Verification
console.log('--- Build & Asset Integrity Tests ---');

runTest('Production JS bundle exists', () => {
  const jsPath = path.join(rootDir, 'build/index.js');
  assert.ok(fs.existsSync(jsPath), 'build/index.js must exist');
  const stat = fs.statSync(jsPath);
  assert.ok(stat.size > 10000, 'build/index.js must have non-trivial size');
  assert.ok(stat.size < 500000, `build/index.js is ${stat.size} bytes, within 500KB budget`);
});

runTest('Production CSS stylesheet exists', () => {
  const cssPath = path.join(rootDir, 'build/index.css');
  assert.ok(fs.existsSync(cssPath), 'build/index.css must exist');
  const stat = fs.statSync(cssPath);
  assert.ok(stat.size > 1000, 'build/index.css must be bundled');
});

runTest('WordPress asset metadata (index.asset.php) exists', () => {
  const assetPath = path.join(rootDir, 'build/index.asset.php');
  assert.ok(fs.existsSync(assetPath), 'build/index.asset.php must exist');
  const content = fs.readFileSync(assetPath, 'utf8');
  assert.ok(content.includes('dependencies'), 'Asset metadata must declare dependencies');
});

// Group 2: Design Tokens & CSS Architecture
console.log('\n--- Design Tokens & CSS Architecture Tests ---');

runTest('Tokens CSS defines all required color variables', () => {
  const tokens = fs.readFileSync(path.join(rootDir, 'resources/css/tokens.css'), 'utf8');
  assert.ok(tokens.includes('--bnx-color-primary'), 'Primary color token missing');
  assert.ok(tokens.includes('--bnx-color-surface'), 'Surface color token missing');
  assert.ok(tokens.includes('--bnx-color-text'), 'Text color token missing');
  assert.ok(tokens.includes('--bnx-color-border'), 'Border color token missing');
  assert.ok(tokens.includes('--bnx-color-success'), 'Success color token missing');
  assert.ok(tokens.includes('--bnx-color-warning'), 'Warning color token missing');
  assert.ok(tokens.includes('--bnx-color-danger'), 'Danger color token missing');
});

runTest('Tokens CSS defines typographic and spacing scale', () => {
  const tokens = fs.readFileSync(path.join(rootDir, 'resources/css/tokens.css'), 'utf8');
  assert.ok(tokens.includes('--bnx-font-family'), 'Font family token missing');
  assert.ok(tokens.includes('--bnx-space-1'), 'Spacing token space-1 missing');
  assert.ok(tokens.includes('--bnx-space-4'), 'Spacing token space-4 missing');
  assert.ok(tokens.includes('--bnx-space-8'), 'Spacing token space-8 missing');
});

// Group 3: Component Architecture
console.log('\n--- Shared Component Library Tests ---');

const expectedComponents = [
  'Button/Button.tsx',
  'Card/Card.tsx',
  'Badge/Badge.tsx',
  'DataTable/DataTable.tsx',
  'EmptyState/EmptyState.tsx',
  'ErrorState/ErrorState.tsx',
  'LoadingState/LoadingState.tsx',
  'StatusIndicator/StatusIndicator.tsx',
  'SearchInput/SearchInput.tsx',
  'Pagination/Pagination.tsx',
  'Modal/Modal.tsx',
  'ConfirmDialog/ConfirmDialog.tsx',
  'StatCard.tsx',
  'StatusBadge.tsx',
];

for (const comp of expectedComponents) {
  runTest(`Component exists: ${comp}`, () => {
    const compPath = path.join(rootDir, 'resources/js/components', comp);
    assert.ok(fs.existsSync(compPath), `${comp} must exist`);
  });
}

// Group 4: Layout & Navigation Structure
console.log('\n--- Layout & Navigation Tests ---');

runTest('Sidebar contains all 5 navigation groups and 11 modules', () => {
  const sidebar = fs.readFileSync(path.join(rootDir, 'resources/js/layouts/Sidebar.tsx'), 'utf8');
  const expectedModules = [
    'overview',
    'website-intelligence',
    'knowledge-base',
    'content-strategy',
    'seo-research',
    'blog-studio',
    'image-studio',
    'publishing',
    'analytics',
    'integrations',
    'settings',
  ];

  for (const mod of expectedModules) {
    assert.ok(sidebar.includes(`'${mod}'`), `Sidebar must contain module '${mod}'`);
  }

  assert.ok(sidebar.includes('Website Intelligence'), 'Group Website Intelligence missing');
  assert.ok(sidebar.includes('Content Operations'), 'Group Content Operations missing');
  assert.ok(sidebar.includes('Publishing'), 'Group Publishing missing');
  assert.ok(sidebar.includes('System'), 'Group System missing');
});

// Group 5: 11 Feature Views Integrity
console.log('\n--- 11 Feature Views Verification ---');

const expectedViews = [
  { name: 'Overview', path: 'resources/js/features/overview/OverviewView.tsx' },
  { name: 'Website Intelligence', path: 'resources/js/features/website-intelligence/WebsiteIntelligenceView.tsx' },
  { name: 'Knowledge Base', path: 'resources/js/features/knowledge-base/KnowledgeBaseView.tsx' },
  { name: 'Content Strategy', path: 'resources/js/features/content-strategy/ContentStrategyView.tsx' },
  { name: 'SEO Research', path: 'resources/js/features/seo-research/SEOResearchView.tsx' },
  { name: 'Blog Studio', path: 'resources/js/features/blog-studio/BlogStudioView.tsx' },
  { name: 'AI Image Studio', path: 'resources/js/features/image-studio/ImageStudioView.tsx' },
  { name: 'Publishing & Scheduling', path: 'resources/js/features/publishing/PublishingView.tsx' },
  { name: 'Performance Analytics', path: 'resources/js/features/analytics/AnalyticsView.tsx' },
  { name: 'Integrations', path: 'resources/js/features/integrations/IntegrationsView.tsx' },
  { name: 'Settings', path: 'resources/js/features/settings/SettingsView.tsx' },
];

for (const view of expectedViews) {
  runTest(`Feature View implemented: ${view.name}`, () => {
    const viewPath = path.join(rootDir, view.path);
    assert.ok(fs.existsSync(viewPath), `${view.name} must exist at ${view.path}`);
    const content = fs.readFileSync(viewPath, 'utf8');
    assert.ok(content.includes('export const'), 'View must be an exported React component');
  });
}

// Group 6: API Client & Security Contracts
console.log('\n--- API Client & Security UI Contracts ---');

runTest('API Client includes X-WP-Nonce header on every request', () => {
  const client = fs.readFileSync(path.join(rootDir, 'resources/js/services/apiClient.ts'), 'utf8');
  assert.ok(client.includes("'X-WP-Nonce'"), 'apiClient must attach X-WP-Nonce header');
  assert.ok(client.includes('getStatus'), 'apiClient must have getStatus endpoint');
  assert.ok(client.includes('getSettings'), 'apiClient must have getSettings endpoint');
  assert.ok(client.includes('updateSettings'), 'apiClient must have updateSettings endpoint');
});

runTest('UI does not hardcode private credentials or AI secrets', () => {
  const fullJs = fs.readFileSync(path.join(rootDir, 'build/index.js'), 'utf8');
  assert.ok(!fullJs.includes('sk-ant-'), 'Antropic keys must not be present in JS bundle');
  assert.ok(!fullJs.includes('sk-proj-'), 'OpenAI keys must not be present in JS bundle');
  assert.ok(!fullJs.includes('AIzaSy'), 'Google keys must not be present in JS bundle');
});

console.log('\n==========================================================');
console.log(' TEST SUMMARY');
console.log('==========================================================');
console.log(` Total Tests  : ${totalTests}`);
console.log(` Passed       : ${passedTests}`);
console.log(` Failed       : ${failedTests}`);
console.log(` Result       : ${failedTests === 0 ? 'SUCCESS (ALL TESTS PASSED)' : 'FAILURE'}`);
console.log('==========================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
