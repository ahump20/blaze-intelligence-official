# Blaze Intelligence R2 Storage Setup

**Date:** September 1, 2025  
**Status:** ✅ CONFIGURED AND DEPLOYED

## 🏪 R2 Storage Configuration

### Account Details
- **Account ID:** `a12cb329d84130460eed99b816e4d0d3`
- **Bucket Name:** `blaze-intelligence-data`
- **Endpoint:** https://a12cb329d84130460eed99b816e4d0d3.r2.cloudflarestorage.com
- **Storage Worker:** https://blaze-storage.humphrey-austin20.workers.dev

### Available Buckets
```
✓ blaze-intelligence-data (Primary)
✓ blaze-sports-data-lake
✓ blaze-youth-data
✓ blaze-intelligence-videos
✓ blaze-vision-clips
✓ blaze-vision-reports
✓ blaze-backups-production
```

## 🔧 Components Deployed

### 1. Storage Worker (`src/storage-worker.js`)
- **URL:** https://blaze-storage.humphrey-austin20.workers.dev
- **Features:**
  - RESTful API for data access
  - CORS enabled
  - Error handling & fallbacks
  - Metadata enrichment
  - Health monitoring

### 2. R2 Manager Script (`scripts/r2-manager.cjs`)
- Upload/download sports data
- Bulk operations
- Sample data creation
- CLI interface

### 3. Frontend Integration (`js/r2-integration.js`)
- Client-side data fetching
- Caching (5-minute TTL)
- Fallback data system
- Error handling

### 4. Data Browser (`r2-browser.html`)
- Web interface for R2 data
- Real-time testing
- API debugging
- Storage status monitoring

## 📊 Data Structure

### Uploaded Datasets (22 total)
```
sports-data/
├── mlb/
│   └── cardinals.json
├── nfl/
│   └── titans.json  
├── cfb/
│   └── longhorns.json
├── youth-baseball/
│   ├── 13u-dataset.json
│   ├── 14u-dataset.json
│   ├── 15u-dataset.json
│   ├── 16u-dataset.json
│   ├── 17u-dataset.json
│   ├── 18u-dataset.json
│   ├── perfect-game-integration.json
│   └── recruiting-insights.json
└── general/
    ├── blaze-metrics.json
    ├── blog-index.json
    ├── dashboard-config.json
    ├── insights.json
    ├── monitoring-report.json
    └── [more...]
```

## 🔌 API Endpoints

### Storage Worker API
- `GET /api/health` - Service health check
- `GET /api/data/{sport}/{dataset}` - Fetch data
- `POST /api/data/{sport}/{dataset}` - Store data  
- `DELETE /api/data/{sport}/{dataset}` - Delete data

### Example Usage
```bash
# Health check
curl https://blaze-storage.humphrey-austin20.workers.dev/api/health

# Fetch Cardinals data
curl https://blaze-storage.humphrey-austin20.workers.dev/api/data/mlb/cardinals

# Upload data
curl -X POST https://blaze-storage.humphrey-austin20.workers.dev/api/data/mlb/cardinals \
  -H "Content-Type: application/json" \
  -d '{"roster": [...], "stats": {...}}'
```

## 🛠️ Management Commands

### R2 Manager CLI
```bash
# Upload data
node scripts/r2-manager.cjs upload mlb cardinals ./data/mlb/cardinals.json

# Download data  
node scripts/r2-manager.cjs download nfl titans ./titans-data.json

# Upload all local data
node scripts/r2-manager.cjs upload-all

# Create sample data
node scripts/r2-manager.cjs create-sample

# Show info
node scripts/r2-manager.cjs info
```

### Wrangler Commands
```bash
# Deploy storage worker
wrangler deploy --config wrangler-storage.toml

# Upload file directly
wrangler r2 object put blaze-intelligence-data/sports-data/mlb/cardinals.json --file="./data.json"

# List buckets
wrangler r2 bucket list
```

## 🔐 Security Configuration

### Secrets (Stored via Wrangler)
- `CLOUDFLARE_R2_ACCESS_KEY_ID` - Stored securely
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` - Stored securely

### Access Control
- Worker has R2 bucket binding
- CORS enabled for web access
- No public bucket access (Worker-mediated only)

## 🚀 Deployment URLs

### Main Site (with R2 Integration)
- **Live:** https://80077cff.blaze-intelligence.com
- **R2 Browser:** https://80077cff.blaze-intelligence.com/r2-browser.html

### Storage Services  
- **Worker:** https://blaze-storage.humphrey-austin20.workers.dev
- **Health:** https://blaze-storage.humphrey-austin20.workers.dev/api/health

## ⚡ Performance Features

### Caching Strategy
- Client-side: 5-minute cache
- Worker: Cloudflare edge caching
- Browser: localStorage for preferences

### Error Handling
- Graceful degradation with fallback data
- Comprehensive error logging
- User-friendly error messages

## 🧪 Testing & Debugging

### Browser Interface
Visit `/r2-browser.html` for:
- Live data browsing
- API testing
- Storage health monitoring
- Cache statistics

### Development Tools
- R2 Manager script for bulk operations
- Health check endpoints
- Error logging and monitoring
- Cache control utilities

## 📈 Next Steps

1. **Domain Configuration**: Activate blaze-intelligence.com
2. **Data Pipeline**: Automate data ingestion from MLB/NFL/CFB APIs
3. **Analytics Integration**: Connect R2 data to dashboard widgets  
4. **Monitoring**: Set up alerts for storage health
5. **Backup Strategy**: Implement automated backups across buckets

---

**Status:** All R2 storage components are live and operational. The system provides a robust foundation for Blaze Intelligence's sports data infrastructure with proper security, caching, and error handling.