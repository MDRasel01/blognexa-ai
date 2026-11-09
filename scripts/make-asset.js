const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const assetContent = `<?php return array('dependencies' => array('wp-element', 'wp-i18n'), 'version' => '1.0.0');\n`;
fs.writeFileSync(path.join(buildDir, 'index.asset.php'), assetContent, 'utf8');
console.log('Generated build/index.asset.php successfully.');
