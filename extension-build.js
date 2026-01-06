#!/usr/bin/env node

/**
 * Build script for browser extension
 * Converts Next.js static export to extension format
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'out');
const EXT_DIR = path.join(__dirname, 'extension');

// Ensure extension directory exists (don't delete, just overwrite files)
if (!fs.existsSync(EXT_DIR)) {
  fs.mkdirSync(EXT_DIR, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(EXT_DIR, 'manifest.json')
);

// Copy background.js
if (fs.existsSync(path.join(__dirname, 'background.js'))) {
  fs.copyFileSync(
    path.join(__dirname, 'background.js'),
    path.join(EXT_DIR, 'background.js')
  );
}

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

// Copy Next.js output
// Note: We need to copy _next directory (Next.js static assets) but skip other _ files
function copyRecursive(src, dest, allowUnderscore = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // If allowUnderscore is true (for _next directory), copy everything
    if (allowUnderscore) {
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath, true);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      continue;
    }
    
    // Skip _next directory - we handle it separately and rename it to 'next'
    if (entry.name === '_next') {
      continue; // Skip - already copied as 'next' above
    }
    
    // Skip other files/directories starting with _ (reserved by Chrome extensions)
    if (entry.name.startsWith('_')) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath, false);
    } else {
      // Also skip files starting with _ in their name (except _next)
      if (!entry.name.startsWith('_')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

if (fs.existsSync(OUT_DIR)) {
  // Copy _next directory but rename it to 'next' (Chrome extensions don't allow _ prefix)
  // This is required for Next.js CSS/JS assets
  const nextDir = path.join(OUT_DIR, '_next');
  const nextDest = path.join(EXT_DIR, 'next'); // Renamed from _next to next
  if (fs.existsSync(nextDir)) {
    console.log('📦 Copying _next directory as "next"...');
    
    // Use a simple recursive copy that copies EVERYTHING without any filtering
    function copyAll(src, dest) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyAll(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
    
    copyAll(nextDir, nextDest);
    
    // Verify it was copied
    if (fs.existsSync(nextDest)) {
      const cssDir = path.join(nextDest, 'static', 'css');
      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
        console.log(`✅ Copied _next directory as "next" (${cssFiles.length} CSS files found)`);
      } else {
        console.warn('⚠️  next directory copied but CSS directory not found');
      }
    } else {
      console.error('❌ Failed to copy _next directory!');
    }
  }
  
  // Then copy everything else (excluding other _ files, but _next is already copied)
  copyRecursive(OUT_DIR, EXT_DIR);
  
  // Create popup.html - extension entry point
  // Next.js builds /popup route as popup.html
  const popupHtmlPath = path.join(EXT_DIR, 'popup.html');
  const indexPath = path.join(EXT_DIR, 'index.html');
  
  let popupHtml;
  if (fs.existsSync(popupHtmlPath)) {
    // Use the built popup.html directly - this is the best option
    popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
    console.log('✅ Using built popup.html');
  } else if (fs.existsSync(indexPath)) {
    // Fallback: use index.html and let Next.js handle routing
    popupHtml = fs.readFileSync(indexPath, 'utf8');
    console.log('⚠️  Using index.html as fallback');
  } else {
    console.error('❌ Neither popup.html nor index.html found!');
    process.exit(1);
  }
  
  if (popupHtml) {
    // Extract ALL inline scripts to external files (required for Manifest V3 CSP)
    // We must extract them because CSP blocks inline scripts
    let scriptCounter = 0;
    const extractedScripts = [];
    
    // Extract all inline <script> tags that don't have src attribute
    popupHtml = popupHtml.replace(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
      const trimmedContent = content.trim();
      
      // Skip empty scripts
      if (!trimmedContent || trimmedContent.length === 0) {
        return match;
      }
      
      // Extract to external file
      scriptCounter++;
      const scriptFileName = `inline-script-${scriptCounter}.js`;
      const scriptPath = path.join(EXT_DIR, scriptFileName);
      
      // Write script content to file
      fs.writeFileSync(scriptPath, trimmedContent);
      extractedScripts.push({ fileName: scriptFileName, attrs });
      
      // Return script tag with src pointing to external file
      // Preserve all attributes (especially async, id, etc.)
      const cleanAttrs = attrs.trim();
      return `<script${cleanAttrs ? ' ' + cleanAttrs : ''} src="./${scriptFileName}"></script>`;
    });
    
    console.log(`✅ Extracted ${extractedScripts.length} inline scripts to external files`);
    
    // Fix all paths to work in extension context (relative paths)
    // IMPORTANT: Rename _next to next (Chrome extensions don't allow _ prefix)
    // This must happen AFTER script extraction so we don't break script paths
    
    // Fix href attributes (CSS, fonts, favicons) - rename _next to next
    popupHtml = popupHtml.replace(/href="\/_next\//g, 'href="./next/');
    popupHtml = popupHtml.replace(/href="\.\/_next\//g, 'href="./next/');
    popupHtml = popupHtml.replace(/href="\/favicon/g, 'href="./favicon');
    
    // Fix src attributes (scripts, images) - rename _next to next
    popupHtml = popupHtml.replace(/src="\/_next\//g, 'src="./next/');
    popupHtml = popupHtml.replace(/src="\.\/_next\//g, 'src="./next/');
    
    // Fix paths in JSON strings and template literals (for Next.js data)
    // Handle both double and single quotes - rename _next to next
    popupHtml = popupHtml.replace(/("\/_next\/)/g, '("./next/');
    popupHtml = popupHtml.replace(/("\.\/_next\/)/g, '("./next/');
    popupHtml = popupHtml.replace(/("\/favicon)/g, '("./favicon');
    popupHtml = popupHtml.replace(/('\/_next\/)/g, "('./next/");
    popupHtml = popupHtml.replace(/('\.\/_next\/)/g, "('./next/");
    popupHtml = popupHtml.replace(/('\/favicon)/g, "('./favicon");
    
    // Fix paths in backtick template literals - rename _next to next
    popupHtml = popupHtml.replace(/(`\/_next\/)/g, '(`./next/');
    popupHtml = popupHtml.replace(/(`\.\/_next\/)/g, '(`./next/');
    popupHtml = popupHtml.replace(/(`\/favicon)/g, '(`./favicon');
    
    // Fix any remaining _next PATH references in the HTML (but NOT CSS selectors like #__next)
    // Only replace _next when it's part of a path (has / before or after)
    popupHtml = popupHtml.replace(/\/_next\//g, '/next/');
    popupHtml = popupHtml.replace(/\.\/_next\//g, './next/');
    popupHtml = popupHtml.replace(/"_next\//g, '"next/');
    popupHtml = popupHtml.replace(/'_next\//g, "'next/");
    popupHtml = popupHtml.replace(/`_next\//g, '`next/');
    // DO NOT replace standalone _next or __next (CSS selectors)
    
    // Ensure proper viewport and sizing for extension popup
    popupHtml = popupHtml.replace(
      /<meta name="viewport"[^>]*>/g,
      '<meta name="viewport" content="width=400, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
    );
    
    // Add inline styles to ensure proper popup dimensions and fix CSS loading
    if (!popupHtml.includes('extension-popup-styles')) {
      const extensionStyles = `<style id="extension-popup-styles">
        * {
          box-sizing: border-box;
        }
        html, body {
          width: 400px !important;
          height: 600px !important;
          min-width: 400px !important;
          min-height: 600px !important;
          max-width: 400px !important;
          max-height: 600px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          position: fixed !important;
        }
        #__next, [data-nextjs-scroll-focus-boundary], body > div, body > div > div {
          width: 400px !important;
          height: 600px !important;
          min-width: 400px !important;
          min-height: 600px !important;
          max-width: 400px !important;
          max-height: 600px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
      </style>`;
      popupHtml = popupHtml.replace('</head>', extensionStyles + '</head>');
    }
  } else {
    // Create minimal popup.html if nothing exists
    popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VeilWallet</title>
  <script>
    window.location.href = './popup';
  </script>
</head>
<body>
  <div style="width: 400px; height: 600px; display: flex; align-items: center; justify-content: center;">
    <p>Loading VeilWallet...</p>
  </div>
</body>
</html>`;
  }
  
  // Ensure title is correct
  popupHtml = popupHtml.replace(/<title>.*?<\/title>/, '<title>VeilWallet</title>');
  
  // Create external script file for loading logic (to avoid inline scripts)
  const loadingScriptPath = path.join(EXT_DIR, 'popup-loader.js');
  const loadingScript = `// Hide loading fallback when Next.js loads
window.addEventListener('load', function() {
  setTimeout(function() {
    const fallback = document.getElementById('extension-loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
    }
    document.body.classList.add('loaded');
  }, 500);
});`;
  fs.writeFileSync(loadingScriptPath, loadingScript);
  
  // Add a fallback loading screen that shows immediately (only if not already present)
  if (!popupHtml.includes('extension-loading-fallback')) {
    const loadingStyles = `<style id="extension-loading-styles">
@keyframes spin { to { transform: rotate(360deg); } }
#extension-loading-fallback { z-index: 9999; position: fixed; top: 0; left: 0; width: 400px; height: 600px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: system-ui; }
body.loaded #extension-loading-fallback { display: none; }
</style>`;
    
    const loadingDiv = `<div id="extension-loading-fallback">
  <div style="text-align: center;">
    <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
    <p style="margin: 0; font-size: 16px; font-weight: 500;">Loading VeilWallet...</p>
  </div>
</div>`;
    
    // Add styles to head
    popupHtml = popupHtml.replace('</head>', loadingStyles + '</head>');
    
    // Add loading div and script to body
    popupHtml = popupHtml.replace(
      '<body',
      '<body style="width: 400px; height: 600px; margin: 0; padding: 0; overflow: hidden;">' + loadingDiv
    );
    
    // Add loader script before closing body
    popupHtml = popupHtml.replace('</body>', '<script src="./popup-loader.js"></script></body>');
  }
  
  fs.writeFileSync(path.join(EXT_DIR, 'popup.html'), popupHtml);
  
  // Clean up: Remove any remaining files/dirs starting with _ (reserved by Chrome)
  // BUT preserve _next directory which is required for Next.js
  function removeUnderscoreFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip _next directory - it's required for Next.js!
        if (entry.name === '_next') {
          continue;
        }
        
        if (entry.name.startsWith('_')) {
          try {
            if (entry.isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
            console.log(`⚠️  Removed reserved file/dir: ${entry.name}`);
          } catch (e) {
            console.warn(`Could not remove ${entry.name}:`, e.message);
          }
        } else if (entry.isDirectory()) {
          removeUnderscoreFiles(fullPath);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  removeUnderscoreFiles(EXT_DIR);
  
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

