# 🔥 Blaze Intelligence

Elite Sports Analytics Platform delivering championship-level insights for MLB, NFL, NBA, and NCAA teams.

## 🏆 Overview

Blaze Intelligence combines Texas heritage with algorithmic excellence to transform sports data into competitive advantages. Our platform provides real-time analytics, AI-powered insights, and precision targeting for professional and collegiate sports organizations.

**Founded by**: Austin Humphrey - Former multi-sport athlete turned sports technology innovator  
**Contact**: ahump20@outlook.com | (210) 273-5538  
**Location**: Boerne, Texas

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev

# Open http://localhost:8000
```

## 🎯 Features

- **Real-Time Analytics**: Live performance metrics with <100ms latency
- **AI-Powered Insights**: Machine learning algorithms for pattern recognition
- **Multi-Sport Coverage**: MLB, NFL, NBA, and NCAA data integration
- **Texas-Inspired Design**: Professional branding with Burnt Orange (#BF5700) and Cardinal Blue (#9BCBEB)
- **Mobile-First**: Responsive design for all devices
- **Performance Optimized**: Lighthouse score ≥90 across all metrics

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3/JavaScript**: Modern web standards
- **Performance**: Lazy-loaded Three.js, optimized assets
- **Design**: Glass morphism, Texas-inspired color palette
- **Responsive**: Mobile-first design with CSS Grid

### Backend API
- **Express.js**: Development server with TypeScript
- **Cloudflare Workers**: Production API with edge caching
- **Data Sources**: MLB Stats API, ESPN API, CollegeFootballData
- **Caching**: 5-minute KV cache with stale-while-revalidate

### Data Architecture
```
src/
├── data/
│   ├── mlb/adapter.ts      # MLB Stats API integration
│   ├── nfl/adapter.ts      # ESPN NFL API integration
│   └── cfb/adapter.ts      # College Football Data API
├── server/
│   └── api-server.ts       # Express development server
├── worker/
│   └── api-worker.js       # Cloudflare Worker for production
├── client/
│   └── live-data-client.js # Frontend data management
└── utils/
    └── monitoring.js       # Error tracking and analytics
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required for Live Data
```bash
# Sports Data APIs
MLB_API_KEY=your_mlb_api_key
NFL_API_KEY=your_nfl_api_key  
CFB_API_KEY=your_college_football_data_key

# Monitoring
SENTRY_DSN=your_sentry_dsn

# API Configuration
API_BASE_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,https://blaze-intelligence.pages.dev
```

### Optional
```bash
# Database & Caching
REDIS_URL=redis://localhost:6379
DATABASE_URL=your_database_url

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Development

### Commands
```bash
# Development
npm run dev              # Start dev server + API
npm run dev:server       # API server only
npm run dev:client       # Static file server only

# Building
npm run build           # Build static files + worker
npm run build:static    # Static files only
npm run build:worker    # Cloudflare Worker only

# Testing
npm run test            # Unit tests
npm run test:watch      # Watch mode
npm run test:e2e        # End-to-end tests
npm run validate        # Lint + typecheck + test

# Deployment
npm run deploy          # Deploy to Cloudflare Pages
npm run deploy:worker   # Deploy API worker
```

### Development Workflow
1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `.env.example` to `.env`
3. **Start development**: `npm run dev`
4. **Make changes**: Edit files in `src/`
5. **Test changes**: `npm run validate`
6. **Deploy**: `npm run deploy`

## 📊 API Endpoints

### Teams
- `GET /api/mlb/team/:teamId` - MLB team summary
- `GET /api/nfl/team/:teamAbbr` - NFL team summary  
- `GET /api/cfb/team/:teamName` - College football team summary

### Games
- `GET /api/mlb/games` - Live MLB games
- `GET /api/nfl/games` - Live NFL games
- `GET /api/cfb/games` - Live college football games

### Dashboard
- `GET /api/dashboard/summary` - Combined dashboard data

### Health & Metrics
- `GET /healthz` - Health check
- `GET /metrics` - System metrics

### Response Format
```json
{
  "success": true,
  "data": {
    "id": 138,
    "name": "St. Louis Cardinals",
    "wins": 85,
    "losses": 77,
    "winPercentage": 0.525,
    "lastUpdated": "2025-09-09T12:00:00Z",
    "source": "MLB Stats API",
    "confidence": "high"
  },
  "meta": {
    "cached": true,
    "asOf": "2025-09-09T12:00:00Z",
    "season": "2025-2026"
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
# Tests data adapters, caching, error handling
```

### E2E Tests
```bash
npm run test:e2e
# Tests homepage loading, data updates, responsiveness
```

### Performance Testing
```bash
npm run lighthouse
# Lighthouse CI for performance metrics
```

## 📈 Monitoring

### Error Tracking
- **Sentry**: Real-time error monitoring
- **Custom**: Offline error queuing
- **Performance**: Core Web Vitals tracking

### Analytics
- **API Metrics**: Response times, error rates
- **Cache Performance**: Hit rates, staleness
- **User Interactions**: Page views, engagement

### Health Checks
```bash
curl https://api.blaze-intelligence.com/healthz
```

## 🔒 Security

### Implemented
- ✅ **Secrets Management**: Environment variables only
- ✅ **CORS Protection**: Restricted origins
- ✅ **Rate Limiting**: 100 req/15min per IP
- ✅ **Security Headers**: Helmet.js configuration
- ✅ **Input Validation**: Sanitized parameters

### Secret Rotation
```bash
# Rotate API keys immediately if exposed
wrangler secret put MLB_API_KEY
wrangler secret put NFL_API_KEY
wrangler secret put CFB_API_KEY
```

## 🚀 Deployment

### Staging
```bash
git push origin develop
# Automatically deploys to staging environment
```

### Production
```bash
git push origin main
# Runs tests → deploys to production
```

### Manual Deployment
```bash
# Pages deployment
npm run build
wrangler pages deploy dist

# Worker deployment  
wrangler deploy
```

## 🎨 Brand Guidelines

### Colors
- **Primary**: Burnt Orange `#BF5700`
- **Secondary**: Cardinal Blue `#9BCBEB` 
- **Supporting**: Tennessee Deep `#002244`, Vancouver Teal `#00B2A9`

### Typography
- **Primary**: Inter (400, 500, 600, 700, 900)
- **Technical**: JetBrains Mono (400, 500, 600, 700)

### Teams Focus
- **MLB**: St. Louis Cardinals
- **NFL**: Tennessee Titans  
- **NCAA**: Texas Longhorns
- **NBA**: Memphis Grizzlies

## 📋 Content Guidelines

### Data Accuracy
- ✅ **Source Attribution**: Every widget shows data source
- ✅ **Confidence Levels**: High/Medium/Low indicators
- ✅ **Timestamps**: Last updated times displayed
- ✅ **Demo Labels**: Clear "DEMO DATA" badges when using fallbacks

### Claims Policy
- ❌ **No Partnership Claims**: Don't claim "trusted by pro teams"
- ✅ **Factual Savings**: 67-80% vs named competitor tiers only
- ✅ **Benchmark Disclosure**: Link to "Methods & Definitions" for performance claims

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment: `cp .env.example .env`
5. Make changes and test: `npm run validate`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open Pull Request

### Code Style
- **ESLint**: Enforced linting rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Type checking for server code
- **Tests**: Required for new features

## 📞 Support

### Contact
- **Email**: ahump20@outlook.com
- **Phone**: (210) 273-5538
- **Location**: Boerne, Texas

### Documentation
- **API Docs**: `/docs/data-contracts.md`
- **Deployment**: This README
- **Architecture**: `/docs/architecture.md`

### Issues
Report bugs and request features at: [GitHub Issues](https://github.com/yourusername/blaze-intelligence/issues)

---

## 🏆 Success Metrics

### Technical
- **Performance**: Lighthouse ≥90 (PWA/Perf/SEO/Accessibility)
- **Uptime**: 99.9% availability
- **Response Time**: <100ms API responses
- **Error Rate**: <1% failed requests

### Business
- **Data Accuracy**: Real-time updates with source attribution
- **User Experience**: Mobile-first responsive design
- **Brand Consistency**: Texas-inspired professional aesthetic
- **Content Accuracy**: No false claims, transparent data sources

Built with championship-level precision by **Austin Humphrey** in Boerne, Texas 🤠