/**
 * Blaze Intelligence PWA Manager
 * Handles installation, updates, and offline functionality
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOffline = false;
        this.registration = null;
        this.init();
    }

    async init() {
        // Check if PWA is already installed
        this.checkInstallStatus();
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check network status
        this.checkNetworkStatus();
        
        // Initialize UI
        this.initializeUI();
        
        console.log('🔥 PWA Manager initialized');
    }

    checkInstallStatus() {
        // Check if app is running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('✅ App is installed');
        }
        
        // Check for iOS
        if (window.navigator.standalone) {
            this.isInstalled = true;
            console.log('✅ App is installed (iOS)');
        }
        
        // Store install status
        if (this.isInstalled) {
            localStorage.setItem('pwa_installed', 'true');
            this.trackInstallation();
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered');
                
                // Check for updates
                this.registration.addEventListener('updatefound', () => {
                    this.handleUpdate();
                });
                
                // Check for controller changes
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    this.handleControllerChange();
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupEventListeners() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
            console.log('📱 Install prompt ready');
        });
        
        // App installed
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            this.showSuccessMessage('App installed successfully!');
            this.trackInstallation();
            console.log('✅ App installed');
        });
        
        // Online/Offline events
        window.addEventListener('online', () => {
            this.isOffline = false;
            this.updateNetworkStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOffline = true;
            this.updateNetworkStatus(false);
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    checkNetworkStatus() {
        this.isOffline = !navigator.onLine;
        this.updateNetworkStatus(navigator.onLine);
    }

    updateNetworkStatus(isOnline) {
        const statusEl = document.getElementById('network-status');
        if (statusEl) {
            if (isOnline) {
                statusEl.innerHTML = `
                    <span class="status-online">
                        <span class="status-dot"></span>
                        Online - Live Data
                    </span>
                `;
                statusEl.className = 'network-status online';
            } else {
                statusEl.innerHTML = `
                    <span class="status-offline">
                        <span class="status-dot"></span>
                        Offline - Cached Data
                    </span>
                `;
                statusEl.className = 'network-status offline';
            }
        }
        
        // Show/hide offline banner
        this.toggleOfflineBanner(!isOnline);
    }

    toggleOfflineBanner(show) {
        let banner = document.getElementById('offline-banner');
        
        if (show && !banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.className = 'offline-banner';
            banner.innerHTML = `
                <div class="offline-content">
                    <span class="offline-icon">📡</span>
                    <span class="offline-text">You're offline. Some features may be limited.</span>
                    <button class="offline-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            document.body.appendChild(banner);
        } else if (!show && banner) {
            banner.remove();
        }
    }

    initializeUI() {
        // Add install button to header if not installed
        if (!this.isInstalled && this.deferredPrompt) {
            this.showInstallButton();
        }
        
        // Add network status indicator
        this.addNetworkIndicator();
        
        // Add update button if update available
        if (this.hasUpdate) {
            this.showUpdateButton();
        }
    }

    showInstallButton() {
        const header = document.querySelector('.header-content') || document.querySelector('header');
        if (!header || document.getElementById('pwa-install-btn')) return;
        
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.className = 'pwa-install-btn';
        installBtn.innerHTML = `
            <span class="install-icon">📲</span>
            <span class="install-text">Install App</span>
        `;
        
        installBtn.addEventListener('click', () => this.installApp());
        header.appendChild(installBtn);
        
        // Animate button appearance
        setTimeout(() => {
            installBtn.classList.add('show');
        }, 100);
    }

    hideInstallButton() {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) {
            btn.classList.add('hide');
            setTimeout(() => btn.remove(), 300);
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.log('Install prompt not available');
            return;
        }
        
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log(`User response: ${outcome}`);
        
        if (outcome === 'accepted') {
            this.trackInstallation();
        }
        
        // Clear the deferred prompt
        this.deferredPrompt = null;
    }

    addNetworkIndicator() {
        if (document.getElementById('network-status')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'network-status';
        indicator.className = 'network-status';
        document.body.appendChild(indicator);
        
        this.updateNetworkStatus(navigator.onLine);
    }

    handleUpdate() {
        const newWorker = this.registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.hasUpdate = true;
                this.showUpdateButton();
                this.showUpdateNotification();
            }
        });
    }

    showUpdateButton() {
        if (document.getElementById('pwa-update-btn')) return;
        
        const updateBtn = document.createElement('button');
        updateBtn.id = 'pwa-update-btn';
        updateBtn.className = 'pwa-update-btn';
        updateBtn.innerHTML = `
            <span class="update-icon">🔄</span>
            <span class="update-text">Update Available</span>
        `;
        
        updateBtn.addEventListener('click', () => this.applyUpdate());
        document.body.appendChild(updateBtn);
        
        setTimeout(() => {
            updateBtn.classList.add('show');
        }, 100);
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <h3>New Version Available!</h3>
                <p>A new version of Blaze Intelligence is ready.</p>
                <div class="update-actions">
                    <button class="update-now" onclick="blazePWA.applyUpdate()">Update Now</button>
                    <button class="update-later" onclick="this.parentElement.parentElement.parentElement.remove()">Later</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 10000);
    }

    applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell SW to skip waiting
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }

    handleControllerChange() {
        // Reload the page when SW takes control
        window.location.reload();
    }

    async checkForUpdates() {
        if (this.registration) {
            try {
                await this.registration.update();
            } catch (error) {
                console.error('Update check failed:', error);
            }
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    trackInstallation() {
        // Track installation analytics
        if (window.gtag) {
            gtag('event', 'pwa_install', {
                event_category: 'engagement',
                event_label: 'installed'
            });
        }
        
        // Send to backend
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'pwa_install',
                timestamp: Date.now()
            })
        }).catch(console.error);
    }

    // Public API
    async cacheUrls(urls) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_URLS',
                urls
            });
        }
    }

    async clearCache() {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_CACHE'
            });
        }
    }

    getInstallStatus() {
        return {
            isInstalled: this.isInstalled,
            isOffline: this.isOffline,
            hasUpdate: this.hasUpdate,
            canInstall: !!this.deferredPrompt
        };
    }
}

// Initialize PWA Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazePWA = new PWAManager();
    });
} else {
    window.blazePWA = new PWAManager();
}

// Add CSS for PWA UI elements
const style = document.createElement('style');
style.textContent = `
/* PWA Install Button */
.pwa-install-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #BF5700, #FF8C00);
    color: white;
    border: none;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(191, 87, 0, 0.3);
}

.pwa-install-btn.show {
    opacity: 1;
    transform: translateY(0);
}

.pwa-install-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(191, 87, 0, 0.4);
}

.pwa-install-btn.hide {
    opacity: 0;
    transform: translateY(20px);
}

/* Network Status Indicator */
.network-status {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(26, 26, 26, 0.9);
    border-radius: 20px;
    font-size: 14px;
    z-index: 999;
    backdrop-filter: blur(10px);
}

.network-status.online {
    border: 1px solid #4caf50;
}

.network-status.offline {
    border: 1px solid #ff5252;
}

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    animation: pulse 2s infinite;
}

.status-online .status-dot {
    background: #4caf50;
}

.status-offline .status-dot {
    background: #ff5252;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Offline Banner */
.offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, #ff5252, #ff8a80);
    color: white;
    padding: 12px;
    z-index: 2000;
    animation: slideDown 0.3s ease;
}

.offline-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}

.offline-dismiss {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0 8px;
}

@keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
}

/* Update Notification */
.update-notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 2000;
    max-width: 400px;
    transition: transform 0.3s ease;
}

.update-notification.show {
    transform: translateX(-50%) translateY(0);
}

.update-content h3 {
    margin: 0 0 10px 0;
    color: #BF5700;
}

.update-content p {
    margin: 0 0 15px 0;
    color: #666;
}

.update-actions {
    display: flex;
    gap: 10px;
}

.update-actions button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.update-now {
    background: linear-gradient(135deg, #BF5700, #FF8C00);
    color: white;
}

.update-later {
    background: #f0f0f0;
    color: #666;
}

/* Success Toast */
.success-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: #4caf50;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 3000;
    transition: transform 0.3s ease;
}

.success-toast.show {
    transform: translateX(-50%) translateY(0);
}

/* Update Button */
.pwa-update-btn {
    position: fixed;
    bottom: 80px;
    right: 20px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #4caf50, #81c784);
    color: white;
    border: none;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.pwa-update-btn.show {
    opacity: 1;
    transform: translateY(0);
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .network-status {
        top: auto;
        bottom: 60px;
        right: 10px;
    }
    
    .update-notification {
        left: 10px;
        right: 10px;
        transform: translateX(0) translateY(100px);
        max-width: none;
    }
    
    .update-notification.show {
        transform: translateX(0) translateY(0);
    }
}
`;
document.head.appendChild(style);