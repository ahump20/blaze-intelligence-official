// Demo Data and Mock API Responses for Blaze Intelligence

// Demo Teams Data
const DEMO_TEAMS = [
    {
        id: 'mem',
        name: 'Memphis Grizzlies',
        abbreviation: 'MEM',
        conference: 'Western',
        division: 'Pacific',
        logo: '🏀',
        colors: { primary: '#552583', secondary: '#FDB927' },
        record: { wins: 32, losses: 12 },
        stats: {
            pointsPerGame: 118.2,
            pointsAllowed: 112.8,
            fieldGoalPct: 47.8,
            threePointPct: 38.2,
            reboundsPerGame: 45.6,
            assistsPerGame: 27.4
        }
    },
    {
        id: 'tex',
        name: 'Texas Longhorns',
        abbreviation: 'TEX',
        conference: 'Western',
        division: 'Pacific',
        logo: '⚡',
        colors: { primary: '#1D428A', secondary: '#FFC72C' },
        record: { wins: 29, losses: 15 },
        stats: {
            pointsPerGame: 115.6,
            pointsAllowed: 114.2,
            fieldGoalPct: 46.1,
            threePointPct: 39.8,
            reboundsPerGame: 43.2,
            assistsPerGame: 29.1
        }
    },
    {
        id: 'stl',
        name: 'St. Louis Cardinals',
        abbreviation: 'STL',
        conference: 'Eastern',
        division: 'Atlantic',
        logo: '🍀',
        colors: { primary: '#007A33', secondary: '#BA9653' },
        record: { wins: 34, losses: 10 },
        stats: {
            pointsPerGame: 119.8,
            pointsAllowed: 108.4,
            fieldGoalPct: 48.9,
            threePointPct: 37.6,
            reboundsPerGame: 46.8,
            assistsPerGame: 26.9
        }
    }
];

// Demo Players Data
const DEMO_PLAYERS = {
    lal: [
        {
            id: 'lebron-james',
            name: 'LeBron James',
            number: 23,
            position: 'SF',
            height: '6\'9"',
            weight: '250 lbs',
            age: 39,
            experience: 21,
            stats: {
                pointsPerGame: 25.2,
                reboundsPerGame: 7.8,
                assistsPerGame: 8.1,
                fieldGoalPct: 54.8,
                threePointPct: 41.2,
                freeThrowPct: 75.6,
                minutes: 35.2
            },
            recentGames: [
                { date: '2024-01-15', opponent: 'GSW', points: 32, rebounds: 9, assists: 11 },
                { date: '2024-01-13', opponent: 'PHX', points: 28, rebounds: 6, assists: 8 },
                { date: '2024-01-11', opponent: 'MIA', points: 22, rebounds: 8, assists: 12 }
            ]
        },
        {
            id: 'anthony-davis',
            name: 'Anthony Davis',
            number: 3,
            position: 'PF/C',
            height: '6\'10"',
            weight: '253 lbs',
            age: 31,
            experience: 12,
            stats: {
                pointsPerGame: 24.1,
                reboundsPerGame: 12.6,
                assistsPerGame: 3.6,
                fieldGoalPct: 56.2,
                threePointPct: 29.4,
                freeThrowPct: 81.8,
                minutes: 35.8,
                blocks: 2.4
            },
            injuryStatus: {
                status: 'healthy',
                risk: 'low',
                lastInjury: '2023-12-15',
                daysHealthy: 31
            }
        },
        {
            id: 'dangelo-russell',
            name: "D'Angelo Russell",
            number: 1,
            position: 'PG',
            height: '6\'4"',
            weight: '193 lbs',
            age: 28,
            experience: 9,
            stats: {
                pointsPerGame: 18.0,
                reboundsPerGame: 3.1,
                assistsPerGame: 6.3,
                fieldGoalPct: 45.6,
                threePointPct: 41.5,
                freeThrowPct: 82.8,
                minutes: 32.1
            }
        },
        {
            id: 'austin-reaves',
            name: 'Austin Reaves',
            number: 15,
            position: 'SG',
            height: '6\'5"',
            weight: '206 lbs',
            age: 25,
            experience: 3,
            stats: {
                pointsPerGame: 15.9,
                reboundsPerGame: 4.3,
                assistsPerGame: 5.5,
                fieldGoalPct: 48.8,
                threePointPct: 36.7,
                freeThrowPct: 85.4,
                minutes: 29.5
            }
        }
    ]
};

// Demo Games Data
const DEMO_GAMES = [
    {
        id: 'game-001',
        date: '2024-01-20T02:30:00Z',
        homeTeam: 'LAL',
        awayTeam: 'GSW',
        venue: 'Crypto.com Arena',
        status: 'scheduled',
        gameType: 'regular',
        predictions: {
            winProbability: { home: 67.8, away: 32.2 },
            predictedScore: { home: 118, away: 112 },
            spread: -5.5,
            overUnder: 230.5,
            confidence: 'high',
            keyFactors: [
                'Home court advantage',
                'Rest advantage (2 days vs 1 day)',
                'Historical head-to-head (LAL 3-1 this season)'
            ]
        },
        broadcasts: ['ESPN', 'NBA TV'],
        tickets: {
            available: true,
            priceRange: { min: 89, max: 450 }
        }
    },
    {
        id: 'game-002',
        date: '2024-01-22T05:00:00Z',
        homeTeam: 'PHX',
        awayTeam: 'LAL',
        venue: 'Footprint Center',
        status: 'scheduled',
        gameType: 'regular',
        predictions: {
            winProbability: { home: 45.3, away: 54.7 },
            predictedScore: { home: 115, away: 119 },
            spread: 3.5,
            overUnder: 234.0,
            confidence: 'medium',
            keyFactors: [
                'Back-to-back game for LAL',
                'Phoenix revenge game',
                'Key player matchups'
            ]
        }
    },
    {
        id: 'game-003',
        date: '2024-01-17T03:00:00Z',
        homeTeam: 'LAL',
        awayTeam: 'MIA',
        venue: 'Crypto.com Arena',
        status: 'final',
        gameType: 'regular',
        finalScore: { home: 134, away: 124 },
        boxScore: {
            quarters: [
                { home: 32, away: 28 },
                { home: 35, away: 31 },
                { home: 33, away: 35 },
                { home: 34, away: 30 }
            ],
            leadChanges: 12,
            tieCount: 8,
            biggestLead: { home: 15, away: 7 }
        }
    }
];

// Demo Analytics Data
const DEMO_ANALYTICS = {
    teamPerformance: {
        offensiveRating: 118.4,
        defensiveRating: 112.1,
        netRating: 6.3,
        pace: 101.2,
        effectiveFieldGoalPct: 56.8,
        turnoverRate: 12.4,
        offensiveReboundPct: 28.9,
        freeThrowRate: 24.6
    },
    trends: {
        last10Games: { wins: 8, losses: 2 },
        homeRecord: { wins: 18, losses: 4 },
        awayRecord: { wins: 14, losses: 8 },
        vsConference: { wins: 22, losses: 8 },
        clutchRecord: { wins: 12, losses: 6 }, // Games within 5 points in final 5 minutes
        recentForm: '+12.3' // Point differential last 10 games
    },
    injuries: [
        {
            playerId: 'anthony-davis',
            playerName: 'Anthony Davis',
            injury: 'Left ankle soreness',
            status: 'day-to-day',
            expectedReturn: '1-2 games',
            riskLevel: 'low',
            gamesProbable: 85
        },
        {
            playerId: 'gabe-vincent',
            playerName: 'Gabe Vincent',
            injury: 'Left knee surgery',
            status: 'out',
            expectedReturn: '3-4 weeks',
            riskLevel: 'high',
            gamesProbable: 0
        }
    ]
};

// Demo Predictions Data
const DEMO_PREDICTIONS = {
    seasonProjections: {
        finalRecord: { wins: 52, losses: 30 },
        playoffProbability: 87.3,
        divisionTitle: 23.8,
        conferenceTitle: 12.4,
        championship: 6.8
    },
    playerProjections: {
        'lebron-james': {
            gamesPlayed: 65,
            pointsPerGame: 25.8,
            reboundsPerGame: 7.9,
            assistsPerGame: 8.2,
            allStarProbability: 95.2,
            allNBAProbability: 78.6
        }
    },
    nextGame: {
        gameId: 'game-001',
        predictions: DEMO_GAMES[0].predictions,
        keyMatchups: [
            {
                matchup: 'LeBron James vs Draymond Green',
                advantage: 'LAL',
                impactScore: 8.5
            },
            {
                matchup: 'Anthony Davis vs Kevon Looney',
                advantage: 'LAL',
                impactScore: 9.2
            },
            {
                matchup: "D'Angelo Russell vs Stephen Curry",
                advantage: 'GSW',
                impactScore: 7.8
            }
        ]
    }
};

// Advanced Statistics
const DEMO_ADVANCED_STATS = {
    playerImpact: {
        'lebron-james': {
            plusMinus: 8.7,
            per: 27.3,
            trueShootingPct: 61.4,
            usageRate: 31.2,
            winShares: 9.8,
            bpm: 7.2,
            vorp: 4.1
        },
        'anthony-davis': {
            plusMinus: 6.9,
            per: 26.8,
            trueShootingPct: 59.8,
            usageRate: 28.4,
            winShares: 8.1,
            bpm: 5.8,
            vorp: 3.2
        }
    },
    teamAdvanced: {
        fourFactors: {
            effectiveFieldGoalPct: 56.8,
            turnoverRate: 12.4,
            offensiveReboundPct: 28.9,
            freeThrowRate: 24.6
        },
        clutchStats: {
            record: '12-6',
            pointsPerGame: 112.4,
            fieldGoalPct: 48.2,
            threePointPct: 39.1
        },
        lineupData: [
            {
                lineup: ['LeBron James', 'Anthony Davis', "D'Angelo Russell", 'Austin Reaves', 'Jarred Vanderbilt'],
                minutes: 156.8,
                plusMinus: 22.4,
                offensiveRating: 124.6,
                defensiveRating: 108.2
            }
        ]
    }
};

// Mock API Response Generator
class MockAPIResponseGenerator {
    static generateTeamStats(teamId) {
        const team = DEMO_TEAMS.find(t => t.id === teamId) || DEMO_TEAMS[0];
        return {
            team: team,
            season: '2023-24',
            lastUpdated: new Date().toISOString(),
            stats: team.stats,
            analytics: DEMO_ANALYTICS.teamPerformance,
            trends: DEMO_ANALYTICS.trends,
            advanced: DEMO_ADVANCED_STATS.teamAdvanced
        };
    }
    
    static generatePlayerStats(playerId) {
        // Find player in any team
        let player = null;
        for (const teamPlayers of Object.values(DEMO_PLAYERS)) {
            player = teamPlayers.find(p => p.id === playerId);
            if (player) break;
        }
        
        if (!player) {
            player = DEMO_PLAYERS.lal[0]; // Default to LeBron
        }
        
        return {
            player: player,
            season: '2023-24',
            lastUpdated: new Date().toISOString(),
            advanced: DEMO_ADVANCED_STATS.playerImpact[player.id] || {},
            projections: DEMO_PREDICTIONS.playerProjections[player.id] || {}
        };
    }
    
    static generateGamePrediction(gameId) {
        const game = DEMO_GAMES.find(g => g.id === gameId) || DEMO_GAMES[0];
        
        return {
            game: game,
            predictions: game.predictions,
            keyMatchups: DEMO_PREDICTIONS.nextGame.keyMatchups,
            weatherFactor: game.venue.includes('outdoor') ? 'Clear, 72°F' : 'Indoor',
            lastUpdated: new Date().toISOString(),
            confidence: game.predictions.confidence,
            modelAccuracy: {
                season: 73.2,
                lastMonth: 78.6,
                headToHead: 71.4
            }
        };
    }
    
    static generateInjuryReport(teamId) {
        return {
            team: teamId,
            lastUpdated: new Date().toISOString(),
            injuries: DEMO_ANALYTICS.injuries,
            healthMetrics: {
                teamHealthScore: 85.2,
                averageAge: 28.4,
                minutesLoad: 'optimal',
                recoveryRate: 'good'
            },
            riskFactors: [
                'Heavy minutes for key players',
                'Back-to-back games this week',
                'Long road trip upcoming'
            ]
        };
    }
    
    static generateLiveGameData(gameId) {
        // Simulate live game data
        const baseGame = DEMO_GAMES.find(g => g.id === gameId) || DEMO_GAMES[0];
        
        return {
            gameId: gameId,
            status: 'live',
            period: 3,
            timeRemaining: '8:42',
            score: { home: 84, away: 81 },
            lastPlay: 'LeBron James made 3-pt shot assisted by Anthony Davis',
            momentum: 'LAL',
            leadChanges: 8,
            timesTied: 6,
            keyStats: {
                home: { fieldGoals: '32/68', threePointers: '12/28', freeThrows: '8/10' },
                away: { fieldGoals: '30/71', threePointers: '9/31', freeThrows: '12/14' }
            },
            inGamePredictions: {
                winProbability: { home: 72.4, away: 27.6 },
                finalScorePrediction: { home: 118, away: 112 }
            }
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEMO_TEAMS,
        DEMO_PLAYERS,
        DEMO_GAMES,
        DEMO_ANALYTICS,
        DEMO_PREDICTIONS,
        DEMO_ADVANCED_STATS,
        MockAPIResponseGenerator
    };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.DemoData = {
        DEMO_TEAMS,
        DEMO_PLAYERS,
        DEMO_GAMES,
        DEMO_ANALYTICS,
        DEMO_PREDICTIONS,
        DEMO_ADVANCED_STATS,
        MockAPIResponseGenerator
    };
}