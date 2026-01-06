#!/usr/bin/env node

/**
 * Build script for browser extension
 * Converts Next.js static export to extension format
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'out');
const EXT_DIR = path.join(__dirname, 'extension');

// Clean extension directory
if (fs.existsSync(EXT_DIR)) {
  fs.rmSync(EXT_DIR, { recursive: true });
}
fs.mkdirSync(EXT_DIR, { recursive: true });

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(EXT_DIR, 'manifest.json')
);

// Copy public assets
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  publicFiles.forEach(file => {
    if (file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.ico')) {
      fs.copyFileSync(
        path.join(publicDir, file),
        path.join(EXT_DIR, file)
      );
    }
  });
}

// Copy Next.js output (excluding files/dirs starting with _)
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    // Skip files/directories starting with _ (reserved by Chrome extensions)
    if (entry.name.startsWith('_')) {
      continue;
    }
    
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      // Also skip files starting with _ in their name
      if (!entry.name.startsWith('_')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

if (fs.existsSync(OUT_DIR)) {
  copyRecursive(OUT_DIR, EXT_DIR);
  
  // Create popup.html - extension entry point
  const indexPath = path.join(EXT_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    // Read and modify index.html for popup
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    // Ensure it works as popup
    htmlContent = htmlContent.replace(/<title>.*?<\/title>/, '<title>VeilWallet</title>');
    fs.writeFileSync(path.join(EXT_DIR, 'popup.html'), htmlContent);
  } else {
    // Create minimal popup.html if index.html doesn't exist
    const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VeilWallet</title>
  <script>
    window.location.href = '/popup';
  </script>
</head>
<body>
  <div style="width: 400px; height: 600px; display: flex; align-items: center; justify-content: center;">
    <p>Loading VeilWallet...</p>
  </div>
</body>
</html>`;
    fs.writeFileSync(path.join(EXT_DIR, 'popup.html'), popupHtml);
  }
  
  console.log('✅ Extension built successfully!');
  console.log(`📦 Extension directory: ${EXT_DIR}`);
  console.log('\nTo load the extension:');
  console.log('1. Open Chrome/Edge: chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log(`4. Select: ${EXT_DIR}`);
} else {
  console.error('❌ Build output not found. Run "npm run build" first.');
  process.exit(1);
}

