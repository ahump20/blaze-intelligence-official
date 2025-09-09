/**
 * CDN Integration for Global Asset Delivery
 * Optimizes static asset delivery and caching
 */

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

class CDNIntegration {
  constructor(logger = null) {
    this.logger = logger;
    this.cdnDomain = process.env.CDN_DOMAIN || null;
    this.enabled = process.env.NODE_ENV === 'production' && this.cdnDomain;
    this.assetMap = new Map(); // Asset versioning map
    this.cacheHeaders = {
      static: 'public, max-age=31536000, immutable', // 1 year for versioned assets
      dynamic: 'public, max-age=3600', // 1 hour for dynamic content
      html: 'public, max-age=300, must-revalidate' // 5 minutes for HTML
    };
  }

  /**
   * Initialize CDN integration
   */
  async initialize() {
    try {
      if (!this.enabled) {
        console.log('📡 CDN integration disabled (development mode)');
        return;
      }

      await this.generateAssetMap();
      await this.setupCacheHeaders();
      
      console.log(`✅ CDN integration initialized: ${this.cdnDomain}`);
      
      if (this.logger) {
        this.logger.logHealth('cdn', 'initialized', {
          domain: this.cdnDomain,
          assetsCount: this.assetMap.size
        });
      }
      
    } catch (error) {
      console.error('❌ CDN initialization failed:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'cdn-integration' });
      }
    }
  }

  /**
   * Generate asset fingerprint map for cache busting
   */
  async generateAssetMap() {
    const publicDir = path.join(process.cwd(), 'public');
    
    try {
      await this.scanDirectory(publicDir, '');
      console.log(`📦 Generated asset map: ${this.assetMap.size} files`);
    } catch (error) {
      console.warn('Warning: Could not generate asset map:', error.message);
    }
  }

  /**
   * Recursively scan directory for assets
   */
  async scanDirectory(dirPath, relativePath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const assetPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, assetPath);
        } else if (this.isStaticAsset(entry.name)) {
          const hash = await this.generateFileHash(fullPath);
          const versionedPath = this.getVersionedPath(assetPath, hash);
          
          this.assetMap.set(assetPath, {
            original: assetPath,
            versioned: versionedPath,
            hash,
            size: await this.getFileSize(fullPath)
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
      console.warn(`Could not scan directory: ${dirPath}`);
    }
  }

  /**
   * Check if file is a static asset
   */
  isStaticAsset(filename) {
    const staticExtensions = [
      '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
      '.woff', '.woff2', '.ttf', '.otf', '.eot',
      '.mp4', '.webm', '.ogg', '.mp3', '.wav',
      '.pdf', '.zip', '.json'
    ];
    
    const ext = path.extname(filename).toLowerCase();
    return staticExtensions.includes(ext);
  }

  /**
   * Generate file hash for cache busting
   */
  async generateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get versioned path with hash
   */
  getVersionedPath(originalPath, hash) {
    const ext = path.extname(originalPath);
    const basePath = originalPath.slice(0, -ext.length);
    return `${basePath}.${hash}${ext}`;
  }

  /**
   * Get file size
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get CDN URL for asset
   */
  getCDNUrl(assetPath) {
    if (!this.enabled || !this.cdnDomain) {
      return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    }

    const asset = this.assetMap.get(assetPath);
    const finalPath = asset ? asset.versioned : assetPath;
    
    return `https://${this.cdnDomain}${finalPath.startsWith('/') ? finalPath : `/${finalPath}`}`;
  }

  /**
   * Setup cache headers middleware
   */
  setupCacheHeaders() {
    return (req, res, next) => {
      const url = req.url;
      const ext = path.extname(url).toLowerCase();
      
      // Set appropriate cache headers based on content type
      if (this.isStaticAsset(url)) {
        // Long cache for static assets with versioning
        if (this.hasVersionHash(url)) {
          res.set('Cache-Control', this.cacheHeaders.static);
          res.set('Expires', new Date(Date.now() + 31536000000).toUTCString()); // 1 year
        } else {
          res.set('Cache-Control', this.cacheHeaders.dynamic);
          res.set('Expires', new Date(Date.now() + 3600000).toUTCString()); // 1 hour
        }
      } else if (ext === '.html' || url.endsWith('/')) {
        // Short cache for HTML pages
        res.set('Cache-Control', this.cacheHeaders.html);
        res.set('Expires', new Date(Date.now() + 300000).toUTCString()); // 5 minutes
      } else {
        // Default caching for other content
        res.set('Cache-Control', 'public, max-age=300');
      }
      
      // Add ETags for better caching
      if (process.env.NODE_ENV === 'production') {
        res.set('ETag', this.generateETag(url));
      }
      
      next();
    };
  }

  /**
   * Check if URL contains version hash
   */
  hasVersionHash(url) {
    // Simple check for 8-character hash before file extension
    const pattern = /\.[a-f0-9]{8}\.(js|css|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|otf|eot)$/i;
    return pattern.test(url);
  }

  /**
   * Generate ETag for URL
   */
  generateETag(url) {
    const hash = crypto.createHash('md5').update(url + Date.now().toString()).digest('hex');
    return `"${hash.substring(0, 16)}"`;
  }

  /**
   * Get asset manifest for frontend
   */
  getAssetManifest() {
    const manifest = {};
    
    for (const [original, asset] of this.assetMap.entries()) {
      manifest[original] = {
        url: this.getCDNUrl(original),
        versioned: asset.versioned,
        hash: asset.hash,
        size: asset.size
      };
    }
    
    return manifest;
  }

  /**
   * Purge CDN cache for specific assets
   */
  async purgeCDNCache(assets = []) {
    if (!this.enabled || !process.env.CDN_PURGE_KEY) {
      console.log('CDN cache purge skipped (not configured)');
      return { success: false, reason: 'not_configured' };
    }

    try {
      // This would integrate with your CDN provider's purge API
      // Example implementations for different CDN providers:
      
      const purgeUrls = assets.map(asset => this.getCDNUrl(asset));
      
      console.log(`🧹 Purging CDN cache for ${purgeUrls.length} assets`);
      
      // Cloudflare example:
      if (process.env.CDN_PROVIDER === 'cloudflare') {
        return await this.purgeCloudflare(purgeUrls);
      }
      
      // AWS CloudFront example:
      if (process.env.CDN_PROVIDER === 'cloudfront') {
        return await this.purgeCloudFront(purgeUrls);
      }
      
      console.log('CDN purge completed (mock)');
      return { success: true, urls: purgeUrls };
      
    } catch (error) {
      console.error('❌ CDN cache purge failed:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'cdn-purge', assets });
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Cloudflare cache purge implementation
   */
  async purgeCloudflare(urls) {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files: urls })
    });
    
    const result = await response.json();
    return { success: result.success, result };
  }

  /**
   * AWS CloudFront cache invalidation
   */
  async purgeCloudFront(urls) {
    // AWS SDK would be required for this implementation
    console.log('CloudFront invalidation not implemented (requires AWS SDK)');
    return { success: false, reason: 'not_implemented' };
  }

  /**
   * Get CDN statistics
   */
  getCDNStats() {
    const totalSize = Array.from(this.assetMap.values()).reduce((sum, asset) => sum + asset.size, 0);
    
    return {
      enabled: this.enabled,
      domain: this.cdnDomain,
      assetsCount: this.assetMap.size,
      totalSize: this.formatBytes(totalSize),
      cacheHeaders: this.cacheHeaders,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Format bytes for human readable output
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check for CDN
   */
  async healthCheck() {
    try {
      if (!this.enabled) {
        return { status: 'disabled', reason: 'development_mode' };
      }
      
      // Test CDN connectivity
      const testUrl = this.getCDNUrl('/favicon.ico');
      const response = await fetch(testUrl, { method: 'HEAD', timeout: 5000 });
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        domain: this.cdnDomain,
        testUrl,
        responseTime: response.headers.get('cf-ray') ? 'cloudflare' : 'unknown',
        stats: this.getCDNStats()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getCDNStats()
      };
    }
  }
}

export default CDNIntegration;