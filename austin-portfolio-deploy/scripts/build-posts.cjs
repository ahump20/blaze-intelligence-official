#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseFrontMatter } = require('./build-blog-index.cjs');

// Blog post HTML template
function generatePostHTML(frontMatter, content, sport) {
    const sportName = {
        'cfb': 'College Football',
        'mlb': 'MLB',
        'nfl': 'NFL'
    }[sport] || 'Sports';
    
    // Remove front-matter from content
    const htmlContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${frontMatter.title} | Blaze Intelligence Blog</title>
    <meta name="description" content="${frontMatter.summary || ''}">
    <meta name="keywords" content="${(frontMatter.tags || []).join(', ')}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${frontMatter.title}">
    <meta property="og:description" content="${frontMatter.summary || ''}">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="${frontMatter.date}">
    
    <!-- Canonical -->
    <link rel="canonical" href="https://blaze-intelligence.com/blog/${sport}/${path.basename(frontMatter.slug || '')}.html">
    
    <!-- Fonts & Styles -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Three.js for hero -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #e2e8f0;
        }
        .hero-3d-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        .content-card {
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .sport-badge {
            background: linear-gradient(45deg, #BF5700, #FF8C00);
        }
        .game-results {
            display: grid;
            gap: 1rem;
            margin: 1.5rem 0;
        }
        .game-results > div {
            padding: 1rem;
            background: rgba(15, 23, 42, 0.5);
            border-left: 3px solid #FF8C00;
            border-radius: 0.5rem;
        }
        table {
            width: 100%;
            margin: 1.5rem 0;
            border-collapse: collapse;
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        th {
            background: rgba(15, 23, 42, 0.5);
            color: #FF8C00;
        }
        .prediction-box {
            background: linear-gradient(135deg, rgba(191, 87, 0, 0.2), rgba(255, 140, 0, 0.1));
            border: 2px solid #FF8C00;
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin: 2rem 0;
            text-align: center;
            font-size: 1.25rem;
        }
        .matchup-analysis, .defensive-preview, .analytics-insight {
            background: rgba(15, 23, 42, 0.3);
            padding: 1.5rem;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
        }
    </style>
</head>
<body class="min-h-screen">
    <!-- Navigation -->
    <nav class="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <a href="/" class="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                    Blaze Intelligence
                </a>
                <div class="flex items-center space-x-6">
                    <a href="/blog/" class="text-gray-300 hover:text-white">All Posts</a>
                    <a href="/blog/cfb/" class="text-gray-300 hover:text-white">CFB</a>
                    <a href="/blog/mlb/" class="text-gray-300 hover:text-white">MLB</a>
                    <a href="/blog/nfl/" class="text-gray-300 hover:text-white">NFL</a>
                    <a href="/" class="text-gray-300 hover:text-white">Home</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="relative h-64 overflow-hidden">
        <div id="hero-3d" class="hero-3d-container"></div>
        <div class="relative z-10 h-full flex items-center justify-center">
            <div class="text-center px-4">
                <div class="sport-badge inline-block px-4 py-1 rounded-full text-white font-bold mb-4">
                    ${sportName} • Week ${frontMatter.week || ''}
                </div>
                <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl mx-auto">
                    ${frontMatter.title}
                </h1>
                <div class="mt-4 text-gray-300">
                    <time datetime="${frontMatter.date}">${new Date(frontMatter.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</time>
                </div>
            </div>
        </div>
    </div>

    <!-- Article Content -->
    <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="content-card rounded-lg p-8">
            ${htmlContent}
            
            <!-- Sources & Methods Footer -->
            <div class="mt-12 pt-8 border-t border-gray-700">
                <h3 class="text-xl font-bold text-orange-400 mb-4">Sources & Methods</h3>
                <div class="text-sm text-gray-400 space-y-2">
                    ${frontMatter.sources && frontMatter.sources.length > 0 ? 
                        `<p><strong>Data Sources:</strong> ${frontMatter.sources.join(', ')}</p>` : ''}
                    <p>All predictions and analytics powered by Blaze Intelligence proprietary models using 2.8M+ data points.</p>
                    <p>For detailed methodology and accuracy metrics, see our <a href="/methods-definitions.html" class="text-orange-400 hover:text-orange-300 underline">Methods & Definitions</a> page.</p>
                    <p>Historical accuracy: CFB 73% • MLB 72% • NFL 75% • NBA 76%</p>
                </div>
            </div>
            
            <!-- Navigation -->
            <div class="mt-8 pt-8 border-t border-gray-700 flex justify-between">
                <a href="/blog/${sport}/" class="text-orange-400 hover:text-orange-300">
                    ← Back to ${sportName} Archive
                </a>
                <a href="/blog/" class="text-orange-400 hover:text-orange-300">
                    All Blog Posts →
                </a>
            </div>
        </div>
    </article>

    <!-- Footer -->
    <footer class="mt-16 py-8 border-t border-gray-800">
        <div class="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p>© 2025 Blaze Intelligence • <a href="/privacy.html" class="hover:text-white">Privacy</a> • <a href="/terms.html" class="hover:text-white">Terms</a> • <a href="/status.html" class="hover:text-white">Status</a></p>
        </div>
    </footer>

    <script>
        // Simple Three.js particle field for hero
        if (typeof THREE !== 'undefined') {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 256, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            
            const container = document.getElementById('hero-3d');
            if (container) {
                renderer.setSize(window.innerWidth, 256);
                container.appendChild(renderer.domElement);
                
                // Create particle field
                const geometry = new THREE.BufferGeometry();
                const vertices = [];
                for (let i = 0; i < 1000; i++) {
                    vertices.push(
                        Math.random() * 100 - 50,
                        Math.random() * 50 - 25,
                        Math.random() * 100 - 50
                    );
                }
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                
                const material = new THREE.PointsMaterial({ 
                    color: 0xFF8C00, 
                    size: 0.5,
                    transparent: true,
                    opacity: 0.6
                });
                
                const particles = new THREE.Points(geometry, material);
                scene.add(particles);
                
                camera.position.z = 30;
                
                function animate() {
                    requestAnimationFrame(animate);
                    particles.rotation.y += 0.0005;
                    renderer.render(scene, camera);
                }
                animate();
            }
        }
    </script>
</body>
</html>`;
}

// Process all blog posts
function buildPosts() {
    const contentDir = path.join(__dirname, '..', 'content', 'blog');
    const blogOutputDir = path.join(__dirname, '..', 'blog');
    
    // Ensure output directory exists
    if (!fs.existsSync(blogOutputDir)) {
        fs.mkdirSync(blogOutputDir, { recursive: true });
    }
    
    let processedCount = 0;
    
    // Recursively process posts
    function processDirectory(dir, sport = null) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Sport directories
                const sportName = path.basename(filePath);
                const sportOutputDir = path.join(blogOutputDir, sportName);
                if (!fs.existsSync(sportOutputDir)) {
                    fs.mkdirSync(sportOutputDir, { recursive: true });
                }
                processDirectory(filePath, sportName);
            } else if (file.endsWith('.html') || file.endsWith('.md')) {
                const content = fs.readFileSync(filePath, 'utf8');
                const frontMatter = parseFrontMatter(content);
                
                if (frontMatter) {
                    const filename = path.basename(file, path.extname(file));
                    const outputPath = sport ? 
                        path.join(blogOutputDir, sport, `${filename}.html`) :
                        path.join(blogOutputDir, `${filename}.html`);
                    
                    frontMatter.slug = filename;
                    const html = generatePostHTML(frontMatter, content, sport || 'general');
                    
                    fs.writeFileSync(outputPath, html);
                    processedCount++;
                    console.log(`   ✓ Generated: ${outputPath}`);
                }
            }
        });
    }
    
    console.log('Building blog posts...');
    processDirectory(contentDir);
    console.log(`✅ Generated ${processedCount} blog posts`);
    
    return processedCount;
}

// Run if called directly
if (require.main === module) {
    buildPosts();
}

module.exports = { buildPosts, generatePostHTML };