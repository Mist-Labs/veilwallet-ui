#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'out');
const EXT_DIR = path.join(__dirname, 'extension');

console.log('🚀 Building VeilWallet extension (simple approach)...');

// Ensure extension directory exists
if (!fs.existsSync(EXT_DIR)) {
  fs.mkdirSync(EXT_DIR, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(EXT_DIR, 'manifest.json')
);
console.log('✅ Copied manifest.json');

// Copy background.js
fs.copyFileSync(
  path.join(__dirname, 'background.js'),
  path.join(EXT_DIR, 'background.js')
);
console.log('✅ Copied background.js');

// Copy public assets (icons)
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
  console.log('✅ Copied public assets');
}

// Simple recursive copy function
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

// Copy entire Next.js output
if (fs.existsSync(OUT_DIR)) {
  console.log('📦 Copying Next.js output...');
  copyRecursive(OUT_DIR, EXT_DIR);
  console.log('✅ Copied Next.js output');
  
  // Rename _next to next (Chrome doesn't allow _ prefix)
  const nextSrc = path.join(EXT_DIR, '_next');
  const nextDest = path.join(EXT_DIR, 'next');
  if (fs.existsSync(nextSrc)) {
                                                                                                                                    // Remove existing 'next' directory if it exists
    if (fs.existsSync(nextDest)) {
      fs.rmSync(nextDest, { recursive: true, force: true });
    }
    fs.renameSync(nextSrc, nextDest);
    console.log('✅ Renamed _next to next');
  }
  
  // Remove files starting with _ (except _next directory which is needed)
  function removeReservedFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // _next was renamed to 'next', so clean inside 'next' directory
      if (entry.name === 'next') {
        // Recursively clean inside next (remove files starting with _)
        if (entry.isDirectory()) {
          function cleanNextDir(dir, relativePath = 'next') {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const e of entries) {
              const p = path.join(dir, e.name);
              const relPath = `${relativePath}/${e.name}`;
              
              if (e.name.startsWith('_')) {
                if (e.isFile()) {
                  fs.unlinkSync(p);
                  console.log(`   Removed: ${relPath}`);
                } else if (e.isDirectory()) {
                  fs.rmSync(p, { recursive: true, force: true });
                  console.log(`   Removed: ${relPath}/`);
                }
              } else if (e.isDirectory()) {
                cleanNextDir(p, relPath);
              }
            }
          }
          cleanNextDir(fullPath);
        }
        continue;
      }
      
      // Remove other files/dirs starting with _
      if (entry.name.startsWith('_')) {
        if (entry.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`   Removed: ${entry.name}`);
      } else if (entry.isDirectory()) {
        removeReservedFiles(fullPath);
      }
    }
  }
  
  console.log('🧹 Cleaning reserved files...');
  removeReservedFiles(EXT_DIR);
  console.log('✅ Cleaned reserved files');
  
  // Read popup.html
  const popupPath = path.join(EXT_DIR, 'popup.html');
  if (fs.existsSync(popupPath)) {
    let popupHtml = fs.readFileSync(popupPath, 'utf8');
    
    // Extract inline scripts (required for Manifest V3 CSP)
    let scriptCounter = 0;
    popupHtml = popupHtml.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g, (match, attrs, content) => {
      // Skip external scripts
      if (attrs.includes('src=')) {
        return match;
      }
      
      // Skip empty scripts
      const trimmedContent = content.trim();
      if (!trimmedContent || trimmedContent.length === 0) {
        return match;
      }
      
      // Extract to external file
      scriptCounter++;
      const scriptFileName = `inline-script-${scriptCounter}.js`;
      const scriptPath = path.join(EXT_DIR, scriptFileName);
      
      // Fix paths in script content before writing
      let fixedContent = trimmedContent;
      fixedContent = fixedContent.replace(/\/_next\//g, './next/');
      fixedContent = fixedContent.replace(/"\/_next\//g, '"./next/');
      fixedContent = fixedContent.replace(/'\/_next\//g, "'./next/");
      fixedContent = fixedContent.replace(/`\/_next\//g, '`./next/');
      fixedContent = fixedContent.replace(/\("\/next\//g, '("./next/');
      fixedContent = fixedContent.replace(/\('\/next\//g, "('./next/");
      fixedContent = fixedContent.replace(/\["\/_next\//g, '["./next/');
      fixedContent = fixedContent.replace(/\['\/_next\//g, "['./next/");
      
      // Write script content to file
      fs.writeFileSync(scriptPath, fixedContent);
      
      // Return script tag with src pointing to external file
      return `<script${attrs} src="./${scriptFileName}"></script>`;
    });
    
    console.log(`✅ Extracted ${scriptCounter} inline scripts to external files`);
    
    // Fix paths to be relative and rename _next to next (required for extensions)
    popupHtml = popupHtml.replace(/href="\/_next\//g, 'href="./next/');
    popupHtml = popupHtml.replace(/src="\/_next\//g, 'src="./next/');
    popupHtml = popupHtml.replace(/href="\/favicon/g, 'href="./favicon');
    popupHtml = popupHtml.replace(/src="\/favicon/g, 'src="./favicon');
    
    // Fix paths in JSON/JS content
    popupHtml = popupHtml.replace(/("\/_next\/)/g, '("./next/');
    popupHtml = popupHtml.replace(/('\/_next\/)/g, "('./next/");
    
    // Fix the viewport
    popupHtml = popupHtml.replace(
      /<meta name="viewport"[^>]*>/g,
      '<meta name="viewport" content="width=400, height=600">'
    );
    
    // Add simple size enforcement
    const sizeStyles = `<style>
html, body {
  width: 400px !important;
  height: 600px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
#__next {
  width: 400px !important;
  height: 600px !important;
  overflow-y: auto !important;
}
</style>`;
    
    popupHtml = popupHtml.replace('</head>', sizeStyles + '</head>');
    
    fs.writeFileSync(popupPath, popupHtml);
    console.log('✅ Updated popup.html with relative paths and sizing');
  }
  
  console.log('\n✅ Extension built successfully!');
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

