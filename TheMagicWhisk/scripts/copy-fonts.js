#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Font directories from @expo/vector-icons that need to be copied
const fontSources = [
  {
    src: path.join(__dirname, '../node_modules/@expo/vector-icons/fonts'),
    dest: path.join(__dirname, '../dist/fonts'),
  },
  {
    src: path.join(__dirname, '../node_modules/expo-font/fonts'),
    dest: path.join(__dirname, '../dist/expo-font'),
  },
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Font source not found: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stats = fs.statSync(srcFile);

    if (stats.isDirectory()) {
      copyDir(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
      console.log(`📋 Copied: ${file}`);
    }
  });
}

console.log('📦 Copying vector icon fonts...\n');

fontSources.forEach(({ src, dest }) => {
  console.log(`Copying from: ${src}`);
  console.log(`Copying to:   ${dest}\n`);
  copyDir(src, dest);
});

console.log('\n✅ Font copy complete!');
