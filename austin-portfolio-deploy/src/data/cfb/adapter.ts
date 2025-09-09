/**
 * College Football Data Adapter
 * Connects to CollegeFootballData API and other college sports sources
 */

export interface CFBTeamSummary {
  id: number;
  name: string;
  abbreviation: string;
  school: string;
  conference: string;
  wins: number;
  losses: number;
  winPercentage: number;
  conferenceWins: number;
  conferenceLosses: number;
  apRanking?: number;
  coachesRanking?: number;
  playoffRanking?: number;
  lastUpdated: string;
  source: 'CollegeFootballData' | 'ESPN API' | 'Demo Data';
  confidence: 'high' | 'medium' | 'low';
}

export interface CFBPlayerSummary {
  id: string;
  name: string;
  team: string;
  position: string;
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTouchdowns?: number;
  receivingYards?: number;
  receivingTouchdowns?: number;
  tackles?: number;
  sacks?: number;
  lastUpdated: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CFBLiveGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  status: 'pre' | 'live' | 'halftime' | 'final' | 'postponed';
  startTime: string;
  venue?: string;
  lastUpdated: string;
  source: string;
}

class CFBAdapter {
  private readonly cfbApiUrl = 'https://api.collegefootballdata.com';
  private readonly espnCfbUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
  private readonly currentSeason = 2025; // 2025-2026 season

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
        console.warn(`CFB API error, serving stale data for ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  async getTeamSummary(teamName: string): Promise<CFBTeamSummary> {
    return this.fetchWithCache(`team-${teamName}`, async () => {
      try {
        // Try CollegeFootballData API first for comprehensive stats
        const recordResponse = await fetch(`${this.cfbApiUrl}/records?year=${this.currentSeason}&team=${encodeURIComponent(teamName)}`);
        const rankingsResponse = await fetch(`${this.cfbApiUrl}/rankings?year=${this.currentSeason}&week=15`);
        
        if (!recordResponse.ok) throw new Error(`CFB API error: ${recordResponse.status}`);
        
        const records = await recordResponse.json();
        const rankings = rankingsResponse.ok ? await rankingsResponse.json() : [];
        
        const teamRecord = records.find((r: any) => 
          r.team.toLowerCase() === teamName.toLowerCase() ||
          r.team.toLowerCase().includes(teamName.toLowerCase())
        );

        // Find team in rankings
        const teamRanking = rankings.find((poll: any) => 
          poll.polls.some((p: any) => 
            p.ranks.some((rank: any) => 
              rank.school.toLowerCase() === teamName.toLowerCase() ||
              rank.school.toLowerCase().includes(teamName.toLowerCase())
            )
          )
        );

        let apRank, coachesRank;
        if (teamRanking) {
          const apPoll = teamRanking.polls.find((p: any) => p.poll === 'AP Top 25');
          const coachesPoll = teamRanking.polls.find((p: any) => p.poll === 'Coaches Poll');
          
          apRank = apPoll?.ranks.find((r: any) => 
            r.school.toLowerCase().includes(teamName.toLowerCase())
          )?.rank;
          
          coachesRank = coachesPoll?.ranks.find((r: any) => 
            r.school.toLowerCase().includes(teamName.toLowerCase())
          )?.rank;
        }

        if (teamRecord) {
          return {
            id: Math.floor(Math.random() * 1000), // Generate ID since CFB API doesn't provide consistent IDs
            name: teamRecord.team,
            abbreviation: this.getTeamAbbreviation(teamRecord.team),
            school: teamRecord.team,
            conference: teamRecord.conference,
            wins: teamRecord.total.wins,
            losses: teamRecord.total.losses,
            winPercentage: teamRecord.total.wins / (teamRecord.total.wins + teamRecord.total.losses),
            conferenceWins: teamRecord.conferenceGames.wins,
            conferenceLosses: teamRecord.conferenceGames.losses,
            apRanking: apRank,
            coachesRanking: coachesRank,
            lastUpdated: new Date().toISOString(),
            source: 'CollegeFootballData',
            confidence: 'high'
          };
        }
        
        throw new Error('Team not found in CFB API');
      } catch (error) {
        console.error('CFB API error, falling back to demo data:', error);
        
        // Return demo data for Texas Longhorns with clear labeling
        const isTexas = teamName.toLowerCase().includes('texas') || teamName.toLowerCase().includes('longhorn');
        
        return {
          id: isTexas ? 251 : 999,
          name: isTexas ? 'Texas Longhorns' : 'Demo University',
          abbreviation: isTexas ? 'TEX' : 'DEMO',
          school: isTexas ? 'University of Texas' : 'Demo University',
          conference: isTexas ? 'Big 12' : 'Demo Conference',
          wins: isTexas ? 9 : 7,
          losses: isTexas ? 1 : 4,
          winPercentage: isTexas ? 0.900 : 0.636,
          conferenceWins: isTexas ? 6 : 4,
          conferenceLosses: isTexas ? 1 : 3,
          apRanking: isTexas ? 7 : undefined,
          coachesRanking: isTexas ? 8 : undefined,
          playoffRanking: isTexas ? 6 : undefined,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getPlayerSummary(playerId: string): Promise<CFBPlayerSummary> {
    return this.fetchWithCache(`player-${playerId}`, async () => {
      try {
        // CFB player stats are more complex and would require team context
        // For now, return demo data with clear labeling
        throw new Error('CFB Player API not implemented yet');
      } catch (error) {
        console.error('CFB Player API error, falling back to demo data:', error);
        
        return {
          id: playerId,
          name: 'Demo College Player',
          team: 'Texas',
          position: 'QB',
          passingYards: 3247,
          passingTouchdowns: 28,
          interceptions: 8,
          rushingYards: 654,
          rushingTouchdowns: 12,
          lastUpdated: new Date().toISOString(),
          source: 'Demo Data',
          confidence: 'low'
        };
      }
    });
  }

  async getLiveGames(): Promise<CFBLiveGame[]> {
    return this.fetchWithCache('live-games', async () => {
      try {
        // Get today's games from ESPN CFB API
        const response = await fetch(`${this.espnCfbUrl}/scoreboard`);
        if (!response.ok) throw new Error(`ESPN CFB API error: ${response.status}`);
        
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
          venue: game.competitions[0].venue?.fullName,
          lastUpdated: new Date().toISOString(),
          source: 'ESPN API'
        })) || [];
      } catch (error) {
        console.error('CFB Live Games API error, falling back to demo data:', error);
        
        // Return demo games with Texas focus
        return [
          {
            gameId: 'demo-cfb-1',
            homeTeam: 'Texas Longhorns',
            awayTeam: 'Oklahoma Sooners',
            homeScore: 35,
            awayScore: 21,
            quarter: 3,
            timeRemaining: '12:15',
            status: 'live',
            startTime: new Date().toISOString(),
            venue: 'Darrell K Royal Stadium',
            lastUpdated: new Date().toISOString(),
            source: 'Demo Data'
          }
        ];
      }
    });
  }

  private mapGameStatus(statusName: string): CFBLiveGame['status'] {
    switch (statusName?.toLowerCase()) {
      case 'pre-game': case 'scheduled': return 'pre';
      case 'in progress': case 'live': return 'live';
      case 'halftime': return 'halftime';
      case 'final': case 'game over': return 'final';
      case 'postponed': case 'delayed': return 'postponed';
      default: return 'pre';
    }
  }

  private getTeamAbbreviation(teamName: string): string {
    const abbreviations: { [key: string]: string } = {
      'Texas': 'TEX',
      'Texas Longhorns': 'TEX',
      'Oklahoma': 'OU',
      'Alabama': 'ALA',
      'Georgia': 'UGA',
      'Michigan': 'MICH',
      'Ohio State': 'OSU',
      'LSU': 'LSU',
      'Florida': 'FLA',
      'Auburn': 'AUB',
      'Tennessee': 'TENN',
      'Notre Dame': 'ND',
      'USC': 'USC',
      'Penn State': 'PSU',
      'Wisconsin': 'WIS',
      'Iowa': 'IOWA',
      'Oregon': 'ORE',
      'Washington': 'UW',
      'Miami': 'MIA',
      'Clemson': 'CLEM',
      'Florida State': 'FSU',
      'Virginia Tech': 'VT'
    };

    return abbreviations[teamName] || teamName.substring(0, 4).toUpperCase();
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

export const cfbAdapter = new CFBAdapter();