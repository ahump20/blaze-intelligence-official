/**
 * Confidence Scoring Demo API
 * GET /api/confidence-demo - Demonstrate confidence scoring system
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Simulate confidence scoring for different insights
        const demoInsights = [
            {
                id: 'biomech_001',
                type: 'biomechanics',
                content: 'Stride length is optimal at 87% of pitcher height',
                athlete_id: 'demo_pitcher_001',
                confidence: {
                    score: 0.94,
                    band: 'HIGH',
                    rationale: 'High confidence recommendation. Strong consensus across all AI models (94% agreement), based on highly reliable sensor data, Previous accuracy for biomechanics analysis: 92%, Data is very recent (< 2 seconds old).',
                    components: {
                        consensus: 0.94,
                        source_reliability: 0.98,
                        historical_accuracy: 0.92,
                        data_freshness: 0.95
                    },
                    models_used: ['ChatGPT 5', 'Claude Opus 4.1', 'Gemini 2.5 Pro'],
                    timestamp: new Date().toISOString(),
                    processing_time_ms: 87
                }
            },
            {
                id: 'strategy_002', 
                type: 'strategy_recommendation',
                content: 'Switch to slider in 2-1 count based on batter tendencies',
                athlete_id: 'demo_pitcher_001',
                confidence: {
                    score: 0.76,
                    band: 'MEDIUM',
                    rationale: 'Moderate confidence - consider additional validation. Good agreement between AI models (76% consensus), using good quality historical data sources, Historically reliable for strategy (85% accuracy), Data freshness is acceptable (5 minutes old).',
                    components: {
                        consensus: 0.76,
                        source_reliability: 0.82,
                        historical_accuracy: 0.85,
                        data_freshness: 0.65
                    },
                    models_used: ['ChatGPT 5', 'Claude Opus 4.1', 'Gemini 2.5 Pro'],
                    timestamp: new Date().toISOString(),
                    processing_time_ms: 156
                }
            },
            {
                id: 'character_003',
                type: 'character_assessment', 
                content: 'Player shows high determination and focus under pressure',
                athlete_id: 'demo_pitcher_001',
                confidence: {
                    score: 0.43,
                    band: 'LOW',
                    rationale: 'Low confidence - use with caution. Moderate agreement between AI models (43% consensus), from limited micro-expression data sources, Moderate historical accuracy for character assessment (78%), Warning: Data may be stale (15 minutes old).',
                    components: {
                        consensus: 0.43,
                        source_reliability: 0.48,
                        historical_accuracy: 0.78,
                        data_freshness: 0.35
                    },
                    models_used: ['ChatGPT 5', 'Claude Opus 4.1', 'Gemini 2.5 Pro'],
                    timestamp: new Date().toISOString(),
                    processing_time_ms: 234
                }
            },
            {
                id: 'prediction_004',
                type: 'injury_risk',
                content: 'Elevated stress indicators in throwing arm mechanics',
                athlete_id: 'demo_pitcher_001', 
                confidence: {
                    score: 0.29,
                    band: 'REJECT',
                    rationale: 'Insufficient confidence - should not be displayed. Significant disagreement between AI models (29% consensus), from limited sensor data with connection issues, Moderate historical accuracy for injury risk (83%), Warning: Data may be stale (30 minutes old).',
                    components: {
                        consensus: 0.29,
                        source_reliability: 0.35,
                        historical_accuracy: 0.83,
                        data_freshness: 0.15
                    },
                    models_used: ['ChatGPT 5', 'Claude Opus 4.1', 'Gemini 2.5 Pro'],
                    timestamp: new Date().toISOString(),
                    processing_time_ms: 312,
                    warning: 'This insight was automatically rejected due to low confidence'
                }
            }
        ];

        // Filter out rejected insights (as would happen in production)
        const visibleInsights = demoInsights.filter(insight => insight.confidence.band !== 'REJECT');
        const rejectedInsights = demoInsights.filter(insight => insight.confidence.band === 'REJECT');

        const response = {
            timestamp: new Date().toISOString(),
            demo_description: 'Confidence scoring system demonstration showing multi-model AI consensus with rationale explanations',
            system_info: {
                models_used: ['ChatGPT 5', 'Claude Opus 4.1', 'Gemini 2.5 Pro'],
                confidence_thresholds: {
                    HIGH: '≥85%',
                    MEDIUM: '65-84%', 
                    LOW: '45-64%',
                    REJECT: '<45% (automatically hidden)'
                },
                processing_speed: 'Average 150ms per insight',
                accuracy_tracking: '94.6% historical accuracy'
            },
            visible_insights: visibleInsights.map(insight => ({
                ...insight,
                display_status: 'VISIBLE',
                ui_elements: {
                    confidence_badge: `${Math.round(insight.confidence.score * 100)}% ${insight.confidence.band}`,
                    color_coding: {
                        'HIGH': 'green',
                        'MEDIUM': 'yellow', 
                        'LOW': 'orange'
                    }[insight.confidence.band],
                    click_action: 'Show detailed rationale and model breakdown'
                }
            })),
            rejected_insights: rejectedInsights.map(insight => ({
                id: insight.id,
                type: insight.type,
                rejection_reason: 'Below confidence threshold',
                confidence_score: insight.confidence.score,
                rationale: insight.confidence.rationale,
                action: 'Automatically hidden from user interface'
            })),
            summary: {
                total_insights: demoInsights.length,
                visible_count: visibleInsights.length,
                rejected_count: rejectedInsights.length,
                average_confidence: Math.round(demoInsights.reduce((sum, i) => sum + i.confidence.score, 0) / demoInsights.length * 100) / 100,
                highest_confidence: Math.max(...demoInsights.map(i => i.confidence.score)),
                processing_time_total: demoInsights.reduce((sum, i) => sum + i.confidence.processing_time_ms, 0) + 'ms'
            },
            production_benefits: [
                'No insights displayed without confidence rationale',
                'Multi-model consensus prevents single-point AI failures',
                'Automatic rejection of low-confidence predictions',
                'Real-time explanation of AI decision-making process',
                'Builds user trust through transparency',
                'Meets accuracy accountability requirements'
            ],
            next_steps: {
                integration: 'All platform insights now include confidence scoring',
                monitoring: 'Real-time confidence degradation alerts active',
                improvement: 'Historical accuracy tracking enables model refinement'
            }
        };

        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: headers
        });

    } catch (error) {
        console.error('Confidence demo error:', error);
        
        return new Response(JSON.stringify({
            error: 'Failed to generate confidence demo',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}