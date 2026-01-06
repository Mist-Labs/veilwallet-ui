#!/usr/bin/env node

/**
 * Create extension icons from SVG
 * Requires: ImageMagick (convert) or similar
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, 'public', 'icon.svg');
const publicDir = path.join(__dirname, 'public');

// Create simple colored PNGs if ImageMagick is not available
function createSimplePNG(size, outputPath) {
  const canvas = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">V</text>
</svg>`;
  
  fs.writeFileSync(outputPath.replace('.png', '.svg'), canvas);
  console.log(`Created ${outputPath.replace('.png', '.svg')}`);
}

// Try to convert SVG to PNG, fallback to creating SVG
sizes.forEach(size => {
  const outputPath = path.join(publicDir, `icon-${size}.png`);
  
  try {
    // Try ImageMagick
    if (fs.existsSync(svgPath)) {
      execSync(`convert -background none -resize ${size}x${size} "${svgPath}" "${outputPath}"`, { stdio: 'ignore' });
      console.log(`✅ Created icon-${size}.png`);
    } else {
      createSimplePNG(size, outputPath);
    }
  } catch (e) {
    // Fallback: create SVG version
    createSimplePNG(size, outputPath);
  }
});

console.log('\n📦 Icons created! If PNGs were not created, the extension will use SVGs.');

