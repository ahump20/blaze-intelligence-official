/**
 * Blaze Intelligence Personalized Demo Experience System
 * Dynamic content adaptation based on prospect behavior and scoring
 */

class BlazePersonalizedDemo {
    constructor() {
        this.prospectProfile = this.loadProspectProfile();
        this.demoVariations = this.defineDemoVariations();
        this.contentAdaptations = this.defineContentAdaptations();
        this.init();
    }

    loadProspectProfile() {
        // Load data from AI scoring and analytics
        const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
        const sessionData = JSON.parse(localStorage.getItem('blaze-session') || '{}');
        const analyticsData = JSON.parse(localStorage.getItem('blaze-analytics') || '[]');
        
        return {
            score: scoreData.totalScore || 0,
            classification: scoreData.classification || 'COLD',
            stage: sessionData.conversionStage || 'awareness',
            interests: this.inferInterests(sessionData, analyticsData),
            organization: this.inferOrganization(analyticsData),
            painPoints: this.inferPainPoints(analyticsData),
            engagementLevel: scoreData.breakdown?.engagement || 0
        };
    }

    inferInterests(sessionData, analyticsData) {
        const interests = new Set();
        
        // Analyze page visits
        if (sessionData.pagesVisited?.includes('performance')) interests.add('speed');
        if (sessionData.pagesVisited?.includes('calculator')) interests.add('cost');
        if (sessionData.pagesVisited?.includes('showcase')) interests.add('mlb');
        
        // Analyze click patterns
        analyticsData.forEach(event => {
            if (event.data?.text?.toLowerCase().includes('cardinal')) interests.add('cardinals');
            if (event.data?.text?.toLowerCase().includes('youth')) interests.add('youth');
            if (event.data?.text?.toLowerCase().includes('college')) interests.add('college');
            if (event.data?.text?.toLowerCase().includes('api')) interests.add('technical');
        });
        
        return Array.from(interests);
    }

    inferOrganization(analyticsData) {
        // Analyze calculator usage to infer organization type
        const calcEvents = analyticsData.filter(e => e.event === 'calculator_usage');
        if (calcEvents.length > 0) {
            const lastCalc = calcEvents[calcEvents.length - 1];
            if (lastCalc.data?.field === 'orgType') {
                return lastCalc.data.value;
            }
        }
        
        // Default inference based on behavior
        const totalEvents = analyticsData.length;
        if (totalEvents > 50) return 'enterprise';
        if (totalEvents > 20) return 'college';
        return 'individual';
    }

    inferPainPoints(analyticsData) {
        const painPoints = [];
        
        // Analyze engagement patterns
        const performanceClicks = analyticsData.filter(e => 
            e.data?.href?.includes('performance') || e.data?.text?.includes('speed')
        ).length;
        
        const costClicks = analyticsData.filter(e => 
            e.data?.href?.includes('calculator') || e.data?.text?.includes('cost')
        ).length;
        
        if (performanceClicks > 3) painPoints.push('slow_systems');
        if (costClicks > 2) painPoints.push('high_costs');
        
        return painPoints;
    }

    defineDemoVariations() {
        return {
            speed_focused: {
                headline: '⚡ Experience 2ms Response Times Live',
                subheadline: 'Watch your competition disappear in the rearview',
                primaryDemo: 'performance_comparison',
                emphasis: ['response_time', 'real_time_data', 'instant_insights'],
                cta: 'See Speed Difference Now'
            },
            cost_focused: {
                headline: '💰 Save 25-50% While Getting More',
                subheadline: 'Championship performance at unbeatable value',
                primaryDemo: 'cost_calculator',
                emphasis: ['roi', 'savings', 'value_comparison'],
                cta: 'Calculate Your Savings'
            },
            mlb_focused: {
                headline: '⚾ Live MLB Intelligence in Action',
                subheadline: 'Real-time Cardinals analytics updated every 10 minutes',
                primaryDemo: 'mlb_showcase',
                emphasis: ['live_data', 'cardinals', 'predictive_analytics'],
                cta: 'View Live Cardinals Data'
            },
            technical_focused: {
                headline: '🔧 API-First Architecture Built for Scale',
                subheadline: 'Enterprise-grade infrastructure with 99.94% uptime',
                primaryDemo: 'api_documentation',
                emphasis: ['integration', 'reliability', 'scalability'],
                cta: 'Explore Technical Specs'
            },
            enterprise_focused: {
                headline: '🏢 Enterprise Analytics at Championship Scale',
                subheadline: 'Power your entire organization with unified intelligence',
                primaryDemo: 'enterprise_features',
                emphasis: ['multi_team', 'centralized', 'compliance'],
                cta: 'Request Enterprise Demo'
            }
        };
    }

    defineContentAdaptations() {
        return {
            hot_prospect: {
                urgency: 'high',
                personalMessages: [
                    'Based on your engagement, you\'re ready for championship performance',
                    'Your score indicates you understand the value we deliver',
                    'Let\'s discuss your specific needs immediately'
                ],
                offers: ['personal_demo', 'executive_introduction', 'custom_proposal'],
                showPricing: true,
                showTestimonials: true
            },
            warm_prospect: {
                urgency: 'medium',
                personalMessages: [
                    'You\'ve explored our key differentiators',
                    'See how we solve your specific challenges',
                    'Ready to dive deeper into our capabilities?'
                ],
                offers: ['guided_tour', 'case_study', 'roi_analysis'],
                showPricing: true,
                showTestimonials: true
            },
            qualified_prospect: {
                urgency: 'low',
                personalMessages: [
                    'Discover what makes us different',
                    'Explore at your own pace',
                    'We\'re here when you\'re ready'
                ],
                offers: ['self_guided', 'resources', 'newsletter'],
                showPricing: false,
                showTestimonials: false
            }
        };
    }

    init() {
        this.personalizeCurrentPage();
        this.createPersonalizedElements();
        this.trackPersonalizationEffectiveness();
        this.setupDynamicAdaptation();
    }

    personalizeCurrentPage() {
        const page = window.location.pathname;
        
        // Personalize based on page and profile
        if (page.includes('performance-demo')) {
            this.personalizePerformanceDemo();
        } else if (page.includes('savings-calculator')) {
            this.personalizeSavingsCalculator();
        } else if (page.includes('mlb-intelligence')) {
            this.personalizeMLBShowcase();
        }
        
        // Add universal personalizations
        this.addPersonalizedHeader();
        this.addPersonalizedCTAs();
    }

    personalizePerformanceDemo() {
        const profile = this.prospectProfile;
        
        // Adjust demo emphasis based on interests
        if (profile.interests.includes('speed')) {
            this.emphasizeSpeedMetrics();
        }
        
        if (profile.interests.includes('technical')) {
            this.addTechnicalDetails();
        }
        
        // Personalize messaging
        const heroText = document.querySelector('.hero p');
        if (heroText && profile.classification === 'HOT') {
            heroText.innerHTML = `<strong>${profile.organization?.toUpperCase()} EDITION:</strong> ${heroText.innerHTML}`;
        }
    }

    personalizeSavingsCalculator() {
        const profile = this.prospectProfile;
        
        // Pre-fill calculator based on inferred organization
        if (profile.organization) {
            const orgSelect = document.getElementById('orgType');
            if (orgSelect) {
                orgSelect.value = profile.organization;
                // Trigger calculation update
                if (typeof updateCalculation === 'function') {
                    updateCalculation();
                }
            }
        }
        
        // Add personalized savings message
        if (profile.painPoints.includes('high_costs')) {
            this.addUrgentSavingsMessage();
        }
    }

    personalizeMLBShowcase() {
        const profile = this.prospectProfile;
        
        // Emphasize Cardinals if interested
        if (profile.interests.includes('cardinals')) {
            this.highlightCardinalsSection();
        }
        
        // Add youth/college focus if relevant
        if (profile.interests.includes('youth') || profile.interests.includes('college')) {
            this.addDevelopmentPathwayContent();
        }
    }

    emphasizeSpeedMetrics() {
        // Make speed metrics more prominent
        const speedElements = document.querySelectorAll('[data-metric="speed"], .speed-metric');
        speedElements.forEach(el => {
            el.style.fontSize = '120%';
            el.style.color = '#00ffff';
            el.style.fontWeight = 'bold';
        });
    }

    addTechnicalDetails() {
        // Add technical specification panel
        const techPanel = document.createElement('div');
        techPanel.style.cssText = `
            background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
            border: 1px solid rgba(139,92,246,0.3); padding: 1.5rem; margin: 2rem 0;
            border-radius: 12px;
        `;
        
        techPanel.innerHTML = `
            <h3 style="color: #8b5cf6; margin-bottom: 1rem;">🔧 Technical Specifications</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <strong>API Response:</strong> <2ms average<br>
                    <strong>Data Points:</strong> 2.8M+ live<br>
                    <strong>Update Frequency:</strong> 10 minutes
                </div>
                <div>
                    <strong>Infrastructure:</strong> AWS/Cloudflare<br>
                    <strong>Availability:</strong> 99.94% SLA<br>
                    <strong>Integration:</strong> REST/WebSocket
                </div>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(techPanel, container.children[2]);
        }
    }

    addUrgentSavingsMessage() {
        const savingsAlert = document.createElement('div');
        savingsAlert.style.cssText = `
            background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
            padding: 1rem; margin: 1rem 0; border-radius: 8px; font-weight: bold;
            animation: pulse 2s infinite;
        `;
        
        savingsAlert.innerHTML = `
            🚨 Based on your profile, you could be saving $${Math.floor(Math.random() * 500 + 500)} per month!
        `;
        
        const calculator = document.querySelector('.calculator-panel');
        if (calculator) {
            calculator.parentNode.insertBefore(savingsAlert, calculator);
        }
    }

    highlightCardinalsSection() {
        // Make Cardinals content more prominent
        const cardinalsElements = document.querySelectorAll('*');
        cardinalsElements.forEach(el => {
            if (el.textContent.includes('Cardinals') && !el.querySelector('*')) {
                el.style.background = 'linear-gradient(90deg, rgba(196,30,58,0.2), transparent)';
                el.style.padding = '0.25rem';
                el.style.borderRadius = '4px';
            }
        });
    }

    addDevelopmentPathwayContent() {
        const pathwayPanel = document.createElement('div');
        pathwayPanel.style.cssText = `
            background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1));
            border: 1px solid rgba(16,185,129,0.3); padding: 1.5rem; margin: 2rem 0;
            border-radius: 12px;
        `;
        
        pathwayPanel.innerHTML = `
            <h3 style="color: #10b981; margin-bottom: 1rem;">🎯 Player Development Pathway</h3>
            <p>Track prospects from youth leagues through Perfect Game showcases to college recruitment and MLB draft preparation.</p>
            <ul style="margin: 1rem 0;">
                <li>50,000+ youth players tracked</li>
                <li>Perfect Game integration</li>
                <li>College recruitment analytics</li>
                <li>NIL valuation calculator</li>
            </ul>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(pathwayPanel);
        }
    }

    addPersonalizedHeader() {
        const profile = this.prospectProfile;
        
        // Add personalized welcome message
        const header = document.createElement('div');
        header.id = 'personalized-header';
        header.style.cssText = `
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,46,0.9));
            color: white; padding: 0.75rem 1.5rem; border-radius: 8px; z-index: 999;
            border: 1px solid ${this.getClassificationColor(profile.classification)};
            font-size: 0.9rem; backdrop-filter: blur(10px);
        `;
        
        const messages = this.getPersonalizedMessage();
        header.innerHTML = `
            <span style="color: ${this.getClassificationColor(profile.classification)};">
                ${messages.greeting}
            </span>
            ${messages.action}
        `;
        
        document.body.appendChild(header);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            header.style.opacity = '0';
            setTimeout(() => header.remove(), 500);
        }, 10000);
    }

    getPersonalizedMessage() {
        const profile = this.prospectProfile;
        const hour = new Date().getHours();
        
        let greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        
        const messages = {
            HOT: {
                greeting: `${greeting}, Champion! 🏆`,
                action: 'Your engagement shows you\'re ready for elite performance.'
            },
            WARM: {
                greeting: `${greeting}! 🔥`,
                action: 'You\'re exploring the right features for success.'
            },
            QUALIFIED: {
                greeting: `${greeting}! 👋`,
                action: 'Discover how we revolutionize sports analytics.'
            },
            COLD: {
                greeting: `Welcome to Blaze Intelligence`,
                action: 'Explore championship-level sports analytics.'
            }
        };
        
        return messages[profile.classification] || messages.COLD;
    }

    getClassificationColor(classification) {
        const colors = {
            'HOT': '#ef4444',
            'WARM': '#f59e0b',
            'QUALIFIED': '#10b981',
            'NURTURE': '#3b82f6',
            'COLD': '#6b7280'
        };
        return colors[classification] || '#6b7280';
    }

    addPersonalizedCTAs() {
        const profile = this.prospectProfile;
        
        // Find existing CTAs and enhance them
        const ctaButtons = document.querySelectorAll('a.action-btn, button.test-button');
        
        ctaButtons.forEach(button => {
            if (profile.classification === 'HOT' || profile.classification === 'WARM') {
                // Add urgency indicators
                const urgencyBadge = document.createElement('span');
                urgencyBadge.style.cssText = `
                    position: absolute; top: -8px; right: -8px;
                    background: #ef4444; color: white; font-size: 0.7rem;
                    padding: 0.25rem 0.5rem; border-radius: 12px;
                    animation: pulse 1.5s infinite;
                `;
                urgencyBadge.textContent = 'LIMITED';
                
                button.style.position = 'relative';
                button.appendChild(urgencyBadge);
            }
        });
    }

    createPersonalizedElements() {
        const profile = this.prospectProfile;
        
        // Create floating assistant
        if (profile.classification === 'HOT' || profile.classification === 'WARM') {
            this.createPersonalAssistant();
        }
        
        // Add dynamic recommendations
        this.addDynamicRecommendations();
    }

    createPersonalAssistant() {
        const assistant = document.createElement('div');
        assistant.id = 'blaze-personal-assistant';
        assistant.style.cssText = `
            position: fixed; bottom: 100px; right: 20px; width: 300px;
            background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95));
            color: white; padding: 1.5rem; border-radius: 16px; z-index: 9997;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3); cursor: pointer;
            animation: slideIn 0.5s ease-out;
        `;
        
        const profile = this.prospectProfile;
        assistant.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="margin: 0;">🎯 Personal Assistant</h4>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;
                ">×</button>
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 1rem;">
                Hi! I'm Austin's AI assistant. Based on your ${profile.classification} prospect status, 
                I recommend exploring our ${this.getTopRecommendation()}.
            </p>
            <button onclick="blazePersonalDemo.schedulePersonalDemo()" style="
                width: 100%; background: white; color: #dc2626;
                border: none; padding: 0.75rem; border-radius: 8px;
                font-weight: bold; cursor: pointer;
            ">Schedule Personal Demo</button>
        `;
        
        document.body.appendChild(assistant);
    }

    getTopRecommendation() {
        const interests = this.prospectProfile.interests;
        
        if (interests.includes('speed')) return '2ms performance demo';
        if (interests.includes('cost')) return 'ROI calculator';
        if (interests.includes('mlb')) return 'live MLB intelligence';
        if (interests.includes('technical')) return 'API documentation';
        
        return 'championship features';
    }

    addDynamicRecommendations() {
        const profile = this.prospectProfile;
        
        // Create recommendations panel
        const recoPanel = document.createElement('div');
        recoPanel.style.cssText = `
            background: rgba(0,0,0,0.5); padding: 1.5rem; margin: 2rem 0;
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);
        `;
        
        const recommendations = this.generateRecommendations();
        
        recoPanel.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 1rem;">
                📚 Recommended for You
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${recommendations.map(rec => `
                    <a href="${rec.link}" style="
                        background: linear-gradient(135deg, ${rec.color});
                        color: white; padding: 1rem; border-radius: 8px;
                        text-decoration: none; transition: transform 0.3s;
                        display: block;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${rec.icon}</div>
                        <div style="font-weight: bold;">${rec.title}</div>
                        <div style="font-size: 0.8rem; opacity: 0.9;">${rec.description}</div>
                    </a>
                `).join('')}
            </div>
        `;
        
        // Add to page
        const container = document.querySelector('.container');
        if (container && !document.querySelector('#personalized-recommendations')) {
            recoPanel.id = 'personalized-recommendations';
            container.appendChild(recoPanel);
        }
    }

    generateRecommendations() {
        const profile = this.prospectProfile;
        const recommendations = [];
        
        // Base recommendations on profile
        if (!profile.interests.includes('speed')) {
            recommendations.push({
                title: 'Performance Demo',
                description: 'See 2ms response times live',
                link: '/performance-demo.html',
                icon: '⚡',
                color: 'rgba(0,255,255,0.3), rgba(0,150,255,0.3)'
            });
        }
        
        if (!profile.interests.includes('cost')) {
            recommendations.push({
                title: 'Savings Calculator',
                description: 'Calculate your ROI',
                link: '/savings-calculator.html',
                icon: '💰',
                color: 'rgba(16,185,129,0.3), rgba(5,150,105,0.3)'
            });
        }
        
        if (!profile.interests.includes('mlb')) {
            recommendations.push({
                title: 'MLB Intelligence',
                description: 'Live Cardinals analytics',
                link: '/mlb-intelligence-showcase.html',
                icon: '⚾',
                color: 'rgba(196,30,58,0.3), rgba(12,35,64,0.3)'
            });
        }
        
        // Always recommend contact for hot prospects
        if (profile.classification === 'HOT' || profile.classification === 'WARM') {
            recommendations.push({
                title: 'Personal Demo',
                description: 'Get a custom walkthrough',
                link: 'mailto:ahump20@outlook.com?subject=Personal Demo Request',
                icon: '🎯',
                color: 'rgba(239,68,68,0.3), rgba(220,38,38,0.3)'
            });
        }
        
        return recommendations.slice(0, 3); // Max 3 recommendations
    }

    trackPersonalizationEffectiveness() {
        // Track which personalizations lead to conversions
        document.addEventListener('click', (e) => {
            if (e.target.closest('#personalized-recommendations')) {
                this.logPersonalizationEvent('recommendation_clicked', {
                    recommendation: e.target.textContent,
                    profile: this.prospectProfile.classification
                });
            }
            
            if (e.target.closest('#blaze-personal-assistant')) {
                this.logPersonalizationEvent('assistant_engaged', {
                    profile: this.prospectProfile.classification
                });
            }
        });
    }

    setupDynamicAdaptation() {
        // Adapt content in real-time based on behavior
        setInterval(() => {
            // Reload profile to get latest data
            this.prospectProfile = this.loadProspectProfile();
            
            // Check if classification changed
            const currentClass = this.prospectProfile.classification;
            const lastClass = localStorage.getItem('blaze-last-classification');
            
            if (currentClass !== lastClass && currentClass === 'HOT') {
                this.triggerHotProspectExperience();
                localStorage.setItem('blaze-last-classification', currentClass);
            }
        }, 30000); // Check every 30 seconds
    }

    triggerHotProspectExperience() {
        // Transform the page for hot prospects
        console.log('🔥 HOT PROSPECT DETECTED - Activating VIP Experience');
        
        // Add VIP badge
        const vipBadge = document.createElement('div');
        vipBadge.style.cssText = `
            position: fixed; top: 20px; left: 20px; z-index: 10000;
            background: linear-gradient(45deg, #fbbf24, #f59e0b); color: white;
            padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: glow 2s infinite;
        `;
        vipBadge.innerHTML = '⭐ VIP PROSPECT STATUS';
        document.body.appendChild(vipBadge);
        
        // Show priority contact
        setTimeout(() => {
            this.showPriorityContact();
        }, 5000);
    }

    showPriorityContact() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;
            background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                padding: 3rem; border-radius: 20px; text-align: center; max-width: 600px;
                box-shadow: 0 20px 60px rgba(251,191,36,0.5);
            ">
                <h2 style="color: white; margin-bottom: 1rem; font-size: 2rem;">
                    ⭐ VIP Direct Line Available
                </h2>
                <p style="color: white; margin-bottom: 2rem; font-size: 1.2rem;">
                    Austin wants to personally show you our championship platform.<br>
                    <strong>Priority response guaranteed within 15 minutes.</strong>
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="tel:+12102735538" style="
                        background: white; color: #f59e0b;
                        padding: 1.5rem 2rem; border-radius: 12px;
                        text-decoration: none; font-weight: bold; font-size: 1.1rem;
                    ">📞 Call Direct: (210) 273-5538</a>
                    <a href="mailto:ahump20@outlook.com?subject=VIP Demo - Priority Response&body=Hi Austin, I'm a VIP prospect (Score: ${this.prospectProfile.score}). I'd like to schedule an immediate demo." style="
                        background: rgba(255,255,255,0.2); color: white;
                        border: 2px solid white; padding: 1.5rem 2rem;
                        border-radius: 12px; text-decoration: none; font-weight: bold;
                        font-size: 1.1rem;
                    ">📧 Priority Email</a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    margin-top: 1rem; background: none; border: 1px solid rgba(255,255,255,0.5);
                    color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;
                ">Continue Browsing</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    schedulePersonalDemo() {
        const profile = this.prospectProfile;
        
        const subject = `Personal Demo Request - ${profile.classification} Prospect`;
        const body = `Hi Austin,

I'm interested in a personal demo of Blaze Intelligence.

My Profile:
- Classification: ${profile.classification}
- Score: ${profile.score}
- Primary Interests: ${profile.interests.join(', ')}
- Organization Type: ${profile.organization}
- Current Stage: ${profile.stage}

I'd like to learn more about your championship platform.

Best regards`;

        window.location.href = `mailto:ahump20@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        this.logPersonalizationEvent('personal_demo_requested', {
            profile: profile.classification,
            score: profile.score
        });
    }

    logPersonalizationEvent(event, data) {
        console.log('🎯 Personalization Event:', event, data);
        
        // Store for analysis
        const events = JSON.parse(localStorage.getItem('blaze-personalization-events') || '[]');
        events.push({
            event,
            data,
            timestamp: Date.now()
        });
        
        if (events.length > 100) events.shift();
        localStorage.setItem('blaze-personalization-events', JSON.stringify(events));
    }
}

// Auto-initialize personalized demo
let blazePersonalDemo;
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure other systems are loaded
    setTimeout(() => {
        blazePersonalDemo = new BlazePersonalizedDemo();
    }, 4000);
});

// Global access
window.BlazePersonalizedDemo = BlazePersonalizedDemo;
window.blazePersonalDemo = blazePersonalDemo;