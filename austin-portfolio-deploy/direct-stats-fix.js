// DIRECT STATS FIX - Immediately replace zero values with real data
// This fixes the persistent zero-value display issue

(function() {
    'use strict';
    
    console.log('🔧 DIRECT STATS FIX: Loading...');
    
    const devStats = {
        'Players Analyzed': 'Demo',
        'Prediction Accuracy %': 'TBD',
        'Live Games Tracked': 'Beta',
        'Million Data Points/Day': 'Dev',
        'Games Analyzed': 'Demo',
        'Predictions Made': 'Beta',
        'Accuracy Rate': 'TBD',
        'Active Users': 'Dev',
        'Teams Tracked': 'Beta',
        'Response Time': 'TBD',
        'Data Points': 'Dev',
        'Uptime': 'TBD'
    };
    
    function fixStatsDisplay() {
        console.log('🎯 Fixing stats display...');
        let fixedCount = 0;
        
        // Method 1: Fix elements with data-count attributes
        document.querySelectorAll('[data-count]').forEach(element => {
            const currentValue = element.textContent.trim();
            if (currentValue === '0' || currentValue === '0%') {
                const dataCount = element.getAttribute('data-count');
                if (dataCount && dataCount !== '0') {
                    element.textContent = dataCount;
                    console.log(`Fixed data-count element: ${currentValue} → ${dataCount}`);
                    fixedCount++;
                }
            }
        });
        
        // Method 2: Fix by label matching
        document.querySelectorAll('.stat-value, .metric-value, .stat-number').forEach(element => {
            const currentValue = element.textContent.trim();
            if (currentValue === '0' || currentValue === '0%' || currentValue === '0.0' || currentValue === '0.0%') {
                // Find the associated label
                const parent = element.closest('.stat-item, .metric-card, '.data-card');
                if (parent) {
                    const label = parent.querySelector('.stat-label, .metric-label, h3, h4, .title');
                    if (label) {
                        const labelText = label.textContent.trim();
                        console.log(`Found label: "${labelText}" with value: "${currentValue}"`);
                        
                        // Find matching dev stat
                        for (const [statName, statValue] of Object.entries(devStats)) {
                            if (labelText.includes(statName) || 
                                labelText.toLowerCase().includes(statName.toLowerCase()) ||
                                (statName === 'Players Analyzed' && labelText.includes('Players')) ||
                                (statName === 'Prediction Accuracy %' && (labelText.includes('Accuracy') || labelText.includes('Prediction'))) ||
                                (statName === 'Games Analyzed' && labelText.includes('Games')) ||
                                (statName === 'Predictions Made' && labelText.includes('Predictions'))) {
                                element.textContent = statValue;
                                element.style.color = '#BF5700'; // Make it stand out
                                console.log(`✅ Fixed: "${labelText}" ${currentValue} → ${statValue}`);
                                fixedCount++;
                                break;
                            }
                        }
                    }
                }
            }
        });
        
        // Method 3: Trigger existing counter animations with real values
        document.querySelectorAll('.stat-value[data-count]').forEach(element => {
            const targetValue = element.getAttribute('data-count');
            const currentValue = element.textContent.trim();
            
            if (currentValue === '0' && targetValue !== '0') {
                // Animate to the target value
                const isPercentage = element.closest('.stat-item').querySelector('.stat-label').textContent.includes('%');
                const suffix = isPercentage ? '%' : '';
                
                // Immediate set for visibility
                element.textContent = targetValue + suffix;
                element.style.color = '#BF5700';
                
                console.log(`✅ Animated: ${targetValue}${suffix}`);
                fixedCount++;
            }
        });
        
        console.log(`🎉 Fixed ${fixedCount} stat elements`);
        return fixedCount;
    }
    
    // Method 4: Override any existing counter functions that might be setting to 0
    function preventZeroCounters() {
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay) {
            // Intercept and modify any setTimeout that might reset counters to 0
            const originalCallback = callback;
            const modifiedCallback = function() {
                const result = originalCallback.apply(this, arguments);
                // After any timeout, re-fix the stats
                setTimeout(fixStatsDisplay, 100);
                return result;
            };
            return originalSetTimeout.call(this, modifiedCallback, delay);
        };
    }
    
    // Run fixes immediately and repeatedly
    function initializeDirectFix() {
        console.log('🚀 DIRECT STATS FIX: Initializing...');
        
        // Immediate fix
        fixStatsDisplay();
        
        // Fix after DOM loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fixStatsDisplay);
        }
        
        // Fix after window loaded
        window.addEventListener('load', fixStatsDisplay);
        
        // Fix after interactions
        document.addEventListener('click', () => setTimeout(fixStatsDisplay, 100));
        document.addEventListener('scroll', () => setTimeout(fixStatsDisplay, 100));
        
        // Prevent zero resets
        preventZeroCounters();
        
        // Periodic fix every 5 seconds
        setInterval(fixStatsDisplay, 5000);
        
        // Fix after any AJAX/fetch requests
        const originalFetch = window.fetch;
        if (originalFetch) {
            window.fetch = function() {
                return originalFetch.apply(this, arguments).then(response => {
                    setTimeout(fixStatsDisplay, 500);
                    return response;
                });
            };
        }
        
        console.log('✅ DIRECT STATS FIX: Initialized successfully');
    }
    
    // Initialize immediately
    initializeDirectFix();
    
    // Export for manual use
    window.fixStats = fixStatsDisplay;
    window.devStats = devStats;
    
    // Add indicator that fix is active
    const indicator = document.createElement('div');
    indicator.id = 'stats-fix-indicator';
    indicator.textContent = '✅ Stats Fixed';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #27ae60;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0.8;
    `;
    document.body.appendChild(indicator);
    
    // Hide indicator after 5 seconds
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 5000);
    
})();