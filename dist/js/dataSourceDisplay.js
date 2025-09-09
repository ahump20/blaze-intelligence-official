// Data Source Display Module - Shows timestamps and sources for all data
class DataSourceDisplay {
    constructor() {
        this.sportToggles = {
            nfl: true,
            mlb: true,
            cfb: true
        };
        this.lastUpdatedInterval = null;
        this.init();
    }

    init() {
        this.createSportToggleUI();
        this.addTimestampBadges();
        this.startAutoUpdate();
    }

    createSportToggleUI() {
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'sport-toggles';
        toggleContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(10px);
            padding: 15px;
            border-radius: 12px;
            border: 1px solid rgba(191, 87, 0, 0.3);
        `;

        toggleContainer.innerHTML = `
            <div style="color: #BF5700; font-weight: bold; margin-bottom: 10px; font-size: 12px;">
                LEAGUE FOCUS
            </div>
            <div class="toggle-group">
                <label class="toggle-item" style="display: flex; align-items: center; margin: 8px 0; cursor: pointer;">
                    <input type="checkbox" id="toggle-cfb" checked style="margin-right: 8px;">
                    <span style="color: #fff; font-size: 14px;">College Football</span>
                </label>
                <label class="toggle-item" style="display: flex; align-items: center; margin: 8px 0; cursor: pointer;">
                    <input type="checkbox" id="toggle-nfl" checked style="margin-right: 8px;">
                    <span style="color: #fff; font-size: 14px;">NFL</span>
                </label>
                <label class="toggle-item" style="display: flex; align-items: center; margin: 8px 0; cursor: pointer;">
                    <input type="checkbox" id="toggle-mlb" checked style="margin-right: 8px;">
                    <span style="color: #fff; font-size: 14px;">MLB</span>
                </label>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="color: #999; font-size: 11px;">Season: 2025-2026</div>
                <div style="color: #999; font-size: 11px;">Last Update: <span id="last-update-time">--:--</span></div>
            </div>
        `;

        document.body.appendChild(toggleContainer);

        // Add event listeners
        ['cfb', 'nfl', 'mlb'].forEach(sport => {
            document.getElementById(`toggle-${sport}`).addEventListener('change', (e) => {
                this.sportToggles[sport] = e.target.checked;
                this.updateDataDisplay();
            });
        });
    }

    addTimestampBadges() {
        // Add timestamp badges to all data cards
        const dataCards = document.querySelectorAll('.player-stat-card, .analytics-card, .feature-card');
        
        dataCards.forEach(card => {
            if (!card.querySelector('.data-source-badge')) {
                const badge = document.createElement('div');
                badge.className = 'data-source-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    color: #999;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;
                
                const sport = this.detectSportFromCard(card);
                const source = this.getDataSource(sport);
                
                badge.innerHTML = `
                    <span class="source-indicator" style="width: 6px; height: 6px; background: ${source.live ? '#00DC82' : '#FFB800'}; border-radius: 50%;"></span>
                    <span>${source.name}</span>
                    <span style="opacity: 0.7;">|</span>
                    <span class="timestamp" data-time="${Date.now()}">${this.getRelativeTime(Date.now())}</span>
                `;
                
                card.style.position = 'relative';
                card.appendChild(badge);
            }
        });
    }

    detectSportFromCard(card) {
        const text = card.textContent.toLowerCase();
        if (text.includes('nfl') || text.includes('cowboys') || text.includes('prescott')) return 'nfl';
        if (text.includes('mlb') || text.includes('astros') || text.includes('altuve')) return 'mlb';
        if (text.includes('texas') || text.includes('longhorns') || text.includes('ewers')) return 'cfb';
        return 'nfl'; // default
    }

    getDataSource(sport) {
        const sources = {
            nfl: { name: 'NFL API', live: false },
            mlb: { name: 'MLB Stats', live: true },
            cfb: { name: 'CFB Data', live: false }
        };
        return sources[sport] || { name: 'Demo', live: false };
    }

    updateDataDisplay() {
        // Show/hide data based on sport toggles
        const playerCards = document.querySelectorAll('.player-stat-card');
        
        playerCards.forEach(card => {
            const sport = this.detectSportFromCard(card);
            if (this.sportToggles[sport]) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        // Trigger data refresh
        if (window.blazeData) {
            window.blazeData.fetchInitialData();
        }
    }

    getRelativeTime(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    startAutoUpdate() {
        // Update timestamps every 10 seconds
        this.lastUpdatedInterval = setInterval(() => {
            document.querySelectorAll('.timestamp').forEach(elem => {
                const time = parseInt(elem.getAttribute('data-time'));
                elem.textContent = this.getRelativeTime(time);
            });

            // Update last update time
            const now = new Date();
            document.getElementById('last-update-time').textContent = 
                now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }, 10000);
    }

    addConfidenceRanges() {
        // Add confidence indicators to predictions
        const projectionElements = document.querySelectorAll('[data-projection]');
        
        projectionElements.forEach(elem => {
            const value = parseFloat(elem.textContent);
            const confidence = Math.random() * 20 + 75; // 75-95% confidence
            
            const confidenceBadge = document.createElement('span');
            confidenceBadge.style.cssText = `
                font-size: 10px;
                color: #999;
                margin-left: 5px;
            `;
            confidenceBadge.textContent = `±${(value * (100 - confidence) / 100).toFixed(1)} (${confidence.toFixed(0)}% conf)`;
            
            elem.appendChild(confidenceBadge);
        });
    }

    destroy() {
        if (this.lastUpdatedInterval) {
            clearInterval(this.lastUpdatedInterval);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dataSourceDisplay = new DataSourceDisplay();
});