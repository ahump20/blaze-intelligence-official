#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'data');
const OUT_FILE = path.join(OUT_DIR, 'blog-index.json');
const BLOG_DIR = path.join(ROOT, 'blog');

function readFrontMatter(raw) {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const body = fmMatch ? raw.slice(fmMatch[0].length) : raw;
  const fm = {};
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!m) return;
      const k = m[1];
      let v = m[2].trim();
      if (v.startsWith('[')) { 
        try { v = JSON.parse(v.replace(/'/g, '"')); } catch { }
      }
      if (/^".*"$/.test(v)) v = v.slice(1, -1);
      if (/^\d+$/.test(v)) v = Number(v);
      fm[k] = v;
    });
  }
  const firstP = (body.match(/<p>([\s\S]*?)<\/p>/i) || [, ''])[1]
    .replace(/<[^>]+>/g, '').trim();
  return { fm, body, excerpt: firstP };
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    if (!/\.(md|html)$/i.test(d.name)) return [];
    const raw = fs.readFileSync(p, 'utf8');
    const { fm, excerpt } = readFrontMatter(raw);
    const sport = p.split(path.sep).slice(-2, -1)[0];
    const base = path.basename(p).replace(/\.(md|html)$/i, '');
    const [date, slug] = base.split('__');
    const href = `/blog/${sport}/${base}.html`;
    return [{
      slug: slug || base,
      path: href,
      title: fm.title || base,
      date: fm.date || date,
      sport,
      week: fm.week || null,
      tags: fm.tags || [],
      summary: fm.summary || excerpt || '',
    }];
  });
}

// Build index
const items = walk(CONTENT_DIR).sort((a, b) => (a.date < b.date ? 1 : -1));
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2));
console.log(`✓ Wrote ${items.length} items → ${OUT_FILE}`);

// Generate RSS
const rssItems = items.slice(0, 30).map(i => `
  <item>
    <title>${i.title}</title>
    <link>https://blaze-intelligence.com${i.path}</link>
    <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    <guid>${i.path}</guid>
    <category>${i.sport}</category>
    <description><![CDATA[${i.summary}]]></description>
  </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Blaze Intelligence Blog</title>
<link>https://blaze-intelligence.com/blog/</link>
<atom:link href="https://blaze-intelligence.com/blog/rss.xml" rel="self" type="application/rss+xml" />
<description>Weekly analytics and insights across CFB, MLB, and NFL.</description>
<language>en-us</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel>
</rss>`;

fs.mkdirSync(BLOG_DIR, { recursive: true });
fs.writeFileSync(path.join(BLOG_DIR, 'rss.xml'), rss);
console.log(`✓ Generated RSS feed → ${path.join(BLOG_DIR, 'rss.xml')}`);