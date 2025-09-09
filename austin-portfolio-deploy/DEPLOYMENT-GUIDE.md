# Blaze Intelligence Sports Data Hub - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to Replit or hosting platform
- Optional: SportsRadar API keys
- Optional: Docker for live-sports-scoreboard-api

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd austin-portfolio-deploy

# Install dependencies (if any)
npm install

# Start local server
python3 -m http.server 8000
# OR
npx serve -p 8000

# Open in browser
open http://localhost:8000
```

## 📦 Core Components

### 1. Sports Data Hub (`js/sports-data-hub.js`)
Unified interface for multiple sports data sources:
- **SportsRadar Integration**: Premium real-time data (requires API keys)
- **MLB Stats API**: Free official MLB data
- **ESPN API**: Free scores and standings
- **College Football Data**: Free NCAA statistics

### 2. Live Scoreboard (`js/live-scoreboard-integration.js`)
Real-time score updates with:
- Integration with nishs9/live-sports-scoreboard-api
- 10-second auto-refresh
- WebSocket streaming support
- Fallback to cached data

### 3. Team Intelligence Cards (`js/team-intelligence-cards.js`)
Interactive team analysis with:
- AI-powered performance scoring
- Resource links to external databases
- Export functionality
- Multiple view modes (grid/table/map)

### 4. API Configuration (`js/api-config.js`)
Central configuration for all APIs and services:
- Environment variable support
- Secure vault integration
- Rate limiting configuration
- Cache management

## 🔑 API Configuration

### Method 1: Web Interface (Recommended)
1. Open `/setup-api-keys.html` in your browser
2. Enter your API keys:
   - SportsRadar MLB Key
   - SportsRadar NFL Key
   - SportsRadar NBA Key
   - SportsRadar NCAA Football Key
3. Click "Test APIs" to verify
4. Click "Save Configuration"

### Method 2: Environment Variables
```bash
# .env file (create in project root)
SPORTRADAR_MLB_KEY=your_mlb_key_here
SPORTRADAR_NFL_KEY=your_nfl_key_here
SPORTRADAR_NBA_KEY=your_nba_key_here
SPORTRADAR_NCAAF_KEY=your_ncaaf_key_here
SCOREBOARD_API_URL=http://localhost:3000
```

### Method 3: JavaScript Console
```javascript
// Open browser console and run:
localStorage.setItem('SPORTRADAR_MLB_KEY', 'your_key_here');
localStorage.setItem('SPORTRADAR_NFL_KEY', 'your_key_here');
localStorage.setItem('SPORTRADAR_NBA_KEY', 'your_key_here');
localStorage.setItem('SPORTRADAR_NCAAF_KEY', 'your_key_here');
```

## 🌐 Deployment Options

### Option 1: Replit Deployment
1. Import repository to Replit
2. Set environment variables in Replit Secrets
3. Configure `.replit` file:
```toml
run = "python3 -m http.server 8000"
language = "html"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "python3 -m http.server 8000"]
```

### Option 2: Cloudflare Pages
1. Connect GitHub repository
2. Build settings:
   - Build command: (leave empty for static site)
   - Build output directory: `/`
3. Environment variables:
   - Add API keys as environment variables
4. Deploy

### Option 3: Vercel
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Option 4: Docker Container
```dockerfile
# Dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t blaze-intelligence .
docker run -p 8080:80 blaze-intelligence
```

## 🏗️ Architecture

### Data Flow
```
User Request → Sports Data Hub → API Router → Data Source
                                      ↓
                                 SportsRadar (if keys available)
                                      ↓
                                 Fallback to Free APIs
                                      ↓
                                 Cache Layer
                                      ↓
                                 Response
```

### Caching Strategy
- **Live Data**: 30 seconds TTL
- **Roster Data**: 24 hours TTL
- **Standings**: 1 hour TTL
- **Statistics**: 6 hours TTL
- **News**: 15 minutes TTL

### Rate Limiting
- **SportsRadar**: 1 request/second, 1000/month (trial)
- **ESPN**: 10 requests/second, 10000/day
- **MLB Stats API**: 10 requests/second, 50000/day

## 📊 Features

### Live Scoreboards
- Real-time MLB and NFL scores
- Auto-refresh every 10 seconds
- Enhanced data with SportsRadar
- Mobile-responsive design

### Team Intelligence Matrix
- 227 teams across all major leagues
- AI-powered performance scoring
- Historical and predictive analytics
- Export capabilities

### Resource Links Hub
- Baseball Reference integration
- Pro Football Focus data
- FanGraphs statistics
- Perfect Game scouting
- ESPN coverage

### Texas Teams Focus
**MLB**: Astros, Rangers
**NFL**: Cowboys, Texans
**NBA**: Rockets, Mavericks, Spurs
**NCAA**: Longhorns, Aggies, TCU, Baylor, Texas Tech, Houston, SMU, Rice, North Texas, UTSA, Texas State, UTEP

## 🔧 Configuration Files

### API Configuration (`js/api-config.js`)
```javascript
window.BlazeAPIConfig = {
    sportsRadar: {
        keys: {
            mlb: 'your_key',
            nfl: 'your_key',
            nba: 'your_key',
            ncaaf: 'your_key'
        }
    },
    features: {
        enableSportsRadar: true,
        enableRealTimeStreaming: true,
        enableAdvancedAnalytics: true,
        enablePerfectGameIntegration: true,
        enableNILValuation: true,
        enableGritIndex: true
    }
};
```

### Dashboard Configuration (`data/dashboard-config.json`)
```json
{
  "refresh_interval": 10000,
  "default_sport": "mlb",
  "show_scoreboards": true,
  "show_intelligence_cards": true,
  "enable_websockets": true
}
```

## 🐛 Troubleshooting

### Issue: No live scores showing
**Solution**: 
1. Check if live-sports-scoreboard-api is running
2. Verify SCOREBOARD_API_URL in configuration
3. Check browser console for errors

### Issue: SportsRadar data not loading
**Solution**:
1. Verify API keys are correct
2. Check rate limits haven't been exceeded
3. Test keys using setup-api-keys.html

### Issue: Slow performance
**Solution**:
1. Enable caching in api-config.js
2. Reduce update intervals
3. Use CDN for static assets

### Issue: CORS errors
**Solution**:
1. Use proxy endpoint through Cloudflare Worker
2. Configure proper CORS headers
3. Use server-side fetching

## 📈 Performance Metrics

Target Metrics:
- **Response Time**: <100ms
- **Accuracy**: 94.6%
- **Uptime**: 99.9%
- **Cache Hit Rate**: >80%

Monitoring:
- Browser DevTools Network tab
- Performance Monitor (`js/performance-monitor.js`)
- Error Handler (`js/error-handler.js`)

## 🔒 Security

### API Key Security
- Never commit keys to repository
- Use environment variables
- Implement vault service for production
- Rotate keys regularly

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline';">
```

### HTTPS Configuration
- Always use HTTPS in production
- Implement SSL certificates
- Force HTTPS redirects

## 📝 Maintenance

### Daily Tasks
- Monitor API usage
- Check error logs
- Verify data accuracy

### Weekly Tasks
- Review performance metrics
- Update team rosters
- Clear old cache data

### Monthly Tasks
- Rotate API keys
- Update dependencies
- Performance optimization

## 🤝 Support

### Resources
- [SportsRadar Documentation](https://developer.sportradar.com/)
- [MLB Stats API](https://statsapi.mlb.com/docs/)
- [ESPN API](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [College Football Data](https://collegefootballdata.com/)

### Contact
- Email: ahump20@outlook.com
- Phone: (210) 273-5538
- Location: Boerne, Texas

## 📄 License

© 2025 Blaze Intelligence. All rights reserved.

---

Built with championship mindset in Texas 🤠