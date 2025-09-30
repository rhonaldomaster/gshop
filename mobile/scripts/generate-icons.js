/**
 * Icon Generation Script
 *
 * Generates all required icon sizes from a single source icon.
 * Requires: sharp npm package
 *
 * Usage:
 *   npm install sharp
 *   node scripts/generate-icons.js path/to/source-icon.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes to generate
const ICON_SIZES = {
  // iOS
  'icon.png': { width: 1024, height: 1024, hasAlpha: false },

  // Android
  'adaptive-icon.png': { width: 1024, height: 1024, hasAlpha: true },

  // Splash
  'splash-icon.png': { width: 1284, height: 2778, hasAlpha: false, contain: true },

  // Web
  'favicon.png': { width: 48, height: 48, hasAlpha: true },

  // Notifications
  'notification-icon.png': { width: 96, height: 96, hasAlpha: true },
};

/**
 * Generate icon with specified size
 */
async function generateIcon(sourceFile, outputFile, config) {
  const { width, height, hasAlpha, contain } = config;

  let pipeline = sharp(sourceFile);

  if (contain) {
    // For splash screens - contain within canvas
    pipeline = pipeline
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });
  } else {
    // For icons - resize directly
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'center'
    });
  }

  // Remove alpha channel if needed (iOS requirement)
  if (!hasAlpha) {
    pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
  }

  // Optimize and save
  await pipeline
    .png({
      quality: 90,
      compressionLevel: 9,
      adaptiveFiltering: true
    })
    .toFile(outputFile);

  console.log(`✅ Generated: ${outputFile} (${width}x${height})`);
}

/**
 * Main function
 */
async function main() {
  const sourceFile = process.argv[2];

  if (!sourceFile) {
    console.error('❌ Error: Please provide source icon file');
    console.log('Usage: node scripts/generate-icons.js path/to/source-icon.png');
    process.exit(1);
  }

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Error: Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  // Create assets directory if it doesn't exist
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('🎨 Generating app icons...\n');

  // Generate all icons
  for (const [filename, config] of Object.entries(ICON_SIZES)) {
    const outputFile = path.join(assetsDir, filename);
    try {
      await generateIcon(sourceFile, outputFile, config);
    } catch (error) {
      console.error(`❌ Error generating ${filename}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\nGenerated files:');
  Object.keys(ICON_SIZES).forEach(filename => {
    console.log(`  - assets/${filename}`);
  });

  console.log('\n📝 Next steps:');
  console.log('  1. Review generated icons in assets/ folder');
  console.log('  2. Run: npx expo start');
  console.log('  3. Test icons on device');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});