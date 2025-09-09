/**
 * Blaze Intelligence Video Analytics System
 * Comprehensive tracking for video engagement and conversion
 */

(function() {
  'use strict';
  
  // Helper to push to dataLayer
  const dl = (event) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
    
    // Debug mode for development
    if (window.BLAZE_DEBUG) {
      console.log('[Analytics]', event);
    }
  };

  // Track page performance
  window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      dl({
        event: 'page_timing',
        page_load_time: pageLoadTime,
        page_path: window.location.pathname
      });
    }
  });

  // Video card clicks (hub page and homepage)
  document.addEventListener('DOMContentLoaded', () => {
    // Video cards
    document.querySelectorAll('.video-card, a[href*="/videos/"]').forEach(card => {
      card.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const videoSlug = href.match(/\/videos\/([^\/]+)/)?.[1] || 'unknown';
        dl({
          event: 'video_card_click',
          videoSlug: videoSlug,
          source: this.closest('[data-section]')?.dataset.section || 'unknown',
          page_path: window.location.pathname
        });
      });
    });

    // Watch strip impression (homepage)
    const watchStrip = document.querySelector('.watch-strip, [data-section="video-communication"]');
    if (watchStrip && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          dl({
            event: 'watch_strip_impression',
            page_path: window.location.pathname
          });
          io.disconnect();
        }
      }, { threshold: 0.25 });
      io.observe(watchStrip);
    }

    // Video iframe impressions and interactions
    const iframes = document.querySelectorAll('iframe[src*="videodelivery"], iframe[src*="cloudflarestream"]');
    iframes.forEach(iframe => {
      // Extract video ID from src
      const videoId = iframe.src.match(/\/([a-f0-9]{32})/)?.[1] || 'unknown';
      iframe.dataset.videoId = videoId;
      
      // Track impressions
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            dl({
              event: 'video_impression',
              videoId: videoId,
              videoSlug: window.location.pathname.split('/').pop() || 'unknown',
              page_path: window.location.pathname
            });
            io.disconnect();
          }
        }, { threshold: 0.25 });
        io.observe(iframe);
      }

      // Track first interaction
      let hasInteracted = false;
      const trackInteraction = () => {
        if (!hasInteracted) {
          hasInteracted = true;
          dl({
            event: 'video_first_interaction',
            videoId: videoId,
            videoSlug: window.location.pathname.split('/').pop() || 'unknown',
            page_path: window.location.pathname
          });
        }
      };
      
      iframe.addEventListener('click', trackInteraction);
      iframe.addEventListener('focus', trackInteraction);
    });

    // Chapter clicks
    document.addEventListener('click', (e) => {
      const chapterLink = e.target.closest('a[data-chapter-ts], .chapter-item, [data-chapter]');
      if (chapterLink) {
        const seconds = chapterLink.dataset.chapterTs || 
                       chapterLink.dataset.seconds || 
                       chapterLink.querySelector('[data-seconds]')?.dataset.seconds || '0';
        const title = chapterLink.dataset.chapterTitle || 
                     chapterLink.textContent.trim() || 
                     'unknown';
        const videoSlug = chapterLink.dataset.videoSlug || 
                         window.location.pathname.split('/').pop() || 
                         'unknown';
        
        dl({
          event: 'video_chapter_click',
          videoSlug: videoSlug,
          chapterSeconds: parseInt(seconds),
          chapterTitle: title,
          page_path: window.location.pathname
        });
      }
    });

    // CTA clicks
    document.addEventListener('click', (e) => {
      const cta = e.target.closest('a[data-cta], .cta-button, [href*="calendly"], [href^="mailto:"]');
      if (cta) {
        const ctaType = cta.dataset.cta || 
                       (cta.href.includes('calendly') ? 'calendar' : 
                        cta.href.includes('mailto') ? 'email' : 'other');
        const videoSlug = cta.dataset.videoSlug || 
                         window.location.pathname.split('/').pop() || 
                         'unknown';
        
        dl({
          event: 'cta_click',
          ctaType: ctaType,
          videoSlug: videoSlug,
          ctaText: cta.textContent.trim(),
          ctaUrl: cta.href,
          page_path: window.location.pathname
        });
      }
    });

    // Transcript clicks
    document.addEventListener('click', (e) => {
      const transcriptLink = e.target.closest('a[href*="/transcripts/"]');
      if (transcriptLink) {
        const videoSlug = transcriptLink.href.match(/\/transcripts\/([^\/\.]+)/)?.[1] || 'unknown';
        dl({
          event: 'transcript_click',
          videoSlug: videoSlug,
          page_path: window.location.pathname
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.tagName === 'FORM') {
        const formName = form.dataset.formName || form.id || 'unknown';
        const videoContext = form.querySelector('[name="video"]')?.value || 
                           new URLSearchParams(window.location.search).get('video') || 
                           'none';
        
        dl({
          event: 'form_submit',
          formName: formName,
          videoContext: videoContext,
          page_path: window.location.pathname
        });
      }
    });

    // Scroll depth tracking
    let maxScroll = 0;
    let scrollTimer;
    const trackScrollDepth = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          if (maxScroll >= 25 && maxScroll < 50) {
            dl({ event: 'scroll_depth', depth: 25, page_path: window.location.pathname });
          } else if (maxScroll >= 50 && maxScroll < 75) {
            dl({ event: 'scroll_depth', depth: 50, page_path: window.location.pathname });
          } else if (maxScroll >= 75 && maxScroll < 90) {
            dl({ event: 'scroll_depth', depth: 75, page_path: window.location.pathname });
          } else if (maxScroll >= 90) {
            dl({ event: 'scroll_depth', depth: 90, page_path: window.location.pathname });
          }
        }
      }, 100);
    };
    window.addEventListener('scroll', trackScrollDepth);

    // Time on page
    let startTime = Date.now();
    let isVisible = true;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isVisible = false;
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        dl({
          event: 'time_on_page',
          seconds: timeOnPage,
          page_path: window.location.pathname
        });
      } else {
        isVisible = true;
        startTime = Date.now();
      }
    });

    // Track when leaving page
    window.addEventListener('beforeunload', () => {
      if (isVisible) {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        dl({
          event: 'time_on_page',
          seconds: timeOnPage,
          page_path: window.location.pathname
        });
      }
    });
  });

  // UTM parameter preservation
  const preserveUTM = () => {
    const params = new URLSearchParams(window.location.search);
    const utmParams = {};
    let hasUTM = false;
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      if (params.has(param)) {
        utmParams[param] = params.get(param);
        hasUTM = true;
      }
    });
    
    if (hasUTM) {
      // Store in session
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
      
      // Add to all internal links
      document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
        const url = new URL(link.href, window.location.origin);
        Object.entries(utmParams).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
        link.href = url.toString();
      });
    } else {
      // Try to restore from session
      const stored = sessionStorage.getItem('utm_params');
      if (stored) {
        const utmParams = JSON.parse(stored);
        document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
          const url = new URL(link.href, window.location.origin);
          Object.entries(utmParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
          link.href = url.toString();
        });
      }
    }
  };
  
  document.addEventListener('DOMContentLoaded', preserveUTM);

  // Export for use in other scripts
  window.BlazeAnalytics = {
    track: dl,
    preserveUTM: preserveUTM
  };

})();