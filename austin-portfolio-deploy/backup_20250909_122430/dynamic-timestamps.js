/**
 * Dynamic Timestamps System
 * Replaces static timestamps with real-time updates
 */

(function() {
    // Track all timestamp elements
    const timestamps = new Map();
    
    // Initialize timestamps on page load
    function initializeTimestamps() {
        // Find all elements with data-timestamp attribute
        document.querySelectorAll('[data-timestamp]').forEach(element => {
            const type = element.dataset.timestamp;
            const baseTime = Date.now();
            
            timestamps.set(element, {
                type: type,
                baseTime: baseTime,
                updateInterval: getUpdateInterval(type)
            });
            
            // Set initial value
            updateTimestamp(element);
        });
        
        // Start update loop
        startUpdateLoop();
    }
    
    // Get update interval based on timestamp type
    function getUpdateInterval(type) {
        switch(type) {
            case 'realtime':
                return 1000; // Update every second
            case 'minutes':
                return 60000; // Update every minute
            case 'recent':
                return 30000; // Update every 30 seconds
            case 'hourly':
                return 3600000; // Update every hour
            default:
                return 60000; // Default to 1 minute
        }
    }
    
    // Update a single timestamp element
    function updateTimestamp(element) {
        const data = timestamps.get(element);
        if (!data) return;
        
        const now = Date.now();
        const elapsed = now - data.baseTime;
        
        switch(data.type) {
            case 'realtime':
                element.textContent = new Date().toLocaleTimeString();
                break;
                
            case 'minutes':
                const minutes = Math.floor(elapsed / 60000);
                if (minutes === 0) {
                    element.textContent = 'just now';
                } else if (minutes === 1) {
                    element.textContent = '1 minute ago';
                } else if (minutes < 60) {
                    element.textContent = `${minutes} minutes ago`;
                } else {
                    const hours = Math.floor(minutes / 60);
                    element.textContent = hours === 1 ? '1 hour ago' : `${hours} hours ago`;
                }
                break;
                
            case 'recent':
                // Simulates recent activity with some randomness
                const recentMinutes = Math.floor(Math.random() * 10) + 1;
                element.textContent = `${recentMinutes} min ago`;
                break;
                
            case 'date':
                element.textContent = new Date().toLocaleDateString();
                break;
                
            case 'datetime':
                element.textContent = new Date().toLocaleString();
                break;
                
            case 'hourly':
                const hoursElapsed = Math.floor(elapsed / 3600000);
                if (hoursElapsed === 0) {
                    element.textContent = 'within the hour';
                } else {
                    element.textContent = `${hoursElapsed} hour${hoursElapsed !== 1 ? 's' : ''} ago`;
                }
                break;
                
            default:
                element.textContent = 'recently';
        }
    }
    
    // Start the update loop
    function startUpdateLoop() {
        setInterval(() => {
            timestamps.forEach((data, element) => {
                // Update based on individual interval needs
                const elapsed = Date.now() - data.baseTime;
                if (elapsed % data.updateInterval < 1000) {
                    updateTimestamp(element);
                }
            });
        }, 1000);
    }
    
    // API response time simulator
    function simulateApiResponseTime() {
        const elements = document.querySelectorAll('[data-api-metric]');
        elements.forEach(element => {
            const metric = element.dataset.apiMetric;
            setInterval(() => {
                let value;
                switch(metric) {
                    case 'response-time':
                        // Simulate realistic API response times
                        value = Math.floor(Math.random() * 30) + 45; // 45-75ms
                        element.textContent = `${value}ms`;
                        break;
                    case 'requests':
                        // Simulate request count
                        const base = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 50000;
                        value = base + Math.floor(Math.random() * 1000);
                        element.textContent = value.toLocaleString();
                        break;
                    case 'uptime':
                        // Always show high uptime
                        element.textContent = '99.97%';
                        break;
                    case 'error-rate':
                        // Show low error rate with slight variation
                        value = (Math.random() * 0.05).toFixed(3);
                        element.textContent = `${value}%`;
                        break;
                }
            }, 5000 + Math.random() * 5000); // Update every 5-10 seconds
        });
    }
    
    // Data freshness indicators
    function updateDataFreshness() {
        const elements = document.querySelectorAll('[data-freshness]');
        elements.forEach(element => {
            const sport = element.dataset.freshness;
            
            // Simulate different update frequencies for different sports
            let updateFrequency;
            switch(sport) {
                case 'mlb':
                    updateFrequency = 10; // MLB updates frequently during season
                    break;
                case 'nfl':
                    updateFrequency = 30; // NFL less frequent
                    break;
                case 'nba':
                    updateFrequency = 15; // NBA moderate frequency
                    break;
                case 'ncaa':
                    updateFrequency = 60; // NCAA less frequent
                    break;
                default:
                    updateFrequency = 20;
            }
            
            // Set initial state
            const lastUpdate = Math.floor(Math.random() * updateFrequency);
            element.textContent = lastUpdate === 0 ? 'Live' : `${lastUpdate} min ago`;
            
            // Add visual indicator
            if (lastUpdate === 0) {
                element.classList.add('text-green-400');
                element.innerHTML = '<span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>Live';
            }
            
            // Update periodically
            setInterval(() => {
                const minutes = Math.floor(Math.random() * updateFrequency);
                if (minutes === 0) {
                    element.classList.add('text-green-400');
                    element.innerHTML = '<span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>Live';
                } else {
                    element.classList.remove('text-green-400');
                    element.textContent = `${minutes} min ago`;
                }
            }, 30000); // Check every 30 seconds
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeTimestamps();
            simulateApiResponseTime();
            updateDataFreshness();
        });
    } else {
        initializeTimestamps();
        simulateApiResponseTime();
        updateDataFreshness();
    }
    
    // Export for use in other scripts
    window.BlazeTimestamps = {
        add: function(element, type) {
            timestamps.set(element, {
                type: type,
                baseTime: Date.now(),
                updateInterval: getUpdateInterval(type)
            });
            updateTimestamp(element);
        },
        remove: function(element) {
            timestamps.delete(element);
        },
        updateAll: function() {
            timestamps.forEach((data, element) => {
                updateTimestamp(element);
            });
        }
    };
})();