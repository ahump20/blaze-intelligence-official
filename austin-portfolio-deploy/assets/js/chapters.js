/**
 * Blaze Intelligence Interactive Chapters System
 * Enables chapter navigation and optional advanced player mode
 */

(function() {
  'use strict';

  let currentVideoEl = null;
  let hlsInstance = null;

  // Initialize chapters functionality
  const initChapters = () => {
    const playerWrap = document.querySelector('#playerWrap, .video-embed');
    if (!playerWrap) return;

    // Get video metadata from page
    const videoData = {
      videoId: playerWrap.querySelector('iframe')?.src?.match(/\/([a-f0-9]{32})/)?.[1],
      hlsUrl: playerWrap.dataset.hlsUrl || window.VIDEO_HLS_URL,
      slug: window.location.pathname.split('/').pop() || 'unknown'
    };

    // Add advanced player toggle if HLS URL is available
    if (videoData.hlsUrl) {
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'flex items-center gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg';
      toggleContainer.innerHTML = `
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="advancedPlayer" class="w-4 h-4">
          <span class="text-sm text-slate-300">Use Advanced Player (enables chapter seeking)</span>
        </label>
        <span class="text-xs text-slate-500">Beta</span>
      `;
      playerWrap.parentNode.insertBefore(toggleContainer, playerWrap);

      // Handle toggle
      const toggle = document.getElementById('advancedPlayer');
      toggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          await enableAdvancedPlayer(playerWrap, videoData);
        } else {
          disableAdvancedPlayer(playerWrap, videoData);
        }
      });
    }

    // Handle chapter clicks
    document.addEventListener('click', handleChapterClick);
  };

  // Enable advanced player with HLS.js
  const enableAdvancedPlayer = async (wrap, videoData) => {
    // Create video element
    currentVideoEl = document.createElement('video');
    currentVideoEl.controls = true;
    currentVideoEl.className = 'w-full h-full';
    currentVideoEl.style.aspectRatio = '16/9';
    currentVideoEl.dataset.videoId = videoData.videoId;

    // Clear wrapper and add video
    const originalContent = wrap.innerHTML;
    wrap.dataset.originalContent = originalContent;
    wrap.innerHTML = '';
    wrap.appendChild(currentVideoEl);

    // Load HLS
    if (currentVideoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      currentVideoEl.src = videoData.hlsUrl;
    } else if (window.Hls) {
      // Use existing Hls instance
      hlsInstance = new window.Hls();
      hlsInstance.loadSource(videoData.hlsUrl);
      hlsInstance.attachMedia(currentVideoEl);
    } else {
      // Dynamically load HLS.js
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });

        if (window.Hls.isSupported()) {
          hlsInstance = new window.Hls();
          hlsInstance.loadSource(videoData.hlsUrl);
          hlsInstance.attachMedia(currentVideoEl);
        }
      } catch (err) {
        console.error('Failed to load HLS.js:', err);
        disableAdvancedPlayer(wrap, videoData);
        return;
      }
    }

    // Track video progress
    trackVideoProgress(currentVideoEl, videoData.slug);

    // Add visual indicator
    wrap.classList.add('ring-2', 'ring-cyan-400/50');
  };

  // Disable advanced player and restore iframe
  const disableAdvancedPlayer = (wrap, videoData) => {
    // Cleanup HLS
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    // Restore original iframe
    const originalContent = wrap.dataset.originalContent || 
      `<iframe src="https://iframe.videodelivery.net/${videoData.videoId}" 
        loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowfullscreen style="width:100%; height:100%; border:0;"></iframe>`;
    
    wrap.innerHTML = originalContent;
    wrap.classList.remove('ring-2', 'ring-cyan-400/50');
    currentVideoEl = null;
  };

  // Handle chapter click
  const handleChapterClick = (e) => {
    const chapterLink = e.target.closest('[data-chapter-ts], .chapter-item');
    if (!chapterLink) return;

    e.preventDefault();

    const seconds = parseInt(
      chapterLink.dataset.chapterTs || 
      chapterLink.dataset.seconds || 
      '0'
    );

    // If advanced player is active and video element exists
    if (currentVideoEl) {
      currentVideoEl.currentTime = seconds;
      currentVideoEl.play().catch(err => {
        console.log('Autoplay prevented:', err);
      });
    }

    // Scroll to player
    const playerWrap = document.querySelector('#playerWrap, .video-embed');
    if (playerWrap) {
      playerWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Visual feedback
      playerWrap.classList.add('ring-4', 'ring-cyan-400');
      setTimeout(() => {
        playerWrap.classList.remove('ring-4', 'ring-cyan-400');
      }, 800);
    }

    // Track event
    if (window.BlazeAnalytics) {
      window.BlazeAnalytics.track({
        event: 'chapter_seek',
        seconds: seconds,
        chapterTitle: chapterLink.textContent.trim(),
        useAdvancedPlayer: !!currentVideoEl
      });
    }
  };

  // Track video progress milestones
  const trackVideoProgress = (video, slug) => {
    const milestones = {
      25: false,
      50: false,
      75: false,
      90: false
    };

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      
      const percent = (video.currentTime / video.duration) * 100;
      
      Object.keys(milestones).forEach(milestone => {
        const m = parseInt(milestone);
        if (percent >= m && !milestones[m]) {
          milestones[m] = true;
          
          if (window.BlazeAnalytics) {
            window.BlazeAnalytics.track({
              event: 'video_progress',
              milestone: m,
              videoSlug: slug
            });
          }
        }
      });
    });

    // Track completion
    video.addEventListener('ended', () => {
      if (window.BlazeAnalytics) {
        window.BlazeAnalytics.track({
          event: 'video_complete',
          videoSlug: slug
        });
      }
    });
  };

  // Add visual enhancements to chapter items
  const enhanceChapterItems = () => {
    document.querySelectorAll('.chapter-item, [data-chapter-ts]').forEach(item => {
      // Add hover effect
      item.classList.add('cursor-pointer', 'hover:bg-slate-800/50', 'transition-colors');
      
      // Add play icon
      if (!item.querySelector('.chapter-play-icon')) {
        const icon = document.createElement('span');
        icon.className = 'chapter-play-icon inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity';
        icon.innerHTML = '▶';
        item.appendChild(icon);
      }
    });
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initChapters();
      enhanceChapterItems();
    });
  } else {
    initChapters();
    enhanceChapterItems();
  }

  // Export for use in other scripts
  window.BlazeChapters = {
    init: initChapters,
    seekTo: (seconds) => {
      if (currentVideoEl) {
        currentVideoEl.currentTime = seconds;
        currentVideoEl.play();
      }
    }
  };

})();