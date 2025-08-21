#!/usr/bin/env node

/**
 * Blaze Intelligence - Live Data Simulator
 * Simulates real Cardinals data updates for demo purposes
 * Updates enhanced-readiness.json with realistic variations
 */

const fs = require('fs').promises;
const path = require('path');

class LiveDataSimulator {
    constructor() {
        this.dataFile = path.join(__dirname, '../dist/src/data/enhanced-readiness.json');
        this.baseData = null;
        this.gameSimulation = {
            inning: 1,
            homeScore: 0,
            awayScore: 0,
            gameActive: false
        };
    }

    async loadBaseData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            this.baseData = JSON.parse(data);
            console.log('📊 Base data loaded');
        } catch (error) {
            console.error('Failed to load base data:', error.message);
            process.exit(1);
        }
    }

    generateRealisticReadiness() {
        const base = this.baseData.overall;
        // Simulate realistic fluctuation ±5 points
        const variation = (Math.random() - 0.5) * 10;
        const newReadiness = Math.max(75, Math.min(95, base + variation));
        return Math.round(newReadiness);
    }

    generateLeverage() {
        // Leverage typically ranges 1.2x to 2.8x
        const baseLeverage = this.baseData.leverage;
        const variation = (Math.random() - 0.5) * 0.4;
        return Math.max(1.2, Math.min(2.8, baseLeverage + variation));
    }

    generateWinProbability(readiness) {
        // Win probability correlates with readiness
        const baseProb = readiness / 100;
        const momentum = (Math.random() - 0.5) * 0.2;
        return Math.max(0.1, Math.min(0.9, baseProb + momentum));
    }

    generateInsights(readiness, leverage) {
        const insights = [
            {
                title: "Optimize Early Counts",
                category: "Offense", 
                description: "Focus on first-pitch strikes - opponents struggle with early aggression",
                recommendation: "Attack early counts with high-confidence hitters",
                priority: readiness > 85 ? "high" : "medium",
                confidence: Math.random() * 0.3 + 0.7
            },
            {
                title: "Leverage Speed Game",
                category: "Strategy",
                description: "Deploy baserunning early to pressure opponent defense", 
                recommendation: "Use speed threat in first 3 innings when energy is highest",
                priority: leverage > 2.0 ? "high" : "medium",
                confidence: Math.random() * 0.2 + 0.7
            },
            {
                title: "Monitor Pitcher Fatigue",
                category: "Health",
                description: "Track arm stress indicators during high-leverage situations",
                recommendation: "Consider bullpen options after 85 pitches",
                priority: "medium",
                confidence: Math.random() * 0.2 + 0.8
            },
            {
                title: "Weather Impact Analysis",
                category: "Environment",
                description: "Wind patterns favor aggressive baserunning tonight",
                recommendation: "Increase steal attempts with 15+ mph tailwind",
                priority: "low",
                confidence: Math.random() * 0.3 + 0.6
            }
        ];

        // Return 2-3 random insights
        const shuffled = insights.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
    }

    async updateData() {
        const readiness = this.generateRealisticReadiness();
        const leverage = this.generateLeverage();
        const winProbability = this.generateWinProbability(readiness);
        
        const updatedData = {
            ...this.baseData,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            overall: readiness,
            leverage: Math.round(leverage * 10) / 10,
            winProbability: Math.round(winProbability * 1000) / 1000,
            readiness: {
                overall: readiness,
                offense: Math.max(60, Math.min(95, readiness + (Math.random() - 0.5) * 20)),
                defense: Math.max(70, Math.min(98, readiness + (Math.random() - 0.5) * 15)),
                pitching: Math.max(75, Math.min(98, readiness + (Math.random() - 0.5) * 10)),
                conditioning: Math.max(65, Math.min(95, readiness + (Math.random() - 0.5) * 25)),
                mental: Math.max(70, Math.min(98, readiness + (Math.random() - 0.5) * 15))
            },
            performance: {
                ...this.baseData.performance,
                offense: Math.max(60, Math.min(95, readiness + (Math.random() - 0.5) * 20)),
                defense: Math.max(70, Math.min(98, readiness + (Math.random() - 0.5) * 15)),
                pitching: Math.max(75, Math.min(98, readiness + (Math.random() - 0.5) * 10)),
                recent_trend: readiness > 85 ? "improving" : readiness < 75 ? "declining" : "stable"
            },
            predictions: {
                winProbability: winProbability,
                runDifferential: Math.round((winProbability - 0.5) * 5 * 10) / 10,
                championshipOdds: Math.round(winProbability * 0.25 * 1000) / 1000
            },
            insights: this.generateInsights(readiness, leverage),
            blazeIntelligence: {
                ...this.baseData.blazeIntelligence,
                championshipOdds: Math.round(winProbability * 0.25 * 1000) / 1000,
                nextUpdate: new Date(Date.now() + 30000).toISOString(), // 30 seconds
                confidence: Math.random() * 0.1 + 0.9,
                pattern_recognition: {
                    hot_streak: readiness > 85,
                    momentum: readiness > 82 ? "positive" : readiness < 78 ? "negative" : "neutral",
                    pressure_index: Math.random() * 0.5
                }
            },
            healthMetrics: {
                api_status: "healthy",
                data_quality: Math.random() * 0.1 + 0.9,
                latency_ms: Math.floor(Math.random() * 100) + 50,
                uptime: 0.999
            }
        };

        try {
            await fs.writeFile(this.dataFile, JSON.stringify(updatedData, null, 2));
            
            console.log(`🔄 Data updated: Readiness ${readiness}%, Win Prob ${Math.round(winProbability * 100)}%, Leverage ${leverage.toFixed(1)}x`);
            
            return updatedData;
            
        } catch (error) {
            console.error('Failed to update data:', error.message);
            throw error;
        }
    }

    async startSimulation(intervalSeconds = 30) {
        await this.loadBaseData();
        
        console.log(`🚀 Starting live data simulation (updates every ${intervalSeconds}s)`);
        console.log('Press Ctrl+C to stop');
        
        // Initial update
        await this.updateData();
        
        // Set up interval
        setInterval(async () => {
            try {
                await this.updateData();
            } catch (error) {
                console.error('Update failed:', error.message);
            }
        }, intervalSeconds * 1000);
    }

    async singleUpdate() {
        await this.loadBaseData();
        const result = await this.updateData();
        console.log('✅ Single update complete');
        return result;
    }
}

// CLI interface
if (require.main === module) {
    const simulator = new LiveDataSimulator();
    const command = process.argv[2];
    const interval = parseInt(process.argv[3]) || 30;
    
    switch (command) {
        case 'once':
            simulator.singleUpdate()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Simulation failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'start':
        case 'run':
            simulator.startSimulation(interval);
            break;
            
        default:
            console.log(`
🔥 Blaze Intelligence Live Data Simulator

Usage: node simulate-live-data.js [command] [interval]

Commands:
  once        - Update data once and exit
  start       - Start continuous simulation
  run         - Alias for start

Options:
  interval    - Update interval in seconds (default: 30)

Examples:
  node simulate-live-data.js once
  node simulate-live-data.js start 15
  node simulate-live-data.js run 60
            `);
            break;
    }
}

module.exports = LiveDataSimulator;