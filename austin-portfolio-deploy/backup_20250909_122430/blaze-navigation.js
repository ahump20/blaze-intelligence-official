/**
 * Blaze Intelligence Navigation & Conversion System
 * Unified navigation and prospect tracking across all pages
 */

class BlazeNavigation {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.sessionData = this.loadSessionData();
        this.init();
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('performance-demo')) return 'performance';
        if (path.includes('savings-calculator')) return 'calculator';
        if (path.includes('mlb-intelligence-showcase')) return 'showcase';
        if (path.includes('sources-methods')) return 'sources';
        return 'home';
    }

    loadSessionData() {
        const saved = localStorage.getItem('blaze-session');
        return saved ? JSON.parse(saved) : {
            visitCount: 0,
            pagesVisited: [],
            timeSpent: {},
            lastVisit: null,
            conversionStage: 'awareness'
        };
    }

    saveSessionData() {
        this.sessionData.lastVisit = new Date().toISOString();
        localStorage.setItem('blaze-session', JSON.stringify(this.sessionData));
    }

    init() {
        this.trackPageVisit();
        this.addNavigationBar();
        this.addConversionPrompts();
        this.trackEngagement();
        this.startSessionTimer();
    }

    trackPageVisit() {
        this.sessionData.visitCount++;
        if (!this.sessionData.pagesVisited.includes(this.currentPage)) {
            this.sessionData.pagesVisited.push(this.currentPage);
        }
        
        // Update conversion stage based on page progression
        this.updateConversionStage();
        this.saveSessionData();
    }

    updateConversionStage() {
        const visited = this.sessionData.pagesVisited;
        
        if (visited.includes('performance') && visited.includes('calculator') && visited.includes('showcase')) {
            this.sessionData.conversionStage = 'decision';
        } else if (visited.includes('performance') || visited.includes('calculator')) {
            this.sessionData.conversionStage = 'consideration';
        } else {
            this.sessionData.conversionStage = 'awareness';
        }
    }

    addNavigationBar() {
        const nav = document.createElement('div');
        nav.id = 'blaze-nav';
        nav.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: linear-gradient(90deg, rgba(0,0,0,0.95), rgba(26,26,46,0.95));
            backdrop-filter: blur(10px); padding: 0.75rem 2rem;
            border-bottom: 1px solid rgba(0,255,255,0.3);
            display: flex; justify-content: space-between; align-items: center;
            animation: slideDown 0.5s ease-out;
        `;

        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 2rem;">
                <div style="font-weight: 900; color: #00ffff; font-size: 1.2rem;">
                    🔥 Blaze Intelligence
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                    <a href="/performance-demo.html" class="nav-link ${this.currentPage === 'performance' ? 'active' : ''}" data-page="performance">⚡ Performance</a>
                    <a href="/savings-calculator.html" class="nav-link ${this.currentPage === 'calculator' ? 'active' : ''}" data-page="calculator">💰 Calculator</a>
                    <a href="/mlb-intelligence-showcase.html" class="nav-link ${this.currentPage === 'showcase' ? 'active' : ''}" data-page="showcase">⚾ MLB Intel</a>
                    <a href="/sources-methods.html" class="nav-link ${this.currentPage === 'sources' ? 'active' : ''}" data-page="sources">📊 Research</a>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.8rem;">
                <div style="color: #10b981;">
                    Stage: <strong>${this.sessionData.conversionStage.toUpperCase()}</strong>
                </div>
                <div style="color: #94a3b8;">
                    Pages: ${this.sessionData.pagesVisited.length}/4
                </div>
                <button onclick="blazeNav.requestDemo()" style="
                    background: linear-gradient(45deg, #10b981, #059669);
                    color: white; border: none; padding: 0.5rem 1rem;
                    border-radius: 6px; font-weight: bold; cursor: pointer;
                ">Request Demo</button>
            </div>
        `;

        // Add CSS for nav links
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .nav-link {
                color: #e2e8f0; text-decoration: none; padding: 0.5rem 1rem;
                border-radius: 6px; transition: all 0.3s ease;
            }
            .nav-link:hover {
                background: rgba(0,255,255,0.1); color: #00ffff;
            }
            .nav-link.active {
                background: rgba(0,255,255,0.2); color: #00ffff; font-weight: bold;
            }
            body { margin-top: 80px !important; }
        `;
        document.head.appendChild(style);

        // Insert at top of page
        document.body.insertBefore(nav, document.body.firstChild);
    }

    addConversionPrompts() {
        // Add page-specific conversion prompts
        setTimeout(() => {
            this.showConversionPrompt();
        }, 30000); // After 30 seconds on page
    }

    showConversionPrompt() {
        const prompts = {
            awareness: {
                title: "👋 New to Blaze Intelligence?",
                message: "See why we're 250x faster than competitors with 2ms response times.",
                cta: "View Performance Demo",
                link: "/performance-demo.html"
            },
            consideration: {
                title: "💰 Ready to Calculate Savings?",
                message: "You've seen our speed. Now calculate your 25-50% cost savings.",
                cta: "Calculate My Savings",
                link: "/savings-calculator.html"
            },
            decision: {
                title: "🎯 Ready for Live MLB Intelligence?",
                message: "You've seen the speed and savings. Experience live Cardinals analytics.",
                cta: "MLB Intelligence Demo",
                link: "/mlb-intelligence-showcase.html"
            }
        };

        const prompt = prompts[this.sessionData.conversionStage];
        if (!prompt) return;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                padding: 3rem; border-radius: 16px; text-align: center; max-width: 500px;
                border: 2px solid rgba(0,255,255,0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h2 style="color: #00ffff; margin-bottom: 1rem; font-size: 1.5rem;">${prompt.title}</h2>
                <p style="color: #e2e8f0; margin-bottom: 2rem; line-height: 1.6;">${prompt.message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="${prompt.link}" style="
                        background: linear-gradient(45deg, #00ffff, #ff8c00);
                        color: white; padding: 1rem 2rem; border-radius: 8px;
                        text-decoration: none; font-weight: bold;
                    ">${prompt.cta}</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.1); color: #e2e8f0;
                        border: 1px solid rgba(255,255,255,0.2); padding: 1rem 2rem;
                        border-radius: 8px; cursor: pointer;
                    ">Maybe Later</button>
                </div>
            </div>
        `;

        // Add fadeIn animation
        if (!document.querySelector('#fadeInAnimation')) {
            const fadeStyle = document.createElement('style');
            fadeStyle.id = 'fadeInAnimation';
            fadeStyle.textContent = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
            document.head.appendChild(fadeStyle);
        }

        document.body.appendChild(modal);

        // Track prompt display
        this.trackEvent('conversion_prompt_shown', { stage: this.sessionData.conversionStage });
    }

    trackEngagement() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            maxScroll = Math.max(maxScroll, scrollPercent);
        });

        // Track button clicks
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                this.trackEvent('element_clicked', {
                    element: e.target.textContent.trim(),
                    page: this.currentPage
                });
            }
        });

        // Save engagement data on page unload
        window.addEventListener('beforeunload', () => {
            this.sessionData.engagement = {
                maxScrollPercent: maxScroll,
                timeSpent: this.getTimeSpent(),
                interactions: this.sessionData.interactions || 0
            };
            this.saveSessionData();
        });
    }

    startSessionTimer() {
        this.sessionStart = Date.now();
    }

    getTimeSpent() {
        return Math.round((Date.now() - this.sessionStart) / 1000); // seconds
    }

    trackEvent(event, data = {}) {
        // Simple event tracking (could integrate with analytics)
        console.log('Blaze Analytics:', event, data);
        
        if (!this.sessionData.events) this.sessionData.events = [];
        this.sessionData.events.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            page: this.currentPage
        });
        
        this.saveSessionData();
    }

    requestDemo() {
        this.trackEvent('demo_requested', { stage: this.sessionData.conversionStage });
        
        const subject = `MLB Intelligence Demo Request - ${this.sessionData.conversionStage} stage`;
        const body = `Hello Austin,

I'm interested in a Blaze Intelligence demo.

My current stage: ${this.sessionData.conversionStage}
Pages visited: ${this.sessionData.pagesVisited.join(', ')}
Total visits: ${this.sessionData.visitCount}

I'm particularly interested in:
[ ] Performance demonstrations (2ms response times)
[ ] Cost savings analysis (25-50% verified savings)
[ ] Live MLB intelligence capabilities
[ ] Research methodology and sources

Looking forward to seeing championship-level sports analytics in action.

Best regards`;

        window.location.href = `mailto:ahump20@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    // Add progress indicator for multi-page journey
    addProgressIndicator() {
        const progress = document.createElement('div');
        progress.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 1000;
            background: rgba(0,0,0,0.8); color: white; padding: 1rem;
            border-radius: 8px; font-size: 0.8rem;
            border: 1px solid rgba(0,255,255,0.3);
        `;

        const completedPages = this.sessionData.pagesVisited.length;
        const totalPages = 4;
        const percentage = Math.round((completedPages / totalPages) * 100);

        progress.innerHTML = `
            <div style="margin-bottom: 0.5rem; font-weight: bold;">Discovery Progress</div>
            <div style="background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="
                    width: ${percentage}%; height: 100%; 
                    background: linear-gradient(90deg, #00ffff, #10b981);
                    transition: width 0.5s ease;
                "></div>
            </div>
            <div style="margin-top: 0.5rem; color: #94a3b8;">
                ${completedPages}/${totalPages} experiences completed (${percentage}%)
            </div>
        `;

        document.body.appendChild(progress);
    }
}

// Auto-initialize on page load
let blazeNav;
document.addEventListener('DOMContentLoaded', () => {
    blazeNav = new BlazeNavigation();
    blazeNav.addProgressIndicator();
});

// Export for global access
window.BlazeNavigation = BlazeNavigation;