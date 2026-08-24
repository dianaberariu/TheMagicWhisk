#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('📋 Validating font bundle for Expo web...\n');

const checksToRun = [
  {
    name: 'Icon fonts in dist/',
    check: () => {
      const distFontsDir = path.join(__dirname, '../dist/fonts');
      if (!fs.existsSync(distFontsDir)) {
        return { passed: false, message: '❌ dist/fonts/ directory not found' };
      }
      const fontFiles = fs.readdirSync(distFontsDir).filter(f => f.endsWith('.ttf'));
      return {
        passed: fontFiles.length > 0,
        message: `${fontFiles.length > 0 ? '✅' : '❌'} Found ${fontFiles.length} TTF font files`,
      };
    },
  },
  {
    name: 'fonts.css in dist/',
    check: () => {
      const cssPath = path.join(__dirname, '../dist/fonts.css');
      if (fs.existsSync(cssPath)) {
        const content = fs.readFileSync(cssPath, 'utf-8');
        const fontFaceCount = (content.match(/@font-face/g) || []).length;
        return {
          passed: fontFaceCount > 0,
          message: `✅ fonts.css found with ${fontFaceCount} @font-face declarations`,
        };
      }
      return { passed: false, message: '❌ fonts.css not found in dist/' };
    },
  },
  {
    name: 'Icon fonts in node_modules/@expo/vector-icons',
    check: () => {
      const iconsDir = path.join(__dirname, '../node_modules/@expo/vector-icons/fonts');
      if (!fs.existsSync(iconsDir)) {
        return { passed: false, message: '❌ @expo/vector-icons/fonts not found' };
      }
      const fontFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.ttf'));
      return {
        passed: fontFiles.length > 0,
        message: `✅ Found ${fontFiles.length} source TTF files in node_modules`,
      };
    },
  },
  {
    name: 'index.html in dist/',
    check: () => {
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        const hasFontRef = content.includes('fonts.css') || content.includes('@font-face');
        return {
          passed: true,
          message: `✅ index.html found ${hasFontRef ? '(fonts referenced)' : '(fonts may not be referenced in HTML)'}`,
        };
      }
      return { passed: false, message: '❌ index.html not found in dist/' };
    },
  },
];

let allPassed = true;
checksToRun.forEach(({ name, check }) => {
  try {
    const result = check();
    console.log(`${name}:`);
    console.log(`  ${result.message}`);
    if (!result.passed) allPassed = false;
  } catch (error) {
    console.log(`${name}:`);
    console.log(`  ❌ Error: ${error.message}`);
    allPassed = false;
  }
  console.log();
});

if (allPassed) {
  console.log('✅ All font validation checks passed!');
  console.log('\n💡 Tips:');
  console.log('  1. Check browser DevTools (Network tab) for font 404 errors');
  console.log('  2. Verify font paths resolve to: https://your-domain/fonts/MaterialIcons.ttf');
  console.log('  3. Check Netlify build logs for warnings during export');
  process.exit(0);
} else {
  console.log('⚠️  Some validation checks failed.');
  console.log('\n💡 Fix: Run npm run predeploy to rebuild and bundle fonts');
  process.exit(1);
}
