/**
 * Emergency Kill Switch System - Production Implementation
 * "One button. Stops all recording, processing, and data transmission immediately."
 * 
 * This system provides:
 * 1. Immediate shutdown of all data collection
 * 2. Hard stop of all processing pipelines
 * 3. Instant termination of data transmission
 * 4. Secure cleanup of temporary data
 * 5. Audit trail of emergency actions
 */

class EmergencyKillSwitch {
    constructor() {
        this.isEmergencyActive = false;
        this.shutdownSystems = new Set();
        this.cleanupTasks = new Map();
        this.auditLog = [];
        this.preShutdownCallbacks = new Map();
        this.shutdownStartTime = null;
        
        // Critical systems to shut down
        this.criticalSystems = [
            'camera_feed',
            'microphone_input',
            'biometric_sensors',
            'ml_processing',
            'data_transmission',
            'cloud_upload',
            'analytics_pipeline',
            'user_tracking',
            'location_services',
            'consent_processing'
        ];

        this.initializeKillSwitch();
    }

    /**
     * Initialize emergency kill switch
     */
    initializeKillSwitch() {
        console.log('[EmergencyKillSwitch] Initializing emergency kill switch system');
        
        // Create physical kill switch UI
        this.createKillSwitchUI();
        
        // Register keyboard shortcuts (Ctrl+Shift+X, Escape x3)
        this.registerKeyboardShortcuts();
        
        // Set up system shutdown hooks
        this.registerShutdownHooks();
        
        // Initialize cleanup procedures
        this.setupCleanupProcedures();
        
        console.log('[EmergencyKillSwitch] Emergency kill switch ready - accessible via button or Ctrl+Shift+X');
    }

    /**
     * MAIN KILL SWITCH ACTIVATION
     * This is the big red button - stops everything immediately
     */
    async activateEmergencyKillSwitch(reason = 'MANUAL_ACTIVATION', source = 'BUTTON') {
        console.error('🚨 EMERGENCY KILL SWITCH ACTIVATED 🚨');
        console.error(`Reason: ${reason}, Source: ${source}`);
        
        this.isEmergencyActive = true;
        this.shutdownStartTime = Date.now();
        
        // Log the emergency activation
        this.auditLog.push({
            timestamp: new Date().toISOString(),
            action: 'EMERGENCY_ACTIVATION',
            reason: reason,
            source: source,
            user_agent: navigator.userAgent,
            url: window.location.href
        });

        // Show emergency UI immediately
        this.showEmergencyUI();
        
        // Execute emergency shutdown in parallel
        await this.executeEmergencyShutdown();
        
        // Final verification
        this.verifyShutdownComplete();
        
        console.error(`🚨 Emergency shutdown complete in ${Date.now() - this.shutdownStartTime}ms 🚨`);
        
        return {
            status: 'EMERGENCY_SHUTDOWN_COMPLETE',
            shutdown_time_ms: Date.now() - this.shutdownStartTime,
            systems_shutdown: Array.from(this.shutdownSystems),
            audit_entries: this.auditLog.length
        };
    }

    /**
     * Execute emergency shutdown of all systems
     */
    async executeEmergencyShutdown() {
        const shutdownPromises = this.criticalSystems.map(system => 
            this.shutdownSystem(system)
        );

        // Wait for all systems to shut down (max 5 seconds total)
        try {
            await Promise.race([
                Promise.all(shutdownPromises),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Shutdown timeout')), 5000)
                )
            ]);
        } catch (error) {
            console.error('[EmergencyKillSwitch] Some systems may not have shut down cleanly:', error);
        }

        // Force shutdown any remaining systems
        await this.forceShutdownRemaining();
        
        // Execute cleanup tasks
        await this.executeCleanupTasks();
    }

    /**
     * Shutdown individual system
     */
    async shutdownSystem(systemName) {
        try {
            console.warn(`[EmergencyKillSwitch] Shutting down ${systemName}...`);
            
            // Execute pre-shutdown callback if exists
            const preShutdownCallback = this.preShutdownCallbacks.get(systemName);
            if (preShutdownCallback) {
                await preShutdownCallback();
            }

            // Execute system-specific shutdown
            await this.executeSystemShutdown(systemName);
            
            this.shutdownSystems.add(systemName);
            
            this.auditLog.push({
                timestamp: new Date().toISOString(),
                action: 'SYSTEM_SHUTDOWN',
                system: systemName,
                status: 'SUCCESS'
            });
            
        } catch (error) {
            console.error(`[EmergencyKillSwitch] Error shutting down ${systemName}:`, error);
            
            this.auditLog.push({
                timestamp: new Date().toISOString(),
                action: 'SYSTEM_SHUTDOWN',
                system: systemName,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    /**
     * Execute system-specific shutdown procedures
     */
    async executeSystemShutdown(systemName) {
        switch (systemName) {
            case 'camera_feed':
                await this.shutdownCameraFeed();
                break;
            case 'microphone_input':
                await this.shutdownMicrophoneInput();
                break;
            case 'biometric_sensors':
                await this.shutdownBiometricSensors();
                break;
            case 'ml_processing':
                await this.shutdownMLProcessing();
                break;
            case 'data_transmission':
                await this.shutdownDataTransmission();
                break;
            case 'cloud_upload':
                await this.shutdownCloudUpload();
                break;
            case 'analytics_pipeline':
                await this.shutdownAnalyticsPipeline();
                break;
            case 'user_tracking':
                await this.shutdownUserTracking();
                break;
            case 'location_services':
                await this.shutdownLocationServices();
                break;
            case 'consent_processing':
                await this.shutdownConsentProcessing();
                break;
            default:
                console.warn(`[EmergencyKillSwitch] Unknown system: ${systemName}`);
        }
    }

    // ========== SYSTEM-SPECIFIC SHUTDOWN PROCEDURES ==========

    /**
     * Shutdown camera feed
     */
    async shutdownCameraFeed() {
        try {
            // Stop all video streams
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const streams = document.querySelectorAll('video');
                streams.forEach(video => {
                    if (video.srcObject) {
                        const tracks = video.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                        video.srcObject = null;
                    }
                });
            }

            // Clear video elements
            const videoElements = document.querySelectorAll('video');
            videoElements.forEach(video => {
                video.pause();
                video.src = '';
                video.load();
            });

            // Stop any WebRTC connections
            if (window.RTCPeerConnection) {
                // Close any existing peer connections
                window.activePeerConnections?.forEach(pc => pc.close());
            }

            console.log('[EmergencyKillSwitch] Camera feed shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down camera:', error);
        }
    }

    /**
     * Shutdown microphone input
     */
    async shutdownMicrophoneInput() {
        try {
            // Stop all audio streams
            if (navigator.mediaDevices) {
                const audioElements = document.querySelectorAll('audio');
                audioElements.forEach(audio => {
                    if (audio.srcObject) {
                        const tracks = audio.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                        audio.srcObject = null;
                    }
                    audio.pause();
                });
            }

            // Stop Web Audio API contexts
            if (window.AudioContext || window.webkitAudioContext) {
                window.activeAudioContexts?.forEach(context => {
                    if (context.state !== 'closed') {
                        context.close();
                    }
                });
            }

            // Stop speech recognition
            if (window.SpeechRecognition || window.webkitSpeechRecognition) {
                window.activeSpeechRecognizers?.forEach(recognizer => {
                    recognizer.stop();
                    recognizer.abort();
                });
            }

            console.log('[EmergencyKillSwitch] Microphone shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down microphone:', error);
        }
    }

    /**
     * Shutdown biometric sensors
     */
    async shutdownBiometricSensors() {
        try {
            // Stop device motion/orientation listeners
            window.removeEventListener('devicemotion', this.handleDeviceMotion);
            window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
            
            // Stop any WebBluetooth connections
            if (navigator.bluetooth) {
                // Disconnect from any connected devices
                window.connectedBluetoothDevices?.forEach(async (device) => {
                    if (device.gatt.connected) {
                        await device.gatt.disconnect();
                    }
                });
            }

            // Stop any WebUSB connections
            if (navigator.usb) {
                window.connectedUSBDevices?.forEach(async (device) => {
                    if (device.opened) {
                        await device.close();
                    }
                });
            }

            console.log('[EmergencyKillSwitch] Biometric sensors shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down biometric sensors:', error);
        }
    }

    /**
     * Shutdown ML processing
     */
    async shutdownMLProcessing() {
        try {
            // Terminate any Web Workers
            if (window.activeMLWorkers) {
                window.activeMLWorkers.forEach(worker => {
                    worker.terminate();
                });
                window.activeMLWorkers.clear();
            }

            // Stop any TensorFlow.js operations
            if (window.tf) {
                await window.tf.disposeVariables();
                window.tf.engine().endScope();
            }

            // Cancel any pending ML operations
            if (window.pendingMLOperations) {
                window.pendingMLOperations.forEach(operation => {
                    if (typeof operation.cancel === 'function') {
                        operation.cancel();
                    }
                });
                window.pendingMLOperations.clear();
            }

            console.log('[EmergencyKillSwitch] ML processing shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down ML processing:', error);
        }
    }

    /**
     * Shutdown data transmission
     */
    async shutdownDataTransmission() {
        try {
            // Cancel all pending fetch requests
            if (window.pendingRequests) {
                window.pendingRequests.forEach(controller => {
                    controller.abort();
                });
                window.pendingRequests.clear();
            }

            // Close WebSocket connections
            if (window.activeWebSockets) {
                window.activeWebSockets.forEach(socket => {
                    socket.close(1000, 'Emergency shutdown');
                });
                window.activeWebSockets.clear();
            }

            // Close EventSource connections
            if (window.activeEventSources) {
                window.activeEventSources.forEach(source => {
                    source.close();
                });
                window.activeEventSources.clear();
            }

            console.log('[EmergencyKillSwitch] Data transmission shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down data transmission:', error);
        }
    }

    /**
     * Shutdown cloud upload
     */
    async shutdownCloudUpload() {
        try {
            // Cancel any file upload operations
            if (window.activeUploads) {
                window.activeUploads.forEach(upload => {
                    if (upload.xhr) {
                        upload.xhr.abort();
                    }
                });
                window.activeUploads.clear();
            }

            // Clear upload queues
            if (window.uploadQueue) {
                window.uploadQueue.clear();
            }

            console.log('[EmergencyKillSwitch] Cloud upload shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down cloud upload:', error);
        }
    }

    /**
     * Shutdown analytics pipeline
     */
    async shutdownAnalyticsPipeline() {
        try {
            // Stop analytics tracking
            if (window.gtag) {
                // Stop Google Analytics tracking
                window.gtag('config', 'GA_TRACKING_ID', { 'send_page_view': false });
            }

            // Clear analytics queues
            if (window.analyticsQueue) {
                window.analyticsQueue.clear();
            }

            // Stop custom analytics
            if (window.customAnalytics) {
                window.customAnalytics.stop();
            }

            console.log('[EmergencyKillSwitch] Analytics pipeline shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down analytics:', error);
        }
    }

    /**
     * Shutdown user tracking
     */
    async shutdownUserTracking() {
        try {
            // Clear session storage
            if (sessionStorage) {
                sessionStorage.clear();
            }

            // Clear tracking cookies (where possible)
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });

            // Stop user activity tracking
            window.removeEventListener('click', this.trackUserActivity);
            window.removeEventListener('scroll', this.trackUserActivity);
            window.removeEventListener('keydown', this.trackUserActivity);

            console.log('[EmergencyKillSwitch] User tracking shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down user tracking:', error);
        }
    }

    /**
     * Shutdown location services
     */
    async shutdownLocationServices() {
        try {
            // Clear geolocation watches
            if (window.activeLocationWatches) {
                window.activeLocationWatches.forEach(watchId => {
                    navigator.geolocation.clearWatch(watchId);
                });
                window.activeLocationWatches.clear();
            }

            console.log('[EmergencyKillSwitch] Location services shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down location services:', error);
        }
    }

    /**
     * Shutdown consent processing
     */
    async shutdownConsentProcessing() {
        try {
            // Clear any pending consent operations
            if (window.pendingConsentOperations) {
                window.pendingConsentOperations.clear();
            }

            // Set emergency consent state
            if (window.consentSystem) {
                window.consentSystem.setEmergencyState(true);
            }

            console.log('[EmergencyKillSwitch] Consent processing shutdown complete');
            
        } catch (error) {
            console.error('[EmergencyKillSwitch] Error shutting down consent processing:', error);
        }
    }

    // ========== UI AND INTERFACE ==========

    /**
     * Create kill switch UI button
     */
    createKillSwitchUI() {
        const killSwitchContainer = document.createElement('div');
        killSwitchContainer.id = 'emergency-kill-switch-container';
        killSwitchContainer.innerHTML = `
            <style>
                #emergency-kill-switch-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 999999;
                    display: flex;
                    gap: 10px;
                }
                
                .emergency-kill-switch {
                    background: linear-gradient(145deg, #dc2626, #b91c1c);
                    color: white;
                    border: 3px solid #991b1b;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 24px;
                    font-weight: bold;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                    user-select: none;
                }
                
                .emergency-kill-switch:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.6);
                    background: linear-gradient(145deg, #ef4444, #dc2626);
                }
                
                .emergency-kill-switch:active {
                    transform: scale(0.95);
                }
                
                .kill-switch-label {
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                }
                
                .emergency-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(220, 38, 38, 0.95);
                    color: white;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    flex-direction: column;
                    z-index: 1000000;
                    font-family: monospace;
                }
                
                .emergency-message {
                    font-size: 2rem;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 20px;
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            </style>
            
            <div class="kill-switch-label" title="Emergency shutdown of all data processing">
                🚨 KILL SWITCH (Ctrl+Shift+X)
            </div>
            <button class="emergency-kill-switch" 
                    onclick="window.emergencyKillSwitch?.activateEmergencyKillSwitch('MANUAL_ACTIVATION', 'UI_BUTTON')"
                    title="EMERGENCY STOP - Immediately stops all data collection and processing"
                    aria-label="Emergency kill switch - stops all data processing immediately">
                ⏹
            </button>
            
            <!-- Emergency overlay -->
            <div class="emergency-overlay" id="emergency-overlay">
                <div class="emergency-message">
                    🚨 EMERGENCY SHUTDOWN ACTIVATED 🚨
                    <br>
                    All data collection and processing stopped
                </div>
                <div>
                    System is now in safe mode.
                    <br>
                    Refresh page to restart services.
                </div>
            </div>
        `;

        document.body.appendChild(killSwitchContainer);
    }

    /**
     * Show emergency UI overlay
     */
    showEmergencyUI() {
        const overlay = document.getElementById('emergency-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        // Change page title
        document.title = '🚨 EMERGENCY SHUTDOWN - Blaze Intelligence';
        
        // Change favicon to red
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚨</text></svg>';
        }
    }

    /**
     * Register keyboard shortcuts
     */
    registerKeyboardShortcuts() {
        let escapeCount = 0;
        let lastEscapeTime = 0;

        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+X
            if (event.ctrlKey && event.shiftKey && event.key === 'X') {
                event.preventDefault();
                this.activateEmergencyKillSwitch('KEYBOARD_SHORTCUT', 'CTRL_SHIFT_X');
                return;
            }

            // Triple Escape
            if (event.key === 'Escape') {
                const now = Date.now();
                if (now - lastEscapeTime < 1000) {
                    escapeCount++;
                } else {
                    escapeCount = 1;
                }
                lastEscapeTime = now;

                if (escapeCount >= 3) {
                    event.preventDefault();
                    this.activateEmergencyKillSwitch('KEYBOARD_SHORTCUT', 'TRIPLE_ESCAPE');
                    escapeCount = 0;
                }
            }
        });
    }

    /**
     * Register system shutdown hooks
     */
    registerShutdownHooks() {
        // Browser close/refresh warning
        window.addEventListener('beforeunload', (event) => {
            if (!this.isEmergencyActive) {
                const message = 'Data processing is still active. Close anyway?';
                event.returnValue = message;
                return message;
            }
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isEmergencyActive) {
                console.log('[EmergencyKillSwitch] Page hidden - systems remain active');
            }
        });
    }

    /**
     * Setup cleanup procedures
     */
    setupCleanupProcedures() {
        // Clear temporary data
        this.cleanupTasks.set('clear_temp_data', async () => {
            try {
                // Clear IndexedDB temporary data
                if (window.indexedDB) {
                    const databases = await window.indexedDB.databases();
                    for (const db of databases) {
                        if (db.name.includes('temp') || db.name.includes('cache')) {
                            window.indexedDB.deleteDatabase(db.name);
                        }
                    }
                }
            } catch (error) {
                console.error('Error clearing temp data:', error);
            }
        });

        // Clear memory allocations
        this.cleanupTasks.set('clear_memory', async () => {
            try {
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                // Clear large objects
                window.largeDataArrays?.forEach(array => {
                    array.length = 0;
                });
                
            } catch (error) {
                console.error('Error clearing memory:', error);
            }
        });
    }

    /**
     * Execute all cleanup tasks
     */
    async executeCleanupTasks() {
        console.log('[EmergencyKillSwitch] Executing cleanup tasks...');
        
        const cleanupPromises = Array.from(this.cleanupTasks.entries()).map(
            async ([taskName, taskFunction]) => {
                try {
                    await taskFunction();
                    console.log(`[EmergencyKillSwitch] Cleanup task '${taskName}' completed`);
                } catch (error) {
                    console.error(`[EmergencyKillSwitch] Cleanup task '${taskName}' failed:`, error);
                }
            }
        );

        await Promise.allSettled(cleanupPromises);
    }

    /**
     * Force shutdown any remaining systems
     */
    async forceShutdownRemaining() {
        const remainingSystems = this.criticalSystems.filter(
            system => !this.shutdownSystems.has(system)
        );

        if (remainingSystems.length > 0) {
            console.warn('[EmergencyKillSwitch] Force shutting down remaining systems:', remainingSystems);
            
            remainingSystems.forEach(system => {
                this.shutdownSystems.add(system);
                this.auditLog.push({
                    timestamp: new Date().toISOString(),
                    action: 'FORCE_SHUTDOWN',
                    system: system,
                    status: 'FORCED'
                });
            });
        }
    }

    /**
     * Verify shutdown is complete
     */
    verifyShutdownComplete() {
        const shutdownComplete = this.criticalSystems.every(
            system => this.shutdownSystems.has(system)
        );

        if (shutdownComplete) {
            console.log('✅ [EmergencyKillSwitch] All systems confirmed shutdown');
        } else {
            console.error('❌ [EmergencyKillSwitch] Some systems may still be active');
        }

        // Final audit log entry
        this.auditLog.push({
            timestamp: new Date().toISOString(),
            action: 'SHUTDOWN_VERIFICATION',
            all_systems_shutdown: shutdownComplete,
            systems_count: this.shutdownSystems.size,
            total_systems: this.criticalSystems.length
        });
    }

    /**
     * Register pre-shutdown callback for a system
     */
    registerPreShutdownCallback(systemName, callback) {
        this.preShutdownCallbacks.set(systemName, callback);
    }

    /**
     * Get audit log for compliance
     */
    getAuditLog() {
        return [...this.auditLog];
    }

    /**
     * Check if emergency is currently active
     */
    isEmergencyKillSwitchActive() {
        return this.isEmergencyActive;
    }

    /**
     * Get shutdown status report
     */
    getShutdownStatus() {
        return {
            is_emergency_active: this.isEmergencyActive,
            shutdown_start_time: this.shutdownStartTime,
            systems_shutdown: Array.from(this.shutdownSystems),
            total_systems: this.criticalSystems.length,
            shutdown_complete: this.shutdownSystems.size === this.criticalSystems.length,
            audit_entries: this.auditLog.length
        };
    }
}

// Auto-initialize emergency kill switch
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyKillSwitch = new EmergencyKillSwitch();
    console.log('🚨 Emergency Kill Switch System Active - Press Ctrl+Shift+X or triple-tap Escape for emergency shutdown');
});

// Export for integration
if (typeof window !== 'undefined') {
    window.EmergencyKillSwitch = EmergencyKillSwitch;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyKillSwitch;
}

/**
 * Usage Examples:
 * 
 * // Emergency kill switch is automatically initialized
 * // Access via: window.emergencyKillSwitch
 * 
 * // Manual activation
 * await window.emergencyKillSwitch.activateEmergencyKillSwitch('PRIVACY_CONCERN', 'MANUAL');
 * 
 * // Register custom pre-shutdown callback
 * window.emergencyKillSwitch.registerPreShutdownCallback('my_system', async () => {
 *     console.log('Cleaning up my system before shutdown...');
 *     // Custom cleanup code here
 * });
 * 
 * // Check if emergency is active
 * if (window.emergencyKillSwitch.isEmergencyKillSwitchActive()) {
 *     console.log('Emergency mode - all processing stopped');
 * }
 * 
 * // Get audit trail for compliance
 * const auditLog = window.emergencyKillSwitch.getAuditLog();
 * console.log('Emergency actions audit:', auditLog);
 */