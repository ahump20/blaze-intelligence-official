/**
 * Blaze Intelligence Advanced Analytics Engine
 * Extracted and adapted from Blaze Intelligence OS v2
 * Provides ELO ratings, Kalman filtering, and advanced metrics
 */

class BlazeAdvancedAnalytics {
    constructor() {
        this.eventBus = new EventBus();
        this.metrics = new MetricsEngine();
        this.eloRatings = {};
        this.kalmanFilters = {};
        this.connectors = this.initializeConnectors();
    }

    /**
     * Statistical Helper Functions
     */
    static clamp(x, lo = 0, hi = 1) {
        return Math.max(lo, Math.min(hi, x));
    }

    static mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
    }

    static sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }

    static variance(arr) {
        const m = BlazeAdvancedAnalytics.mean(arr);
        return BlazeAdvancedAnalytics.mean(arr.map(x => (x - m) ** 2));
    }

    static stddev(arr) {
        return Math.sqrt(BlazeAdvancedAnalytics.variance(arr));
    }

    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    static softmax(xs) {
        const m = Math.max(...xs);
        const exps = xs.map(x => Math.exp(x - m));
        const s = BlazeAdvancedAnalytics.sum(exps);
        return exps.map(e => e / s);
    }

    /**
     * Initialize data source connectors
     */
    initializeConnectors() {
        return {
            espn: { 
                id: 'espn', 
                label: 'ESPN API', 
                connect: async () => this.connectToESPN() 
            },
            mlb: { 
                id: 'mlb', 
                label: 'MLB StatsAPI', 
                connect: async () => this.connectToMLB() 
            },
            ncaa: { 
                id: 'ncaa', 
                label: 'NCAA DB', 
                connect: async () => this.connectToNCAA() 
            },
            nfl: { 
                id: 'nfl', 
                label: 'NFL Data', 
                connect: async () => this.connectToNFL() 
            },
            nba: {
                id: 'nba',
                label: 'NBA Stats',
                connect: async () => this.connectToNBA()
            }
        };
    }

    /**
     * Connect to ESPN API
     */
    async connectToESPN() {
        // Placeholder for ESPN connection
        console.log('Connecting to ESPN API...');
        return true;
    }

    /**
     * Connect to MLB Stats API
     */
    async connectToMLB() {
        // Placeholder for MLB connection
        console.log('Connecting to MLB Stats API...');
        return true;
    }

    /**
     * Connect to NCAA Database
     */
    async connectToNCAA() {
        // Placeholder for NCAA connection
        console.log('Connecting to NCAA Database...');
        return true;
    }

    /**
     * Connect to NFL Data
     */
    async connectToNFL() {
        // Placeholder for NFL connection
        console.log('Connecting to NFL Data...');
        return true;
    }

    /**
     * Connect to NBA Stats
     */
    async connectToNBA() {
        // Placeholder for NBA connection
        console.log('Connecting to NBA Stats...');
        return true;
    }
}

/**
 * Event Bus for real-time updates
 */
class EventBus {
    constructor() {
        this.listeners = [];
    }

    on(fn) {
        this.listeners.push(fn);
    }

    off(fn) {
        this.listeners = this.listeners.filter(x => x !== fn);
    }

    emit(type, data) {
        for (const listener of this.listeners) {
            try {
                listener({ type, data });
            } catch (error) {
                console.error('Event listener error:', error);
            }
        }
    }
}

/**
 * ELO Rating System
 */
class ELOSystem {
    constructor() {
        this.ratings = {};
        this.k = 32; // K-factor for rating changes
    }

    /**
     * Initialize team with default rating
     */
    initializeTeam(teamId, rating = 1500) {
        if (!this.ratings[teamId]) {
            this.ratings[teamId] = {
                rating: rating,
                games: 0,
                wins: 0,
                losses: 0,
                draws: 0
            };
        }
    }

    /**
     * Calculate expected score
     */
    expectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    /**
     * Update ratings after a game
     */
    updateRatings(teamA, teamB, result) {
        this.initializeTeam(teamA);
        this.initializeTeam(teamB);

        const ratingA = this.ratings[teamA].rating;
        const ratingB = this.ratings[teamB].rating;

        const expectedA = this.expectedScore(ratingA, ratingB);
        const expectedB = this.expectedScore(ratingB, ratingA);

        let scoreA, scoreB;
        if (result === 'A') {
            scoreA = 1;
            scoreB = 0;
            this.ratings[teamA].wins++;
            this.ratings[teamB].losses++;
        } else if (result === 'B') {
            scoreA = 0;
            scoreB = 1;
            this.ratings[teamA].losses++;
            this.ratings[teamB].wins++;
        } else {
            scoreA = 0.5;
            scoreB = 0.5;
            this.ratings[teamA].draws++;
            this.ratings[teamB].draws++;
        }

        this.ratings[teamA].rating = ratingA + this.k * (scoreA - expectedA);
        this.ratings[teamB].rating = ratingB + this.k * (scoreB - expectedB);
        this.ratings[teamA].games++;
        this.ratings[teamB].games++;

        return {
            [teamA]: this.ratings[teamA],
            [teamB]: this.ratings[teamB]
        };
    }

    /**
     * Get team rating
     */
    getTeamRating(teamId) {
        return this.ratings[teamId] || null;
    }

    /**
     * Get league rankings
     */
    getRankings(league = null) {
        const teams = Object.entries(this.ratings);
        
        if (league) {
            // Filter by league if specified
            teams.filter(([id, data]) => id.includes(league.toLowerCase()));
        }

        return teams
            .sort(([, a], [, b]) => b.rating - a.rating)
            .map(([id, data], index) => ({
                rank: index + 1,
                teamId: id,
                ...data
            }));
    }
}

/**
 * Kalman Filter for predictive analytics
 */
class KalmanFilter {
    constructor(initialState = 0, initialCovariance = 1) {
        this.x = initialState; // State estimate
        this.p = initialCovariance; // Error covariance
        this.q = 0.1; // Process noise
        this.r = 0.1; // Measurement noise
    }

    /**
     * Predict next state
     */
    predict() {
        this.p = this.p + this.q;
        return this.x;
    }

    /**
     * Update with measurement
     */
    update(measurement) {
        const y = measurement - this.x; // Innovation
        const s = this.p + this.r; // Innovation covariance
        const k = this.p / s; // Kalman gain

        this.x = this.x + k * y;
        this.p = (1 - k) * this.p;

        return this.x;
    }

    /**
     * Get current state estimate
     */
    getState() {
        return {
            estimate: this.x,
            uncertainty: this.p
        };
    }
}

/**
 * Metrics Engine
 */
class MetricsEngine {
    constructor() {
        this.metrics = this.initializeMetrics();
    }

    /**
     * Initialize metric computation modules
     */
    initializeMetrics() {
        return [
            {
                id: 'winProbability',
                description: 'Win probability based on current stats',
                compute: (values) => BlazeAdvancedAnalytics.sigmoid(BlazeAdvancedAnalytics.mean(values) - 0.5)
            },
            {
                id: 'performanceIndex',
                description: 'Overall performance index',
                compute: (values) => BlazeAdvancedAnalytics.clamp(BlazeAdvancedAnalytics.mean(values) / 100, 0, 1)
            },
            {
                id: 'consistency',
                description: 'Team consistency metric',
                compute: (values) => 1 - BlazeAdvancedAnalytics.clamp(BlazeAdvancedAnalytics.stddev(values) / 50, 0, 1)
            },
            {
                id: 'momentum',
                description: 'Recent performance trend',
                compute: (values) => {
                    if (values.length < 2) return 0.5;
                    const recent = values.slice(-5);
                    const older = values.slice(0, -5);
                    return BlazeAdvancedAnalytics.sigmoid(
                        BlazeAdvancedAnalytics.mean(recent) - BlazeAdvancedAnalytics.mean(older)
                    );
                }
            },
            {
                id: 'clutchFactor',
                description: 'Performance in high-pressure situations',
                compute: (values) => {
                    const weights = values.map((_, idx) => idx + 1);
                    const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0);
                    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
                    return BlazeAdvancedAnalytics.clamp(weightedSum / totalWeight / 100, 0, 1);
                }
            },
            {
                id: 'efficiency',
                description: 'Resource utilization efficiency',
                compute: (values) => {
                    const softmaxVals = BlazeAdvancedAnalytics.softmax(values);
                    return softmaxVals[0] || 0;
                }
            },
            {
                id: 'dominance',
                description: 'Dominance over competition',
                compute: (values) => {
                    const mean = BlazeAdvancedAnalytics.mean(values);
                    const variance = BlazeAdvancedAnalytics.variance(values);
                    return BlazeAdvancedAnalytics.sigmoid((mean - 50) / 10) * (1 - variance / 1000);
                }
            },
            {
                id: 'resilience',
                description: 'Ability to bounce back from losses',
                compute: (values) => {
                    let bouncebacks = 0;
                    for (let i = 1; i < values.length; i++) {
                        if (values[i] > values[i-1] && values[i-1] < 50) {
                            bouncebacks++;
                        }
                    }
                    return bouncebacks / Math.max(values.length - 1, 1);
                }
            }
        ];
    }

    /**
     * Compute metric by ID
     */
    computeMetric(metricId, values) {
        const metric = this.metrics.find(m => m.id === metricId);
        if (!metric) {
            console.warn(`Metric ${metricId} not found`);
            return null;
        }
        return metric.compute(values);
    }

    /**
     * Compute all metrics for given values
     */
    computeAllMetrics(values) {
        const results = {};
        for (const metric of this.metrics) {
            results[metric.id] = {
                value: metric.compute(values),
                description: metric.description
            };
        }
        return results;
    }
}

/**
 * Championship Prediction Engine
 */
class ChampionshipPredictor {
    constructor() {
        this.elo = new ELOSystem();
        this.kalmanFilters = {};
    }

    /**
     * Initialize Kalman filter for team
     */
    initializeTeamFilter(teamId) {
        if (!this.kalmanFilters[teamId]) {
            this.kalmanFilters[teamId] = new KalmanFilter(75, 10);
        }
    }

    /**
     * Update team performance
     */
    updateTeamPerformance(teamId, performanceScore) {
        this.initializeTeamFilter(teamId);
        return this.kalmanFilters[teamId].update(performanceScore);
    }

    /**
     * Predict championship probability
     */
    predictChampionship(teamId) {
        const rating = this.elo.getTeamRating(teamId);
        if (!rating) return 0;

        const rankings = this.elo.getRankings();
        const teamRank = rankings.find(r => r.teamId === teamId);
        
        if (!teamRank) return 0;

        // Base probability on ranking
        const rankFactor = 1 - (teamRank.rank - 1) / rankings.length;
        
        // Factor in win rate
        const winRate = rating.wins / Math.max(rating.games, 1);
        
        // Get Kalman prediction if available
        let trendFactor = 0.5;
        if (this.kalmanFilters[teamId]) {
            const state = this.kalmanFilters[teamId].getState();
            trendFactor = BlazeAdvancedAnalytics.sigmoid((state.estimate - 75) / 10);
        }

        // Combine factors
        const probability = (rankFactor * 0.4 + winRate * 0.4 + trendFactor * 0.2);
        
        return BlazeAdvancedAnalytics.clamp(probability, 0, 1);
    }

    /**
     * Get power rankings
     */
    getPowerRankings(league = null) {
        const rankings = this.elo.getRankings(league);
        
        return rankings.map(team => ({
            ...team,
            championshipProbability: this.predictChampionship(team.teamId),
            trend: this.kalmanFilters[team.teamId] 
                ? this.kalmanFilters[team.teamId].getState().estimate 
                : null
        }));
    }
}

// Initialize on page load
const blazeAnalytics = new BlazeAdvancedAnalytics();
const championshipPredictor = new ChampionshipPredictor();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlazeAdvancedAnalytics,
        EventBus,
        ELOSystem,
        KalmanFilter,
        MetricsEngine,
        ChampionshipPredictor
    };
}