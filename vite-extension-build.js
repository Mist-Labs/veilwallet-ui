#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const EXT_DIR = path.join(__dirname, 'extension');

console.log('🚀 Building VeilWallet Chrome Extension with Vite...\n');

// Clean extension directory
if (fs.existsSync(EXT_DIR)) {
  fs.rmSync(EXT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(EXT_DIR, { recursive: true });

// Check if Vite build exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Vite build not found. Run "npm run build" first.');
  process.exit(1);
}

// Function to copy directory recursively
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy Vite build output
console.log('📦 Copying Vite build output...');
copyRecursive(DIST_DIR, EXT_DIR);
console.log('✅ Copied Vite build');

// Copy manifest.json
if (fs.existsSync(path.join(__dirname, 'manifest.json'))) {
  fs.copyFileSync(
    path.join(__dirname, 'manifest.json'),
    path.join(EXT_DIR, 'manifest.json')
  );
  console.log('✅ Copied manifest.json');
}

// Copy background.js
if (fs.existsSync(path.join(__dirname, 'background.js'))) {
  fs.copyFileSync(
    path.join(__dirname, 'background.js'),
    path.join(EXT_DIR, 'background.js')
  );
  console.log('✅ Copied background.js');
}

// Copy icons and content scripts
const publicDir = path.join(__dirname, 'public');

// Copy content scripts
const contentScripts = ['content.js', 'inpage.js'];
contentScripts.forEach(script => {
  const src = path.join(publicDir, script);
  const dest = path.join(EXT_DIR, script);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});
console.log('✅ Copied content scripts');

if (fs.existsSync(publicDir)) {
  const iconFiles = ['icon-16.png', 'icon-48.png', 'icon-128.png'];
  iconFiles.forEach(icon => {
    const src = path.join(publicDir, icon);
    const dest = path.join(EXT_DIR, icon);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  console.log('✅ Copied icon assets');
}

// Fix absolute paths in HTML files
console.log('🔧 Fixing paths in HTML files...');
const htmlFiles = fs.readdirSync(EXT_DIR).filter(file => file.endsWith('.html'));
htmlFiles.forEach(htmlFile => {
  const filePath = path.join(EXT_DIR, htmlFile);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace absolute paths with relative paths
  content = content.replace(/href="\/assets\//g, 'href="./assets/');
  content = content.replace(/src="\/assets\//g, 'src="./assets/');
  
  fs.writeFileSync(filePath, content, 'utf-8');
});
console.log('✅ Fixed paths in HTML files');

console.log('\n✨ Extension build complete!');
console.log(`📦 Extension directory: ${EXT_DIR}\n`);
console.log('To load the extension:');
console.log('1. Open chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log(`4. Select: ${EXT_DIR}\n`);
