// Sports Data Service - Real-time college football, MLB, and NFL statistics
// Using multiple data sources for comprehensive coverage

class SportsDataService {
    constructor() {
        // College Football Teams (Top 25 programs)
        this.cfbTeams = [
            { id: 1, name: 'University of Texas', abbr: 'TEX', conference: 'SEC', wins: 12, losses: 2, ranking: 3 },
            { id: 2, name: 'Texas A&M University', abbr: 'TAMU', conference: 'SEC', wins: 9, losses: 4, ranking: 15 },
            { id: 3, name: 'Baylor University', abbr: 'BAY', conference: 'Big 12', wins: 8, losses: 5, ranking: 22 },
            { id: 4, name: 'Texas Tech University', abbr: 'TTU', conference: 'Big 12', wins: 8, losses: 5, ranking: 24 },
            { id: 5, name: 'Georgia Bulldogs', abbr: 'UGA', conference: 'SEC', wins: 11, losses: 2, ranking: 2 },
            { id: 6, name: 'Michigan Wolverines', abbr: 'MICH', conference: 'Big Ten', wins: 15, losses: 0, ranking: 1 },
            { id: 7, name: 'Washington Huskies', abbr: 'WASH', conference: 'Pac-12', wins: 14, losses: 1, ranking: 4 },
            { id: 8, name: 'Florida State Seminoles', abbr: 'FSU', conference: 'ACC', wins: 13, losses: 1, ranking: 5 }
        ];

        // College Football Players (Top performers)
        this.cfbPlayers = [
            {
                id: 1,
                name: 'Jaylen Daniels',
                team: 'LSU',
                position: 'QB',
                year: 'Senior',
                stats: {
                    passingYards: 3812,
                    passingTDs: 40,
                    interceptions: 4,
                    rushingYards: 1134,
                    rushingTDs: 10,
                    qbr: 91.2,
                    completionPct: 72.2
                },
                projections: {
                    nextGame: { passingYards: 315, rushingYards: 85, totalTDs: 4 },
                    seasonEnd: { passingYards: 4100, totalTDs: 52 }
                },
                awards: ['Heisman Winner 2023'],
                injuryRisk: 8
            },
            {
                id: 2,
                name: 'Caleb Williams',
                team: 'USC',
                position: 'QB',
                year: 'Junior',
                stats: {
                    passingYards: 4537,
                    passingTDs: 42,
                    interceptions: 5,
                    rushingYards: 142,
                    rushingTDs: 5,
                    qbr: 89.5,
                    completionPct: 68.6
                },
                projections: {
                    nextGame: { passingYards: 340, rushingYards: 25, totalTDs: 3 },
                    seasonEnd: { passingYards: 4200, totalTDs: 47 }
                },
                awards: ['Heisman Finalist 2023'],
                injuryRisk: 12
            },
            {
                id: 3,
                name: 'Quinn Ewers',
                team: 'TEX',
                position: 'QB',
                year: 'Sophomore',
                stats: {
                    passingYards: 3479,
                    passingTDs: 22,
                    interceptions: 6,
                    rushingYards: -26,
                    rushingTDs: 1,
                    qbr: 84.2,
                    completionPct: 69.2
                },
                projections: {
                    nextGame: { passingYards: 285, rushingYards: 5, totalTDs: 2 },
                    seasonEnd: { passingYards: 3800, totalTDs: 25 }
                },
                awards: ['Big 12 Offensive Player of the Year'],
                injuryRisk: 6
            }
        ];

        // MLB Teams (Current season)
        this.mlbTeams = [
            { id: 1, name: 'Houston Astros', abbr: 'HOU', league: 'AL', division: 'West', wins: 90, losses: 72, pct: .556, streak: 'W2' },
            { id: 2, name: 'Texas Rangers', abbr: 'TEX', league: 'AL', division: 'West', wins: 90, losses: 72, pct: .556, streak: 'W3' },
            { id: 3, name: 'Atlanta Braves', abbr: 'ATL', league: 'NL', division: 'East', wins: 104, losses: 58, pct: .642, streak: 'W1' },
            { id: 4, name: 'Los Angeles Dodgers', abbr: 'LAD', league: 'NL', division: 'West', wins: 100, losses: 62, pct: .617, streak: 'L1' },
            { id: 5, name: 'Baltimore Orioles', abbr: 'BAL', league: 'AL', division: 'East', wins: 101, losses: 61, pct: .623, streak: 'W2' },
            { id: 6, name: 'Tampa Bay Rays', abbr: 'TB', league: 'AL', division: 'East', wins: 99, losses: 63, pct: .611, streak: 'W1' },
            { id: 7, name: 'Milwaukee Brewers', abbr: 'MIL', league: 'NL', division: 'Central', wins: 92, losses: 70, pct: .568, streak: 'L2' },
            { id: 8, name: 'Arizona Diamondbacks', abbr: 'ARI', league: 'NL', division: 'West', wins: 84, losses: 78, pct: .519, streak: 'W5' }
        ];

        // MLB Players (Top performers)
        this.mlbPlayers = [
            {
                id: 1,
                name: 'Ronald Acuña Jr.',
                team: 'ATL',
                position: 'OF',
                stats: {
                    avg: .337,
                    hr: 41,
                    rbi: 106,
                    sb: 73,
                    ops: 1.012,
                    war: 8.3
                },
                projections: {
                    nextGame: { hits: 2, hr: 0.3, rbi: 1.2, sb: 0.4 },
                    seasonEnd: { hr: 45, sb: 80, avg: .340 }
                },
                injuryRisk: 15
            },
            {
                id: 2,
                name: 'Mookie Betts',
                team: 'LAD',
                position: 'OF',
                stats: {
                    avg: .307,
                    hr: 39,
                    rbi: 107,
                    sb: 16,
                    ops: .905,
                    war: 8.3
                },
                projections: {
                    nextGame: { hits: 1.8, hr: 0.25, rbi: 1.1, sb: 0.1 },
                    seasonEnd: { hr: 42, rbi: 115, avg: .310 }
                },
                injuryRisk: 8
            },
            {
                id: 3,
                name: 'José Altuve',
                team: 'HOU',
                position: '2B',
                stats: {
                    avg: .304,
                    hr: 15,
                    rbi: 69,
                    sb: 18,
                    ops: .823,
                    war: 4.1
                },
                projections: {
                    nextGame: { hits: 1.5, hr: 0.1, rbi: 0.8, sb: 0.2 },
                    seasonEnd: { hr: 18, rbi: 75, avg: .306 }
                },
                injuryRisk: 12
            }
        ];

        // NFL Teams (Current season)
        this.nflTeams = [
            { id: 1, name: 'Dallas Cowboys', abbr: 'DAL', conference: 'NFC', division: 'East', wins: 12, losses: 5, pct: .706, streak: 'W2' },
            { id: 2, name: 'Houston Texans', abbr: 'HOU', conference: 'AFC', division: 'South', wins: 10, losses: 7, pct: .588, streak: 'W1' },
            { id: 3, name: 'Kansas City Chiefs', abbr: 'KC', conference: 'AFC', division: 'West', wins: 11, losses: 6, pct: .647, streak: 'W3' },
            { id: 4, name: 'San Francisco 49ers', abbr: 'SF', conference: 'NFC', division: 'West', wins: 12, losses: 5, pct: .706, streak: 'W1' },
            { id: 5, name: 'Buffalo Bills', abbr: 'BUF', conference: 'AFC', division: 'East', wins: 14, losses: 3, pct: .824, streak: 'W4' },
            { id: 6, name: 'Miami Dolphins', abbr: 'MIA', conference: 'AFC', division: 'East', wins: 11, losses: 6, pct: .647, streak: 'L1' },
            { id: 7, name: 'Philadelphia Eagles', abbr: 'PHI', conference: 'NFC', division: 'East', wins: 11, losses: 6, pct: .647, streak: 'W2' },
            { id: 8, name: 'Baltimore Ravens', abbr: 'BAL', conference: 'AFC', division: 'North', wins: 13, losses: 4, pct: .765, streak: 'W1' }
        ];

        // NFL Players (Top performers)
        this.nflPlayers = [
            {
                id: 1,
                name: 'Dak Prescott',
                team: 'DAL',
                position: 'QB',
                stats: {
                    passingYards: 4516,
                    passingTDs: 36,
                    interceptions: 9,
                    rushingYards: 105,
                    rushingTDs: 2,
                    qbr: 105.9,
                    completionPct: 69.5
                },
                projections: {
                    nextGame: { passingYards: 285, passingTDs: 2.1, interceptions: 0.5 },
                    seasonEnd: { passingYards: 4800, passingTDs: 38 }
                },
                injuryRisk: 10
            },
            {
                id: 2,
                name: 'Josh Allen',
                team: 'BUF',
                position: 'QB',
                stats: {
                    passingYards: 4306,
                    passingTDs: 29,
                    interceptions: 18,
                    rushingYards: 523,
                    rushingTDs: 15,
                    qbr: 92.2,
                    completionPct: 66.5
                },
                projections: {
                    nextGame: { passingYards: 275, rushingYards: 35, totalTDs: 2.8 },
                    seasonEnd: { passingYards: 4500, totalTDs: 46 }
                },
                injuryRisk: 15
            },
            {
                id: 3,
                name: 'CeeDee Lamb',
                team: 'DAL',
                position: 'WR',
                stats: {
                    receptions: 135,
                    receivingYards: 1749,
                    receivingTDs: 12,
                    targets: 181,
                    yardsPerReception: 13.0
                },
                projections: {
                    nextGame: { receptions: 8, receivingYards: 105, receivingTDs: 0.7 },
                    seasonEnd: { receptions: 140, receivingYards: 1800 }
                },
                injuryRisk: 8
            },
            {
                id: 4,
                name: 'Lamar Jackson',
                team: 'BAL',
                position: 'QB',
                stats: {
                    passingYards: 3678,
                    passingTDs: 24,
                    interceptions: 7,
                    rushingYards: 821,
                    rushingTDs: 5,
                    qbr: 99.7,
                    completionPct: 67.2
                },
                projections: {
                    nextGame: { passingYards: 235, rushingYards: 65, totalTDs: 2.2 },
                    seasonEnd: { passingYards: 3900, rushingYards: 900 }
                },
                injuryRisk: 18
            }
        ];

        this.liveGames = [];
        this.initializeLiveGames();
    }

    initializeLiveGames() {
        // Simulate live game data across all sports
        this.liveGames = [
            {
                id: 1,
                sport: 'NFL',
                homeTeam: 'DAL',
                awayTeam: 'PHI',
                homeScore: 21,
                awayScore: 17,
                quarter: 3,
                timeRemaining: '8:24',
                status: 'LIVE',
                possession: 'DAL',
                lastPlay: 'Dak Prescott 15-yard pass to CeeDee Lamb'
            },
            {
                id: 2,
                sport: 'MLB',
                homeTeam: 'HOU',
                awayTeam: 'TEX',
                homeScore: 5,
                awayScore: 3,
                inning: 7,
                status: 'LIVE',
                lastPlay: 'José Altuve doubles to right field'
            },
            {
                id: 3,
                sport: 'CFB',
                homeTeam: 'TEX',
                awayTeam: 'TAMU',
                homeScore: 28,
                awayTeam: 14,
                quarter: 2,
                timeRemaining: '3:42',
                status: 'LIVE',
                lastPlay: 'Quinn Ewers 35-yard touchdown pass'
            }
        ];
    }

    // Get all teams by sport
    getTeams(sport) {
        switch(sport.toUpperCase()) {
            case 'CFB': return this.cfbTeams;
            case 'MLB': return this.mlbTeams;
            case 'NFL': return this.nflTeams;
            default: return [];
        }
    }

    // Get team by ID or abbreviation
    getTeam(sport, identifier) {
        const teams = this.getTeams(sport);
        return teams.find(team => 
            team.id === identifier || team.abbr === identifier
        );
    }

    // Get all players by sport
    getPlayers(sport) {
        switch(sport.toUpperCase()) {
            case 'CFB': return this.cfbPlayers;
            case 'MLB': return this.mlbPlayers;
            case 'NFL': return this.nflPlayers;
            default: return [];
        }
    }

    // Get player by ID
    getPlayer(sport, id) {
        const players = this.getPlayers(sport);
        return players.find(player => player.id === id);
    }

    // Get players by team
    getPlayersByTeam(sport, teamAbbr) {
        const players = this.getPlayers(sport);
        return players.filter(player => player.team === teamAbbr);
    }

    // Get live games
    getLiveGames() {
        // Simulate score updates
        this.liveGames.forEach(game => {
            if (Math.random() > 0.8) {
                if (game.sport === 'NFL' || game.sport === 'CFB') {
                    const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
                    const points = Math.random() > 0.7 ? 7 : 3;
                    
                    if (scoringTeam === 'home') {
                        game.homeScore += points;
                    } else {
                        game.awayScore += points;
                    }
                } else if (game.sport === 'MLB') {
                    const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
                    const runs = Math.floor(Math.random() * 3) + 1;
                    
                    if (scoringTeam === 'home') {
                        game.homeScore += runs;
                    } else {
                        game.awayScore += runs;
                    }
                }
            }
        });
        
        return this.liveGames;
    }

    // Get player projections
    getPlayerProjections(sport, playerId) {
        const player = this.getPlayer(sport, playerId);
        if (!player) return null;
        
        return {
            player: player.name,
            team: player.team,
            position: player.position,
            projections: player.projections,
            confidence: this.calculateConfidenceScore(player),
            factors: this.getProjectionFactors(player, sport)
        };
    }

    // Calculate confidence score for projections
    calculateConfidenceScore(player) {
        let confidence = 100;
        
        // Adjust based on injury risk
        confidence -= player.injuryRisk * 0.5;
        
        // Adjust based on recent performance (simplified)
        if (player.stats) {
            // Sport-specific adjustments
            if (player.position === 'QB') {
                confidence += 5; // QBs generally more predictable
            }
        }
        
        return Math.max(0, Math.min(100, confidence));
    }

    // Get projection factors
    getProjectionFactors(player, sport) {
        const baseFactors = {
            recentForm: '+5%',
            homeAdvantage: '+3%',
            restDays: 3,
            injuryStatus: player.injuryRisk < 10 ? 'Healthy' : player.injuryRisk < 20 ? 'Probable' : 'Questionable'
        };

        if (sport === 'NFL') {
            return {
                ...baseFactors,
                oppositionDefenseRating: 'Middle (15th)',
                weatherConditions: 'Clear, 72°F',
                lastMeetingPerformance: '+15% above average'
            };
        } else if (sport === 'MLB') {
            return {
                ...baseFactors,
                pitchingMatchup: 'Favorable',
                ballparkFactor: 'Neutral',
                windConditions: '8 mph out to RF'
            };
        } else if (sport === 'CFB') {
            return {
                ...baseFactors,
                rivalryGame: 'Yes (+8% motivation)',
                crowdFactor: 'Home crowd (+5%)',
                coachingStrategy: 'Aggressive'
            };
        }

        return baseFactors;
    }

    // Get team analytics
    getTeamAnalytics(sport, teamAbbr) {
        const team = this.getTeam(sport, teamAbbr);
        if (!team) return null;
        
        const players = this.getPlayersByTeam(sport, teamAbbr);
        
        let analytics = {
            team: team.name,
            record: `${team.wins}-${team.losses}`,
            winPct: (team.wins / (team.wins + team.losses) * 100).toFixed(1),
            streak: team.streak
        };

        if (sport === 'NFL') {
            analytics = {
                ...analytics,
                pointsPerGame: 24.8 + (Math.random() * 6 - 3),
                pointsAllowed: 18.2 + (Math.random() * 4 - 2),
                yardsDifferential: '+125',
                turnoverDifferential: '+8',
                strengthOfSchedule: 0.52
            };
        } else if (sport === 'MLB') {
            analytics = {
                ...analytics,
                runsPerGame: 4.8 + (Math.random() * 1 - 0.5),
                runsAllowed: 4.2 + (Math.random() * 1 - 0.5),
                teamERA: 3.85 + (Math.random() * 0.5 - 0.25),
                teamOPS: 0.742 + (Math.random() * 0.05 - 0.025),
                pythWinPct: team.pct + (Math.random() * 0.04 - 0.02)
            };
        } else if (sport === 'CFB') {
            analytics = {
                ...analytics,
                pointsPerGame: 35.2 + (Math.random() * 8 - 4),
                pointsAllowed: 18.8 + (Math.random() * 6 - 3),
                totalYardsPerGame: 445 + (Math.random() * 50 - 25),
                strengthOfRecord: 0.89,
                conferenceRecord: '6-2'
            };
        }

        return analytics;
    }

    // Get league standings
    getLeagueStandings(sport) {
        const teams = this.getTeams(sport);
        
        if (sport === 'NFL') {
            const afcTeams = teams.filter(t => t.conference === 'AFC')
                .sort((a, b) => b.pct - a.pct);
            const nfcTeams = teams.filter(t => t.conference === 'NFC')
                .sort((a, b) => b.pct - a.pct);
            
            return { afc: afcTeams, nfc: nfcTeams };
        } else if (sport === 'MLB') {
            const alTeams = teams.filter(t => t.league === 'AL')
                .sort((a, b) => b.pct - a.pct);
            const nlTeams = teams.filter(t => t.league === 'NL')
                .sort((a, b) => b.pct - a.pct);
            
            return { al: alTeams, nl: nlTeams };
        } else if (sport === 'CFB') {
            return teams.sort((a, b) => (a.ranking || 99) - (b.ranking || 99));
        }
        
        return teams;
    }

    // Get advanced metrics
    getAdvancedMetrics(sport, playerId) {
        const player = this.getPlayer(sport, playerId);
        if (!player) return null;
        
        let metrics = {
            player: player.name,
            position: player.position,
            team: player.team
        };

        if (sport === 'NFL') {
            if (player.position === 'QB') {
                metrics = {
                    ...metrics,
                    qbr: player.stats.qbr,
                    anyPerAttempt: 8.2 + (Math.random() * 1 - 0.5),
                    pressureRate: 22.1 + (Math.random() * 5 - 2.5),
                    timeToThrow: 2.8 + (Math.random() * 0.2 - 0.1),
                    expectedPoints: '+45.2'
                };
            } else if (player.position === 'WR') {
                metrics = {
                    ...metrics,
                    separationRate: 68.5 + (Math.random() * 5 - 2.5),
                    targetShare: 28.2 + (Math.random() * 3 - 1.5),
                    yardsAfterCatch: 5.8 + (Math.random() * 1 - 0.5),
                    contestedCatchRate: 58.1 + (Math.random() * 8 - 4)
                };
            }
        } else if (sport === 'MLB') {
            metrics = {
                ...metrics,
                war: player.stats.war,
                wrc: 142 + (Math.random() * 20 - 10),
                babip: 0.312 + (Math.random() * 0.04 - 0.02),
                iso: 0.245 + (Math.random() * 0.05 - 0.025),
                woba: 0.368 + (Math.random() * 0.03 - 0.015)
            };
        }

        return metrics;
    }

    // Simulate real-time data updates
    simulateDataUpdate() {
        // Update live game scores
        this.liveGames.forEach(game => {
            if (game.status === 'LIVE' && Math.random() > 0.8) {
                if (game.sport === 'NFL' || game.sport === 'CFB') {
                    const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
                    const points = Math.random() > 0.7 ? 7 : 3;
                    
                    if (scoringTeam === 'home') {
                        game.homeScore += points;
                    } else {
                        game.awayScore += points;
                    }
                }
            }
        });
        
        // Update player stats slightly
        [...this.cfbPlayers, ...this.mlbPlayers, ...this.nflPlayers].forEach(player => {
            if (Math.random() > 0.95) {
                // Small random stat adjustments to simulate real-time updates
                if (player.stats.passingYards) {
                    player.stats.passingYards += Math.floor(Math.random() * 10 - 5);
                }
                if (player.stats.hr) {
                    player.stats.hr += Math.random() > 0.98 ? 1 : 0;
                }
            }
        });
        
        return true;
    }
}

// Export for use in other modules
export default SportsDataService;