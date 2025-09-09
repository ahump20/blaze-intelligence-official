// Loading animations and micro-interactions for enhanced UX

class LoadingAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.createAdvancedLoader();
        this.setupMicroInteractions();
        this.initPageTransitions();
    }

    createAdvancedLoader() {
        // Create an enhanced loading screen
        const loader = document.getElementById('preloader');
        if (!loader) {
            const loaderHTML = `
                <div id="preloader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #000a14 0%, #001f3f 100%); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div class="advanced-loader">
                        <div class="loader-content">
                            <div class="logo-animation">
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <defs>
                                        <linearGradient id="flameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:#FF6B35" />
                                            <stop offset="50%" style="stop-color:#BF5700" />
                                            <stop offset="100%" style="stop-color:#8B3A00" />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#flameGradient)" stroke-width="3" stroke-dasharray="314" stroke-dashoffset="314" class="loader-circle">
                                        <animate attributeName="stroke-dashoffset" dur="2s" values="314;0" repeatCount="indefinite" />
                                    </circle>
                                    <text x="60" y="65" text-anchor="middle" fill="url(#flameGradient)" font-size="24" font-weight="bold" font-family="Inter">BI</text>
                                </svg>
                            </div>
                            <div class="loading-text">
                                <span class="loading-label">Loading Analytics</span>
                                <div class="loading-dots">
                                    <span class="dot" style="animation-delay: 0s">.</span>
                                    <span class="dot" style="animation-delay: 0.2s">.</span>
                                    <span class="dot" style="animation-delay: 0.4s">.</span>
                                </div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('afterbegin', loaderHTML);
        }

        // Add styles for the loader
        const styles = `
            <style>
                .advanced-loader {
                    text-align: center;
                }
                
                .loader-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }
                
                .logo-animation {
                    animation: float 3s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                .loading-text {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    font-size: 1.2rem;
                    font-weight: 500;
                }
                
                .loading-dots {
                    display: flex;
                }
                
                .dot {
                    animation: bounce 1.4s infinite ease-in-out;
                    color: #BF5700;
                    font-size: 1.5rem;
                }
                
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    40% {
                        transform: translateY(-10px);
                        opacity: 0.8;
                    }
                }
                
                .progress-bar-container {
                    width: 200px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #BF5700 0%, #FF6B35 100%);
                    border-radius: 2px;
                    animation: progressFill 2s ease-out forwards;
                    box-shadow: 0 0 10px rgba(191, 87, 0, 0.5);
                }
                
                @keyframes progressFill {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                
                .fade-out {
                    animation: fadeOut 0.5s ease forwards;
                }
                
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        visibility: hidden;
                    }
                }
            </style>
        `;
        
        if (!document.querySelector('#loader-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'loader-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }

        // Auto-hide loader after content loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.hideLoader();
            }, 2000);
        });
    }

    hideLoader() {
        const loader = document.getElementById('preloader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }

    setupMicroInteractions() {
        // Button hover effects
        document.addEventListener('DOMContentLoaded', () => {
            // Ripple effect for buttons
            const buttons = document.querySelectorAll('button, .btn, .cta-button');
            buttons.forEach(button => {
                button.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    ripple.classList.add('ripple');
                    
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    
                    this.style.position = 'relative';
                    this.style.overflow = 'hidden';
                    this.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });
            });

            // Card hover tilt effect
            const cards = document.querySelectorAll('.glass-card, .dashboard-card, .feature-card');
            cards.forEach(card => {
                card.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                });
            });

            // Input focus effects
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                const wrapper = input.parentElement;
                
                input.addEventListener('focus', () => {
                    if (wrapper) {
                        wrapper.classList.add('input-focused');
                    }
                });
                
                input.addEventListener('blur', () => {
                    if (wrapper) {
                        wrapper.classList.remove('input-focused');
                    }
                });
            });

            // Magnetic button effect
            const magneticButtons = document.querySelectorAll('.magnetic-button');
            magneticButtons.forEach(button => {
                button.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    this.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translate(0, 0)';
                });
            });

            // Scroll indicator animation
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                window.addEventListener('scroll', () => {
                    const scrolled = window.scrollY;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPercent = (scrolled / maxScroll) * 100;
                    
                    scrollIndicator.style.width = scrollPercent + '%';
                });
            }
        });

        // Add micro-interaction styles
        const microStyles = `
            <style>
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    animation: rippleEffect 0.6s ease-out;
                    pointer-events: none;
                }
                
                @keyframes rippleEffect {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
                
                .input-focused {
                    box-shadow: 0 0 0 3px rgba(191, 87, 0, 0.2);
                    border-color: #BF5700 !important;
                    transition: all 0.3s ease;
                }
                
                .magnetic-button {
                    transition: transform 0.2s ease;
                    will-change: transform;
                }
                
                .scroll-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #BF5700 0%, #FF6B35 100%);
                    z-index: 9999;
                    transition: width 0.1s ease;
                    box-shadow: 0 0 10px rgba(191, 87, 0, 0.5);
                }
            </style>
        `;
        
        if (!document.querySelector('#micro-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'micro-styles';
            styleElement.innerHTML = microStyles;
            document.head.appendChild(styleElement);
        }
    }

    initPageTransitions() {
        // Smooth page transitions
        document.addEventListener('DOMContentLoaded', () => {
            // Add transition overlay
            const transitionOverlay = document.createElement('div');
            transitionOverlay.className = 'page-transition';
            transitionOverlay.innerHTML = `
                <div class="transition-logo">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="35" fill="none" stroke="#BF5700" stroke-width="3" class="transition-circle" />
                        <text x="40" y="45" text-anchor="middle" fill="#BF5700" font-size="20" font-weight="bold" font-family="Inter">BI</text>
                    </svg>
                </div>
            `;
            document.body.appendChild(transitionOverlay);

            // Handle link clicks with transitions
            const links = document.querySelectorAll('a[href^="#"]');
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    
                    if (target) {
                        // Smooth scroll to target
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // Add highlight effect
                        target.classList.add('highlight-section');
                        setTimeout(() => {
                            target.classList.remove('highlight-section');
                        }, 2000);
                    }
                });
            });
        });

        // Add transition styles
        const transitionStyles = `
            <style>
                .page-transition {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #000a14 0%, #001f3f 100%);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                
                .page-transition.active {
                    visibility: visible;
                    opacity: 1;
                }
                
                .transition-logo {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .transition-circle {
                    stroke-dasharray: 220;
                    stroke-dashoffset: 220;
                    animation: drawCircle 1s ease forwards;
                }
                
                @keyframes drawCircle {
                    to { stroke-dashoffset: 0; }
                }
                
                .highlight-section {
                    animation: highlightPulse 2s ease;
                }
                
                @keyframes highlightPulse {
                    0%, 100% { box-shadow: none; }
                    50% { box-shadow: 0 0 30px rgba(191, 87, 0, 0.5); }
                }
            </style>
        `;
        
        if (!document.querySelector('#transition-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'transition-styles';
            styleElement.innerHTML = transitionStyles;
            document.head.appendChild(styleElement);
        }
    }

    // Method to trigger page transition
    showTransition(callback) {
        const transition = document.querySelector('.page-transition');
        if (transition) {
            transition.classList.add('active');
            setTimeout(() => {
                if (callback) callback();
                setTimeout(() => {
                    transition.classList.remove('active');
                }, 300);
            }, 500);
        }
    }
}

// Initialize loading animations
const loadingAnimations = new LoadingAnimations();

// Export for use in other scripts
window.LoadingAnimations = LoadingAnimations;