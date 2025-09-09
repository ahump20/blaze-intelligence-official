#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'blog');

function readFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const body = m ? raw.slice(m[0].length) : raw;
  const fm = {};
  if (m) {
    m[1].split('\n').forEach(line => {
      const mm = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!mm) return;
      const k = mm[1];
      let v = mm[2].trim();
      if (v.startsWith('[')) { 
        try { v = JSON.parse(v.replace(/'/g, '"')); } catch { }
      }
      if (/^".*"$/.test(v)) v = v.slice(1, -1);
      if (/^\d+$/.test(v)) v = Number(v);
      fm[k] = v;
    });
  }
  return { fm, body };
}

function template({ title, date, week, sport, body, tags, sources }) {
  const sportName = sport === 'cfb' ? 'College Football' : 
                    sport === 'mlb' ? 'MLB' : 
                    sport === 'nfl' ? 'NFL' : sport.toUpperCase();
  
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} • Blaze Intelligence</title>
    <meta name="description" content="${title}">
    <link rel="canonical" href="https://blaze-intelligence.com/blog/${sport}/${date}__${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:type" content="article">
    <meta property="og:description" content="${title}">
    <meta property="article:published_time" content="${date}">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'burnt-orange': {
                            '500': '#BF5700',
                            '600': '#A0522D',
                        },
                        'neon': {
                            'blue': '#00FFFF',
                            'green': '#00FF00',
                            'orange': '#FF8C00',
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e2e8f0;
        }
        .glass-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(51, 65, 85, 0.5);
        }
        .neon-text {
            background: linear-gradient(135deg, #FF8C00 0%, #BF5700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <a href="/" class="text-2xl font-bold neon-text">BLAZE INTELLIGENCE</a>
                <nav class="hidden md:flex items-center gap-6">
                    <a href="/blog/" class="text-slate-300 hover:text-white transition-colors">All Posts</a>
                    <a href="/blog/cfb/" class="text-slate-300 hover:text-white transition-colors">CFB</a>
                    <a href="/blog/mlb/" class="text-slate-300 hover:text-white transition-colors">MLB</a>
                    <a href="/blog/nfl/" class="text-slate-300 hover:text-white transition-colors">NFL</a>
                </nav>
            </div>
        </div>
    </header>
    
    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article class="glass-card rounded-2xl p-8 md:p-12">
            <!-- Article Header -->
            <header class="mb-8 pb-8 border-b border-slate-700">
                <div class="flex items-center gap-4 mb-4">
                    <span class="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                        ${sportName}
                    </span>
                    ${week ? `<span class="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">Week ${week}</span>` : ''}
                    <time class="text-slate-400 text-sm">${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                </div>
                <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">${title}</h1>
            </header>
            
            <!-- Article Body -->
            <div class="prose prose-invert prose-lg max-w-none">
                ${body}
            </div>
            
            <!-- Sources & Methods -->
            <section class="mt-12 pt-8 border-t border-slate-700">
                <h3 class="text-xl font-bold text-white mb-4">Sources & Methods</h3>
                <p class="text-slate-300 mb-4">
                    Data sourced from: ${sources ? sources.join(', ') : 'Official stats, proprietary models'}.
                    See our <a href="/methods-definitions.html" class="text-orange-400 hover:text-orange-300 underline">Methods & Definitions</a> page for complete methodology and data provenance.
                </p>
                ${tags && tags.length > 0 ? `
                <div class="flex flex-wrap gap-2 mt-4">
                    ${tags.map(tag => `<span class="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-sm">#${tag}</span>`).join('')}
                </div>` : ''}
            </section>
            
            <!-- Navigation -->
            <nav class="mt-8 pt-8 border-t border-slate-700 flex justify-between">
                <a href="/blog/${sport}/" class="text-orange-400 hover:text-orange-300 font-medium">
                    ← ${sportName} Archive
                </a>
                <a href="/blog/" class="text-orange-400 hover:text-orange-300 font-medium">
                    All Blog Posts →
                </a>
            </nav>
        </article>
        
        <!-- Related Articles (placeholder for future) -->
        <section class="mt-12">
            <h2 class="text-2xl font-bold text-white mb-6">More ${sportName} Analysis</h2>
            <div class="grid gap-4">
                <a href="/blog/${sport}/" class="glass-card p-6 rounded-lg hover:border-orange-500/50 transition-colors block">
                    <p class="text-slate-300">View all ${sportName} posts →</p>
                </a>
            </div>
        </section>
    </main>
    
    <!-- Footer -->
    <footer class="mt-20 py-12 bg-black/50 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row items-center justify-between">
                <div class="text-center md:text-left mb-4 md:mb-0">
                    <div class="text-2xl font-bold neon-text mb-2">BLAZE INTELLIGENCE</div>
                    <div class="text-slate-400">Where cognitive performance meets quarterly performance.</div>
                </div>
                <div class="flex items-center gap-4">
                    <a href="https://x.com/BISportsIntel" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-orange-400 transition-colors">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    <div class="text-slate-500 text-sm">© 2025 Blaze Intelligence</div>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

function ensureDir(p) { 
  fs.mkdirSync(p, { recursive: true }); 
}

// Process each sport
for (const sport of ['cfb', 'mlb', 'nfl']) {
  const dir = path.join(CONTENT_DIR, sport);
  if (!fs.existsSync(dir)) continue;
  
  const outSport = path.join(OUT_DIR, sport);
  ensureDir(outSport);
  
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(md|html)$/i.test(f)) continue;
    
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { fm, body } = readFrontMatter(raw);
    const html = template({
      title: fm.title || f,
      date: fm.date || '',
      week: fm.week || '',
      sport,
      tags: fm.tags || [],
      sources: fm.sources || [],
      body
    });
    
    const outFile = path.join(outSport, f.replace(/\.(md|html)$/i, '.html'));
    fs.writeFileSync(outFile, html);
    console.log('✓ Wrote', outFile);
  }
}

console.log('✓ Post generation complete');