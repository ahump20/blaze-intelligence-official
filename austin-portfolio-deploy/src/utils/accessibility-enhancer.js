/**
 * Comprehensive Accessibility Enhancement System
 * WCAG 2.1 AAA compliant features for Blaze Intelligence
 */

class AccessibilityEnhancer {
  constructor() {
    this.settings = this.loadSettings();
    this.observers = new Map();
    this.announcements = [];
    this.focusHistory = [];
    
    // Feature flags
    this.features = {
      screenReader: true,
      keyboardNavigation: true,
      highContrast: true,
      reducedMotion: true,
      fontSize: true,
      colorBlind: true,
      focusManagement: true,
      announcements: true
    };
    
    this.initialize();
  }
  
  loadSettings() {
    const defaults = {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'normal', // small, normal, large, xl
      colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
      announcements: true,
      keyboardOnly: false,
      screenReaderMode: false
    };
    
    try {
      const stored = localStorage.getItem('accessibility-settings');
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
      return defaults;
    }
  }
  
  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }
  
  initialize() {
    this.createAccessibilityToolbar();
    this.setupKeyboardNavigation();
    this.setupScreenReader();
    this.setupFocusManagement();
    this.applySettings();
    this.startAccessibilityMonitoring();
    
    // Listen for system preferences
    this.detectSystemPreferences();
  }
  
  // === ACCESSIBILITY TOOLBAR ===
  createAccessibilityToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'accessibility-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Accessibility Options');
    
    toolbar.innerHTML = `
      <button type="button" class="a11y-toggle" id="a11y-menu-toggle" aria-expanded="false" aria-controls="a11y-menu">
        <span class="visually-hidden">Accessibility Menu</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11H11C9.9 11 9 10.1 9 9V7.5L3 7V9C3 11.2 4.8 13 7 13H8V22H10V13H14V22H16V13H17C19.2 13 21 11.2 21 9Z"/>
        </svg>
      </button>
      
      <div id="a11y-menu" class="a11y-menu" hidden>
        <div class="a11y-section">
          <h3>Visual</h3>
          <label class="a11y-option">
            <input type="checkbox" id="high-contrast" ${this.settings.highContrast ? 'checked' : ''}>
            <span>High Contrast</span>
          </label>
          <label class="a11y-option">
            <input type="checkbox" id="reduced-motion" ${this.settings.reducedMotion ? 'checked' : ''}>
            <span>Reduce Motion</span>
          </label>
          <div class="a11y-option">
            <label for="font-size">Font Size:</label>
            <select id="font-size">
              <option value="small" ${this.settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
              <option value="normal" ${this.settings.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="large" ${this.settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
              <option value="xl" ${this.settings.fontSize === 'xl' ? 'selected' : ''}>Extra Large</option>
            </select>
          </div>
          <div class="a11y-option">
            <label for="colorblind-mode">Color Vision:</label>
            <select id="colorblind-mode">
              <option value="none" ${this.settings.colorBlindMode === 'none' ? 'selected' : ''}>Normal</option>
              <option value="protanopia" ${this.settings.colorBlindMode === 'protanopia' ? 'selected' : ''}>Protanopia</option>
              <option value="deuteranopia" ${this.settings.colorBlindMode === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option>
              <option value="tritanopia" ${this.settings.colorBlindMode === 'tritanopia' ? 'selected' : ''}>Tritanopia</option>
            </select>
          </div>
        </div>
        
        <div class="a11y-section">
          <h3>Navigation</h3>
          <label class="a11y-option">
            <input type="checkbox" id="keyboard-only" ${this.settings.keyboardOnly ? 'checked' : ''}>
            <span>Keyboard Only Mode</span>
          </label>
          <label class="a11y-option">
            <input type="checkbox" id="screen-reader-mode" ${this.settings.screenReaderMode ? 'checked' : ''}>
            <span>Screen Reader Mode</span>
          </label>
          <label class="a11y-option">
            <input type="checkbox" id="announcements" ${this.settings.announcements ? 'checked' : ''}>
            <span>Live Announcements</span>
          </label>
        </div>
        
        <div class="a11y-section">
          <button type="button" id="reset-a11y" class="a11y-button">Reset to Defaults</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(toolbar);
    this.bindToolbarEvents();
    this.injectToolbarStyles();
  }
  
  bindToolbarEvents() {
    // Menu toggle
    const menuToggle = document.getElementById('a11y-menu-toggle');
    const menu = document.getElementById('a11y-menu');
    
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isOpen);
      menu.hidden = isOpen;
      
      if (!isOpen) {
        menu.querySelector('input, select, button').focus();
      }
    });
    
    // Settings controls
    document.getElementById('high-contrast').addEventListener('change', (e) => {
      this.toggleHighContrast(e.target.checked);
    });
    
    document.getElementById('reduced-motion').addEventListener('change', (e) => {
      this.toggleReducedMotion(e.target.checked);
    });
    
    document.getElementById('font-size').addEventListener('change', (e) => {
      this.setFontSize(e.target.value);
    });
    
    document.getElementById('colorblind-mode').addEventListener('change', (e) => {
      this.setColorBlindMode(e.target.value);
    });
    
    document.getElementById('keyboard-only').addEventListener('change', (e) => {
      this.toggleKeyboardOnly(e.target.checked);
    });
    
    document.getElementById('screen-reader-mode').addEventListener('change', (e) => {
      this.toggleScreenReaderMode(e.target.checked);
    });
    
    document.getElementById('announcements').addEventListener('change', (e) => {
      this.toggleAnnouncements(e.target.checked);
    });
    
    document.getElementById('reset-a11y').addEventListener('click', () => {
      this.resetSettings();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.accessibility-toolbar')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    });
  }
  
  // === SCREEN READER SUPPORT ===
  setupScreenReader() {
    // Create live regions for announcements
    this.createLiveRegions();
    
    // Add screen reader labels to data visualizations
    this.enhanceDataVisualizations();
    
    // Improve form accessibility
    this.enhanceFormAccessibility();
  }
  
  createLiveRegions() {
    // Polite announcements (non-interrupting)
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'visually-hidden';
    politeRegion.id = 'polite-announcements';
    document.body.appendChild(politeRegion);
    
    // Assertive announcements (interrupting)
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'visually-hidden';
    assertiveRegion.id = 'assertive-announcements';
    document.body.appendChild(assertiveRegion);
    
    this.politeRegion = politeRegion;
    this.assertiveRegion = assertiveRegion;
  }
  
  announce(message, priority = 'polite') {
    if (!this.settings.announcements) return;
    
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (!region) return;
    
    // Clear and set message with small delay to ensure screen reader notices
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
      this.announcements.push({
        message,
        priority,
        timestamp: Date.now()
      });
      
      // Keep only last 10 announcements
      if (this.announcements.length > 10) {
        this.announcements.shift();
      }
    }, 10);
  }
  
  enhanceDataVisualizations() {
    // Find and enhance charts and graphs
    const dataElements = document.querySelectorAll('[data-value], .data-card, .chart, .graph');
    
    dataElements.forEach(element => {
      if (!element.getAttribute('role')) {
        element.setAttribute('role', 'img');
      }
      
      // Add descriptive labels
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        const label = this.generateDataLabel(element);
        if (label) {
          element.setAttribute('aria-label', label);
        }
      }
      
      // Make data tables more accessible
      if (element.querySelector('table')) {
        this.enhanceTable(element.querySelector('table'));
      }
    });
  }
  
  generateDataLabel(element) {
    const value = element.dataset.value || element.textContent;
    const label = element.dataset.label || element.querySelector('.data-label')?.textContent;
    const badge = element.querySelector('.data-badge')?.textContent;
    
    let description = '';
    if (label && value) {
      description = `${label}: ${value}`;
    }
    if (badge && !badge.includes('LOADING')) {
      description += `. Data source: ${badge}`;
    }
    
    return description || null;
  }
  
  enhanceTable(table) {
    // Add table structure for screen readers
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption');
      caption.textContent = 'Data table';
      table.insertBefore(caption, table.firstChild);
    }
    
    // Add headers if missing
    const firstRow = table.querySelector('tr');
    if (firstRow && !firstRow.querySelector('th')) {
      const cells = firstRow.querySelectorAll('td');
      cells.forEach((cell, index) => {
        const th = document.createElement('th');
        th.textContent = cell.textContent || `Column ${index + 1}`;
        th.setAttribute('scope', 'col');
        cell.parentNode.replaceChild(th, cell);
      });
    }
  }
  
  // === KEYBOARD NAVIGATION ===
  setupKeyboardNavigation() {
    this.createSkipLinks();
    this.enhanceKeyboardFocus();
    this.addKeyboardShortcuts();
  }
  
  createSkipLinks() {
    const skipNav = document.createElement('div');
    skipNav.className = 'skip-navigation';
    skipNav.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;
    
    document.body.insertBefore(skipNav, document.body.firstChild);
  }
  
  enhanceKeyboardFocus() {
    // Add focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-focus *:focus {
        outline: 3px solid var(--burnt-orange) !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-focus *:focus:not(:focus-visible) {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Detect keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-focus');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-focus');
    });
    
    // Improve focus management for dynamic content
    this.observeFocusableElements();
  }
  
  addKeyboardShortcuts() {
    const shortcuts = {
      'Alt+M': () => document.getElementById('a11y-menu-toggle')?.click(),
      'Alt+H': () => document.querySelector('header')?.focus(),
      'Alt+N': () => document.querySelector('nav')?.focus(),
      'Alt+S': () => document.querySelector('[role="search"]')?.focus(),
      'Alt+C': () => document.querySelector('#main-content')?.focus(),
      'Alt+F': () => document.querySelector('footer')?.focus()
    };
    
    document.addEventListener('keydown', (e) => {
      const combination = [];
      if (e.altKey) combination.push('Alt');
      if (e.ctrlKey) combination.push('Ctrl');
      if (e.shiftKey) combination.push('Shift');
      combination.push(e.key.toUpperCase());
      
      const shortcut = combination.join('+');
      if (shortcuts[shortcut]) {
        e.preventDefault();
        shortcuts[shortcut]();
      }
    });
  }
  
  // === FOCUS MANAGEMENT ===
  setupFocusManagement() {
    this.trapFocus();
    this.manageFocusHistory();
  }
  
  trapFocus() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      
      const modal = document.querySelector('[role="dialog"]:not([hidden])');
      if (modal) {
        const focusableElements = this.getFocusableElements(modal);
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
  
  getFocusableElements(container = document) {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(selector))
      .filter(el => !el.hidden && el.offsetParent !== null);
  }
  
  // === VISUAL ENHANCEMENTS ===
  toggleHighContrast(enabled) {
    this.settings.highContrast = enabled;
    document.body.classList.toggle('high-contrast', enabled);
    this.saveSettings();
    this.announce(enabled ? 'High contrast enabled' : 'High contrast disabled');
  }
  
  toggleReducedMotion(enabled) {
    this.settings.reducedMotion = enabled;
    document.body.classList.toggle('reduced-motion', enabled);
    this.saveSettings();
    this.announce(enabled ? 'Reduced motion enabled' : 'Reduced motion disabled');
  }
  
  setFontSize(size) {
    this.settings.fontSize = size;
    document.body.className = document.body.className.replace(/font-size-\w+/g, '');
    document.body.classList.add(`font-size-${size}`);
    this.saveSettings();
    this.announce(`Font size changed to ${size}`);
  }
  
  setColorBlindMode(mode) {
    this.settings.colorBlindMode = mode;
    document.body.className = document.body.className.replace(/colorblind-\w+/g, '');
    if (mode !== 'none') {
      document.body.classList.add(`colorblind-${mode}`);
    }
    this.saveSettings();
    this.announce(mode === 'none' ? 'Normal color vision' : `${mode} color vision simulation enabled`);
  }
  
  applySettings() {
    this.toggleHighContrast(this.settings.highContrast);
    this.toggleReducedMotion(this.settings.reducedMotion);
    this.setFontSize(this.settings.fontSize);
    this.setColorBlindMode(this.settings.colorBlindMode);
    this.toggleKeyboardOnly(this.settings.keyboardOnly);
    this.toggleScreenReaderMode(this.settings.screenReaderMode);
  }
  
  detectSystemPreferences() {
    // Detect prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotionQuery.matches && !localStorage.getItem('accessibility-settings')) {
      this.toggleReducedMotion(true);
      document.getElementById('reduced-motion').checked = true;
    }
    
    // Detect high contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (highContrastQuery.matches && !localStorage.getItem('accessibility-settings')) {
      this.toggleHighContrast(true);
      document.getElementById('high-contrast').checked = true;
    }
  }
  
  // === UTILITY METHODS ===
  resetSettings() {
    this.settings = this.loadSettings();
    localStorage.removeItem('accessibility-settings');
    this.applySettings();
    
    // Reset form controls
    document.getElementById('high-contrast').checked = false;
    document.getElementById('reduced-motion').checked = false;
    document.getElementById('font-size').value = 'normal';
    document.getElementById('colorblind-mode').value = 'none';
    document.getElementById('keyboard-only').checked = false;
    document.getElementById('screen-reader-mode').checked = false;
    document.getElementById('announcements').checked = true;
    
    this.announce('Accessibility settings reset to defaults');
  }
  
  injectToolbarStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-toolbar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      
      .a11y-toggle {
        background: var(--burnt-orange);
        color: white;
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .a11y-toggle:hover {
        background: #e65c00;
      }
      
      .a11y-menu {
        position: absolute;
        top: 60px;
        right: 0;
        background: white;
        color: #333;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        padding: 16px;
        min-width: 280px;
        max-width: 320px;
      }
      
      .a11y-section {
        margin-bottom: 16px;
      }
      
      .a11y-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--tennessee-deep);
      }
      
      .a11y-option {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .a11y-option input,
      .a11y-option select {
        margin-right: 8px;
      }
      
      .a11y-button {
        background: var(--burnt-orange);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .visually-hidden {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .skip-navigation {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        left: -9999px;
        z-index: 999;
        padding: 8px 16px;
        background: var(--burnt-orange);
        color: white;
        text-decoration: none;
      }
      
      .skip-link:focus {
        left: 6px;
        top: 6px;
      }
      
      /* High contrast mode */
      .high-contrast {
        filter: contrast(150%) brightness(120%);
      }
      
      .high-contrast .data-card {
        border: 2px solid white !important;
      }
      
      /* Reduced motion */
      .reduced-motion *,
      .reduced-motion *::before,
      .reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Font sizes */
      .font-size-small { font-size: 14px; }
      .font-size-normal { font-size: 16px; }
      .font-size-large { font-size: 18px; }
      .font-size-xl { font-size: 20px; }
      
      /* Color blind simulations */
      .colorblind-protanopia {
        filter: url(#protanopia-filter);
      }
      
      .colorblind-deuteranopia {
        filter: url(#deuteranopia-filter);
      }
      
      .colorblind-tritanopia {
        filter: url(#tritanopia-filter);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Additional methods for specific features
  toggleKeyboardOnly(enabled) {
    this.settings.keyboardOnly = enabled;
    document.body.classList.toggle('keyboard-only', enabled);
    if (enabled) {
      document.body.classList.add('keyboard-focus');
    }
    this.saveSettings();
  }
  
  toggleScreenReaderMode(enabled) {
    this.settings.screenReaderMode = enabled;
    document.body.classList.toggle('screen-reader-mode', enabled);
    this.saveSettings();
  }
  
  toggleAnnouncements(enabled) {
    this.settings.announcements = enabled;
    this.saveSettings();
  }
  
  startAccessibilityMonitoring() {
    // Monitor for new dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.enhanceNewContent(node);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  enhanceNewContent(element) {
    // Add accessibility features to new content
    const dataElements = element.querySelectorAll('[data-value], .data-card');
    dataElements.forEach(el => {
      if (!el.getAttribute('role')) {
        el.setAttribute('role', 'img');
        const label = this.generateDataLabel(el);
        if (label) {
          el.setAttribute('aria-label', label);
        }
      }
    });
  }
}

// Initialize accessibility enhancer
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityEnhancer = new AccessibilityEnhancer();
  });
}

export default AccessibilityEnhancer;