#!/usr/bin/env node

/**
 * Production Build Script for Blaze Intelligence
 * Optimizes assets, minifies code, and prepares for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🏗️  Building Blaze Intelligence for Production...\n');

// Create directories
const directories = ['logs', 'dist', '.pm2'];
directories.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy public assets to dist
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

if (fs.existsSync(publicDir)) {
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyRecursive(publicDir, path.join(distDir, 'public'));
  console.log('✅ Copied public assets to dist/');
}

// Copy root HTML files
const htmlFiles = ['index.html', 'manifesto.html', 'pilot-playbook.html', 'investor-narrative.html', 'methods.html'];
htmlFiles.forEach(file => {
  const srcPath = path.join(rootDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  }
});

// Copy JavaScript files from src/
const srcDir = path.join(rootDir, 'src');
const distSrcDir = path.join(distDir, 'src');

if (fs.existsSync(srcDir)) {
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else if (item.endsWith('.js')) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyRecursive(srcDir, distSrcDir);
  console.log('✅ Copied src/ directory to dist/');
}

// Create production configuration
const prodConfig = {
  buildTime: new Date().toISOString(),
  version: process.env.npm_package_version || '1.0.0',
  nodeEnv: 'production',
  features: {
    redis: true,
    logging: true,
    monitoring: true,
    ssl: true
  }
};

fs.writeFileSync(
  path.join(distDir, 'production-config.json'),
  JSON.stringify(prodConfig, null, 2)
);

console.log('✅ Created production configuration');
console.log('\n🚀 Production build complete!');
console.log(`   Build time: ${prodConfig.buildTime}`);
console.log(`   Output directory: ${distDir}`);
console.log('');
console.log('Next steps:');
console.log('  1. Set up production environment variables');
console.log('  2. Configure Redis cache server');
console.log('  3. Run: npm run start:prod');
console.log('');