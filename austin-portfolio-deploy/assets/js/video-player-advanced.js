/**
 * Blaze Intelligence Advanced Video Player - Phase E
 * Championship-level video experience with HLS.js
 */

(function() {
  'use strict';

  class BlazeVideoPlayer {
    constructor() {
      this.currentVideo = null;
      this.hlsInstance = null;
      this.settings = this.loadSettings();
      this.progress = {};
      this.shortcuts = {
        ' ': 'playPause',
        'k': 'playPause',
        'ArrowLeft': 'seek-10',
        'ArrowRight': 'seek+10',
        'j': 'seek-10',
        'l': 'seek+10',
        '0-9': 'seekPercent',
        'm': 'toggleMute',
        'f': 'toggleFullscreen',
        'p': 'togglePIP',
        'c': 'toggleCaptions',
        '<': 'speedDown',
        '>': 'speedUp',
        '?': 'showHelp'
      };
    }

    init() {
      this.injectStyles();
      this.enhanceAllVideos();
      this.bindKeyboardShortcuts();
      this.setupProgressTracking();
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .blaze-video-wrapper {
          position: relative;
          background: #000;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .blaze-video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.9));
          padding: 1rem;
          transform: translateY(100%);
          transition: transform 0.3s ease;
          z-index: 10;
        }

        .blaze-video-wrapper:hover .blaze-video-controls,
        .blaze-video-controls.visible {
          transform: translateY(0);
        }

        .quality-selector {
          position: absolute;
          bottom: 60px;
          right: 10px;
          background: rgba(0,0,0,0.9);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 4px;
          padding: 0.5rem;
          display: none;
        }

        .quality-selector.active {
          display: block;
        }

        .quality-option {
          padding: 0.25rem 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s;
        }

        .quality-option:hover {
          background: rgba(255,140,0,0.3);
        }

        .quality-option.active {
          color: #FF8C00;
          font-weight: bold;
        }

        .speed-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: #00FFFF;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .speed-indicator.visible {
          opacity: 1;
        }

        .keyboard-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(30, 41, 59, 0.98);
          border: 2px solid #00FFFF;
          border-radius: 1rem;
          padding: 2rem;
          z-index: 9999;
          display: none;
          max-width: 500px;
          backdrop-filter: blur(10px);
        }

        .keyboard-overlay.visible {
          display: block;
        }

        .keyboard-overlay h3 {
          color: #00FFFF;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .shortcut-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .shortcut-key {
          background: rgba(255,140,0,0.2);
          color: #FF8C00;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-weight: bold;
        }

        .shortcut-action {
          color: #e2e8f0;
        }

        .progress-bar-wrapper {
          position: relative;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          margin: 0.5rem 0;
          cursor: pointer;
        }

        .progress-bar-filled {
          height: 100%;
          background: linear-gradient(90deg, #FF8C00, #00FFFF);
          border-radius: 3px;
          transition: width 0.1s;
        }

        .progress-bar-buffered {
          position: absolute;
          top: 0;
          height: 100%;
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }

        .chapter-markers {
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
        }

        .chapter-marker {
          position: absolute;
          width: 2px;
          height: 100%;
          background: #FFD700;
          opacity: 0.7;
        }

        .chapter-tooltip {
          position: absolute;
          bottom: 20px;
          background: rgba(0,0,0,0.9);
          color: #fff;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .progress-bar-wrapper:hover .chapter-tooltip {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }

    enhanceAllVideos() {
      document.querySelectorAll('.video-embed, #playerWrap').forEach(wrapper => {
        this.enhanceVideo(wrapper);
      });
    }

    enhanceVideo(wrapper) {
      const iframe = wrapper.querySelector('iframe');
      if (!iframe) return;

      const videoId = iframe.src.match(/\/([a-f0-9]{32})/)?.[1];
      const hlsUrl = wrapper.dataset.hlsUrl || window.VIDEO_HLS_URL;
      
      if (!hlsUrl) return;

      // Create enhanced UI
      const enhancedUI = document.createElement('div');
      enhancedUI.className = 'mt-4 space-y-3';
      enhancedUI.innerHTML = `
        <div class="flex flex-wrap gap-3">
          <button class="blaze-enhance-btn px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Enable Championship Mode
            </span>
          </button>
          
          <button class="blaze-pip-btn px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors" style="display:none;">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"></path>
              </svg>
              Picture-in-Picture
            </span>
          </button>

          <div class="flex items-center gap-2 text-sm text-slate-400">
            <kbd class="px-2 py-1 bg-slate-800 rounded">?</kbd>
            <span>Show keyboard shortcuts</span>
          </div>
        </div>
      `;

      wrapper.parentNode.insertBefore(enhancedUI, wrapper.nextSibling);

      // Handle enhancement
      const enhanceBtn = enhancedUI.querySelector('.blaze-enhance-btn');
      enhanceBtn.addEventListener('click', () => {
        this.activateChampionshipMode(wrapper, { videoId, hlsUrl });
      });
    }

    async activateChampionshipMode(wrapper, config) {
      // Save original content
      const originalContent = wrapper.innerHTML;
      wrapper.dataset.originalContent = originalContent;

      // Create video element
      const video = document.createElement('video');
      video.className = 'w-full h-full';
      video.controls = false; // We'll use custom controls
      video.style.aspectRatio = '16/9';
      
      // Create wrapper structure
      wrapper.innerHTML = '';
      wrapper.classList.add('blaze-video-wrapper');
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'relative';
      videoContainer.appendChild(video);
      
      // Add custom controls
      const controls = this.createCustomControls(video);
      videoContainer.appendChild(controls);
      
      // Add overlays
      const speedIndicator = document.createElement('div');
      speedIndicator.className = 'speed-indicator';
      videoContainer.appendChild(speedIndicator);
      
      wrapper.appendChild(videoContainer);
      
      // Initialize HLS
      await this.initializeHLS(video, config.hlsUrl);
      
      // Restore progress if available
      this.restoreProgress(video, config.videoId);
      
      // Setup event listeners
      this.setupVideoEventListeners(video, config.videoId);
      
      // Store reference
      this.currentVideo = video;
      
      // Visual feedback
      wrapper.classList.add('ring-2', 'ring-orange-500');
      
      // Track activation
      this.trackEvent('championship_mode_activated', { videoId: config.videoId });
    }

    createCustomControls(video) {
      const controls = document.createElement('div');
      controls.className = 'blaze-video-controls';
      controls.innerHTML = `
        <div class="progress-bar-wrapper">
          <div class="progress-bar-buffered" style="width: 0%"></div>
          <div class="progress-bar-filled" style="width: 0%"></div>
          <div class="chapter-markers"></div>
          <div class="chapter-tooltip"></div>
        </div>
        
        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center gap-3">
            <button class="play-pause-btn text-white hover:text-orange-400 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
            
            <div class="text-sm text-white">
              <span class="current-time">0:00</span> / <span class="duration">0:00</span>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button class="speed-btn text-white hover:text-orange-400 transition-colors">
              <span class="text-sm font-bold">1x</span>
            </button>
            
            <button class="quality-btn text-white hover:text-orange-400 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
            </button>
            
            <button class="fullscreen-btn text-white hover:text-orange-400 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="quality-selector">
          <div class="quality-option" data-quality="auto">Auto</div>
        </div>
      `;

      // Bind control events
      this.bindControlEvents(controls, video);
      
      return controls;
    }

    bindControlEvents(controls, video) {
      // Play/Pause
      const playPauseBtn = controls.querySelector('.play-pause-btn');
      playPauseBtn.addEventListener('click', () => this.togglePlayPause(video));
      
      // Progress bar
      const progressBar = controls.querySelector('.progress-bar-wrapper');
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
      });
      
      // Speed control
      const speedBtn = controls.querySelector('.speed-btn');
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      let currentSpeedIndex = 2; // Start at 1x
      
      speedBtn.addEventListener('click', () => {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
        const newSpeed = speeds[currentSpeedIndex];
        video.playbackRate = newSpeed;
        speedBtn.querySelector('span').textContent = `${newSpeed}x`;
        this.showSpeedIndicator(newSpeed);
      });
      
      // Quality selector
      const qualityBtn = controls.querySelector('.quality-btn');
      const qualitySelector = controls.querySelector('.quality-selector');
      
      qualityBtn.addEventListener('click', () => {
        qualitySelector.classList.toggle('active');
      });
      
      // Fullscreen
      const fullscreenBtn = controls.querySelector('.fullscreen-btn');
      fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen(video.parentElement.parentElement);
      });
    }

    async initializeHLS(video, hlsUrl) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support
        video.src = hlsUrl;
      } else {
        // Load HLS.js
        if (!window.Hls) {
          await this.loadHLSLibrary();
        }
        
        if (window.Hls && window.Hls.isSupported()) {
          this.hlsInstance = new window.Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000, // 60 MB
            maxBufferHole: 0.5,
            enableWorker: true,
            lowLatencyMode: false
          });
          
          this.hlsInstance.loadSource(hlsUrl);
          this.hlsInstance.attachMedia(video);
          
          // Handle quality levels
          this.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            this.updateQualityLevels();
          });
          
          // Handle errors
          this.hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('HLS fatal error:', data);
              this.handlePlaybackError(video);
            }
          });
        }
      }
    }

    loadHLSLibrary() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    updateQualityLevels() {
      if (!this.hlsInstance) return;
      
      const levels = this.hlsInstance.levels;
      const selector = document.querySelector('.quality-selector');
      
      if (!selector) return;
      
      // Clear existing options
      selector.innerHTML = '<div class="quality-option active" data-quality="-1">Auto</div>';
      
      // Add quality levels
      levels.forEach((level, index) => {
        const option = document.createElement('div');
        option.className = 'quality-option';
        option.dataset.quality = index;
        option.textContent = `${level.height}p`;
        option.addEventListener('click', () => {
          this.hlsInstance.currentLevel = index;
          document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.remove('active');
          });
          option.classList.add('active');
        });
        selector.appendChild(option);
      });
    }

    setupVideoEventListeners(video, videoId) {
      // Update progress bar
      video.addEventListener('timeupdate', () => {
        this.updateProgressBar(video);
        this.saveProgress(videoId, video.currentTime, video.duration);
      });
      
      // Update buffered
      video.addEventListener('progress', () => {
        this.updateBufferedBar(video);
      });
      
      // Update duration
      video.addEventListener('loadedmetadata', () => {
        this.updateDuration(video);
        this.addChapterMarkers(video);
      });
      
      // Track milestones
      this.trackVideoProgress(video, videoId);
    }

    updateProgressBar(video) {
      const progressBar = video.parentElement.querySelector('.progress-bar-filled');
      const currentTimeEl = video.parentElement.querySelector('.current-time');
      
      if (progressBar && video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }
      
      if (currentTimeEl) {
        currentTimeEl.textContent = this.formatTime(video.currentTime);
      }
    }

    updateBufferedBar(video) {
      const bufferedBar = video.parentElement.querySelector('.progress-bar-buffered');
      
      if (bufferedBar && video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const percent = (bufferedEnd / video.duration) * 100;
        bufferedBar.style.width = `${percent}%`;
      }
    }

    updateDuration(video) {
      const durationEl = video.parentElement.querySelector('.duration');
      if (durationEl) {
        durationEl.textContent = this.formatTime(video.duration);
      }
    }

    addChapterMarkers(video) {
      const markersContainer = video.parentElement.querySelector('.chapter-markers');
      if (!markersContainer) return;
      
      // Get chapters from page
      const chapters = [];
      document.querySelectorAll('.chapter-item').forEach(item => {
        const seconds = parseInt(item.dataset.chapterTs || 0);
        const title = item.querySelector('.text-white')?.textContent || '';
        chapters.push({ seconds, title });
      });
      
      // Add markers
      chapters.forEach(chapter => {
        const marker = document.createElement('div');
        marker.className = 'chapter-marker';
        marker.style.left = `${(chapter.seconds / video.duration) * 100}%`;
        marker.dataset.title = chapter.title;
        marker.dataset.time = chapter.seconds;
        markersContainer.appendChild(marker);
      });
    }

    bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (!this.currentVideo) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        // Number keys for seeking
        if (key >= '0' && key <= '9') {
          e.preventDefault();
          const percent = parseInt(key) * 10;
          this.currentVideo.currentTime = (percent / 100) * this.currentVideo.duration;
          return;
        }
        
        // Other shortcuts
        switch(key) {
          case ' ':
          case 'k':
            e.preventDefault();
            this.togglePlayPause(this.currentVideo);
            break;
            
          case 'arrowleft':
          case 'j':
            e.preventDefault();
            this.currentVideo.currentTime = Math.max(0, this.currentVideo.currentTime - 10);
            break;
            
          case 'arrowright':
          case 'l':
            e.preventDefault();
            this.currentVideo.currentTime = Math.min(this.currentVideo.duration, this.currentVideo.currentTime + 10);
            break;
            
          case 'm':
            e.preventDefault();
            this.currentVideo.muted = !this.currentVideo.muted;
            break;
            
          case 'f':
            e.preventDefault();
            this.toggleFullscreen(this.currentVideo.parentElement.parentElement);
            break;
            
          case 'p':
            e.preventDefault();
            this.togglePictureInPicture(this.currentVideo);
            break;
            
          case '<':
            e.preventDefault();
            this.currentVideo.playbackRate = Math.max(0.25, this.currentVideo.playbackRate - 0.25);
            this.showSpeedIndicator(this.currentVideo.playbackRate);
            break;
            
          case '>':
            e.preventDefault();
            this.currentVideo.playbackRate = Math.min(2, this.currentVideo.playbackRate + 0.25);
            this.showSpeedIndicator(this.currentVideo.playbackRate);
            break;
            
          case '?':
            e.preventDefault();
            this.toggleKeyboardHelp();
            break;
        }
      });
    }

    togglePlayPause(video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    toggleFullscreen(element) {
      if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }

    async togglePictureInPicture(video) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (err) {
        console.error('PiP error:', err);
      }
    }

    showSpeedIndicator(speed) {
      const indicator = document.querySelector('.speed-indicator');
      if (indicator) {
        indicator.textContent = `${speed}x`;
        indicator.classList.add('visible');
        setTimeout(() => {
          indicator.classList.remove('visible');
        }, 2000);
      }
    }

    toggleKeyboardHelp() {
      let overlay = document.querySelector('.keyboard-overlay');
      
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'keyboard-overlay';
        overlay.innerHTML = `
          <h3>Keyboard Shortcuts</h3>
          <div class="shortcut-row">
            <span class="shortcut-action">Play/Pause</span>
            <span><span class="shortcut-key">Space</span> or <span class="shortcut-key">K</span></span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Seek backward 10s</span>
            <span><span class="shortcut-key">←</span> or <span class="shortcut-key">J</span></span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Seek forward 10s</span>
            <span><span class="shortcut-key">→</span> or <span class="shortcut-key">L</span></span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Seek to 0-90%</span>
            <span><span class="shortcut-key">0</span> - <span class="shortcut-key">9</span></span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Toggle mute</span>
            <span class="shortcut-key">M</span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Toggle fullscreen</span>
            <span class="shortcut-key">F</span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Picture-in-Picture</span>
            <span class="shortcut-key">P</span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Decrease speed</span>
            <span class="shortcut-key"><</span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Increase speed</span>
            <span class="shortcut-key">></span>
          </div>
          <div class="shortcut-row">
            <span class="shortcut-action">Close this help</span>
            <span class="shortcut-key">ESC</span> or <span class="shortcut-key">?</span>
          </div>
        `;
        document.body.appendChild(overlay);
        
        // Close on escape or click outside
        const closeHelp = (e) => {
          if (e.key === 'Escape' || e.key === '?' || e.target === overlay) {
            overlay.classList.remove('visible');
            document.removeEventListener('keydown', closeHelp);
            overlay.removeEventListener('click', closeHelp);
          }
        };
        
        document.addEventListener('keydown', closeHelp);
        overlay.addEventListener('click', closeHelp);
      }
      
      overlay.classList.toggle('visible');
    }

    setupProgressTracking() {
      // Load saved progress
      const saved = localStorage.getItem('blazeVideoProgress');
      if (saved) {
        this.progress = JSON.parse(saved);
      }
    }

    saveProgress(videoId, currentTime, duration) {
      if (!videoId || !duration) return;
      
      this.progress[videoId] = {
        currentTime: currentTime,
        duration: duration,
        percent: (currentTime / duration) * 100,
        timestamp: Date.now()
      };
      
      localStorage.setItem('blazeVideoProgress', JSON.stringify(this.progress));
    }

    restoreProgress(video, videoId) {
      const saved = this.progress[videoId];
      if (saved && saved.currentTime > 5) {
        // Only restore if more than 5 seconds watched
        video.currentTime = saved.currentTime;
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = `Resuming from ${this.formatTime(saved.currentTime)}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    }

    trackVideoProgress(video, videoId) {
      const milestones = { 25: false, 50: false, 75: false, 90: false };
      
      video.addEventListener('timeupdate', () => {
        if (!video.duration) return;
        
        const percent = (video.currentTime / video.duration) * 100;
        
        Object.keys(milestones).forEach(milestone => {
          const m = parseInt(milestone);
          if (percent >= m && !milestones[m]) {
            milestones[m] = true;
            this.trackEvent('video_progress', {
              videoId: videoId,
              milestone: m,
              duration: video.duration
            });
          }
        });
      });
      
      video.addEventListener('ended', () => {
        this.trackEvent('video_complete', {
          videoId: videoId,
          duration: video.duration
        });
      });
    }

    handlePlaybackError(video) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'absolute inset-0 flex items-center justify-center bg-black/80';
      errorMsg.innerHTML = `
        <div class="text-center">
          <div class="text-red-500 text-4xl mb-4">⚠️</div>
          <div class="text-white text-lg mb-2">Playback Error</div>
          <div class="text-slate-400 mb-4">Unable to load video stream</div>
          <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Try Again
          </button>
        </div>
      `;
      
      const retryBtn = errorMsg.querySelector('button');
      retryBtn.addEventListener('click', () => {
        location.reload();
      });
      
      video.parentElement.appendChild(errorMsg);
    }

    formatTime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    loadSettings() {
      const defaults = {
        autoplay: false,
        defaultQuality: 'auto',
        defaultSpeed: 1,
        saveProgress: true,
        keyboardShortcuts: true
      };
      
      const saved = localStorage.getItem('blazeVideoSettings');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    saveSettings() {
      localStorage.setItem('blazeVideoSettings', JSON.stringify(this.settings));
    }

    trackEvent(event, data) {
      if (window.dataLayer) {
        window.dataLayer.push({
          event: event,
          ...data
        });
      }
      
      if (window.BlazeAnalytics) {
        window.BlazeAnalytics.track({ event, ...data });
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.BlazeVideoPlayer = new BlazeVideoPlayer();
      window.BlazeVideoPlayer.init();
    });
  } else {
    window.BlazeVideoPlayer = new BlazeVideoPlayer();
    window.BlazeVideoPlayer.init();
  }

})();