# 🏈 Free Sports Intelligence APIs & MCP Integration Guide
## Complete American Sports Data Stack (2025)

## 🚀 Quick Start - 100% Free Options

### **No Registration Required**
These APIs work immediately without any signup:

```javascript
// 1. BallDontLie - NBA Data (Completely Free)
fetch('https://www.balldontlie.io/api/v1/games?dates[]=2025-08-15')
  .then(res => res.json())
  .then(data => console.log(data));

// 2. ESPN Hidden API - All Major Sports (Unofficial but Free)
fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')
  .then(res => res.json())
  .then(data => console.log(data));

// 3. College Football Data - NCAAF (Completely Free)
fetch('https://api.collegefootballdata.com/games?year=2025&week=1')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📊 Complete Free API Breakdown

### 1. **BallDontLie API** ⭐ BEST FREE NBA API
**URL**: `https://www.balldontlie.io/api/v1`
**Cost**: 100% FREE FOREVER
**Rate Limit**: 60 requests/minute

#### Available Endpoints:
```javascript
/players           // All NBA players
/players?search=lebron  // Search players
/teams             // All NBA teams
/games             // Games by date
/stats             // Player statistics
/season_averages   // Season averages
```

#### Features:
- ✅ No API key required
- ✅ No email registration
- ✅ Data from 1979 to present
- ✅ Updates every 10 minutes during games
- ✅ Clean JSON responses

---

### 2. **ESPN Hidden API** ⭐ MOST COMPREHENSIVE
**Base URL**: `https://site.api.espn.com/apis/site/v2/sports`
**Cost**: FREE (Unofficial)
**Sports**: NFL, NBA, MLB, NHL, NCAAF, NCAAB

#### Key Endpoints:
```javascript
// NFL
/football/nfl/scoreboard
/football/nfl/teams/{teamId}/schedule
/football/nfl/standings
/football/nfl/teams/{teamId}/roster

// NBA
/basketball/nba/scoreboard
/basketball/nba/teams/{teamId}/statistics
/basketball/nba/standings

// MLB
/baseball/mlb/scoreboard
/baseball/mlb/teams/{teamId}/schedule

// NHL
/hockey/nhl/scoreboard
/hockey/nhl/standings

// College Football
/football/college-football/scoreboard?groups=80  // Top 25
/football/college-football/rankings

// College Basketball
/basketball/mens-college-basketball/scoreboard
/basketball/mens-college-basketball/rankings
```

---

### 3. **College Football Data API** ⭐ BEST COLLEGE SPORTS
**URL**: `https://api.collegefootballdata.com`
**Cost**: FREE
**Rate Limit**: 120 requests/minute

#### Features:
- ✅ Games, drives, plays
- ✅ Team & player stats
- ✅ Recruiting data
- ✅ Betting lines
- ✅ SP+ and FPI ratings
- ✅ NFL draft data

#### Sample Endpoints:
```javascript
/games?year=2025&week=1&seasonType=regular
/stats/season?year=2025&team=Alabama
/rankings?year=2025&week=1
/recruiting/players?year=2025&classification=HighSchool
/metrics/ppa/games?year=2025&team=Georgia
```

---

### 4. **TheSportsDB** (Free Tier)
**URL**: `https://www.thesportsdb.com/api/v1/json/1`
**Cost**: FREE with "1" as API key for testing
**Registration**: Optional for production

#### Endpoints:
```javascript
/eventspastleague.php?id=4391  // NFL past events
/eventsnextleague.php?id=4391  // NFL upcoming
/lookupteam.php?id=134862      // Team details
/lookupplayer.php?id=34145937  // Player details
/searchplayers.php?p=Tom%20Brady
```

#### League IDs:
- NFL: 4391
- NBA: 4387
- MLB: 4424
- NHL: 4380

---

## 🤖 MCP (Model Context Protocol) Sports Servers

### **What is MCP?**
Model Context Protocol enables AI models to directly interact with data sources through standardized server implementations.

### Available MCP Sports Servers:

#### 1. **MLB MCP Server**
```bash
# Installation
npm install mlb-api-mcp

# Or clone directly
git clone https://github.com/guillochon/mlb-api-mcp
```

**Features**:
- Current MLB standings
- Game schedules and results
- Player stats (WAR, wOBA, wRC+)
- Live boxscores and play-by-play
- Team rosters

#### 2. **NHL MCP Server**
```bash
# Installation
npm install nhl-mcp

# Or clone directly
git clone https://github.com/dylangroos/nhl-mcp
```

**Features**:
- Live NHL games
- Team standings
- Player statistics
- Schedule information
- Generate reports

#### 3. **NBA MCP Server**
```javascript
// Integration with basketball-reference.com
// 23 specialized tools for:
- Career statistics
- Season comparisons
- Advanced metrics
- Game logs
- Awards voting
- All-time rankings
```

### MCP Integration Example:
```typescript
import { MLBMCPServer } from 'mlb-api-mcp';
import { NHLMCPServer } from 'nhl-mcp';

// Initialize MCP servers
const mlbServer = new MLBMCPServer();
const nhlServer = new NHLMCPServer();

// Use with Claude or other LLMs
const mlbStandings = await mlbServer.getStandings({
  league: 'AL',
  season: 2025
});

const nhlGames = await nhlServer.getLiveGames();
```

---

## 💰 Betting & DFS APIs (Limited Free Tiers)

### 1. **The Odds API**
**Free Tier**: 500 requests/month
**URL**: `https://api.the-odds-api.com/v4`

```javascript
// Get odds for NFL games
fetch(`https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${KEY}&regions=us&markets=h2h,spreads,totals`)
```

**Available Sports Keys**:
- `americanfootball_nfl`
- `basketball_nba`
- `baseball_mlb`
- `icehockey_nhl`
- `americanfootball_ncaaf`
- `basketball_ncaab`

### 2. **MySportsFeeds**
**Free Tier**: 250 API calls/month (non-commercial)
**Features**: DFS data, injuries, odds, play-by-play

```javascript
// Basic Auth required
const auth = Buffer.from(`${username}:${password}`).toString('base64');
fetch('https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-regular/games.json', {
  headers: { 'Authorization': `Basic ${auth}` }
});
```

---

## 🎯 Fantasy & DFS Data Sources

### Free Options:
1. **ESPN Fantasy API** (Unofficial)
```javascript
// Get fantasy football data
fetch('https://fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/{leagueId}')
```

2. **Yahoo Fantasy** (OAuth Required)
```javascript
// Requires OAuth2 authentication
// Free for personal use
// Access via: https://developer.yahoo.com/fantasysports/
```

3. **Sleeper API** (Free, No Auth)
```javascript
// Get NFL players
fetch('https://api.sleeper.app/v1/players/nfl')

// Get user rosters
fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
```

---

## 🔥 Implementation Strategy

### Phase 1: Immediate Integration (100% Free)
```javascript
const freeSportsStack = {
  nba: 'BallDontLie API',
  allSports: 'ESPN Hidden API',
  ncaaf: 'College Football Data API',
  mcp: ['MLB MCP Server', 'NHL MCP Server']
};
```

### Phase 2: Enhanced Features (Free Tiers)
```javascript
const enhancedStack = {
  odds: 'The Odds API (500 req/month)',
  dfs: 'MySportsFeeds (250 req/month)',
  theSportsDB: 'Free tier with registration'
};
```

### Phase 3: Revenue Generation
```javascript
const monetization = {
  basic: '$9.99/month - Scores & Stats',
  pro: '$19.99/month - + Betting Odds & DFS',
  premium: '$39.99/month - + Real-time & Predictions',
  enterprise: 'Custom - White label API access'
};
```

---

## 📈 Rate Limits & Best Practices

### Rate Limit Summary:
| API | Limit | Reset |
|-----|-------|-------|
| BallDontLie | 60/min | Per minute |
| ESPN (Unofficial) | Unknown | Use sparingly |
| College Football Data | 120/min | Per minute |
| The Odds API | 500/month | Monthly |
| MySportsFeeds | 250/month | Monthly |
| TheSportsDB | Reasonable | No hard limit |

### Caching Strategy:
```javascript
class SportsCacheManager {
  constructor() {
    this.cache = new Map();
    this.TTL = {
      live: 30000,      // 30 seconds for live games
      scores: 60000,    // 1 minute for scores
      standings: 3600000, // 1 hour for standings
      stats: 86400000   // 24 hours for historical stats
    };
  }
  
  get(key, type = 'scores') {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const age = Date.now() - item.timestamp;
    if (age > this.TTL[type]) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
}
```

---

## 🚨 Legal & Compliance

### Terms of Service:
- **ESPN API**: Unofficial - use at your own risk
- **BallDontLie**: Free for any use including commercial
- **College Football Data**: Free for non-commercial
- **The Odds API**: Requires attribution
- **MySportsFeeds**: Free for non-commercial only

### Best Practices:
1. **Respect rate limits** - Implement exponential backoff
2. **Cache aggressively** - Reduce API calls
3. **Attribute sources** - Give credit where required
4. **Monitor usage** - Track API calls
5. **Have fallbacks** - Multiple data sources

---

## 💡 Advanced Integration Patterns

### Multi-Source Aggregation:
```javascript
class SportsDataAggregator {
  async getGame(gameId, sport) {
    // Try multiple sources in order of preference
    const sources = [
      () => this.getESPN(gameId, sport),
      () => this.getBallDontLie(gameId),
      () => this.getTheSportsDB(gameId)
    ];
    
    for (const source of sources) {
      try {
        return await source();
      } catch (error) {
        continue; // Try next source
      }
    }
    
    throw new Error('All sources failed');
  }
}
```

### Real-time Updates:
```javascript
class LiveSportsTracker {
  constructor() {
    this.activeGames = new Map();
    this.updateInterval = 30000; // 30 seconds
  }
  
  trackGame(gameId) {
    const interval = setInterval(async () => {
      const gameData = await this.fetchGameData(gameId);
      
      if (gameData.status === 'Final') {
        clearInterval(interval);
        this.activeGames.delete(gameId);
      }
      
      this.emit('gameUpdate', gameData);
    }, this.updateInterval);
    
    this.activeGames.set(gameId, interval);
  }
}
```

---

## 🎮 Complete Implementation Example

```javascript
import FreeSportsAPIService from './freeSportsAPIs';

// Initialize with available keys (all optional)
const sportsAPI = new FreeSportsAPIService({
  theOddsApiKey: process.env.ODDS_API_KEY // Optional
});

// Get everything for free
async function getTodaysSports() {
  // All free, no auth required
  const [nbaGames, nflScores, cfbGames] = await Promise.all([
    sportsAPI.getNBAGames(),           // BallDontLie
    sportsAPI.getESPNScoreboard('nfl'), // ESPN
    sportsAPI.getCollegeFootballGames(2025, 1) // CFB Data
  ]);
  
  // Initialize MCP servers if available
  const mcpServers = await sportsAPI.initializeMCPServers();
  
  // Get MLB data via MCP
  if (mcpServers.mlb) {
    const mlbStandings = await mcpServers.mlb.getStandings();
  }
  
  return {
    nba: nbaGames,
    nfl: nflScores,
    cfb: cfbGames,
    mlb: mlbStandings
  };
}
```

---

## 📞 Support & Resources

### Documentation:
- BallDontLie: https://www.balldontlie.io
- College Football Data: https://api.collegefootballdata.com/api/docs
- TheSportsDB: https://www.thesportsdb.com/api.php
- MCP Protocol: https://modelcontextprotocol.io

### Community:
- Reddit: r/sportsdata
- GitHub: Search "sports api"
- Discord: Various sports dev communities

### Get API Keys:
- The Odds API: https://the-odds-api.com
- MySportsFeeds: https://www.mysportsfeeds.com
- API-Sports: https://api-sports.io

---

**Last Updated**: August 2025
**Cost**: $0 to get started
**Coverage**: NFL, NBA, MLB, NHL, NCAAF, NCAAB

🔥 **Start building your sports intelligence platform today - completely free!** 🔥