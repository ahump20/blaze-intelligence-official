// Theme Manager - Light/Dark Mode Toggle
// Improves accessibility and user experience

class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        console.log('🎨 Initializing Theme Manager');
        this.loadSavedTheme();
        this.setupThemeToggle();
        this.addThemeCSS();
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('blazeTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
        }
    }

    setupThemeToggle() {
        // Add theme toggle to navbar
        this.addThemeToggleToNav();
        
        // Listen for toggle events
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle')) {
                this.toggleTheme();
            }
        });
    }

    addThemeToggleToNav() {
        const navbar = document.querySelector('#navbar, nav');
        if (!navbar) return;

        // Check if theme toggle already exists
        if (document.getElementById('themeToggle')) return;

        const themeToggleHTML = `
            <div class="nav-controls" style="margin-left: auto; display: flex; align-items: center;">
                <button id="themeToggle" class="theme-toggle" title="Toggle light/dark theme" aria-label="Toggle theme">
                    <span class="theme-icon">${this.currentTheme === 'dark' ? '🌙' : '☀️'}</span>
                </button>
            </div>
        `;

        // Insert at the end of navbar
        navbar.insertAdjacentHTML('beforeend', themeToggleHTML);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.currentTheme = newTheme;
        localStorage.setItem('blazeTheme', newTheme);
        
        // Update toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Announce theme change for screen readers
        this.announceThemeChange(theme);
    }

    announceThemeChange(theme) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = `Theme changed to ${theme} mode`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    addThemeCSS() {
        if (document.getElementById('theme-manager-css')) return;

        const css = document.createElement('style');
        css.id = 'theme-manager-css';
        css.textContent = `
            /* Theme Toggle Button */
            .theme-toggle {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 18px;
            }
            
            .theme-toggle:hover {
                background: rgba(191, 87, 0, 0.2);
                border-color: #BF5700;
                transform: scale(1.1);
            }
            
            .theme-toggle:focus {
                outline: 2px solid #BF5700;
                outline-offset: 2px;
            }
            
            /* Light Theme Variables */
            [data-theme="light"] {
                --primary-bg: #ffffff;
                --secondary-bg: #f8f9fa;
                --text-primary: #1a1a1a;
                --text-secondary: #4a4a4a;
                --text-muted: #6c757d;
                --border-color: #e0e0e0;
                --card-bg: #ffffff;
                --overlay-bg: rgba(0, 0, 0, 0.1);
            }
            
            /* Light Theme Overrides */
            [data-theme="light"] body {
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                color: var(--text-primary);
            }
            
            [data-theme="light"] .hero {
                background: linear-gradient(135deg, #ffffff 0%, #f0f2f5 100%);
            }
            
            [data-theme="light"] .hero::before {
                background: linear-gradient(45deg, rgba(191, 87, 0, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%);
            }
            
            [data-theme="light"] .section-title,
            [data-theme="light"] .hero-title,
            [data-theme="light"] h1, h2, h3, h4, h5, h6 {
                color: var(--text-primary);
            }
            
            [data-theme="light"] .section-subtitle,
            [data-theme="light"] .hero-subtitle,
            [data-theme="light"] p {
                color: var(--text-secondary);
            }
            
            [data-theme="light"] .feature-card,
            [data-theme="light"] .tool-card,
            [data-theme="light"] .pricing-card,
            [data-theme="light"] .insight-card {
                background: var(--card-bg);
                border-color: var(--border-color);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            [data-theme="light"] .feature-card:hover,
            [data-theme="light"] .tool-card:hover,
            [data-theme="light"] .pricing-card:hover,
            [data-theme="light"] .insight-card:hover {
                box-shadow: 0 8px 30px rgba(191, 87, 0, 0.15);
            }
            
            [data-theme="light"] .analytics-section,
            [data-theme="light"] .tools-section,
            [data-theme="light"] .dashboard-section,
            [data-theme="light"] .airtable-insights-section {
                background: var(--secondary-bg);
            }
            
            [data-theme="light"] .live-stats-bar {
                background: rgba(191, 87, 0, 0.05);
                border-color: rgba(191, 87, 0, 0.2);
            }
            
            [data-theme="light"] .stat-value {
                color: var(--text-primary);
            }
            
            [data-theme="light"] .stat-label {
                color: var(--text-muted);
            }
            
            [data-theme="light"] .demo-mode-badge,
            [data-theme="light"] .demo-mode-banner {
                background: rgba(191, 87, 0, 0.05);
                border-color: rgba(191, 87, 0, 0.2);
            }
            
            [data-theme="light"] .demo-text,
            [data-theme="light"] .demo-mode-content p {
                color: var(--text-secondary);
            }
            
            [data-theme="light"] .journey-step {
                background: var(--card-bg);
                border-color: var(--border-color);
            }
            
            [data-theme="light"] .journey-step:hover {
                background: rgba(191, 87, 0, 0.05);
            }
            
            [data-theme="light"] #navbar {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
            }
            
            [data-theme="light"] .nav-links a {
                color: var(--text-primary);
            }
            
            [data-theme="light"] .nav-links a:hover {
                color: #BF5700;
            }
            
            [data-theme="light"] .theme-toggle {
                background: rgba(0, 0, 0, 0.05);
                border-color: rgba(0, 0, 0, 0.1);
            }
            
            [data-theme="light"] .theme-toggle:hover {
                background: rgba(191, 87, 0, 0.1);
            }
            
            /* Improved contrast for accessibility */
            [data-theme="light"] .btn-primary {
                background: linear-gradient(135deg, #BF5700 0%, #A54800 100%);
                color: white;
                border: none;
            }
            
            [data-theme="light"] .btn-secondary {
                background: transparent;
                color: #BF5700;
                border: 2px solid #BF5700;
            }
            
            [data-theme="light"] .btn-secondary:hover {
                background: #BF5700;
                color: white;
            }
            
            /* High contrast mode for better accessibility */
            @media (prefers-contrast: high) {
                [data-theme="light"] .section-title,
                [data-theme="light"] .hero-title {
                    color: #000000;
                    text-shadow: none;
                }
                
                [data-theme="light"] .feature-card,
                [data-theme="light"] .tool-card {
                    border-width: 2px;
                    border-color: #000000;
                }
            }
            
            /* Reduce motion for users who prefer it */
            @media (prefers-reduced-motion: reduce) {
                .theme-toggle,
                .journey-step,
                .feature-card,
                .tool-card {
                    transition: none;
                }
                
                .theme-toggle:hover,
                .journey-step:hover {
                    transform: none;
                }
            }
            
            /* Focus indicators for keyboard navigation */
            .theme-toggle:focus-visible,
            [data-theme="light"] .btn-primary:focus-visible,
            [data-theme="light"] .btn-secondary:focus-visible,
            [data-theme="light"] .journey-link:focus-visible {
                outline: 3px solid #BF5700;
                outline-offset: 2px;
            }
        `;
        
        document.head.appendChild(css);
    }

    // Method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Method to set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            this.currentTheme = theme;
            localStorage.setItem('blazeTheme', theme);
            
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}