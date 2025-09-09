/**
 * Blaze Intelligence Perfect Game Integration
 * Youth baseball scouting and recruiting analytics
 */

class PerfectGameIntegration {
    constructor() {
        this.dataPath = '/data/youth-baseball/';
        this.updateInterval = 3600000; // 1 hour updates
        this.prospectDatabase = new Map();
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Perfect Game Integration...');
        await this.loadProspectData();
        await this.loadRecruitingInsights();
        this.startAutoUpdate();
        this.setupEventListeners();
    }

    async loadProspectData() {
        try {
            // Load age group datasets
            const ageGroups = ['13u', '14u', '15u', '16u', '17u', '18u'];
            const dataPromises = ageGroups.map(age => 
                fetch(`${this.dataPath}${age}-dataset.json`)
                    .then(res => res.json())
                    .catch(() => this.generateProspectData(age))
            );

            const datasets = await Promise.all(dataPromises);
            
            // Process and combine datasets
            let allProspects = [];
            datasets.forEach((data, index) => {
                const ageGroup = ageGroups[index];
                if (data.prospects) {
                    data.prospects.forEach(prospect => {
                        allProspects.push({
                            ...prospect,
                            ageGroup: ageGroup,
                            blazeScore: this.calculateBlazeScore(prospect)
                        });
                    });
                }
            });

            // Sort by Blaze Score
            allProspects.sort((a, b) => b.blazeScore.overall - a.blazeScore.overall);

            // Store in database
            this.prospectDatabase.set('allProspects', allProspects);
            this.prospectDatabase.set('topProspects', allProspects.slice(0, 100));

            this.broadcastUpdate('prospects', {
                total: allProspects.length,
                topProspects: allProspects.slice(0, 10),
                byAgeGroup: this.groupByAge(allProspects)
            });

            return allProspects;
        } catch (error) {
            console.error('Error loading prospect data:', error);
            return this.generateProspectData('mixed');
        }
    }

    generateProspectData(ageGroup) {
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
        const states = ['TX', 'CA', 'FL', 'GA', 'AZ', 'NC', 'SC', 'TN'];
        const prospects = [];

        for (let i = 0; i < 50; i++) {
            prospects.push({
                id: `PG${ageGroup}${i}`,
                name: this.generateProspectName(),
                position: positions[Math.floor(Math.random() * positions.length)],
                age: parseInt(ageGroup) || 16,
                state: states[Math.floor(Math.random() * states.length)],
                highSchool: `${['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]} HS`,
                graduation: 2026 + Math.floor(Math.random() * 3),
                metrics: {
                    battingAvg: (0.280 + Math.random() * 0.120).toFixed(3),
                    era: (2.00 + Math.random() * 2.50).toFixed(2),
                    velocity: Math.floor(75 + Math.random() * 20),
                    sixtyTime: (6.5 + Math.random() * 1.0).toFixed(2),
                    popTime: (1.85 + Math.random() * 0.35).toFixed(2),
                    exitVelo: Math.floor(75 + Math.random() * 25)
                },
                rankings: {
                    national: Math.floor(Math.random() * 500) + 1,
                    state: Math.floor(Math.random() * 100) + 1,
                    position: Math.floor(Math.random() * 50) + 1
                },
                events: {
                    attended: Math.floor(Math.random() * 10) + 1,
                    awards: Math.floor(Math.random() * 3)
                }
            });
        }

        return { prospects, ageGroup };
    }

    generateProspectName() {
        const firstNames = ['Jackson', 'Mason', 'Ethan', 'Lucas', 'Oliver', 'Aiden', 'Liam', 'Noah'];
        const lastNames = ['Johnson', 'Williams', 'Martinez', 'Garcia', 'Rodriguez', 'Smith', 'Jones', 'Davis'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    calculateBlazeScore(prospect) {
        // Championship DNA Algorithm for youth prospects
        const factors = {
            performance: this.getPerformanceFactor(prospect),
            projectability: this.getProjectabilityFactor(prospect),
            character: this.getCharacterFactor(prospect),
            competition: this.getCompetitionFactor(prospect),
            development: this.getDevelopmentFactor(prospect)
        };

        const weights = {
            performance: 0.25,
            projectability: 0.25,
            character: 0.20,
            competition: 0.15,
            development: 0.15
        };

        let overall = 0;
        for (const [factor, score] of Object.entries(factors)) {
            overall += score * weights[factor];
        }

        return {
            overall: overall.toFixed(1),
            factors: factors,
            grade: this.getGrade(overall),
            mlbComparison: this.getMLBComparison(overall, prospect.position),
            projectedDraft: this.getProjectedDraft(overall)
        };
    }

    getPerformanceFactor(prospect) {
        let score = 50;
        
        // Batting average impact
        if (prospect.metrics.battingAvg) {
            const avg = parseFloat(prospect.metrics.battingAvg);
            score += (avg - 0.300) * 100;
        }
        
        // Velocity for pitchers
        if (prospect.position === 'P' && prospect.metrics.velocity) {
            score += (prospect.metrics.velocity - 80) * 2;
        }
        
        // Exit velocity for hitters
        if (prospect.metrics.exitVelo) {
            score += (prospect.metrics.exitVelo - 85) * 1.5;
        }

        return Math.max(0, Math.min(100, score));
    }

    getProjectabilityFactor(prospect) {
        let score = 60;
        
        // Age bonus (younger is better)
        const ageBonus = (18 - prospect.age) * 5;
        score += ageBonus;
        
        // Physical metrics
        if (prospect.metrics.sixtyTime) {
            const sixtyTime = parseFloat(prospect.metrics.sixtyTime);
            score += (7.0 - sixtyTime) * 20;
        }

        return Math.max(0, Math.min(100, score));
    }

    getCharacterFactor(prospect) {
        // Simulated character assessment
        return 70 + Math.random() * 25;
    }

    getCompetitionFactor(prospect) {
        let score = 50;
        
        // Events attended
        if (prospect.events) {
            score += prospect.events.attended * 3;
            score += prospect.events.awards * 10;
        }
        
        // Rankings boost
        if (prospect.rankings) {
            if (prospect.rankings.national <= 100) score += 20;
            if (prospect.rankings.state <= 10) score += 15;
            if (prospect.rankings.position <= 5) score += 15;
        }

        return Math.max(0, Math.min(100, score));
    }

    getDevelopmentFactor(prospect) {
        // Simulated development trajectory
        return 65 + Math.random() * 30;
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        return 'C-';
    }

    getMLBComparison(score, position) {
        const comparisons = {
            P: {
                90: 'Jacob deGrom',
                85: 'Gerrit Cole',
                80: 'Shane Bieber',
                75: 'Marcus Stroman',
                70: 'Michael Wacha'
            },
            C: {
                90: 'J.T. Realmuto',
                85: 'Will Smith',
                80: 'Salvador Perez',
                75: 'Willson Contreras',
                70: 'Tyler Stephenson'
            },
            '1B': {
                90: 'Freddie Freeman',
                85: 'Paul Goldschmidt',
                80: 'Pete Alonso',
                75: 'Josh Bell',
                70: 'Christian Walker'
            },
            default: {
                90: 'Mike Trout',
                85: 'Mookie Betts',
                80: 'Ronald Acuña Jr.',
                75: 'George Springer',
                70: 'Bryan Reynolds'
            }
        };

        const posComps = comparisons[position] || comparisons.default;
        const thresholds = Object.keys(posComps).map(Number).sort((a, b) => b - a);
        
        for (const threshold of thresholds) {
            if (score >= threshold) {
                return posComps[threshold];
            }
        }
        return 'Development Player';
    }

    getProjectedDraft(score) {
        if (score >= 90) return '1st Round';
        if (score >= 85) return '2nd-3rd Round';
        if (score >= 80) return '4th-7th Round';
        if (score >= 75) return '8th-15th Round';
        if (score >= 70) return '16th-20th Round';
        if (score >= 65) return 'Late Round';
        return 'Undrafted FA';
    }

    async loadRecruitingInsights() {
        try {
            const response = await fetch(`${this.dataPath}recruiting-insights.json`);
            const data = await response.json();
            
            const insights = {
                hotbeds: data.hotbeds || this.getDefaultHotbeds(),
                trends: data.trends || this.getDefaultTrends(),
                commitments: data.commitments || [],
                pipeline: data.pipeline || this.generatePipeline()
            };

            this.prospectDatabase.set('insights', insights);
            this.broadcastUpdate('insights', insights);
            
            return insights;
        } catch (error) {
            console.error('Error loading recruiting insights:', error);
            return this.getDefaultInsights();
        }
    }

    getDefaultHotbeds() {
        return [
            { state: 'Texas', prospects: 487, avgRank: 156 },
            { state: 'California', prospects: 412, avgRank: 189 },
            { state: 'Florida', prospects: 389, avgRank: 201 },
            { state: 'Georgia', prospects: 276, avgRank: 234 },
            { state: 'Arizona', prospects: 198, avgRank: 267 }
        ];
    }

    getDefaultTrends() {
        return [
            'Velocity increases averaging +3mph year-over-year',
            'Exit velocity becoming primary hitting metric',
            'Multi-sport athletes showing higher ceiling',
            'Travel ball exposure critical for D1 recruiting',
            'Academic performance increasingly important'
        ];
    }

    generatePipeline() {
        const colleges = ['Texas', 'LSU', 'Vanderbilt', 'Arkansas', 'TCU', 'Rice', 'Texas A&M'];
        return colleges.map(college => ({
            school: college,
            commits: Math.floor(Math.random() * 10) + 5,
            avgRank: Math.floor(Math.random() * 200) + 50,
            scholarship: Math.random() > 0.5 ? 'Full' : 'Partial'
        }));
    }

    getDefaultInsights() {
        return {
            hotbeds: this.getDefaultHotbeds(),
            trends: this.getDefaultTrends(),
            commitments: [],
            pipeline: this.generatePipeline()
        };
    }

    groupByAge(prospects) {
        const groups = {};
        prospects.forEach(prospect => {
            if (!groups[prospect.ageGroup]) {
                groups[prospect.ageGroup] = [];
            }
            groups[prospect.ageGroup].push(prospect);
        });
        return groups;
    }

    broadcastUpdate(type, data) {
        const event = new CustomEvent('perfectGameUpdate', {
            detail: {
                type: type,
                data: data,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    setupEventListeners() {
        document.addEventListener('requestProspect', (event) => {
            const { prospectId } = event.detail;
            const prospect = this.getProspect(prospectId);
            if (prospect) {
                this.broadcastUpdate('prospectDetail', prospect);
            }
        });
    }

    getProspect(id) {
        const allProspects = this.prospectDatabase.get('allProspects') || [];
        return allProspects.find(p => p.id === id);
    }

    searchProspects(criteria) {
        const allProspects = this.prospectDatabase.get('allProspects') || [];
        return allProspects.filter(prospect => {
            if (criteria.position && prospect.position !== criteria.position) return false;
            if (criteria.state && prospect.state !== criteria.state) return false;
            if (criteria.minScore && prospect.blazeScore.overall < criteria.minScore) return false;
            if (criteria.graduation && prospect.graduation !== criteria.graduation) return false;
            return true;
        });
    }

    startAutoUpdate() {
        setInterval(() => {
            this.loadRecruitingInsights();
        }, this.updateInterval);
    }
}

// Initialize Perfect Game integration
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.perfectGameIntegration = new PerfectGameIntegration();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerfectGameIntegration;
}