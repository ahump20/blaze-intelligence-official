/**
 * Unit Tests for Sports Data Adapters
 * Tests MLB, NFL, and CFB data adapters with mocked API responses
 */

import { jest } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn();

describe('MLB Adapter', () => {
  let mlbAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamic import to avoid issues with ES modules
    const { mlbAdapter: adapter } = await import('../../src/data/mlb/adapter.js');
    mlbAdapter = adapter;
    mlbAdapter.clearCache();
  });

  describe('getTeamSummary', () => {
    it('should fetch team data successfully', async () => {
      const mockTeamData = {
        teams: [{
          id: 138,
          name: 'St. Louis Cardinals',
          abbreviation: 'STL',
          record: {
            leagueRecord: {
              wins: 85,
              losses: 77,
              pct: '0.525'
            }
          },
          divisionRank: 2,
          leagueRank: 8,
          gamesBack: '3.5'
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeamData
      });

      const result = await mlbAdapter.getTeamSummary(138);

      expect(fetch).toHaveBeenCalledWith(
        'https://statsapi.mlb.com/api/v1/teams/138?hydrate=record'
      );
      expect(result).toMatchObject({
        id: 138,
        name: 'St. Louis Cardinals',
        abbreviation: 'STL',
        wins: 85,
        losses: 77,
        winPercentage: 0.525,
        source: 'MLB Stats API',
        confidence: 'high'
      });
    });

    it('should return demo data when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await mlbAdapter.getTeamSummary(138);

      expect(result.source).toBe('Demo Data');
      expect(result.confidence).toBe('low');
      expect(result.name).toBe('Demo Team');
    });

    it('should use cached data on subsequent calls', async () => {
      const mockData = {
        teams: [{
          id: 138,
          name: 'St. Louis Cardinals',
          abbreviation: 'STL',
          record: { leagueRecord: { wins: 85, losses: 77, pct: '0.525' } }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      // First call
      await mlbAdapter.getTeamSummary(138);
      
      // Second call should use cache
      await mlbAdapter.getTeamSummary(138);

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLiveGames', () => {
    it('should fetch live games successfully', async () => {
      const mockGamesData = {
        dates: [{
          games: [{
            gamePk: 12345,
            teams: {
              home: { team: { name: 'Cardinals' }, score: 7 },
              away: { team: { name: 'Cubs' }, score: 4 }
            },
            linescore: {
              currentInning: 9,
              inningHalf: 'bottom'
            },
            status: { statusCode: 'I' },
            gameDate: '2025-09-09T19:15:00Z'
          }]
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGamesData
      });

      const result = await mlbAdapter.getLiveGames();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        gameId: '12345',
        homeTeam: 'Cardinals',
        awayTeam: 'Cubs',
        homeScore: 7,
        awayScore: 4,
        status: 'live'
      });
    });

    it('should return demo games when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await mlbAdapter.getLiveGames();

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('Demo Data');
      expect(result[0].homeTeam).toBe('Cardinals');
    });
  });
});

describe('NFL Adapter', () => {
  let nflAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    const { nflAdapter: adapter } = await import('../../src/data/nfl/adapter.js');
    nflAdapter = adapter;
    nflAdapter.clearCache();
  });

  describe('getTeamSummary', () => {
    it('should fetch Titans data successfully', async () => {
      const mockTeamData = {
        team: {
          id: 'TEN',
          displayName: 'Tennessee Titans',
          abbreviation: 'TEN',
          record: {
            items: [{
              wins: '7',
              losses: '3',
              ties: '0',
              winPercent: '0.700'
            }]
          },
          standingSummary: {
            divisionRank: 1,
            conferenceRank: 3
          },
          playoffOdds: 78.5
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeamData
      });

      const result = await nflAdapter.getTeamSummary('TEN');

      expect(result).toMatchObject({
        name: 'Tennessee Titans',
        abbreviation: 'TEN',
        wins: 7,
        losses: 3,
        ties: 0,
        winPercentage: 0.700,
        divisionRank: 1,
        conferenceRank: 3,
        playoffOdds: 78.5,
        source: 'ESPN API',
        confidence: 'high'
      });
    });

    it('should return demo data for Titans when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await nflAdapter.getTeamSummary('TEN');

      expect(result.source).toBe('Demo Data');
      expect(result.name).toBe('Tennessee Titans');
      expect(result.wins).toBe(7);
      expect(result.losses).toBe(3);
      expect(result.playoffOdds).toBe(78.5);
    });
  });
});

describe('CFB Adapter', () => {
  let cfbAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    const { cfbAdapter: adapter } = await import('../../src/data/cfb/adapter.js');
    cfbAdapter = adapter;
    cfbAdapter.clearCache();
  });

  describe('getTeamSummary', () => {
    it('should fetch Texas Longhorns data successfully', async () => {
      const mockRecordData = [{
        team: 'Texas',
        conference: 'Big 12',
        total: { wins: 9, losses: 1 },
        conferenceGames: { wins: 6, losses: 1 }
      }];

      const mockRankingsData = [{
        polls: [{
          poll: 'AP Top 25',
          ranks: [{ school: 'Texas', rank: 7 }]
        }]
      }];

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRecordData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRankingsData
        });

      const result = await cfbAdapter.getTeamSummary('Texas');

      expect(result).toMatchObject({
        name: 'Texas',
        conference: 'Big 12',
        wins: 9,
        losses: 1,
        conferenceWins: 6,
        conferenceLosses: 1,
        apRanking: 7,
        source: 'CollegeFootballData',
        confidence: 'high'
      });
    });

    it('should return demo data for Texas when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await cfbAdapter.getTeamSummary('Texas');

      expect(result.source).toBe('Demo Data');
      expect(result.name).toBe('Texas Longhorns');
      expect(result.wins).toBe(9);
      expect(result.losses).toBe(1);
      expect(result.apRanking).toBe(7);
    });

    it('should handle team abbreviation mapping', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await cfbAdapter.getTeamSummary('Texas');

      expect(result.abbreviation).toBe('TEX');
    });
  });
});

describe('Cache functionality', () => {
  let mlbAdapter;

  beforeEach(async () => {
    jest.clearAllMocks();
    const { mlbAdapter: adapter } = await import('../../src/data/mlb/adapter.js');
    mlbAdapter = adapter;
    mlbAdapter.clearCache();
  });

  it('should provide cache statistics', () => {
    const stats = mlbAdapter.getCacheStats();
    
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('keys');
    expect(Array.isArray(stats.keys)).toBe(true);
  });

  it('should clear cache successfully', () => {
    mlbAdapter.clearCache();
    const stats = mlbAdapter.getCacheStats();
    
    expect(stats.size).toBe(0);
    expect(stats.keys).toHaveLength(0);
  });
});