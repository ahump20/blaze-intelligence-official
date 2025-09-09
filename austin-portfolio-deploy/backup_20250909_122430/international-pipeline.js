/**
 * Blaze Intelligence International Pipeline
 * KBO, NPB, and Latin American prospect tracking
 */

class InternationalPipeline {
    constructor() {
        this.regions = {
            KBO: { name: 'Korea Baseball Organization', country: 'South Korea' },
            NPB: { name: 'Nippon Professional Baseball', country: 'Japan' },
            LIDOM: { name: 'Dominican Winter League', country: 'Dominican Republic' },
            LMP: { name: 'Mexican Pacific League', country: 'Mexico' },
            LVBP: { name: 'Venezuelan Professional Baseball League', country: 'Venezuela' },
            LPB: { name: 'Liga Profesional de Béisbol', country: 'Cuba' }
        };
        this.prospectPool = new Map();
        this.updateInterval = 3600000; // 1 hour
        this.init();
    }

    async init() {
        console.log('🔥 Initializing International Pipeline...');
        await this.loadInternationalProspects();
        await this.loadPostingSystem();
        await this.loadLatinAmericanPipeline();
        this.startAutoUpdate();
    }

    async loadInternationalProspects() {
        const kboProspects = this.generateKBOProspects();
        const npbProspects = this.generateNPBProspects();
        
        const allProspects = [...kboProspects, ...npbProspects];
        
        // Calculate Blaze scores and MLB readiness
        allProspects.forEach(prospect => {
            prospect.blazeAnalysis = this.analyzeProspect(prospect);
            prospect.mlbReadiness = this.calculateMLBReadiness(prospect);
        });

        // Sort by MLB readiness
        allProspects.sort((a, b) => b.mlbReadiness.score - a.mlbReadiness.score);

        this.prospectPool.set('asia', allProspects);
        this.broadcastUpdate('asianProspects', {
            total: allProspects.length,
            top10: allProspects.slice(0, 10),
            byLeague: {
                KBO: kboProspects.length,
                NPB: npbProspects.length
            }
        });

        return allProspects;
    }

    generateKBOProspects() {
        const teams = ['Samsung Lions', 'LG Twins', 'Doosan Bears', 'KT Wiz', 'NC Dinos', 
                      'SSG Landers', 'Kiwoom Heroes', 'Lotte Giants', 'Hanwha Eagles', 'Kia Tigers'];
        
        const prospects = [];
        const koreanLastNames = ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Ryu'];
        const koreanFirstNames = ['Jung-hoo', 'Ha-seong', 'Hyun-jin', 'Kwang-hyun', 'Ji-man', 'Seung-hwan'];

        for (let i = 0; i < 30; i++) {
            const lastName = koreanLastNames[Math.floor(Math.random() * koreanLastNames.length)];
            const firstName = koreanFirstNames[Math.floor(Math.random() * koreanFirstNames.length)];
            
            prospects.push({
                id: `KBO${i}`,
                name: `${lastName} ${firstName}`,
                league: 'KBO',
                team: teams[Math.floor(Math.random() * teams.length)],
                position: this.getRandomPosition(),
                age: 24 + Math.floor(Math.random() * 8),
                yearsInLeague: 3 + Math.floor(Math.random() * 7),
                stats: {
                    avg: (0.270 + Math.random() * 0.080).toFixed(3),
                    hr: Math.floor(10 + Math.random() * 30),
                    rbi: Math.floor(40 + Math.random() * 80),
                    ops: (0.750 + Math.random() * 0.250).toFixed(3),
                    era: (2.50 + Math.random() * 2.00).toFixed(2),
                    strikeouts: Math.floor(100 + Math.random() * 150),
                    whip: (1.00 + Math.random() * 0.40).toFixed(2)
                },
                postingStatus: Math.random() > 0.7 ? 'Posted' : Math.random() > 0.4 ? 'Eligible' : 'Not Eligible',
                estimatedValue: `$${Math.floor(5 + Math.random() * 45)}M`,
                scoutingNotes: this.generateScoutingNotes('KBO')
            });
        }

        return prospects;
    }

    generateNPBProspects() {
        const teams = ['Yomiuri Giants', 'Hanshin Tigers', 'Yakult Swallows', 'Hiroshima Carp', 
                      'Chunichi Dragons', 'DeNA BayStars', 'Softbank Hawks', 'Seibu Lions',
                      'Rakuten Eagles', 'Nippon-Ham Fighters', 'Orix Buffaloes', 'Lotte Marines'];
        
        const prospects = [];
        const japaneseLastNames = ['Yamamoto', 'Tanaka', 'Suzuki', 'Matsui', 'Ohtani', 'Darvish', 'Sasaki'];
        const japaneseFirstNames = ['Yoshinobu', 'Shohei', 'Yu', 'Masahiro', 'Kodai', 'Roki'];

        for (let i = 0; i < 30; i++) {
            const lastName = japaneseLastNames[Math.floor(Math.random() * japaneseLastNames.length)];
            const firstName = japaneseFirstNames[Math.floor(Math.random() * japaneseFirstNames.length)];
            
            prospects.push({
                id: `NPB${i}`,
                name: `${lastName} ${firstName}`,
                league: 'NPB',
                team: teams[Math.floor(Math.random() * teams.length)],
                position: this.getRandomPosition(),
                age: 23 + Math.floor(Math.random() * 9),
                yearsInLeague: 2 + Math.floor(Math.random() * 8),
                stats: {
                    avg: (0.280 + Math.random() * 0.070).toFixed(3),
                    hr: Math.floor(8 + Math.random() * 35),
                    rbi: Math.floor(35 + Math.random() * 90),
                    ops: (0.780 + Math.random() * 0.220).toFixed(3),
                    era: (2.20 + Math.random() * 2.30).toFixed(2),
                    strikeouts: Math.floor(120 + Math.random() * 180),
                    whip: (0.95 + Math.random() * 0.45).toFixed(2)
                },
                postingStatus: Math.random() > 0.6 ? 'Posted' : Math.random() > 0.3 ? 'Eligible' : 'Not Eligible',
                estimatedValue: `$${Math.floor(10 + Math.random() * 90)}M`,
                scoutingNotes: this.generateScoutingNotes('NPB')
            });
        }

        return prospects;
    }

    async loadLatinAmericanPipeline() {
        const countries = ['Dominican Republic', 'Venezuela', 'Cuba', 'Mexico', 'Puerto Rico', 'Colombia'];
        const prospects = [];

        countries.forEach(country => {
            for (let i = 0; i < 20; i++) {
                prospects.push(this.generateLatinProspect(country));
            }
        });

        // Calculate Blaze scores
        prospects.forEach(prospect => {
            prospect.blazeAnalysis = this.analyzeProspect(prospect);
            prospect.signingBonus = this.estimateSigningBonus(prospect);
        });

        // Sort by potential
        prospects.sort((a, b) => b.blazeAnalysis.potential - a.blazeAnalysis.potential);

        this.prospectPool.set('latinAmerica', prospects);
        this.broadcastUpdate('latinProspects', {
            total: prospects.length,
            top20: prospects.slice(0, 20),
            byCountry: this.groupByCountry(prospects)
        });

        return prospects;
    }

    generateLatinProspect(country) {
        const positions = ['SS', '2B', 'CF', 'RF', 'C', 'P'];
        const tools = {
            hit: 20 + Math.floor(Math.random() * 60),
            power: 20 + Math.floor(Math.random() * 60),
            run: 20 + Math.floor(Math.random() * 60),
            arm: 20 + Math.floor(Math.random() * 60),
            field: 20 + Math.floor(Math.random() * 60)
        };

        return {
            id: `LA${country.substring(0, 2)}${Math.floor(Math.random() * 1000)}`,
            name: this.generateLatinName(country),
            country: country,
            position: positions[Math.floor(Math.random() * positions.length)],
            age: 16 + Math.floor(Math.random() * 5),
            tools: tools,
            overallGrade: Math.floor((tools.hit + tools.power + tools.run + tools.arm + tools.field) / 5),
            physicalProjection: {
                height: `${5 + Math.floor(Math.random() * 2)}'${8 + Math.floor(Math.random() * 5)}"`,
                weight: 150 + Math.floor(Math.random() * 50),
                bodyType: ['Athletic', 'Projectable', 'Strong', 'Lean'][Math.floor(Math.random() * 4)]
            },
            performance: {
                battingAvg: (0.250 + Math.random() * 0.100).toFixed(3),
                homeRuns: Math.floor(Math.random() * 10),
                stolenBases: Math.floor(Math.random() * 30),
                era: (3.00 + Math.random() * 2.00).toFixed(2),
                velocity: 88 + Math.floor(Math.random() * 10)
            },
            status: Math.random() > 0.5 ? 'Signed' : 'Available',
            mlbTeamInterest: this.generateMLBInterest()
        };
    }

    generateLatinName(country) {
        const names = {
            'Dominican Republic': {
                first: ['Juan', 'Pedro', 'Luis', 'Carlos', 'Miguel', 'Rafael'],
                last: ['Martinez', 'Rodriguez', 'Santana', 'Ramirez', 'Guerrero', 'Soto']
            },
            'Venezuela': {
                first: ['Jose', 'Carlos', 'Miguel', 'Luis', 'Ronald', 'Salvador'],
                last: ['Altuve', 'Cabrera', 'Perez', 'Gonzalez', 'Acuna', 'Arcia']
            },
            'Cuba': {
                first: ['Yordan', 'Luis', 'Randy', 'Yoan', 'Jose', 'Aroldis'],
                last: ['Alvarez', 'Robert', 'Arozarena', 'Moncada', 'Abreu', 'Chapman']
            },
            'Mexico': {
                first: ['Julio', 'Roberto', 'Luis', 'Adrian', 'Isaac', 'Alex'],
                last: ['Urias', 'Osuna', 'Gonzalez', 'Verdugo', 'Paredes', 'Banuelos']
            },
            default: {
                first: ['Carlos', 'Juan', 'Miguel', 'Luis', 'Jose', 'Pedro'],
                last: ['Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Gonzalez', 'Perez']
            }
        };

        const countryNames = names[country] || names.default;
        const firstName = countryNames.first[Math.floor(Math.random() * countryNames.first.length)];
        const lastName = countryNames.last[Math.floor(Math.random() * countryNames.last.length)];
        
        return `${firstName} ${lastName}`;
    }

    generateMLBInterest() {
        const teams = ['Yankees', 'Dodgers', 'Cardinals', 'Rangers', 'Padres', 'Mariners'];
        const interested = [];
        const numTeams = Math.floor(Math.random() * 4) + 1;
        
        for (let i = 0; i < numTeams; i++) {
            const team = teams[Math.floor(Math.random() * teams.length)];
            if (!interested.includes(team)) {
                interested.push(team);
            }
        }
        
        return interested;
    }

    getRandomPosition() {
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
        return positions[Math.floor(Math.random() * positions.length)];
    }

    generateScoutingNotes(league) {
        const notes = {
            KBO: [
                'Strong contact skills with developing power',
                'Excellent plate discipline, low chase rate',
                'Above-average speed, good baserunning instincts',
                'Plus arm strength with quick release',
                'Smooth fielding actions, good range'
            ],
            NPB: [
                'Elite command and control',
                'Plus splitter/forkball combination',
                'Excellent breaking ball with sharp bite',
                'Maintains velocity deep into games',
                'Strong mental makeup, handles pressure well'
            ]
        };

        const leagueNotes = notes[league] || notes.KBO;
        return leagueNotes[Math.floor(Math.random() * leagueNotes.length)];
    }

    analyzeProspect(prospect) {
        const factors = {
            performance: this.evaluatePerformance(prospect),
            age: this.evaluateAge(prospect),
            experience: this.evaluateExperience(prospect),
            physical: this.evaluatePhysical(prospect),
            potential: this.evaluatePotential(prospect)
        };

        const overall = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

        return {
            overall: overall.toFixed(1),
            factors: factors,
            grade: this.getProspectGrade(overall),
            comparison: this.getMLBComparison(overall, prospect.position),
            recommendation: this.getRecommendation(overall)
        };
    }

    evaluatePerformance(prospect) {
        let score = 50;
        
        if (prospect.stats) {
            if (prospect.stats.avg) score += (parseFloat(prospect.stats.avg) - 0.280) * 100;
            if (prospect.stats.ops) score += (parseFloat(prospect.stats.ops) - 0.800) * 50;
            if (prospect.stats.era) score += (4.00 - parseFloat(prospect.stats.era)) * 10;
        }
        
        if (prospect.tools) {
            score = (prospect.tools.hit + prospect.tools.power) / 2;
        }

        return Math.max(20, Math.min(80, score));
    }

    evaluateAge(prospect) {
        const optimalAge = prospect.league ? 26 : 18;
        const ageDiff = Math.abs(prospect.age - optimalAge);
        return Math.max(20, 80 - (ageDiff * 5));
    }

    evaluateExperience(prospect) {
        if (prospect.yearsInLeague) {
            return Math.min(80, 40 + (prospect.yearsInLeague * 5));
        }
        return 50;
    }

    evaluatePhysical(prospect) {
        if (prospect.physicalProjection) {
            const { bodyType } = prospect.physicalProjection;
            const scores = { 'Athletic': 70, 'Projectable': 65, 'Strong': 60, 'Lean': 55 };
            return scores[bodyType] || 50;
        }
        return 60 + Math.random() * 20;
    }

    evaluatePotential(prospect) {
        let potential = 50;
        
        if (prospect.age < 25) potential += 10;
        if (prospect.postingStatus === 'Posted') potential += 15;
        if (prospect.tools && prospect.tools.power > 50) potential += 10;
        
        return Math.min(80, potential);
    }

    calculateMLBReadiness(prospect) {
        const factors = {
            performance: prospect.blazeAnalysis.factors.performance,
            experience: prospect.blazeAnalysis.factors.experience,
            age: prospect.age < 30 ? 70 : 50,
            competition: prospect.league === 'NPB' ? 75 : 65
        };

        const score = Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;

        return {
            score: score.toFixed(1),
            timeline: this.getTimeline(score),
            risk: this.getRiskLevel(score),
            confidence: this.getConfidence(factors)
        };
    }

    getTimeline(score) {
        if (score >= 75) return 'MLB Ready';
        if (score >= 65) return '1 Year Away';
        if (score >= 55) return '2-3 Years Away';
        return '3+ Years Away';
    }

    getRiskLevel(score) {
        if (score >= 70) return 'Low';
        if (score >= 55) return 'Medium';
        return 'High';
    }

    getConfidence(factors) {
        const variance = this.calculateVariance(Object.values(factors));
        if (variance < 100) return 'High';
        if (variance < 200) return 'Medium';
        return 'Low';
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    getProspectGrade(score) {
        if (score >= 70) return 'Elite';
        if (score >= 60) return 'Plus';
        if (score >= 50) return 'Average';
        if (score >= 40) return 'Below Average';
        return 'Poor';
    }

    getMLBComparison(score, position) {
        // Position-specific MLB comparisons
        const comparisons = {
            70: 'All-Star Caliber',
            60: 'Everyday Starter',
            50: 'Role Player',
            40: 'Bench/Depth',
            30: 'Organizational'
        };

        const thresholds = Object.keys(comparisons).map(Number).sort((a, b) => b - a);
        for (const threshold of thresholds) {
            if (score >= threshold) {
                return comparisons[threshold];
            }
        }
        return 'Project';
    }

    getRecommendation(score) {
        if (score >= 70) return 'Priority Target - Immediate Action';
        if (score >= 60) return 'Strong Interest - Monitor Closely';
        if (score >= 50) return 'Moderate Interest - Continue Evaluation';
        return 'Low Priority - Track Development';
    }

    estimateSigningBonus(prospect) {
        const baseBonus = prospect.overallGrade * 10000;
        const ageMultiplier = (22 - prospect.age) * 0.1 + 1;
        const toolsMultiplier = (prospect.tools.power + prospect.tools.hit) / 100;
        
        const bonus = baseBonus * ageMultiplier * toolsMultiplier;
        
        if (bonus > 1000000) {
            return `$${(bonus / 1000000).toFixed(1)}M`;
        }
        return `$${Math.floor(bonus / 1000)}K`;
    }

    groupByCountry(prospects) {
        const groups = {};
        prospects.forEach(prospect => {
            if (!groups[prospect.country]) {
                groups[prospect.country] = {
                    count: 0,
                    avgGrade: 0,
                    prospects: []
                };
            }
            groups[prospect.country].count++;
            groups[prospect.country].prospects.push(prospect);
        });

        // Calculate average grades
        Object.keys(groups).forEach(country => {
            const totalGrade = groups[country].prospects.reduce((sum, p) => 
                sum + parseFloat(p.blazeAnalysis.overall), 0);
            groups[country].avgGrade = (totalGrade / groups[country].count).toFixed(1);
        });

        return groups;
    }

    async loadPostingSystem() {
        // Simulate posting system data
        const postingData = {
            currentWindow: {
                open: true,
                startDate: '2025-11-01',
                endDate: '2025-12-15'
            },
            postedPlayers: [],
            historicalSignings: [
                { player: 'Yoshinobu Yamamoto', team: 'Dodgers', value: '$325M', year: 2024 },
                { player: 'Seiya Suzuki', team: 'Cubs', value: '$85M', year: 2022 },
                { player: 'Ha-Seong Kim', team: 'Padres', value: '$28M', year: 2021 }
            ]
        };

        this.prospectPool.set('postingSystem', postingData);
        return postingData;
    }

    broadcastUpdate(type, data) {
        const event = new CustomEvent('internationalUpdate', {
            detail: {
                type: type,
                data: data,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    startAutoUpdate() {
        setInterval(() => {
            this.loadInternationalProspects();
            this.loadLatinAmericanPipeline();
        }, this.updateInterval);
    }

    searchProspects(criteria) {
        let prospects = [];
        
        if (criteria.region === 'asia') {
            prospects = this.prospectPool.get('asia') || [];
        } else if (criteria.region === 'latinAmerica') {
            prospects = this.prospectPool.get('latinAmerica') || [];
        } else {
            prospects = [
                ...(this.prospectPool.get('asia') || []),
                ...(this.prospectPool.get('latinAmerica') || [])
            ];
        }

        return prospects.filter(prospect => {
            if (criteria.minScore && prospect.blazeAnalysis?.overall < criteria.minScore) return false;
            if (criteria.position && prospect.position !== criteria.position) return false;
            if (criteria.maxAge && prospect.age > criteria.maxAge) return false;
            if (criteria.country && prospect.country !== criteria.country) return false;
            return true;
        });
    }
}

// Initialize International Pipeline
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.internationalPipeline = new InternationalPipeline();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InternationalPipeline;
}