// Performance optimization script for Blaze Intelligence
// Reduces loading issues and improves website performance

(function() {
    'use strict';

    // Preload critical resources
    function preloadResources() {
        const criticalResources = [
            '/public/css/enhanced-visuals.css',
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
        ];

        criticalResources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = url.endsWith('.css') ? 'style' : 'script';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    // Optimize images and lazy loading
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
            if (!img.decoding) {
                img.decoding = 'async';
            }
        });
    }

    // Reduce layout shifts
    function preventLayoutShifts() {
        // Reserve space for dynamic content
        const dynamicElements = document.querySelectorAll('.live-stats-card, .metric-card, .chart-container');
        dynamicElements.forEach(element => {
            if (!element.style.minHeight) {
                element.style.minHeight = element.offsetHeight > 0 ? element.offsetHeight + 'px' : '200px';
            }
        });
    }

    // Optimize animations for performance
    function optimizeAnimations() {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // Disable complex animations
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Clean up unused event listeners and intervals
    function cleanupResources() {
        // Store active intervals for cleanup
        window.blazeIntervals = window.blazeIntervals || [];
        
        // Override setInterval to track intervals
        const originalSetInterval = window.setInterval;
        window.setInterval = function(callback, delay) {
            const intervalId = originalSetInterval(callback, delay);
            window.blazeIntervals.push(intervalId);
            return intervalId;
        };

        // Cleanup function
        window.cleanupBlaze = function() {
            window.blazeIntervals.forEach(id => clearInterval(id));
            window.blazeIntervals = [];
        };
    }

    // Initialize performance optimizations
    function init() {
        // Run immediately for critical path
        preloadResources();
        optimizeAnimations();
        cleanupResources();

        // Run after DOM content loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                optimizeImages();
                preventLayoutShifts();
            });
        } else {
            optimizeImages();
            preventLayoutShifts();
        }

        // Run after window load for non-critical optimizations
        window.addEventListener('load', () => {
            // Additional optimizations after full page load
            setTimeout(() => {
                preventLayoutShifts(); // Re-run in case content loaded dynamically
            }, 1000);
        });

        // Handle page visibility for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, reduce resource usage
                if (window.blazeHeroViz && window.blazeHeroViz.renderer) {
                    window.blazeHeroViz.renderer.setAnimationLoop(null);
                }
            } else {
                // Page is visible, resume animations
                if (window.blazeHeroViz && window.blazeHeroViz.animate) {
                    window.blazeHeroViz.animate();
                }
            }
        });
    }

    // Connection-aware loading
    if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection && connection.effectiveType) {
            // Adjust quality based on connection
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                // Reduce quality for slow connections
                document.documentElement.style.setProperty('--animation-duration', '0.01ms');
                document.documentElement.classList.add('low-bandwidth');
            }
        }
    }

    // Initialize optimizations
    init();

    // Export for debugging
    window.BlazeOptimizer = {
        preloadResources,
        optimizeImages,
        preventLayoutShifts,
        optimizeAnimations,
        cleanupResources
    };

})();