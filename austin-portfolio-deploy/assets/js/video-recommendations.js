/**
 * Blaze Intelligence Video Recommendation Engine - Phase F
 * AI-powered content suggestions based on viewing patterns
 */

(function() {
  'use strict';

  class BlazeRecommendations {
    constructor() {
      this.viewingHistory = this.loadHistory();
      this.userProfile = this.buildUserProfile();
      this.contentMatrix = this.buildContentMatrix();
      this.recommendations = [];
      this.modelVersion = '1.0.0';
    }

    init() {
      this.trackCurrentVideo();
      this.generateRecommendations();
      this.injectRecommendationUI();
      this.setupEventListeners();
      this.prefetchRecommendedContent();
    }

    // Load viewing history from localStorage
    loadHistory() {
      const stored = localStorage.getItem('blazeViewingHistory');
      return stored ? JSON.parse(stored) : {
        videos: {},
        sessions: [],
        totalWatchTime: 0,
        preferences: {
          preferredCategory: null,
          averageViewDuration: 0,
          completionRate: 0,
          preferredTime: null
        }
      };
    }

    // Build user profile based on viewing patterns
    buildUserProfile() {
      const profile = {
        type: 'unknown',
        interests: [],
        engagementLevel: 'low',
        viewingPattern: 'casual',
        contentPreferences: {
          coaching: 0,
          executive: 0,
          partnership: 0
        }
      };

      if (this.viewingHistory.videos) {
        // Calculate category preferences
        Object.values(this.viewingHistory.videos).forEach(video => {
          if (video.category) {
            profile.contentPreferences[video.category] = 
              (profile.contentPreferences[video.category] || 0) + video.watchTime;
          }
        });

        // Determine user type
        const totalTime = Object.values(profile.contentPreferences).reduce((a, b) => a + b, 0);
        if (totalTime > 600) { // 10+ minutes
          profile.engagementLevel = 'high';
          profile.viewingPattern = 'power-user';
        } else if (totalTime > 300) { // 5+ minutes
          profile.engagementLevel = 'medium';
          profile.viewingPattern = 'engaged';
        }

        // Identify primary interest
        const topCategory = Object.entries(profile.contentPreferences)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (topCategory && topCategory[1] > 0) {
          profile.interests.push(topCategory[0]);
          
          // Map to user type
          if (topCategory[0] === 'coaching') {
            profile.type = 'coach-athlete';
          } else if (topCategory[0] === 'executive') {
            profile.type = 'executive-analyst';
          } else if (topCategory[0] === 'partnership') {
            profile.type = 'brand-sponsor';
          }
        }
      }

      return profile;
    }

    // Build content similarity matrix
    buildContentMatrix() {
      // This would normally come from a backend ML model
      // For now, using predefined relationships
      return {
        'sports-conversation': {
          tags: ['coaching', 'player-development', 'communication', 'baseball', 'training'],
          embeddings: [0.8, 0.2, 0.1, 0.9, 0.7], // Simplified vector
          relatedVideos: ['ut-dctf-nil-sponsorship-proposal'],
          category: 'coaching'
        },
        'dmk-final-presentation': {
          tags: ['executive', 'analytics', 'decision-making', 'roi', 'frameworks'],
          embeddings: [0.2, 0.9, 0.8, 0.3, 0.5],
          relatedVideos: ['sports-conversation'],
          category: 'executive'
        },
        'ut-dctf-nil-sponsorship-proposal': {
          tags: ['nil', 'sponsorship', 'partnerships', 'compliance', 'brand'],
          embeddings: [0.3, 0.5, 0.9, 0.4, 0.8],
          relatedVideos: ['dmk-final-presentation'],
          category: 'partnership'
        }
      };
    }

    // Track current video viewing
    trackCurrentVideo() {
      const pathname = window.location.pathname;
      const videoMatch = pathname.match(/\/videos\/([^\/]+)/);
      
      if (videoMatch) {
        const videoSlug = videoMatch[1];
        const startTime = Date.now();
        
        // Initialize video tracking
        if (!this.viewingHistory.videos[videoSlug]) {
          this.viewingHistory.videos[videoSlug] = {
            slug: videoSlug,
            views: 0,
            watchTime: 0,
            completions: 0,
            lastViewed: null,
            category: this.contentMatrix[videoSlug]?.category || 'unknown'
          };
        }
        
        const videoData = this.viewingHistory.videos[videoSlug];
        videoData.views++;
        videoData.lastViewed = startTime;
        
        // Track session
        this.viewingHistory.sessions.push({
          videoSlug: videoSlug,
          timestamp: startTime,
          referrer: document.referrer,
          deviceType: this.getDeviceType()
        });
        
        // Update on page unload
        window.addEventListener('beforeunload', () => {
          const duration = (Date.now() - startTime) / 1000;
          videoData.watchTime += duration;
          this.viewingHistory.totalWatchTime += duration;
          this.saveHistory();
        });
        
        // Track video completion
        document.addEventListener('video_complete', (e) => {
          if (e.detail && e.detail.videoSlug === videoSlug) {
            videoData.completions++;
            this.saveHistory();
            this.triggerRecommendationUpdate();
          }
        });
      }
    }

    // Generate AI-powered recommendations
    generateRecommendations() {
      const currentVideo = this.getCurrentVideoSlug();
      const profile = this.userProfile;
      const recommendations = [];

      // 1. Content-based filtering
      if (currentVideo && this.contentMatrix[currentVideo]) {
        const currentContent = this.contentMatrix[currentVideo];
        
        // Find similar videos by embeddings
        Object.entries(this.contentMatrix).forEach(([slug, content]) => {
          if (slug !== currentVideo) {
            const similarity = this.cosineSimilarity(
              currentContent.embeddings,
              content.embeddings
            );
            
            recommendations.push({
              slug: slug,
              score: similarity * 0.4, // 40% weight for content similarity
              reason: 'content_similarity',
              category: content.category
            });
          }
        });
      }

      // 2. Collaborative filtering based on viewing patterns
      if (profile.interests.length > 0) {
        Object.entries(this.contentMatrix).forEach(([slug, content]) => {
          if (profile.interests.includes(content.category)) {
            const existingRec = recommendations.find(r => r.slug === slug);
            if (existingRec) {
              existingRec.score += 0.3; // Add 30% for matching interests
              existingRec.reason += ',interest_match';
            } else {
              recommendations.push({
                slug: slug,
                score: 0.3,
                reason: 'interest_match',
                category: content.category
              });
            }
          }
        });
      }

      // 3. Behavioral patterns
      const viewingPatterns = this.analyzeViewingPatterns();
      if (viewingPatterns.preferredLength) {
        // Boost videos of similar length
        recommendations.forEach(rec => {
          const videoMeta = this.getVideoMetadata(rec.slug);
          if (videoMeta && Math.abs(videoMeta.duration - viewingPatterns.preferredLength) < 180) {
            rec.score += 0.2; // 20% for duration match
            rec.reason += ',duration_match';
          }
        });
      }

      // 4. Diversity injection (avoid filter bubble)
      const unexploredCategories = ['coaching', 'executive', 'partnership']
        .filter(cat => !profile.interests.includes(cat));
      
      if (unexploredCategories.length > 0 && Math.random() > 0.7) {
        // 30% chance to recommend something new
        const randomCategory = unexploredCategories[Math.floor(Math.random() * unexploredCategories.length)];
        const diverseVideo = Object.entries(this.contentMatrix)
          .find(([slug, content]) => content.category === randomCategory);
        
        if (diverseVideo) {
          recommendations.push({
            slug: diverseVideo[0],
            score: 0.25,
            reason: 'exploration',
            category: diverseVideo[1].category
          });
        }
      }

      // 5. Recency and freshness
      Object.entries(this.viewingHistory.videos).forEach(([slug, data]) => {
        const daysSinceViewed = (Date.now() - data.lastViewed) / (1000 * 60 * 60 * 24);
        if (daysSinceViewed > 7) {
          const existingRec = recommendations.find(r => r.slug === slug);
          if (existingRec) {
            existingRec.score += 0.1; // 10% boost for re-engagement
            existingRec.reason += ',re_engagement';
          }
        }
      });

      // Sort and filter
      this.recommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) // Top 5 recommendations
        .map(rec => {
          // Add metadata
          const meta = this.getVideoMetadata(rec.slug);
          return {
            ...rec,
            ...meta,
            confidence: Math.min(rec.score, 1.0),
            explanation: this.generateExplanation(rec)
          };
        });

      return this.recommendations;
    }

    // Calculate cosine similarity between vectors
    cosineSimilarity(vec1, vec2) {
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
      }
      
      return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    // Analyze viewing patterns
    analyzeViewingPatterns() {
      const patterns = {
        preferredLength: null,
        viewingTime: null,
        bingeWatching: false,
        completionTendency: 0
      };

      if (this.viewingHistory.videos) {
        const videos = Object.values(this.viewingHistory.videos);
        
        // Average watch time
        if (videos.length > 0) {
          const avgWatchTime = videos.reduce((sum, v) => sum + v.watchTime, 0) / videos.length;
          patterns.preferredLength = avgWatchTime;
        }
        
        // Completion rate
        const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
        const totalCompletions = videos.reduce((sum, v) => sum + v.completions, 0);
        patterns.completionTendency = totalViews > 0 ? totalCompletions / totalViews : 0;
        
        // Binge watching detection
        if (this.viewingHistory.sessions.length >= 3) {
          const recentSessions = this.viewingHistory.sessions.slice(-3);
          const timeDiffs = [];
          for (let i = 1; i < recentSessions.length; i++) {
            timeDiffs.push(recentSessions[i].timestamp - recentSessions[i-1].timestamp);
          }
          // If videos watched within 30 minutes of each other
          patterns.bingeWatching = timeDiffs.every(diff => diff < 1800000);
        }
      }

      return patterns;
    }

    // Generate human-readable explanation
    generateExplanation(recommendation) {
      const reasons = recommendation.reason.split(',');
      const explanations = {
        'content_similarity': 'Similar to what you\'re watching',
        'interest_match': `Matches your ${recommendation.category} interests`,
        'duration_match': 'Perfect length for you',
        'exploration': 'Something new to explore',
        're_engagement': 'Worth another watch'
      };

      const primaryReason = reasons[0];
      return explanations[primaryReason] || 'Recommended for you';
    }

    // Get video metadata
    getVideoMetadata(slug) {
      // This would normally come from the videos.json or API
      const metadata = {
        'sports-conversation': {
          title: 'Sports Conversation',
          duration: 540, // 9 minutes in seconds
          thumbnail: 'https://videodelivery.net/138facaf760c65e9b4efab3715ae6f50/thumbnails/thumbnail.jpg',
          description: 'Coach/player dialogue on tactical fluency'
        },
        'dmk-final-presentation': {
          title: 'DMK Final Presentation',
          duration: 720, // 12 minutes
          thumbnail: 'https://videodelivery.net/eec1d7b09566f8acbcbadab3a0df5924/thumbnails/thumbnail.jpg',
          description: 'Executive decision frameworks'
        },
        'ut-dctf-nil-sponsorship-proposal': {
          title: 'UT × DCTF Partnership',
          duration: 900, // 15 minutes
          thumbnail: 'https://videodelivery.net/acb0f50e86caf8f840f3b36a0c463229/thumbnails/thumbnail.jpg',
          description: 'NIL sponsorship strategies'
        }
      };

      return metadata[slug] || null;
    }

    // Inject recommendation UI
    injectRecommendationUI() {
      // Check if we're on a video page
      if (!window.location.pathname.includes('/videos/')) return;

      // Create recommendation section
      const recSection = document.createElement('section');
      recSection.id = 'ai-recommendations';
      recSection.className = 'max-w-6xl mx-auto px-4 py-12';
      recSection.innerHTML = `
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            AI Recommendations
          </h2>
          <p class="text-slate-400">
            Personalized suggestions based on your viewing patterns
            <span class="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Beta</span>
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="recommendation-grid">
          <!-- Recommendations will be inserted here -->
        </div>

        <div class="mt-8 p-4 bg-slate-800/50 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-400">
              <span class="font-semibold">Your Profile:</span>
              <span id="user-profile-type" class="ml-2 text-white"></span>
            </div>
            <button id="reset-recommendations" class="text-sm text-orange-400 hover:text-orange-300">
              Reset Preferences
            </button>
          </div>
        </div>
      `;

      // Insert after main content
      const main = document.querySelector('main');
      if (main) {
        main.appendChild(recSection);
        this.renderRecommendations();
      }
    }

    // Render recommendation cards
    renderRecommendations() {
      const grid = document.getElementById('recommendation-grid');
      const profileType = document.getElementById('user-profile-type');
      
      if (!grid) return;

      // Update profile type
      if (profileType) {
        const typeMap = {
          'coach-athlete': 'Coach/Athlete Focus',
          'executive-analyst': 'Executive/Analytics Focus',
          'brand-sponsor': 'Brand/Partnership Focus',
          'unknown': 'New Viewer'
        };
        profileType.textContent = typeMap[this.userProfile.type] || 'Exploring';
      }

      // Clear existing
      grid.innerHTML = '';

      // Render each recommendation
      this.recommendations.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card relative group';
        card.innerHTML = `
          <a href="/videos/${rec.slug}/" class="block glass-card overflow-hidden hover:ring-2 hover:ring-cyan-400 transition-all">
            <div class="aspect-video relative">
              <img src="${rec.thumbnail}" alt="${rec.title}" 
                   class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                   loading="lazy">
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <!-- Confidence indicator -->
              <div class="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                <span class="text-cyan-400">${Math.round(rec.confidence * 100)}%</span> match
              </div>
              
              <!-- Ranking badge -->
              <div class="absolute top-2 left-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${index + 1}
              </div>
            </div>
            
            <div class="p-4">
              <h3 class="text-lg font-semibold text-white mb-1">${rec.title}</h3>
              <p class="text-sm text-slate-400 mb-2">${rec.description}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-cyan-400">${rec.explanation}</span>
                <span class="text-xs text-slate-500">${Math.floor(rec.duration / 60)} min</span>
              </div>
            </div>
          </a>
        `;

        // Track recommendation clicks
        card.addEventListener('click', () => {
          this.trackRecommendationClick(rec);
        });

        grid.appendChild(card);
      });

      // Add loading animation if no recommendations yet
      if (this.recommendations.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
            <p class="text-slate-400">Analyzing your preferences...</p>
          </div>
        `;

        // Generate recommendations after a delay
        setTimeout(() => {
          this.generateRecommendations();
          this.renderRecommendations();
        }, 1500);
      }
    }

    // Setup event listeners
    setupEventListeners() {
      // Reset preferences button
      const resetBtn = document.getElementById('reset-recommendations');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetPreferences();
        });
      }

      // Listen for video progress events
      document.addEventListener('video_progress', (e) => {
        if (e.detail && e.detail.milestone >= 50) {
          // Update recommendations after 50% viewing
          this.triggerRecommendationUpdate();
        }
      });

      // Refresh recommendations on visibility change
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkForUpdates();
        }
      });
    }

    // Track recommendation click
    trackRecommendationClick(recommendation) {
      // Send to analytics
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'recommendation_click',
          recommendation_slug: recommendation.slug,
          recommendation_rank: this.recommendations.indexOf(recommendation) + 1,
          recommendation_confidence: recommendation.confidence,
          recommendation_reason: recommendation.reason
        });
      }

      // Update internal tracking
      if (!this.viewingHistory.recommendations) {
        this.viewingHistory.recommendations = {};
      }
      
      if (!this.viewingHistory.recommendations[recommendation.slug]) {
        this.viewingHistory.recommendations[recommendation.slug] = {
          impressions: 0,
          clicks: 0
        };
      }
      
      this.viewingHistory.recommendations[recommendation.slug].clicks++;
      this.saveHistory();
    }

    // Trigger recommendation update
    triggerRecommendationUpdate() {
      // Rebuild profile and regenerate
      this.userProfile = this.buildUserProfile();
      this.generateRecommendations();
      this.renderRecommendations();
    }

    // Check for updates
    checkForUpdates() {
      // Check if new videos are available
      fetch('/data/videos.json')
        .then(res => res.json())
        .then(data => {
          if (data.videos && data.videos.length > Object.keys(this.contentMatrix).length) {
            // New videos available, refresh
            location.reload();
          }
        })
        .catch(err => console.error('Update check failed:', err));
    }

    // Prefetch recommended content
    prefetchRecommendedContent() {
      // Prefetch top recommendation thumbnails and pages
      this.recommendations.slice(0, 3).forEach(rec => {
        // Prefetch thumbnail
        const img = new Image();
        img.src = rec.thumbnail;
        
        // Prefetch page
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/videos/${rec.slug}/`;
        document.head.appendChild(link);
      });
    }

    // Reset preferences
    resetPreferences() {
      if (confirm('Reset all viewing history and recommendations?')) {
        localStorage.removeItem('blazeViewingHistory');
        localStorage.removeItem('blazeVideoProgress');
        this.viewingHistory = this.loadHistory();
        this.userProfile = this.buildUserProfile();
        this.generateRecommendations();
        this.renderRecommendations();
        
        // Show confirmation
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Preferences reset successfully';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
      }
    }

    // Save history
    saveHistory() {
      localStorage.setItem('blazeViewingHistory', JSON.stringify(this.viewingHistory));
    }

    // Get current video slug
    getCurrentVideoSlug() {
      const match = window.location.pathname.match(/\/videos\/([^\/]+)/);
      return match ? match[1] : null;
    }

    // Get device type
    getDeviceType() {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.BlazeRecommendations = new BlazeRecommendations();
      window.BlazeRecommendations.init();
    });
  } else {
    window.BlazeRecommendations = new BlazeRecommendations();
    window.BlazeRecommendations.init();
  }

})();