/**
 * Blaze Intelligence A/B Testing Framework - Phase G
 * Championship-level experimentation and optimization
 */

(function() {
  'use strict';

  class BlazeExperiments {
    constructor() {
      this.experiments = this.loadExperiments();
      this.userId = this.getOrCreateUserId();
      this.assignments = {};
      this.events = [];
      this.config = {
        apiEndpoint: '/api/experiments',
        flushInterval: 30000, // 30 seconds
        batchSize: 50,
        enableRealTime: true
      };
    }

    init() {
      this.loadActiveExperiments();
      this.assignUserToExperiments();
      this.applyExperimentVariants();
      this.setupEventTracking();
      this.startEventFlushing();
      this.injectDebugUI();
    }

    // Load experiments configuration
    loadExperiments() {
      // In production, this would come from an API
      return {
        'video_player_enhancement': {
          id: 'exp_001',
          name: 'Video Player Enhancement Test',
          status: 'active',
          traffic: 1.0, // 100% of users
          variants: [
            {
              id: 'control',
              name: 'Standard Player',
              weight: 0.5,
              config: {
                showChampionshipButton: false,
                autoEnableAdvanced: false
              }
            },
            {
              id: 'treatment',
              name: 'Auto Championship Mode',
              weight: 0.5,
              config: {
                showChampionshipButton: true,
                autoEnableAdvanced: true,
                showOnboarding: true
              }
            }
          ],
          metrics: ['engagement_rate', 'completion_rate', 'championship_adoption'],
          successCriteria: {
            primary: { metric: 'completion_rate', improvement: 0.1 },
            secondary: { metric: 'engagement_rate', improvement: 0.05 }
          }
        },
        'cta_optimization': {
          id: 'exp_002',
          name: 'CTA Button Optimization',
          status: 'active',
          traffic: 0.5, // 50% of users
          variants: [
            {
              id: 'control',
              name: 'Orange CTAs',
              weight: 0.33,
              config: {
                primaryColor: '#FF8C00',
                primaryText: 'Book 15-min Consultation',
                secondaryText: 'Request Sample Report'
              }
            },
            {
              id: 'variant_a',
              name: 'Cyan CTAs',
              weight: 0.33,
              config: {
                primaryColor: '#00FFFF',
                primaryText: 'Start Free Analysis',
                secondaryText: 'Get Custom Report'
              }
            },
            {
              id: 'variant_b',
              name: 'Gradient CTAs',
              weight: 0.34,
              config: {
                primaryColor: 'linear-gradient(135deg, #FF8C00, #00FFFF)',
                primaryText: 'Unlock Championship Insights',
                secondaryText: 'See Your Team\'s Potential'
              }
            }
          ],
          metrics: ['cta_click_rate', 'conversion_rate', 'bounce_rate'],
          successCriteria: {
            primary: { metric: 'conversion_rate', improvement: 0.15 },
            guardrail: { metric: 'bounce_rate', threshold: 0.4 }
          }
        },
        'recommendation_algorithm': {
          id: 'exp_003',
          name: 'Recommendation Algorithm Test',
          status: 'active',
          traffic: 0.3, // 30% of users
          variants: [
            {
              id: 'control',
              name: 'Content-Based',
              weight: 0.5,
              config: {
                algorithm: 'content_similarity',
                diversityFactor: 0.1
              }
            },
            {
              id: 'treatment',
              name: 'Hybrid ML',
              weight: 0.5,
              config: {
                algorithm: 'hybrid_ml',
                diversityFactor: 0.3,
                personalizeRanking: true
              }
            }
          ],
          metrics: ['recommendation_ctr', 'session_duration', 'videos_per_session'],
          successCriteria: {
            primary: { metric: 'recommendation_ctr', improvement: 0.2 }
          }
        }
      };
    }

    // Load active experiments from API
    async loadActiveExperiments() {
      // In production, fetch from API
      // For now, using local config
      this.activeExperiments = Object.values(this.experiments)
        .filter(exp => exp.status === 'active');
    }

    // Get or create user ID
    getOrCreateUserId() {
      let userId = localStorage.getItem('blazeUserId');
      if (!userId) {
        userId = this.generateUserId();
        localStorage.setItem('blazeUserId', userId);
      }
      return userId;
    }

    // Generate unique user ID
    generateUserId() {
      return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Assign user to experiments
    assignUserToExperiments() {
      this.activeExperiments.forEach(experiment => {
        // Check if user should be in experiment
        const inExperiment = this.shouldEnterExperiment(experiment);
        
        if (inExperiment) {
          // Get or assign variant
          const assignment = this.getOrAssignVariant(experiment);
          this.assignments[experiment.id] = assignment;
          
          // Track assignment
          this.trackEvent('experiment_assigned', {
            experiment_id: experiment.id,
            experiment_name: experiment.name,
            variant_id: assignment.variant.id,
            variant_name: assignment.variant.name
          });
        }
      });
    }

    // Check if user should enter experiment
    shouldEnterExperiment(experiment) {
      // Check traffic allocation
      const hash = this.hashString(this.userId + experiment.id);
      const bucket = hash % 100 / 100;
      return bucket < experiment.traffic;
    }

    // Get or assign variant
    getOrAssignVariant(experiment) {
      // Check for existing assignment
      const stored = localStorage.getItem(`exp_${experiment.id}`);
      if (stored) {
        const assignment = JSON.parse(stored);
        // Find variant config
        const variant = experiment.variants.find(v => v.id === assignment.variantId);
        return { ...assignment, variant };
      }

      // New assignment
      const variant = this.selectVariant(experiment);
      const assignment = {
        experimentId: experiment.id,
        variantId: variant.id,
        assignedAt: Date.now(),
        variant: variant
      };

      // Store assignment
      localStorage.setItem(`exp_${experiment.id}`, JSON.stringify({
        experimentId: assignment.experimentId,
        variantId: assignment.variantId,
        assignedAt: assignment.assignedAt
      }));

      return assignment;
    }

    // Select variant based on weights
    selectVariant(experiment) {
      const random = Math.random();
      let cumulative = 0;
      
      for (const variant of experiment.variants) {
        cumulative += variant.weight;
        if (random < cumulative) {
          return variant;
        }
      }
      
      // Fallback to last variant
      return experiment.variants[experiment.variants.length - 1];
    }

    // Apply experiment variants
    applyExperimentVariants() {
      Object.values(this.assignments).forEach(assignment => {
        const experiment = this.experiments[assignment.experimentId];
        if (!experiment) return;

        switch(experiment.id) {
          case 'exp_001':
            this.applyVideoPlayerVariant(assignment.variant);
            break;
          case 'exp_002':
            this.applyCTAVariant(assignment.variant);
            break;
          case 'exp_003':
            this.applyRecommendationVariant(assignment.variant);
            break;
        }
      });
    }

    // Apply video player variant
    applyVideoPlayerVariant(variant) {
      if (variant.config.autoEnableAdvanced && window.BlazeVideoPlayer) {
        // Auto-enable championship mode
        setTimeout(() => {
          const wrapper = document.querySelector('.video-embed, #playerWrap');
          if (wrapper) {
            const btn = document.querySelector('.blaze-enhance-btn');
            if (btn && variant.config.showChampionshipButton) {
              btn.click();
            }
          }
        }, 2000);
      }

      if (variant.config.showOnboarding) {
        this.showOnboardingTooltip();
      }
    }

    // Apply CTA variant
    applyCTAVariant(variant) {
      // Update CTA buttons
      document.querySelectorAll('[data-cta="calendar"]').forEach(btn => {
        if (variant.config.primaryText) {
          const textEl = btn.querySelector('span:last-child');
          if (textEl) textEl.textContent = variant.config.primaryText;
        }
        
        if (variant.config.primaryColor) {
          if (variant.config.primaryColor.includes('gradient')) {
            btn.style.background = variant.config.primaryColor;
          } else {
            btn.style.backgroundColor = variant.config.primaryColor;
          }
        }
      });

      document.querySelectorAll('[data-cta="email"]').forEach(btn => {
        if (variant.config.secondaryText) {
          const textEl = btn.querySelector('span:last-child');
          if (textEl) textContent = variant.config.secondaryText;
        }
      });
    }

    // Apply recommendation variant
    applyRecommendationVariant(variant) {
      if (window.BlazeRecommendations) {
        // Override algorithm settings
        window.BlazeRecommendations.algorithmConfig = variant.config;
        
        if (variant.config.algorithm === 'hybrid_ml') {
          // Enable advanced ML features
          window.BlazeRecommendations.enableMLFeatures = true;
        }
      }
    }

    // Show onboarding tooltip
    showOnboardingTooltip() {
      const tooltip = document.createElement('div');
      tooltip.className = 'fixed top-20 right-4 bg-gradient-to-r from-orange-500 to-cyan-500 text-white p-4 rounded-lg shadow-2xl z-50 max-w-sm';
      tooltip.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="text-2xl">🏆</div>
          <div>
            <h4 class="font-bold mb-1">Championship Mode Available!</h4>
            <p class="text-sm opacity-90">Enhanced video controls, keyboard shortcuts, and progress tracking.</p>
            <button class="mt-2 text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">
              Learn More
            </button>
          </div>
          <button class="ml-auto text-white/70 hover:text-white">&times;</button>
        </div>
      `;

      document.body.appendChild(tooltip);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        tooltip.style.transition = 'opacity 0.5s';
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 500);
      }, 10000);

      // Close button
      tooltip.querySelector('button:last-child').addEventListener('click', () => {
        tooltip.remove();
      });
    }

    // Setup event tracking
    setupEventTracking() {
      // Track page views
      this.trackEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer
      });

      // Track video events
      document.addEventListener('video_play', (e) => {
        this.trackEvent('video_play', e.detail);
      });

      document.addEventListener('video_complete', (e) => {
        this.trackEvent('video_complete', e.detail);
      });

      // Track CTA clicks
      document.querySelectorAll('[data-cta]').forEach(cta => {
        cta.addEventListener('click', () => {
          const ctaType = cta.dataset.cta;
          const videoSlug = cta.dataset.videoSlug;
          
          this.trackEvent('cta_click', {
            cta_type: ctaType,
            video_slug: videoSlug,
            cta_text: cta.textContent.trim()
          });
        });
      });

      // Track recommendation clicks
      document.addEventListener('recommendation_click', (e) => {
        this.trackEvent('recommendation_click', e.detail);
      });
    }

    // Track event
    trackEvent(eventName, properties = {}) {
      const event = {
        event: eventName,
        userId: this.userId,
        timestamp: Date.now(),
        properties: {
          ...properties,
          ...this.getExperimentContext()
        },
        sessionId: this.getSessionId(),
        deviceType: this.getDeviceType()
      };

      this.events.push(event);

      // Send to dataLayer for GTM
      if (window.dataLayer) {
        window.dataLayer.push(event);
      }

      // Flush if batch is full
      if (this.events.length >= this.config.batchSize) {
        this.flushEvents();
      }
    }

    // Get experiment context
    getExperimentContext() {
      const context = {};
      Object.values(this.assignments).forEach(assignment => {
        context[`exp_${assignment.experimentId}`] = assignment.variantId;
      });
      return context;
    }

    // Get session ID
    getSessionId() {
      let sessionId = sessionStorage.getItem('blazeSessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now().toString(36);
        sessionStorage.setItem('blazeSessionId', sessionId);
      }
      return sessionId;
    }

    // Get device type
    getDeviceType() {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }

    // Start event flushing
    startEventFlushing() {
      // Periodic flush
      setInterval(() => {
        if (this.events.length > 0) {
          this.flushEvents();
        }
      }, this.config.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
      });
    }

    // Flush events to server
    async flushEvents() {
      if (this.events.length === 0) return;

      const batch = [...this.events];
      this.events = [];

      try {
        // In production, send to API
        // await fetch(this.config.apiEndpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ events: batch })
        // });

        // For now, log to console in dev
        if (window.BLAZE_DEBUG) {
          console.log('[A/B Testing] Flushing events:', batch);
        }

        // Store locally for analysis
        this.storeEventsLocally(batch);
      } catch (error) {
        console.error('Failed to flush events:', error);
        // Re-add events to queue
        this.events = batch.concat(this.events);
      }
    }

    // Store events locally for analysis
    storeEventsLocally(events) {
      const stored = localStorage.getItem('blazeExperimentEvents');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = existing.concat(events);
      
      // Keep only last 1000 events
      if (updated.length > 1000) {
        updated.splice(0, updated.length - 1000);
      }
      
      localStorage.setItem('blazeExperimentEvents', JSON.stringify(updated));
    }

    // Inject debug UI
    injectDebugUI() {
      // Only in debug mode
      if (!window.location.search.includes('debug=true')) return;

      const debugPanel = document.createElement('div');
      debugPanel.id = 'ab-testing-debug';
      debugPanel.className = 'fixed bottom-4 left-4 bg-slate-900 border border-cyan-400 rounded-lg p-4 z-50 max-w-sm';
      debugPanel.innerHTML = `
        <h3 class="text-cyan-400 font-bold mb-3 flex items-center justify-between">
          🧪 A/B Testing Debug
          <button class="text-white/50 hover:text-white text-sm" id="close-debug">&times;</button>
        </h3>
        
        <div class="space-y-2 text-sm">
          <div class="text-slate-400">
            User ID: <span class="text-white font-mono text-xs">${this.userId.substring(0, 12)}...</span>
          </div>
          
          <div class="text-slate-400">Active Experiments:</div>
          <div class="space-y-1 pl-2">
            ${Object.values(this.assignments).map(a => `
              <div class="text-white">
                <span class="text-orange-400">${a.experimentId}:</span>
                <span class="text-cyan-400">${a.variantId}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="text-slate-400">
            Events Queued: <span class="text-white">${this.events.length}</span>
          </div>
          
          <div class="flex gap-2 mt-3">
            <button class="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600" id="flush-events">
              Flush Events
            </button>
            <button class="px-3 py-1 bg-cyan-500 text-white rounded text-xs hover:bg-cyan-600" id="view-results">
              View Results
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(debugPanel);

      // Event handlers
      document.getElementById('close-debug').addEventListener('click', () => {
        debugPanel.remove();
      });

      document.getElementById('flush-events').addEventListener('click', () => {
        this.flushEvents();
        alert('Events flushed!');
      });

      document.getElementById('view-results').addEventListener('click', () => {
        this.showResultsDashboard();
      });
    }

    // Show results dashboard
    showResultsDashboard() {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-slate-900 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
          <h2 class="text-2xl font-bold text-white mb-4">Experiment Results Dashboard</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            ${this.activeExperiments.map(exp => this.generateExperimentCard(exp)).join('')}
          </div>
          
          <button class="mt-6 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600" id="close-dashboard">
            Close Dashboard
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('close-dashboard').addEventListener('click', () => {
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    }

    // Generate experiment card
    generateExperimentCard(experiment) {
      const assignment = this.assignments[experiment.id];
      const events = JSON.parse(localStorage.getItem('blazeExperimentEvents') || '[]');
      
      // Calculate metrics
      const metrics = this.calculateMetrics(experiment, events);
      
      return `
        <div class="bg-slate-800 rounded-lg p-4">
          <h3 class="text-lg font-bold text-white mb-2">${experiment.name}</h3>
          <div class="text-sm text-slate-400 mb-3">
            Status: <span class="text-green-400">${experiment.status}</span>
          </div>
          
          ${assignment ? `
            <div class="mb-3">
              <div class="text-sm text-slate-400">Your Variant:</div>
              <div class="text-white font-semibold">${assignment.variant.name}</div>
            </div>
          ` : '<div class="text-slate-500">Not enrolled</div>'}
          
          <div class="space-y-2">
            <div class="text-sm text-slate-400">Metrics:</div>
            ${experiment.metrics.map(metric => `
              <div class="flex justify-between text-xs">
                <span class="text-slate-300">${metric}:</span>
                <span class="text-cyan-400">${metrics[metric] || 'N/A'}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="mt-3 pt-3 border-t border-slate-700">
            <div class="text-xs text-slate-400">
              Sample Size: <span class="text-white">${metrics.sampleSize || 0}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Calculate metrics
    calculateMetrics(experiment, events) {
      const metrics = {
        sampleSize: 0
      };

      // Filter events for this experiment
      const expEvents = events.filter(e => 
        e.properties && e.properties[`exp_${experiment.id}`]
      );

      metrics.sampleSize = new Set(expEvents.map(e => e.userId)).size;

      // Calculate specific metrics
      experiment.metrics.forEach(metric => {
        switch(metric) {
          case 'engagement_rate':
            const engaged = expEvents.filter(e => 
              e.event === 'video_play' || e.event === 'chapter_seek'
            ).length;
            metrics[metric] = metrics.sampleSize > 0 
              ? ((engaged / metrics.sampleSize) * 100).toFixed(1) + '%'
              : '0%';
            break;
            
          case 'completion_rate':
            const completed = expEvents.filter(e => e.event === 'video_complete').length;
            const started = expEvents.filter(e => e.event === 'video_play').length;
            metrics[metric] = started > 0 
              ? ((completed / started) * 100).toFixed(1) + '%'
              : '0%';
            break;
            
          case 'cta_click_rate':
            const ctaClicks = expEvents.filter(e => e.event === 'cta_click').length;
            const pageViews = expEvents.filter(e => e.event === 'page_view').length;
            metrics[metric] = pageViews > 0 
              ? ((ctaClicks / pageViews) * 100).toFixed(1) + '%'
              : '0%';
            break;
            
          case 'recommendation_ctr':
            const recClicks = expEvents.filter(e => e.event === 'recommendation_click').length;
            const recImpressions = expEvents.filter(e => 
              e.event === 'page_view' && e.properties.path.includes('/videos/')
            ).length;
            metrics[metric] = recImpressions > 0 
              ? ((recClicks / recImpressions) * 100).toFixed(1) + '%'
              : '0%';
            break;
        }
      });

      return metrics;
    }

    // Hash string for consistent bucketing
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.BlazeExperiments = new BlazeExperiments();
      window.BlazeExperiments.init();
    });
  } else {
    window.BlazeExperiments = new BlazeExperiments();
    window.BlazeExperiments.init();
  }

})();