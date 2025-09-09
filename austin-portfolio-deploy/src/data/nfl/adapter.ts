/**
 * NFL Data Adapter
 * Connects to licensed NFL data providers and public APIs
 */

export interface NFLTeamSummary {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  divisionRank: number;
  conferenceRank: number;
  playoffOdds: number;
  lastUpdated: string;
  source: 'ESPN API' | 'Licensed Provider' | 'Demo Data';
  confidence: 'high' | 'medium' | 'low';
}

export interface NFLPlayerSummary {
  id: string;
  name: string;
  team: string;
  position: string;
  passingYards?: number;
  touchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  receivingYards?: number;
  tackles?: number;
  sacks?: number;
  lastUpdated: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NFLLiveGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  status: 'pre' | 'live' | 'halftime' | 'final' | 'postponed';
  startTime: string;
  lastUpdated: string;
  source: string;
}

class NFLAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
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
        console.warn(`NFL API error, serving stale data for ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  async getTeamSummary(teamAbbr: string): Promise<NFLTeamSummary> {
    return this.fetchWithCache(`team-${teamAbbr}`, async () => {
      try {
        // Try ESPN API for NFL data
        const response = await fetch(`${this.espnBaseUrl}/teams/${teamAbbr}/record`);
        if (!response.ok) throw new Error(`NFL ESPN API error: ${response.status}`);
        
        const data = await response.json();
        const team = data.team;
        const record = team.record?.items?.[0] || {};

        return {
          id: team.id,
          name: team.displayName,
          abbreviation: team.abbreviation,
          wins: parseInt(record.wins) || 0,
          losses: parseInt(record.losses) || 0,
          ties: parseInt(record.ties) || 0,
          winPercentage: parseFloat(record.winPercent) || 0,
          divisionRank: team.standingSummary?.divisionRank || 0,
          conferenceRank: team.standingSummary?.conferenceRank || 0,
          playoffOdds: team.playoffOdds || 0,
          lastUpdated: new Date().toISOString(),
          source: 'ESPN API',
          confidence: 'high'
        };
      } catch (error) {
        console.error('NFL API error, falling back to demo data:', error);
        
        // Return demo data for Tennessee Titans with clear labeling
        return {
          id: teamAbbr,
          name: teamAbbr === 'TEN' ? 'Tennessee Titans' : 'Demo Team',
          abbreviation: teamAbbr,
          wins: teamAbbr === 'TEN' ? 7 : 8,
          losses: teamAbbr === 'TEN' ? 3 : 5,
          ties: 0,
          winPercentage: teamAbbr === 'TEN' ? 0.700 : 0.615,
          divisionRank: teamAbbr === 'TEN' ? 1 : 2,
          conferenceRank: teamAbbr === 'TEN' ? 3 : 8,
          playoffOdds: teamAbbr === 'TEN' ? 78.5 : 45.2,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getPlayerSummary(playerId: string): Promise<NFLPlayerSummary> {
    return this.fetchWithCache(`player-${playerId}`, async () => {
      try {
        const response = await fetch(`${this.espnBaseUrl}/athletes/${playerId}/stats`);
        if (!response.ok) throw new Error(`NFL ESPN API error: ${response.status}`);
        
        const data = await response.json();
        const athlete = data.athlete;
        const stats = data.statistics?.[0]?.stats || {};

        return {
          id: athlete.id,
          name: athlete.displayName,
          team: athlete.team?.abbreviation || 'Unknown',
          position: athlete.position?.abbreviation || 'Unknown',
          passingYards: stats.passingYards || undefined,
          touchdowns: stats.touchdowns || undefined,
          interceptions: stats.interceptions || undefined,
          rushingYards: stats.rushingYards || undefined,
          receivingYards: stats.receivingYards || undefined,
          tackles: stats.tackles || undefined,
          sacks: stats.sacks || undefined,
          lastUpdated: new Date().toISOString(),
          source: 'ESPN API',
          confidence: 'high'
        };
      } catch (error) {
        console.error('NFL Player API error, falling back to demo data:', error);
        
        return {
          id: playerId,
          name: 'Demo Player',
          team: 'TEN',
          position: 'RB',
          rushingYards: 1247,
          touchdowns: 12,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getLiveGames(): Promise<NFLLiveGame[]> {
    return this.fetchWithCache('live-games', async () => {
      try {
        const response = await fetch(`${this.espnBaseUrl}/scoreboard`);
        if (!response.ok) throw new Error(`NFL ESPN API error: ${response.status}`);
        
        const data = await response.json();
        
        return data.events?.map((game: any) => ({
          gameId: game.id,
          homeTeam: game.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.team.displayName,
          awayTeam: game.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.team.displayName,
          homeScore: parseInt(game.competitions[0].competitors.find((c: any) => c.homeAway === 'home')?.score) || 0,
          awayScore: parseInt(game.competitions[0].competitors.find((c: any) => c.homeAway === 'away')?.score) || 0,
          quarter: game.status?.period || 1,
          timeRemaining: game.status?.displayClock || '15:00',
          status: this.mapGameStatus(game.status?.type?.name),
          startTime: game.date,
          lastUpdated: new Date().toISOString(),
          source: 'ESPN API'
        })) || [];
      } catch (error) {
        console.error('NFL Live Games API error, falling back to demo data:', error);
        
        // Return demo games with Titans focus
        return [
          {
            gameId: 'demo-nfl-1',
            homeTeam: 'Tennessee Titans',
            awayTeam: 'Indianapolis Colts',
            homeScore: 24,
            awayScore: 17,
            quarter: 4,
            timeRemaining: '8:42',
            status: 'live',
            startTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            source: 'Demo Data'
          }
        ];
      }
    });
  }

  private mapGameStatus(statusName: string): NFLLiveGame['status'] {
    switch (statusName?.toLowerCase()) {
      case 'pre-game': case 'scheduled': return 'pre';
      case 'in progress': case 'live': return 'live';
      case 'halftime': return 'halftime';
      case 'final': case 'game over': return 'final';
      case 'postponed': case 'delayed': return 'postponed';
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

export const nflAdapter = new NFLAdapter();