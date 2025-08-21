import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/manifesto', priority: '0.9', changefreq: 'monthly' },
  { url: '/pilot-playbook', priority: '0.8', changefreq: 'monthly' },
  { url: '/investor-narrative', priority: '0.7', changefreq: 'monthly' },
  { url: '/recruiting', priority: '0.8', changefreq: 'weekly' },
  { url: '/integration-hub', priority: '0.6', changefreq: 'weekly' },
];

const generateSitemap = () => {
  const lastmod = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>https://blaze-intelligence.com${page.url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  // Ensure dist directory exists
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Write to both public and dist
  const publicPath = path.join(rootDir, 'public', 'sitemap.xml');
  const distPath = path.join(rootDir, 'dist', 'sitemap.xml');
  
  fs.writeFileSync(publicPath, xml);
  fs.writeFileSync(distPath, xml);
  
  console.log('✅ Sitemap generated successfully!');
  console.log(`   - ${publicPath}`);
  console.log(`   - ${distPath}`);
};

generateSitemap();