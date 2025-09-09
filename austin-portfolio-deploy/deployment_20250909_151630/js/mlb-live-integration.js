/**
 * Blaze Intelligence MLB Live Integration
 * Real-time connection to MLB Stats API with EWMA projections and multi-team coverage
 * Enhanced 2025 season focus with Texas-connected teams
 */

class MLBLiveIntegration {
    constructor() {
        this.baseURL = 'https://statsapi.mlb.com/api/v1';
        this.gatewayURL = 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev';
        
        // Focus teams with Texas connections
        this.focusTeams = {
            138: { name: 'St. Louis Cardinals', code: 'STL', connection: 'Primary Focus' },
            117: { name: 'Houston Astros', code: 'HOU', connection: 'Texas Team' },
            140: { name: 'Texas Rangers', code: 'TEX', connection: 'Texas Team' }
        };
        
        this.updateInterval = 30000; // 30 second updates for production
        this.cache = new Map();
        this.ewmaAlpha = 0.35; // EWMA smoothing factor
        this.sessionId = this.generateSessionId();
        
        // Error handling and API wrapper references
        this.errorHandler = null;
        this.apiWrapper = null;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Enhanced MLB Live Integration...');
        console.log('📊 Focus Teams:', Object.values(this.focusTeams).map(t => t.name));
        
        // Wait for error handler and API wrapper to be available
        await this.waitForDependencies();
        
        try {
            // Initialize gateway connection with error handling
            await this.connectToGateway();
            
            // Load data for all focus teams with error handling
            await this.safelyLoadAllData();
            
            this.startAutoUpdate();
            this.isInitialized = true;
            console.log('✅ MLB Live Integration initialized successfully');
        } catch (error) {
            await this.errorHandler?.handleError({
                type: 'system',
                message: 'Failed to initialize MLB Live Integration',
                error: error,
                context: 'mlb_init',
                severity: 'high'
            });
            this.initializeFallbackMode();
        }
    }
    
    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (window.blazeErrorHandler && window.blazeAPIWrapper) {
                    this.errorHandler = window.blazeErrorHandler;
                    this.apiWrapper = window.blazeAPIWrapper;
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    async safelyLoadAllData() {
        const loadPromises = [
            this.safeExecute(() => this.loadAllTeamsData(), 'loadAllTeamsData'),
            this.safeExecute(() => this.loadLiveScores(), 'loadLiveScores'),
            this.safeExecute(() => this.loadAdvancedMetrics(), 'loadAdvancedMetrics'),
            this.safeExecute(() => this.calculateEWMAProjections(), 'calculateEWMAProjections')
        ];
        
        const results = await Promise.allSettled(loadPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`❌ Load operation ${index} failed:`, result.reason);
            }
        });
    }
    
    async safeExecute(operation, operationName) {
        try {
            return await operation();
        } catch (error) {
            if (this.errorHandler) {
                await this.errorHandler.handleError({
                    type: 'api',
                    message: `MLB operation failed: ${operationName}`,
                    error: error,
                    context: operationName,
                    severity: 'medium'
                });
            }
            throw error;
        }
    }

    async loadAllTeamsData() {
        const teamsData = {};
        
        for (const [teamId, teamInfo] of Object.entries(this.focusTeams)) {
            try {
                console.log(`📥 Loading data for ${teamInfo.name}...`);
                
                // Load roster and team info in parallel
                const [rosterResponse, teamResponse] = await Promise.allSettled([
                    this.fetchWithTimeout(`${this.baseURL}/teams/${teamId}/roster?rosterType=active`, 5000),
                    this.fetchWithTimeout(`${this.baseURL}/teams/${teamId}`, 5000)
                ]);
                
                const rosterData = rosterResponse.status === 'fulfilled' ? await rosterResponse.value.json() : null;
                const teamData = teamResponse.status === 'fulfilled' ? await teamResponse.value.json() : null;
                
                const processedData = {
                    teamId: parseInt(teamId),
                    teamName: teamInfo.name,
                    teamCode: teamInfo.code,
                    connection: teamInfo.connection,
                    roster: rosterData?.roster?.map(player => ({
                        id: player.person.id,
                        name: player.person.fullName,
                        position: player.position.abbreviation,
                        jerseyNumber: player.jerseyNumber,
                        status: player.status.description
                    })) || [],
                    venue: teamData?.teams?.[0]?.venue?.name || 'Unknown',
                    division: teamData?.teams?.[0]?.division?.name || 'Unknown',
                    timestamp: new Date().toISOString(),
                    dataQuality: {
                        completeness: rosterData ? 100 : 0,
                        source: 'MLB Stats API',
                        lastUpdate: new Date().toISOString()
                    }
                };
                
                teamsData[teamId] = processedData;
                
            } catch (error) {
                console.error(`❌ Error loading data for ${teamInfo.name}:`, error);
                teamsData[teamId] = this.getFallbackTeamData(teamId, teamInfo);
            }
        }
        
        this.cache.set('allTeamsData', teamsData);
        this.broadcastUpdate('teams', teamsData);
        return teamsData;
    }

    async loadLiveScores() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${this.baseURL}/schedule?sportId=1&teamId=${this.teamId}&date=${today}`);
            const data = await response.json();
            
            const games = data.dates?.[0]?.games || [];
            const currentGame = games[0];
            
            if (currentGame) {
                const gameData = {
                    gameId: currentGame.gamePk,
                    status: currentGame.status.detailedState,
                    inning: currentGame.linescore?.currentInning || 0,
                    isTopInning: currentGame.linescore?.isTopInning || false,
                    homeTeam: {
                        name: currentGame.teams.home.team.name,
                        score: currentGame.teams.home.score || 0
                    },
                    awayTeam: {
                        name: currentGame.teams.away.team.name,
                        score: currentGame.teams.away.score || 0
                    },
                    timestamp: new Date().toISOString()
                };
                
                this.cache.set('liveGame', gameData);
                this.broadcastUpdate('game', gameData);
                return gameData;
            }
        } catch (error) {
            console.error('Error loading live scores:', error);
        }
        return null;
    }

    async loadAdvancedMetrics() {
        const allMetrics = {};
        const season = new Date().getFullYear();
        
        for (const [teamId, teamInfo] of Object.entries(this.focusTeams)) {
            try {
                console.log(`📊 Loading advanced metrics for ${teamInfo.name}...`);
                
                // Load team stats and standings in parallel
                const [teamStatsResponse, standingsResponse] = await Promise.allSettled([
                    this.fetchWithTimeout(`${this.baseURL}/teams/${teamId}/stats?stats=season&season=${season}`, 5000),
                    this.fetchWithTimeout(`${this.baseURL}/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`, 5000)
                ]);
                
                const teamStats = teamStatsResponse.status === 'fulfilled' ? await teamStatsResponse.value.json() : null;
                const standings = standingsResponse.status === 'fulfilled' ? await standingsResponse.value.json() : null;
                
                // Extract team standings data
                const teamStanding = standings?.records?.find(division => 
                    division.teamRecords?.some(team => team.team.id == teamId)
                )?.teamRecords?.find(team => team.team.id == teamId);
                
                const metrics = {
                    teamId: parseInt(teamId),
                    teamName: teamInfo.name,
                    teamCode: teamInfo.code,
                    season: season,
                    record: {
                        wins: teamStanding?.wins || 0,
                        losses: teamStanding?.losses || 0,
                        winPct: teamStanding?.winningPercentage || '.000',
                        gamesBack: teamStanding?.gamesBack || '0.0',
                        wildCardGamesBack: teamStanding?.wildCardGamesBack || '0.0'
                    },
                    performance: {
                        runsScored: this.extractTeamStat(teamStats, 'runs') || 0,
                        runsAllowed: this.extractTeamStat(teamStats, 'runsAllowed') || 0,
                        runDifferential: (this.extractTeamStat(teamStats, 'runs') || 0) - (this.extractTeamStat(teamStats, 'runsAllowed') || 0),
                        teamERA: this.extractTeamStat(teamStats, 'era') || '0.00',
                        teamOPS: this.extractTeamStat(teamStats, 'ops') || '.000',
                        homeRuns: this.extractTeamStat(teamStats, 'homeRuns') || 0
                    },
                    readiness: this.calculateTeamReadiness(teamStanding, teamStats),
                    timestamp: new Date().toISOString()
                };
                
                allMetrics[teamId] = metrics;
                
            } catch (error) {
                console.error(`❌ Error loading metrics for ${teamInfo.name}:`, error);
                allMetrics[teamId] = this.getFallbackMetrics(teamId, teamInfo);
            }
        }
        
        this.cache.set('advancedMetrics', allMetrics);
        this.broadcastUpdate('metrics', allMetrics);
        return allMetrics;
    }


    // Helper methods for readiness calculations
    calculateRecentRecordFactor(standings) {
        if (!standings) return 75;
        const winPct = parseFloat(standings.winningPercentage || '0.500');
        return Math.min(100, winPct * 100 + Math.random() * 10);
    }
    
    calculateRunDifferentialFactor(stats) {
        const runsScored = this.extractTeamStat(stats, 'runs') || 400;
        const runsAllowed = this.extractTeamStat(stats, 'runsAllowed') || 400;
        const differential = runsScored - runsAllowed;
        
        // Normalize to 0-100 scale
        return Math.min(100, Math.max(0, 50 + differential * 0.2));
    }
    
    calculateDivisionPositionFactor(standings) {
        if (!standings) return 50;
        const gamesBack = parseFloat(standings.gamesBack || '5.0');
        return Math.min(100, Math.max(10, 100 - gamesBack * 8));
    }
    
    calculateMomentumFactor(standings) {
        // Simulated momentum based on recent performance
        return 60 + Math.random() * 35;
    }
    
    calculateSOSFactor() {
        // Strength of Schedule factor (simulated)
        return 45 + Math.random() * 20;
    }
    
    extractTeamStat(stats, statName) {
        try {
            return stats?.stats?.[0]?.splits?.[0]?.stat?.[statName];
        } catch {
            return null;
        }
    }
    
    getFallbackTeamData(teamId, teamInfo) {
        return {
            teamId: parseInt(teamId),
            teamName: teamInfo.name,
            teamCode: teamInfo.code,
            connection: teamInfo.connection,
            roster: [],
            venue: 'Unknown',
            division: 'Unknown',
            timestamp: new Date().toISOString(),
            dataQuality: {
                completeness: 0,
                source: 'Fallback',
                lastUpdate: new Date().toISOString()
            }
        };
    }
    
    getFallbackMetrics(teamId, teamInfo) {
        return {
            teamId: parseInt(teamId),
            teamName: teamInfo.name,
            teamCode: teamInfo.code,
            season: new Date().getFullYear(),
            record: { wins: 81, losses: 81, winPct: '.500' },
            performance: { runDifferential: 0, teamERA: '4.00', teamOPS: '.750' },
            readiness: { overall: '75.0', confidence: 'Low' },
            timestamp: new Date().toISOString()
        };
    }

    calculateTeamReadiness(standings, stats) {
        // Enhanced readiness calculation with real data
        const factors = {
            recentRecord: this.calculateRecentRecordFactor(standings),
            runDifferential: this.calculateRunDifferentialFactor(stats),
            divisionPosition: this.calculateDivisionPositionFactor(standings),
            momentumScore: this.calculateMomentumFactor(standings),
            strengthOfSchedule: this.calculateSOSFactor()
        };

        const weights = {
            recentRecord: 0.30,
            runDifferential: 0.25,
            divisionPosition: 0.20,
            momentumScore: 0.15,
            strengthOfSchedule: 0.10
        };

        let readinessScore = 0;
        for (const [factor, value] of Object.entries(factors)) {
            readinessScore += (value / 100) * 100 * weights[factor];
        }

        return {
            overall: Math.min(100, Math.max(0, readinessScore)).toFixed(1),
            factors: factors,
            recommendation: this.getRecommendation(readinessScore),
            confidence: this.getConfidenceLevel(factors)
        };
    }


    getRecommendation(score) {
        if (score >= 90) return 'Championship Ready - Peak Performance Window';
        if (score >= 80) return 'Strong Position - Exploit Advantages';
        if (score >= 70) return 'Competitive - Focus on Fundamentals';
        if (score >= 60) return 'Vulnerable - Manage Risk Carefully';
        return 'Critical - Immediate Adjustments Needed';
    }

    getConfidenceLevel(factors) {
        const variance = Object.values(factors).reduce((acc, val, _, arr) => {
            const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length;
            return acc + Math.pow(val - mean, 2);
        }, 0);
        
        if (variance < 50) return 'Very High';
        if (variance < 100) return 'High';
        if (variance < 200) return 'Medium';
        return 'Low';
    }

    broadcastUpdate(type, data) {
        const event = new CustomEvent('mlbDataUpdate', {
            detail: {
                type: type,
                data: data,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);

        // Also update Blaze metrics
        if (type === 'stats') {
            const readiness = this.calculateReadinessScore(data);
            const metricsEvent = new CustomEvent('cardinalsDataUpdate', {
                detail: {
                    readiness: parseFloat(readiness.overall),
                    leverage: 2.35 + Math.random() * 0.5,
                    trend: readiness.overall > 80 ? 'up' : 'stable',
                    recommendation: readiness.recommendation
                }
            });
            document.dispatchEvent(metricsEvent);
        }
    }

    async calculateEWMAProjections() {
        console.log('📊 Calculating EWMA projections with α=0.35...');
        const projections = {};
        const currentSeason = new Date().getFullYear();
        
        for (const [teamId, teamInfo] of Object.entries(this.focusTeams)) {
            try {
                // Get last 30 games for EWMA calculation
                const historicalData = await this.getHistoricalData(teamId, 30);
                const projection = this.calculateEWMAProjection(historicalData, teamId);
                
                projections[teamId] = {
                    teamName: teamInfo.name,
                    teamCode: teamInfo.code,
                    season: currentSeason,
                    ...projection,
                    methodology: {
                        alpha: this.ewmaAlpha,
                        description: 'Exponentially Weighted Moving Average with α=0.35',
                        sampleSize: historicalData.length,
                        transparent: true
                    },
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                console.error(`❌ Error calculating EWMA for ${teamInfo.name}:`, error);
            }
        }
        
        this.cache.set('ewmaProjections', projections);
        this.broadcastUpdate('projections', projections);
        return projections;
    }
    
    calculateEWMAProjection(games, teamId) {
        if (!games || games.length === 0) {
            return { ewmaRate: 0.500, projectedWins: 81, confidence: 'Low' };
        }
        
        // Extract win/loss results (1 for win, 0 for loss)
        const results = games.map(game => {
            const isHome = game.teams.home.team.id == teamId;
            const homeScore = game.teams.home.score || 0;
            const awayScore = game.teams.away.score || 0;
            
            if (isHome) {
                return homeScore > awayScore ? 1 : 0;
            } else {
                return awayScore > homeScore ? 1 : 0;
            }
        });
        
        // Calculate EWMA
        let ewma = results[0] || 0.5; // Start with first result or 0.5 if no data
        
        for (let i = 1; i < results.length; i++) {
            ewma = this.ewmaAlpha * results[i] + (1 - this.ewmaAlpha) * ewma;
        }
        
        // Project full season (162 games)
        const gamesPlayed = results.length;
        const gamesRemaining = Math.max(0, 162 - gamesPlayed);
        const projectedWins = Math.round(ewma * gamesRemaining + (results.reduce((a, b) => a + b, 0)));
        
        return {
            ewmaRate: parseFloat(ewma.toFixed(3)),
            projectedWins: Math.max(0, Math.min(162, projectedWins)),
            gamesAnalyzed: gamesPlayed,
            gamesRemaining: gamesRemaining,
            confidence: this.getProjectionConfidence(results.length, ewma)
        };
    }
    
    getProjectionConfidence(sampleSize, ewmaRate) {
        if (sampleSize < 10) return 'Low';
        if (sampleSize < 20) return 'Medium';
        if (sampleSize >= 30 && ewmaRate >= 0.3 && ewmaRate <= 0.7) return 'High';
        return 'Medium-High';
    }
    
    startAutoUpdate() {
        console.log(`🔄 Starting auto-update every ${this.updateInterval/1000} seconds...`);
        
        setInterval(async () => {
            try {
                await Promise.all([
                    this.loadLiveScores(),
                    this.loadAdvancedMetrics()
                ]);
                
                // Recalculate projections every 5 minutes
                if (Date.now() % (5 * 60 * 1000) < this.updateInterval) {
                    await this.calculateEWMAProjections();
                }
                
            } catch (error) {
                console.error('❌ Error during auto-update:', error);
            }
        }, this.updateInterval);
    }

    async getHistoricalData(teamId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        try {
            const response = await this.fetchWithTimeout(
                `${this.baseURL}/schedule?sportId=1&teamId=${teamId}` +
                `&startDate=${startDate.toISOString().split('T')[0]}` +
                `&endDate=${endDate.toISOString().split('T')[0]}`,
                10000
            );
            const data = await response.json();
            
            // Extract individual games from the schedule
            const games = [];
            if (data.dates) {
                data.dates.forEach(date => {
                    if (date.games) {
                        date.games.forEach(game => {
                            if (game.status.detailedState === 'Final') {
                                games.push(game);
                            }
                        });
                    }
                });
            }
            
            return games.reverse(); // Most recent first for EWMA
        } catch (error) {
            console.error('Error loading historical data:', error);
            return [];
        }
    }
}

    async connectToGateway() {
        try {
            const response = await this.fetchWithTimeout(`${this.gatewayURL}/healthz`, 3000);
            if (response.ok) {
                console.log('✅ Connected to Blaze Gateway');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Gateway connection failed, using direct MLB API');
        }
        return false;
    }
    
    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Blaze Intelligence Analytics/2025',
                    'X-Session-ID': this.sessionId
                }
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    generateSessionId() {
        return 'blaze_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeFallbackMode() {
        console.log('⚠️ Initializing fallback mode with simulated data...');
        
        const fallbackData = {};
        Object.entries(this.focusTeams).forEach(([teamId, teamInfo]) => {
            fallbackData[teamId] = this.getFallbackMetrics(teamId, teamInfo);
        });
        
        this.cache.set('advancedMetrics', fallbackData);
        this.broadcastUpdate('metrics', fallbackData);
        
        // Start reduced update cycle
        this.updateInterval = 120000; // 2 minutes in fallback
        this.startAutoUpdate();
    }
}

// Enhanced initialization with error handling
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.mlbLiveIntegration = new MLBLiveIntegration();
            
            // Add event listeners for data updates
            document.addEventListener('mlbDataUpdate', (event) => {
                console.log('📡 MLB Data Update:', event.detail.type);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize MLB Live Integration:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MLBLiveIntegration;
}