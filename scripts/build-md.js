import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const pages = [
  { 
    src: 'BLAZE_MANIFESTO.md', 
    out: 'manifesto.html', 
    title: 'The Blaze Intelligence Manifesto',
    description: 'Blaze turns instinct into auditable signal. Belief with receipts.'
  },
  { 
    src: 'PILOT_PLAYBOOK.md', 
    out: 'pilot-playbook.html', 
    title: 'Blaze Intelligence MLB Pilot Playbook',
    description: '12-week implementation to prove quantified intangibles drive wins.'
  },
  { 
    src: 'INVESTOR_NARRATIVE.md', 
    out: 'investor-narrative.html', 
    title: 'Investor Narrative — The $50B Conviction Economy',
    description: 'The $50B conviction economy and Blaze\'s path to category creation.'
  },
];

const layout = (title, description, body, canonicalPath) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — Blaze Intelligence</title>
    <meta name="description" content="${description}">
    
    <!-- OpenGraph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:site_name" content="Blaze Intelligence">
    <meta property="og:type" content="article">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    
    <!-- Theme -->
    <meta name="theme-color" content="#BF5700">
    
    <!-- Canonical -->
    <link rel="canonical" href="https://blaze-intelligence.com${canonicalPath}">
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title}",
      "description": "${description}",
      "datePublished": "2025-08-20",
      "dateModified": "2025-08-20",
      "author": {
        "@type": "Organization",
        "name": "Blaze Intelligence",
        "url": "https://blaze-intelligence.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Blaze Intelligence",
        "url": "https://blaze-intelligence.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://blaze-intelligence.com/logo.png"
        }
      }
    }
    </script>
    
    <style>
        :root {
            --burnt-orange: #BF5700;
            --dark-burnt-orange: #8B3A00;
            --black: #000000;
            --dark-gray: #0A0A0A;
            --white: #FFFFFF;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
            background: var(--black);
            color: var(--white);
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            padding: 20px 50px;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            z-index: 1000;
            border-bottom: 1px solid rgba(191, 87, 0, 0.2);
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 20px;
            font-weight: 700;
            color: var(--burnt-orange);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .nav-links {
            display: flex;
            gap: 30px;
            list-style: none;
        }
        
        .nav-links a {
            color: var(--white);
            text-decoration: none;
            opacity: 0.8;
            transition: all 0.3s;
        }
        
        .nav-links a:hover {
            opacity: 1;
            color: var(--burnt-orange);
        }
        
        /* Main Content */
        main {
            flex: 1;
            max-width: 900px;
            margin: 120px auto 80px;
            padding: 0 20px;
        }
        
        .prose {
            color: rgba(255, 255, 255, 0.9);
        }
        
        .prose h1 {
            font-size: 48px;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 20px;
            background: linear-gradient(135deg, var(--burnt-orange) 0%, var(--white) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .prose h2 {
            font-size: 32px;
            font-weight: 700;
            margin: 40px 0 20px;
            color: var(--burnt-orange);
        }
        
        .prose h3 {
            font-size: 24px;
            font-weight: 600;
            margin: 30px 0 15px;
            color: rgba(255, 255, 255, 0.95);
        }
        
        .prose p {
            margin: 20px 0;
            font-size: 18px;
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.85);
        }
        
        .prose ul, .prose ol {
            margin: 20px 0;
            padding-left: 30px;
        }
        
        .prose li {
            margin: 10px 0;
            font-size: 17px;
            color: rgba(255, 255, 255, 0.85);
        }
        
        .prose strong {
            color: var(--white);
            font-weight: 600;
        }
        
        .prose em {
            color: var(--burnt-orange);
            font-style: italic;
        }
        
        .prose blockquote {
            border-left: 4px solid var(--burnt-orange);
            padding-left: 20px;
            margin: 30px 0;
            font-style: italic;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .prose code {
            background: rgba(191, 87, 0, 0.1);
            border: 1px solid rgba(191, 87, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 0.9em;
        }
        
        .prose pre {
            background: var(--dark-gray);
            border: 1px solid rgba(191, 87, 0, 0.2);
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            margin: 30px 0;
        }
        
        .prose pre code {
            background: none;
            border: none;
            padding: 0;
        }
        
        .prose hr {
            border: none;
            border-top: 1px solid rgba(191, 87, 0, 0.3);
            margin: 40px 0;
        }
        
        /* Footer */
        footer {
            background: var(--dark-gray);
            border-top: 1px solid rgba(191, 87, 0, 0.2);
            padding: 40px 20px;
            margin-top: 80px;
        }
        
        .footer-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
        }
        
        .footer-section h4 {
            color: var(--burnt-orange);
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .footer-section a {
            display: block;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            margin: 8px 0;
            transition: color 0.3s;
        }
        
        .footer-section a:hover {
            color: var(--burnt-orange);
        }
        
        .footer-bottom {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid rgba(191, 87, 0, 0.2);
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            nav {
                padding: 15px 20px;
            }
            
            .nav-links {
                gap: 20px;
                font-size: 14px;
            }
            
            .prose h1 {
                font-size: 36px;
            }
            
            .prose h2 {
                font-size: 28px;
            }
            
            main {
                margin-top: 100px;
            }
        }
    </style>
</head>
<body>
    <nav>
        <div class="nav-container">
            <a href="/" class="logo">
                <span>🔥</span>
                <span>BLAZE INTELLIGENCE</span>
            </a>
            <div class="nav-links">
                <a href="/">Home</a>
                <a href="/manifesto">Manifesto</a>
                <a href="/recruiting">Recruiting</a>
            </div>
        </div>
    </nav>
    
    <main>
        <article class="prose">
            ${body}
        </article>
    </main>
    
    <footer>
        <div class="footer-container">
            <div class="footer-section">
                <h4>Product</h4>
                <a href="/manifesto">Manifesto</a>
                <a href="/pilot-playbook">Pilot Playbook</a>
                <a href="/recruiting">Global Recruiting Leaderboard</a>
            </div>
            <div class="footer-section">
                <h4>Resources</h4>
                <a href="/pilot-playbook">MLB Pilot Playbook</a>
                <a href="/investor-narrative">Investor Narrative</a>
                <a href="/integration-hub">Integration Hub</a>
            </div>
            <div class="footer-section">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="mailto:austin@blaze-intelligence.com">Email Us</a>
            </div>
            <div class="footer-section">
                <h4>Connect</h4>
                <a href="https://github.com/blaze-intelligence" target="_blank">GitHub</a>
                <a href="https://twitter.com/blazeintel" target="_blank">Twitter</a>
                <a href="https://linkedin.com/company/blaze-intelligence" target="_blank">LinkedIn</a>
            </div>
        </div>
        <div class="footer-bottom">
            © 2025 Blaze Intelligence. Belief with receipts.
        </div>
    </footer>
    
    <!-- Cloudflare Web Analytics -->
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
</body>
</html>`;

// Create the pages
for (const page of pages) {
  try {
    const mdPath = path.join(rootDir, 'content', page.src);
    const md = fs.readFileSync(mdPath, 'utf8');
    const body = marked.parse(md);
    const canonicalPath = '/' + page.out.replace('.html', '');
    const html = layout(page.title, page.description, body, canonicalPath);
    
    // Ensure public directory exists
    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const outPath = path.join(publicDir, page.out);
    fs.writeFileSync(outPath, html);
    console.log(`✅ Created ${page.out}`);
  } catch (error) {
    console.error(`❌ Error processing ${page.src}:`, error.message);
  }
}

console.log('\n📄 Markdown pages built successfully!');