/**
 * MLB Data Adapter
 * Connects to official MLB Stats API and licensed providers
 */

export interface MLBTeamSummary {
  id: number;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  winPercentage: number;
  divisionRank: number;
  leagueRank: number;
  gamesBack: number;
  lastUpdated: string;
  source: 'MLB Stats API' | 'Licensed Provider';
  confidence: 'high' | 'medium' | 'low';
}

export interface MLBPlayerSummary {
  id: number;
  name: string;
  team: string;
  position: string;
  battingAverage?: number;
  homeRuns?: number;
  rbi?: number;
  era?: number;
  wins?: number;
  strikeouts?: number;
  lastUpdated: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MLBLiveGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  inning: number;
  inningHalf: 'top' | 'bottom';
  status: 'pre' | 'live' | 'final' | 'postponed';
  startTime: string;
  lastUpdated: string;
  source: string;
}

class MLBAdapter {
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheTTL;
  }

  private async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // Serve stale data if available during errors
      if (cached) {
        console.warn(`MLB API error, serving stale data for ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  async getTeamSummary(teamId: number): Promise<MLBTeamSummary> {
    return this.fetchWithCache(`team-${teamId}`, async () => {
      try {
        // Try official MLB Stats API first
        const response = await fetch(`${this.baseUrl}/teams/${teamId}?hydrate=record`);
        if (!response.ok) throw new Error(`MLB API error: ${response.status}`);
        
        const data = await response.json();
        const team = data.teams[0];
        const record = team.record?.leagueRecord || {};

        return {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          wins: record.wins || 0,
          losses: record.losses || 0,
          winPercentage: parseFloat(record.pct || '0.000'),
          divisionRank: team.divisionRank || 0,
          leagueRank: team.leagueRank || 0,
          gamesBack: parseFloat(team.gamesBack || '0.0'),
          lastUpdated: new Date().toISOString(),
          source: 'MLB Stats API',
          confidence: 'high'
        };
      } catch (error) {
        console.error('MLB API error, falling back to demo data:', error);
        
        // Return demo data with clear labeling
        return {
          id: teamId,
          name: 'Demo Team',
          abbreviation: 'DEMO',
          wins: 85,
          losses: 77,
          winPercentage: 0.525,
          divisionRank: 2,
          leagueRank: 8,
          gamesBack: 3.5,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getPlayerSummary(playerId: number): Promise<MLBPlayerSummary> {
    return this.fetchWithCache(`player-${playerId}`, async () => {
      try {
        const response = await fetch(`${this.baseUrl}/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[season])`);
        if (!response.ok) throw new Error(`MLB API error: ${response.status}`);
        
        const data = await response.json();
        const player = data.people[0];
        const stats = player.stats?.[0]?.splits?.[0]?.stat || {};

        return {
          id: player.id,
          name: player.fullName,
          team: player.currentTeam?.name || 'Unknown',
          position: player.primaryPosition?.name || 'Unknown',
          battingAverage: stats.avg ? parseFloat(stats.avg) : undefined,
          homeRuns: stats.homeRuns || undefined,
          rbi: stats.rbi || undefined,
          era: stats.era ? parseFloat(stats.era) : undefined,
          wins: stats.wins || undefined,
          strikeouts: stats.strikeOuts || undefined,
          lastUpdated: new Date().toISOString(),
          source: 'MLB Stats API',
          confidence: 'high'
        };
      } catch (error) {
        console.error('MLB Player API error, falling back to demo data:', error);
        
        return {
          id: playerId,
          name: 'Demo Player',
          team: 'Demo Team',
          position: 'OF',
          battingAverage: 0.275,
          homeRuns: 25,
          rbi: 85,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getLiveGames(): Promise<MLBLiveGame[]> {
    return this.fetchWithCache('live-games', async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${this.baseUrl}/schedule/games/?sportId=1&date=${today}&hydrate=linescore`);
        if (!response.ok) throw new Error(`MLB API error: ${response.status}`);
        
        const data = await response.json();
        
        return data.dates?.[0]?.games?.map((game: any) => ({
          gameId: game.gamePk.toString(),
          homeTeam: game.teams.home.team.name,
          awayTeam: game.teams.away.team.name,
          homeScore: game.teams.home.score || 0,
          awayScore: game.teams.away.score || 0,
          inning: game.linescore?.currentInning || 1,
          inningHalf: game.linescore?.inningHalf || 'top',
          status: this.mapGameStatus(game.status.statusCode),
          startTime: game.gameDate,
          lastUpdated: new Date().toISOString(),
          source: 'MLB Stats API'
        })) || [];
      } catch (error) {
        console.error('MLB Live Games API error, falling back to demo data:', error);
        
        // Return demo games with clear labeling
        return [
          {
            gameId: 'demo-1',
            homeTeam: 'Cardinals',
            awayTeam: 'Cubs',
            homeScore: 7,
            awayScore: 4,
            inning: 9,
            inningHalf: 'bottom',
            status: 'live',
            startTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            source: 'Demo Data'
          }
        ];
      }
    });
  }

  private mapGameStatus(statusCode: string): MLBLiveGame['status'] {
    switch (statusCode) {
      case 'S': case 'P': return 'pre';
      case 'I': case 'IR': case 'IW': return 'live';
      case 'F': case 'FG': case 'FR': return 'final';
      case 'PP': case 'PW': return 'postponed';
      default: return 'pre';
    }
  }

  // Method to clear cache for testing/development
  clearCache(): void {
    this.cache.clear();
  }

  // Method to get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const mlbAdapter = new MLBAdapter();