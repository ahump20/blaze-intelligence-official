// Comprehensive Error Handler for Blaze Intelligence
(function() {
    'use strict';
    
    // Global promise rejection counter for debugging
    let rejectionCount = 0;
    const maxRejections = 50; // Prevent infinite logging
    
    // Handle unhandled promise rejections gracefully
    window.addEventListener('unhandledrejection', function(event) {
        rejectionCount++;
        const reason = event.reason;
        
        // Stop processing if too many rejections (prevent spam)
        if (rejectionCount > maxRejections) {
            event.preventDefault();
            return;
        }
        
        // Suppress common development errors to prevent console spam
        if (!reason || 
            reason === null ||
            reason === undefined ||
            reason === '' ||
            (typeof reason === 'object' && Object.keys(reason).length === 0) ||
            (reason.toString && !reason.toString()) ||
            (reason.toString && reason.toString() === '') ||
            (reason.toString && reason.toString() === '[object Object]') ||
            (reason.toString && (
                reason.toString().includes('gateway') ||
                reason.toString().includes('Failed to fetch') ||
                reason.toString().includes('NetworkError') ||
                reason.toString().includes('API key') ||
                reason.toString().includes('not configured') ||
                reason.toString().includes('mlb_live_games') ||
                reason.toString().includes('cache') ||
                reason.toString().includes('fetch') ||
                reason.toString().includes('AbortError') ||
                reason.toString().includes('TypeError') ||
                reason.toString().includes('Script error') ||
                reason.toString().includes('Non-Error promise rejection')
            ))) {
            event.preventDefault();
            return;
        }
        
        // Log other promise rejections for debugging (limited)
        if (rejectionCount <= 3) {
            console.warn('Unhandled promise rejection:', reason);
        } else if (rejectionCount === 4) {
            console.warn('Multiple promise rejections detected, suppressing further logs...');
        }
    });
    
    // Handle other JavaScript errors
    window.addEventListener('error', function(event) {
        // Only log non-gateway related errors
        if (!event.message.includes('gateway')) {
            console.error('JavaScript error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno
            });
        }
    });
})();