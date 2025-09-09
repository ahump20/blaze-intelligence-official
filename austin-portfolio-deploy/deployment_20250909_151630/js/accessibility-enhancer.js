/**
 * Blaze Intelligence Accessibility Enhancer
 * Comprehensive WCAG 2.1 AA compliance implementation
 */

class BlazeAccessibilityEnhancer {
    constructor() {
        this.config = {
            wcagLevel: 'AA', // A, AA, or AAA
            enableKeyboardNavigation: true,
            enableScreenReaderSupport: true,
            enableHighContrast: true,
            enableFocusManagement: true,
            enableMotionReduction: true,
            enableTextScaling: true,
            enableColorBlindSupport: true
        };
        
        this.a11yFeatures = {};
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        
        this.init();
    }

    init() {
        console.log('♿ Initializing Accessibility Enhancer...');
        console.log('🎯 Target WCAG Level:', this.config.wcagLevel);
        
        // Apply accessibility enhancements
        this.enhanceSemanticStructure();
        this.implementKeyboardNavigation();
        this.enhanceColorAccessibility();
        this.implementFocusManagement();
        this.addARIALabels();
        this.enhanceFormAccessibility();
        this.implementMotionPreferences();
        this.setupAccessibilityToolbar();
        this.addScreenReaderAnnouncements();
        this.validateAccessibility();
        
        console.log('✅ Accessibility enhancements applied');
    }

    enhanceSemanticStructure() {
        console.log('📝 Enhancing semantic HTML structure...');
        
        // Ensure proper heading hierarchy
        this.fixHeadingHierarchy();
        
        // Add main landmark if missing
        if (!document.querySelector('main')) {
            const mainContent = document.querySelector('.content, .main-content, #main');
            if (mainContent) {
                const main = document.createElement('main');
                mainContent.parentNode.insertBefore(main, mainContent);
                main.appendChild(mainContent);
                main.setAttribute('aria-label', 'Main content');
            }
        }
        
        // Enhance navigation structure
        this.enhanceNavigationStructure();
        
        // Add skip links
        this.addSkipLinks();
        
        this.a11yFeatures.semanticStructure = 'enhanced';
    }

    fixHeadingHierarchy() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let currentLevel = 0;
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.substring(1));
            
            // Ensure logical heading progression
            if (level > currentLevel + 1) {
                console.warn(`⚠️ Heading hierarchy skip detected: ${heading.tagName} after h${currentLevel}`);
                
                // Add aria-level for screen readers
                heading.setAttribute('aria-level', Math.min(currentLevel + 1, 6).toString());
            }
            
            currentLevel = level;
            
            // Ensure headings have accessible content
            if (!heading.textContent.trim()) {
                heading.setAttribute('aria-hidden', 'true');
            }
        });
    }

    enhanceNavigationStructure() {
        const nav = document.querySelector('nav, .nav, .navigation');
        if (nav && !nav.getAttribute('aria-label')) {
            nav.setAttribute('aria-label', 'Main navigation');
            nav.setAttribute('role', 'navigation');
        }
        
        // Enhance navigation lists
        const navLists = document.querySelectorAll('nav ul, .nav ul');
        navLists.forEach(list => {
            if (!list.getAttribute('role')) {
                list.setAttribute('role', 'menubar');
            }
            
            const items = list.querySelectorAll('li');
            items.forEach(item => {
                if (!item.getAttribute('role')) {
                    item.setAttribute('role', 'menuitem');
                }
            });
        });
    }

    addSkipLinks() {
        // Create skip link container
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#grit-index" class="skip-link">Skip to Grit Index</a>
        `;
        
        // Add styles for skip links
        const skipLinkStyles = `
            <style>
                .skip-links {
                    position: absolute;
                    top: -40px;
                    left: 6px;
                    z-index: 10000;
                }
                
                .skip-link {
                    position: absolute;
                    padding: 8px 12px;
                    background: var(--burnt-orange);
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: 600;
                    transform: translateY(-100%);
                    transition: transform 0.3s ease;
                }
                
                .skip-link:focus {
                    transform: translateY(0);
                    outline: 2px solid white;
                    outline-offset: 2px;
                }
                
                .skip-link:focus + .skip-link {
                    transform: translateY(40px);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', skipLinkStyles);
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    implementKeyboardNavigation() {
        if (!this.config.enableKeyboardNavigation) return;
        
        console.log('⌨️ Implementing keyboard navigation...');
        
        // Find all focusable elements
        this.updateFocusableElements();
        
        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Enhance custom components for keyboard access
        this.enhanceCustomComponentsKeyboardAccess();
        
        // Add visible focus indicators
        this.addFocusIndicators();
        
        this.a11yFeatures.keyboardNavigation = 'implemented';
    }

    updateFocusableElements() {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="menuitem"]:not([disabled])'
        ];
        
        this.focusableElements = Array.from(
            document.querySelectorAll(focusableSelectors.join(', '))
        ).filter(el => {
            return el.offsetWidth > 0 && 
                   el.offsetHeight > 0 && 
                   !el.hasAttribute('aria-hidden');
        });
    }

    handleKeyboardNavigation(e) {
        switch (e.key) {
            case 'Tab':
                // Enhanced tab navigation handled by browser
                this.updateFocusableElements();
                break;
                
            case 'Escape':
                this.handleEscapeKey(e);
                break;
                
            case 'Enter':
            case ' ':
                this.handleActivationKeys(e);
                break;
                
            case 'ArrowDown':
            case 'ArrowUp':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.handleArrowKeys(e);
                break;
                
            case 'Home':
            case 'End':
                this.handleHomeEndKeys(e);
                break;
        }
    }

    handleEscapeKey(e) {
        // Close any open modals or dropdowns
        const openModal = document.querySelector('.modal[aria-hidden="false"], .modal.open');
        if (openModal) {
            this.closeModal(openModal);
            e.preventDefault();
        }
        
        // Return focus to last focused element if applicable
        if (e.target.closest('[role="dialog"]')) {
            e.target.closest('[role="dialog"]').querySelector('[aria-label*="close"]')?.click();
        }
    }

    handleActivationKeys(e) {
        const target = e.target;
        
        // Handle custom interactive elements
        if (target.hasAttribute('role') && 
            ['button', 'menuitem', 'tab', 'option'].includes(target.getAttribute('role'))) {
            target.click();
            e.preventDefault();
        }
    }

    handleArrowKeys(e) {
        const target = e.target;
        
        // Handle menu navigation
        if (target.closest('[role="menubar"], [role="menu"]')) {
            this.handleMenuArrowNavigation(e);
        }
        
        // Handle tab navigation
        if (target.closest('[role="tablist"]')) {
            this.handleTabArrowNavigation(e);
        }
    }

    handleHomeEndKeys(e) {
        const container = e.target.closest('[role="menubar"], [role="menu"], [role="tablist"]');
        if (container) {
            const items = container.querySelectorAll('[role="menuitem"], [role="tab"]');
            if (items.length > 0) {
                if (e.key === 'Home') {
                    items[0].focus();
                } else {
                    items[items.length - 1].focus();
                }
                e.preventDefault();
            }
        }
    }

    enhanceCustomComponentsKeyboardAccess() {
        // Make data cards keyboard accessible
        const dataCards = document.querySelectorAll('.data-card, .feature-card');
        dataCards.forEach(card => {
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                
                if (!card.getAttribute('aria-label')) {
                    const title = card.querySelector('h3, h4, .data-label');
                    if (title) {
                        card.setAttribute('aria-label', title.textContent.trim());
                    }
                }
            }
        });
        
        // Enhance grit index components
        const gritComponents = document.querySelectorAll('.grit-score, .character-score');
        gritComponents.forEach(component => {
            component.setAttribute('role', 'status');
            component.setAttribute('aria-live', 'polite');
        });
    }

    addFocusIndicators() {
        const focusStyles = `
            <style>
                /* High contrast focus indicators */
                *:focus {
                    outline: 3px solid var(--burnt-orange);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 5px rgba(191, 87, 0, 0.3);
                }
                
                /* Custom focus for specific elements */
                .data-card:focus,
                .feature-card:focus {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(191, 87, 0, 0.4);
                }
                
                /* Skip mouse focus for better UX */
                .mouse-user *:focus {
                    outline: none;
                    box-shadow: none;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', focusStyles);
        
        // Detect mouse vs keyboard usage
        document.addEventListener('mousedown', () => {
            document.body.classList.add('mouse-user');
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('mouse-user');
            }
        });
    }

    enhanceColorAccessibility() {
        console.log('🎨 Enhancing color accessibility...');
        
        // Check color contrast ratios
        this.checkColorContrast();
        
        // Add high contrast mode
        this.addHighContrastMode();
        
        // Ensure information is not conveyed by color alone
        this.enhanceColorIndependentDesign();
        
        this.a11yFeatures.colorAccessibility = 'enhanced';
    }

    checkColorContrast() {
        // Define color combinations to check
        const colorCombinations = [
            { bg: '#000000', fg: '#ffffff' }, // Dark background, white text
            { bg: '#BF5700', fg: '#ffffff' }, // Orange background, white text
            { bg: '#002244', fg: '#ffffff' }  // Navy background, white text
        ];
        
        colorCombinations.forEach(combo => {
            const contrast = this.calculateContrastRatio(combo.bg, combo.fg);
            if (contrast < 4.5) {
                console.warn(`⚠️ Low contrast ratio: ${contrast.toFixed(2)} for ${combo.bg}/${combo.fg}`);
            } else {
                console.log(`✅ Good contrast ratio: ${contrast.toFixed(2)} for ${combo.bg}/${combo.fg}`);
            }
        });
    }

    calculateContrastRatio(color1, color2) {
        // Simplified contrast calculation (for demo purposes)
        // In production, you'd use a proper color contrast library
        const getLuminance = (hex) => {
            const rgb = parseInt(hex.substring(1), 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        };
        
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        const brightest = Math.max(l1, l2);
        const darkest = Math.min(l1, l2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    addHighContrastMode() {
        const highContrastButton = document.createElement('button');
        highContrastButton.className = 'high-contrast-toggle';
        highContrastButton.innerHTML = '🎨 High Contrast';
        highContrastButton.setAttribute('aria-label', 'Toggle high contrast mode');
        
        const highContrastStyles = `
            <style id="high-contrast-styles" disabled>
                .high-contrast * {
                    background: black !important;
                    color: white !important;
                    border: 1px solid white !important;
                }
                
                .high-contrast a {
                    color: yellow !important;
                }
                
                .high-contrast button {
                    background: white !important;
                    color: black !important;
                    border: 2px solid white !important;
                }
                
                .high-contrast .burnt-orange,
                .high-contrast [class*="orange"] {
                    background: yellow !important;
                    color: black !important;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', highContrastStyles);
        
        highContrastButton.addEventListener('click', () => {
            const isHighContrast = document.body.classList.toggle('high-contrast');
            const styles = document.getElementById('high-contrast-styles');
            styles.disabled = !isHighContrast;
            
            highContrastButton.setAttribute('aria-pressed', isHighContrast.toString());
            this.announceToScreenReader(isHighContrast ? 'High contrast mode enabled' : 'High contrast mode disabled');
        });
        
        return highContrastButton;
    }

    enhanceColorIndependentDesign() {
        // Add patterns/icons to color-coded elements
        const statusElements = document.querySelectorAll('.status, .badge, .trend');
        statusElements.forEach(element => {
            const text = element.textContent.toLowerCase();
            
            if (text.includes('success') || text.includes('good') || text.includes('up')) {
                element.innerHTML = '✅ ' + element.innerHTML;
            } else if (text.includes('error') || text.includes('bad') || text.includes('down')) {
                element.innerHTML = '❌ ' + element.innerHTML;
            } else if (text.includes('warning') || text.includes('medium')) {
                element.innerHTML = '⚠️ ' + element.innerHTML;
            }
        });
    }

    implementFocusManagement() {
        if (!this.config.enableFocusManagement) return;
        
        console.log('🎯 Implementing focus management...');
        
        // Focus trap for modals
        this.setupFocusTraps();
        
        // Restore focus after dynamic content changes
        this.setupFocusRestoration();
        
        this.a11yFeatures.focusManagement = 'implemented';
    }

    setupFocusTraps() {
        // Implementation would go here for modal focus trapping
        // This is a simplified version
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
                if (modal) {
                    const focusableElements = modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey && document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    setupFocusRestoration() {
        // Store focus before dynamic content changes
        let lastFocusedElement = null;
        
        document.addEventListener('focusout', () => {
            lastFocusedElement = document.activeElement;
        });
        
        // Restore focus after content updates
        const observer = new MutationObserver(() => {
            if (lastFocusedElement && !document.contains(lastFocusedElement)) {
                // Find similar element or focus management
                const similar = document.querySelector(`[aria-label="${lastFocusedElement.getAttribute('aria-label')}"]`);
                if (similar) {
                    similar.focus();
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    addARIALabels() {
        console.log('🏷️ Adding ARIA labels and descriptions...');
        
        // Add aria-labels to interactive elements without text
        const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
        interactiveElements.forEach(element => {
            if (!element.textContent.trim() && 
                !element.getAttribute('aria-label') && 
                !element.getAttribute('aria-labelledby')) {
                
                // Generate meaningful label based on context
                const label = this.generateAccessibleLabel(element);
                if (label) {
                    element.setAttribute('aria-label', label);
                }
            }
        });
        
        // Add descriptions to complex widgets
        this.addComplexWidgetDescriptions();
        
        this.a11yFeatures.ariaLabels = 'added';
    }

    generateAccessibleLabel(element) {
        // Context-aware label generation
        if (element.classList.contains('close')) return 'Close';
        if (element.classList.contains('menu')) return 'Open menu';
        if (element.classList.contains('search')) return 'Search';
        if (element.querySelector('svg, img')) {
            const img = element.querySelector('img');
            if (img && img.alt) return img.alt;
        }
        
        // Use nearby text as label
        const nearbyText = element.closest('[data-label]')?.dataset.label ||
                          element.previousElementSibling?.textContent?.trim() ||
                          element.nextElementSibling?.textContent?.trim();
        
        return nearbyText || null;
    }

    addComplexWidgetDescriptions() {
        // Add descriptions to Grit Index components
        const gritComponents = document.querySelectorAll('[class*="grit"]');
        gritComponents.forEach(component => {
            if (!component.getAttribute('aria-describedby')) {
                const description = document.createElement('div');
                description.id = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                description.className = 'sr-only';
                description.textContent = 'Real-time character analysis based on micro-expressions and performance metrics';
                
                component.parentNode.insertBefore(description, component.nextSibling);
                component.setAttribute('aria-describedby', description.id);
            }
        });
    }

    enhanceFormAccessibility() {
        console.log('📝 Enhancing form accessibility...');
        
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Add form labels and descriptions
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                this.enhanceInputAccessibility(input);
            });
            
            // Add error handling
            this.addFormErrorHandling(form);
        });
        
        this.a11yFeatures.formAccessibility = 'enhanced';
    }

    enhanceInputAccessibility(input) {
        // Ensure proper labeling
        if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
            const label = input.closest('label') || 
                         document.querySelector(`label[for="${input.id}"]`) ||
                         input.previousElementSibling;
            
            if (label && label.tagName === 'LABEL') {
                if (!input.id) {
                    input.id = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    label.setAttribute('for', input.id);
                }
            } else {
                // Generate accessible label
                const placeholder = input.getAttribute('placeholder');
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                }
            }
        }
        
        // Add required field indicators
        if (input.hasAttribute('required')) {
            input.setAttribute('aria-required', 'true');
            
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label && !label.querySelector('.required-indicator')) {
                label.innerHTML += ' <span class="required-indicator" aria-label="required">*</span>';
            }
        }
    }

    addFormErrorHandling(form) {
        form.addEventListener('submit', (e) => {
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            let hasErrors = false;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    this.showInputError(input, 'This field is required');
                    hasErrors = true;
                } else {
                    this.clearInputError(input);
                }
            });
            
            if (hasErrors) {
                e.preventDefault();
                const firstError = form.querySelector('[aria-invalid="true"]');
                if (firstError) {
                    firstError.focus();
                    this.announceToScreenReader('Please correct the errors in the form');
                }
            }
        });
    }

    showInputError(input, message) {
        input.setAttribute('aria-invalid', 'true');
        
        let errorElement = document.getElementById(`${input.id}-error`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = `${input.id}-error`;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        
        errorElement.textContent = message;
        input.setAttribute('aria-describedby', errorElement.id);
    }

    clearInputError(input) {
        input.removeAttribute('aria-invalid');
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    implementMotionPreferences() {
        if (!this.config.enableMotionReduction) return;
        
        console.log('🎬 Implementing motion preferences...');
        
        // Respect prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduce-motion');
            
            const reduceMotionStyles = `
                <style>
                    .reduce-motion * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        scroll-behavior: auto !important;
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', reduceMotionStyles);
        }
        
        this.a11yFeatures.motionPreferences = 'implemented';
    }

    setupAccessibilityToolbar() {
        console.log('🛠️ Setting up accessibility toolbar...');
        
        const toolbar = document.createElement('div');
        toolbar.className = 'accessibility-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Accessibility options');
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'a11y-toggle';
        toggleButton.innerHTML = '♿';
        toggleButton.setAttribute('aria-label', 'Open accessibility options');
        toggleButton.setAttribute('aria-expanded', 'false');
        
        const options = document.createElement('div');
        options.className = 'a11y-options hidden';
        options.innerHTML = `
            <div class="a11y-option">
                <button class="text-size-btn" data-action="increase-text">🔍+ Larger Text</button>
            </div>
            <div class="a11y-option">
                <button class="text-size-btn" data-action="decrease-text">🔍- Smaller Text</button>
            </div>
            <div class="a11y-option">
                ${this.addHighContrastMode().outerHTML}
            </div>
            <div class="a11y-option">
                <button class="motion-toggle">🎬 Toggle Animations</button>
            </div>
        `;
        
        toolbar.appendChild(toggleButton);
        toolbar.appendChild(options);
        
        // Add styles
        const toolbarStyles = `
            <style>
                .accessibility-toolbar {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: 'Inter', sans-serif;
                }
                
                .a11y-toggle {
                    background: var(--burnt-orange);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                }
                
                .a11y-options {
                    position: absolute;
                    bottom: 60px;
                    right: 0;
                    background: white;
                    color: black;
                    border-radius: 8px;
                    padding: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    min-width: 200px;
                }
                
                .a11y-options.hidden {
                    display: none;
                }
                
                .a11y-option {
                    margin-bottom: 8px;
                }
                
                .a11y-option button {
                    width: 100%;
                    padding: 8px;
                    background: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .a11y-option button:hover,
                .a11y-option button:focus {
                    background: #e0e0e0;
                    outline: 2px solid var(--burnt-orange);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', toolbarStyles);
        
        // Event listeners
        toggleButton.addEventListener('click', () => {
            const isExpanded = options.classList.toggle('hidden');
            toggleButton.setAttribute('aria-expanded', (!isExpanded).toString());
        });
        
        // Text size controls
        let currentTextScale = 1;
        options.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'increase-text') {
                currentTextScale = Math.min(currentTextScale + 0.1, 2);
                document.documentElement.style.fontSize = `${currentTextScale * 16}px`;
                this.announceToScreenReader(`Text size increased to ${Math.round(currentTextScale * 100)}%`);
            } else if (e.target.dataset.action === 'decrease-text') {
                currentTextScale = Math.max(currentTextScale - 0.1, 0.8);
                document.documentElement.style.fontSize = `${currentTextScale * 16}px`;
                this.announceToScreenReader(`Text size decreased to ${Math.round(currentTextScale * 100)}%`);
            }
        });
        
        document.body.appendChild(toolbar);
        this.a11yFeatures.accessibilityToolbar = 'added';
    }

    addScreenReaderAnnouncements() {
        console.log('📢 Adding screen reader announcements...');
        
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'sr-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        
        // Add screen reader only styles
        const srStyles = `
            <style>
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                
                .sr-only:focus {
                    position: static;
                    width: auto;
                    height: auto;
                    padding: inherit;
                    margin: inherit;
                    overflow: visible;
                    clip: auto;
                    white-space: inherit;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', srStyles);
        document.body.appendChild(liveRegion);
        
        // Listen for data updates to announce changes
        document.addEventListener('mlbDataUpdate', (e) => {
            this.announceToScreenReader(`Sports data updated: ${e.detail.type}`);
        });
        
        document.addEventListener('gritIndexUpdate', (e) => {
            this.announceToScreenReader(`Grit Index updated: ${e.detail.overall} out of 100`);
        });
        
        this.a11yFeatures.screenReaderSupport = 'implemented';
    }

    announceToScreenReader(message, priority = 'polite') {
        const liveRegion = document.getElementById('sr-live-region');
        if (liveRegion) {
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    validateAccessibility() {
        console.log('✅ Validating accessibility implementation...');
        
        const issues = [];
        
        // Check for missing alt text
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            issues.push(`${images.length} images missing alt text`);
        }
        
        // Check for missing form labels
        const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        if (unlabeledInputs.length > 0) {
            issues.push(`${unlabeledInputs.length} form inputs missing labels`);
        }
        
        // Check for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.substring(1));
            if (level > lastLevel + 1) {
                issues.push(`Heading hierarchy skip: ${heading.tagName} after h${lastLevel}`);
            }
            lastLevel = level;
        });
        
        // Check for interactive elements without proper roles
        const interactiveElements = document.querySelectorAll('[onclick]:not(button):not(a):not([role])');
        if (interactiveElements.length > 0) {
            issues.push(`${interactiveElements.length} interactive elements missing roles`);
        }
        
        if (issues.length === 0) {
            console.log('✅ No accessibility issues detected');
        } else {
            console.warn('⚠️ Accessibility issues found:', issues);
        }
        
        this.a11yFeatures.validation = {
            issues: issues.length,
            details: issues
        };
    }

    // Public API
    getAccessibilityStatus() {
        return {
            wcagLevel: this.config.wcagLevel,
            features: this.a11yFeatures,
            timestamp: Date.now()
        };
    }

    runAccessibilityAudit() {
        this.validateAccessibility();
        return this.a11yFeatures.validation;
    }
}

// Global instance
let blazeAccessibilityEnhancer;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            blazeAccessibilityEnhancer = new BlazeAccessibilityEnhancer();
            window.blazeAccessibilityEnhancer = blazeAccessibilityEnhancer;
            
            console.log('✅ Blaze Accessibility Enhancer loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Accessibility Enhancer:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeAccessibilityEnhancer;
}