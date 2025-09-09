// Error Handler to prevent unhandled promise rejection console spam
(function() {
    'use strict';
    
    // Handle unhandled promise rejections gracefully
    window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason;
        
        // Suppress gateway connection errors to prevent console spam
        if (reason && (
            reason.toString().includes('gateway') ||
            reason.toString().includes('Failed to fetch') ||
            reason.toString().includes('NetworkError')
        )) {
            event.preventDefault();
            console.log('🔌 Gateway connection attempt (expected in development)');
            return;
        }
        
        // Log other promise rejections for debugging
        console.warn('Unhandled promise rejection:', reason);
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