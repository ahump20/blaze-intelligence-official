/**
 * Blaze Intelligence Video Search System
 * Advanced search with filters, suggestions, and instant results
 */

class VideoSearchEngine {
    constructor() {
        this.videos = [];
        this.searchIndex = {};
        this.searchHistory = this.loadSearchHistory();
        this.popularSearches = [];
        this.filters = {
            category: null,
            duration: null,
            register: null
        };
    }

    async init() {
        await this.loadVideoData();
        this.buildSearchIndex();
        this.injectSearchUI();
        this.bindEventListeners();
        this.loadPopularSearches();
        this.setupKeyboardShortcuts();
    }

    // Load video data
    async loadVideoData() {
        try {
            const response = await fetch('/data/videos.json');
            const data = await response.json();
            this.videos = data.videos || [];
        } catch (error) {
            console.error('Failed to load video data:', error);
            // Fallback to embedded data
            this.videos = [
                {
                    slug: 'sports-conversation',
                    title: 'Sports Conversation - Teaching Voice & Tactical Fluency',
                    shortTitle: 'Sports Conversation',
                    description: 'A candid sports dialogue demonstrating the coach/player register',
                    category: 'coaching',
                    register: 'Coach/Player',
                    duration: 'PT9M',
                    tags: ['coaching', 'player-development', 'communication', 'baseball', 'training'],
                    thumbnail: 'https://videodelivery.net/138facaf760c65e9b4efab3715ae6f50/thumbnails/thumbnail.jpg'
                },
                {
                    slug: 'dmk-final-presentation',
                    title: 'DMK Final Presentation - Structure, Proof, Decision Rules',
                    shortTitle: 'DMK Final Presentation',
                    description: 'A formal walkthrough of how we turn funnel mathematics into operator decisions',
                    category: 'executive',
                    register: 'Executive/Analytics',
                    duration: 'PT12M',
                    tags: ['executive', 'analytics', 'decision-making', 'roi', 'frameworks'],
                    thumbnail: 'https://videodelivery.net/eec1d7b09566f8acbcbadab3a0df5924/thumbnails/thumbnail.jpg'
                },
                {
                    slug: 'ut-dctf-nil-sponsorship-proposal',
                    title: 'UT × DCTF NIL Sponsorship Proposal',
                    shortTitle: 'UT × DCTF Partnership',
                    description: 'Sponsorship framing for NIL partnerships',
                    category: 'partnership',
                    register: 'Brand/Partnership',
                    duration: 'PT15M',
                    tags: ['nil', 'sponsorship', 'partnerships', 'compliance', 'brand'],
                    thumbnail: 'https://videodelivery.net/acb0f50e86caf8f840f3b36a0c463229/thumbnails/thumbnail.jpg'
                }
            ];
        }
    }

    // Build search index for fast lookups
    buildSearchIndex() {
        this.searchIndex = {
            titles: {},
            descriptions: {},
            tags: {},
            categories: {},
            registers: {}
        };

        this.videos.forEach((video, index) => {
            // Index titles
            const titleWords = this.tokenize(video.title);
            titleWords.forEach(word => {
                if (!this.searchIndex.titles[word]) {
                    this.searchIndex.titles[word] = [];
                }
                this.searchIndex.titles[word].push(index);
            });

            // Index descriptions
            const descWords = this.tokenize(video.description);
            descWords.forEach(word => {
                if (!this.searchIndex.descriptions[word]) {
                    this.searchIndex.descriptions[word] = [];
                }
                this.searchIndex.descriptions[word].push(index);
            });

            // Index tags
            video.tags.forEach(tag => {
                const tagLower = tag.toLowerCase();
                if (!this.searchIndex.tags[tagLower]) {
                    this.searchIndex.tags[tagLower] = [];
                }
                this.searchIndex.tags[tagLower].push(index);
            });

            // Index categories
            const categoryLower = video.category.toLowerCase();
            if (!this.searchIndex.categories[categoryLower]) {
                this.searchIndex.categories[categoryLower] = [];
            }
            this.searchIndex.categories[categoryLower].push(index);

            // Index registers
            const registerLower = video.register.toLowerCase();
            if (!this.searchIndex.registers[registerLower]) {
                this.searchIndex.registers[registerLower] = [];
            }
            this.searchIndex.registers[registerLower].push(index);
        });
    }

    // Tokenize text for indexing
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    // Inject search UI into page
    injectSearchUI() {
        // Check if we're on a video page
        if (!window.location.pathname.includes('/videos')) return;

        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.id = 'video-search-container';
        searchContainer.className = 'fixed top-20 right-4 z-40';
        searchContainer.innerHTML = `
            <div class="relative">
                <!-- Search Toggle Button -->
                <button id="search-toggle" class="p-3 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </button>

                <!-- Search Panel -->
                <div id="search-panel" class="hidden absolute right-0 top-14 w-96 bg-slate-900 border border-cyan-400/30 rounded-lg shadow-2xl">
                    <!-- Search Input -->
                    <div class="p-4 border-b border-slate-800">
                        <div class="relative">
                            <input type="text" 
                                   id="video-search-input" 
                                   placeholder="Search videos... (Press / to focus)"
                                   class="w-full px-4 py-2 bg-slate-800 text-white rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            <svg class="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <button id="clear-search" class="hidden absolute right-3 top-2.5 text-slate-400 hover:text-white">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Filters -->
                    <div class="p-4 border-b border-slate-800">
                        <div class="flex gap-2 flex-wrap">
                            <select id="filter-category" class="px-3 py-1 bg-slate-800 text-white rounded text-sm">
                                <option value="">All Categories</option>
                                <option value="coaching">Coaching</option>
                                <option value="executive">Executive</option>
                                <option value="partnership">Partnership</option>
                            </select>
                            <select id="filter-duration" class="px-3 py-1 bg-slate-800 text-white rounded text-sm">
                                <option value="">Any Duration</option>
                                <option value="short">< 10 min</option>
                                <option value="medium">10-15 min</option>
                                <option value="long">> 15 min</option>
                            </select>
                            <button id="reset-filters" class="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600">
                                Reset
                            </button>
                        </div>
                    </div>

                    <!-- Search Suggestions -->
                    <div id="search-suggestions" class="hidden p-4 border-b border-slate-800">
                        <div class="text-xs text-slate-400 mb-2">Popular searches</div>
                        <div class="flex gap-2 flex-wrap">
                            <span class="suggestion-tag px-2 py-1 bg-slate-800 text-cyan-400 rounded text-xs cursor-pointer hover:bg-slate-700">coaching</span>
                            <span class="suggestion-tag px-2 py-1 bg-slate-800 text-cyan-400 rounded text-xs cursor-pointer hover:bg-slate-700">analytics</span>
                            <span class="suggestion-tag px-2 py-1 bg-slate-800 text-cyan-400 rounded text-xs cursor-pointer hover:bg-slate-700">NIL</span>
                        </div>
                    </div>

                    <!-- Search Results -->
                    <div id="search-results" class="max-h-96 overflow-y-auto">
                        <div class="p-4 text-center text-slate-400 text-sm">
                            Type to search videos...
                        </div>
                    </div>

                    <!-- Search Stats -->
                    <div id="search-stats" class="hidden p-3 bg-slate-800/50 text-xs text-slate-400 text-center">
                        <span id="result-count">0</span> results found in <span id="search-time">0</span>ms
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(searchContainer);

        // Add keyboard shortcut hint
        const shortcutHint = document.createElement('div');
        shortcutHint.className = 'fixed bottom-4 right-4 text-xs text-slate-500';
        shortcutHint.innerHTML = 'Press <kbd class="px-2 py-1 bg-slate-800 rounded">/</kbd> to search';
        document.body.appendChild(shortcutHint);
    }

    // Bind event listeners
    bindEventListeners() {
        const toggle = document.getElementById('search-toggle');
        const panel = document.getElementById('search-panel');
        const input = document.getElementById('video-search-input');
        const clearBtn = document.getElementById('clear-search');

        if (!toggle || !panel || !input) return;

        // Toggle search panel
        toggle.addEventListener('click', () => {
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                input.focus();
                this.showSuggestions();
            }
        });

        // Search input
        let searchTimeout;
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            
            // Show/hide clear button
            clearBtn.classList.toggle('hidden', !query);

            // Debounce search
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 200);
        });

        // Clear search
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.classList.add('hidden');
            this.showSuggestions();
        });

        // Filter changes
        document.getElementById('filter-category')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value || null;
            this.performSearch(input.value);
        });

        document.getElementById('filter-duration')?.addEventListener('change', (e) => {
            this.filters.duration = e.target.value || null;
            this.performSearch(input.value);
        });

        // Reset filters
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.filters = { category: null, duration: null, register: null };
            document.getElementById('filter-category').value = '';
            document.getElementById('filter-duration').value = '';
            this.performSearch(input.value);
        });

        // Suggestion clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-tag')) {
                input.value = e.target.textContent;
                this.performSearch(e.target.textContent);
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                panel.classList.add('hidden');
            }
        });
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Press "/" to open search
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                const panel = document.getElementById('search-panel');
                const input = document.getElementById('video-search-input');
                
                if (panel) {
                    panel.classList.remove('hidden');
                    input?.focus();
                }
            }

            // Press "Escape" to close search
            if (e.key === 'Escape') {
                const panel = document.getElementById('search-panel');
                panel?.classList.add('hidden');
            }
        });
    }

    // Perform search
    performSearch(query) {
        const startTime = performance.now();

        if (!query || query.length < 2) {
            this.showSuggestions();
            return;
        }

        // Search and rank results
        const results = this.searchVideos(query);
        
        // Apply filters
        const filteredResults = this.applyFilters(results);
        
        // Calculate search time
        const searchTime = (performance.now() - startTime).toFixed(1);
        
        // Display results
        this.displayResults(filteredResults, searchTime);
        
        // Save to history
        this.saveSearchHistory(query);
        
        // Track search event
        this.trackSearch(query, filteredResults.length);
    }

    // Search videos with ranking
    searchVideos(query) {
        const queryWords = this.tokenize(query);
        const scores = {};

        this.videos.forEach((video, index) => {
            let score = 0;

            // Title matches (highest weight)
            queryWords.forEach(word => {
                if (this.searchIndex.titles[word]?.includes(index)) {
                    score += 10;
                }
            });

            // Tag matches (high weight)
            queryWords.forEach(word => {
                if (this.searchIndex.tags[word]?.includes(index)) {
                    score += 7;
                }
            });

            // Description matches (medium weight)
            queryWords.forEach(word => {
                if (this.searchIndex.descriptions[word]?.includes(index)) {
                    score += 3;
                }
            });

            // Category/register matches
            queryWords.forEach(word => {
                if (this.searchIndex.categories[word]?.includes(index)) {
                    score += 5;
                }
                if (this.searchIndex.registers[word]?.includes(index)) {
                    score += 5;
                }
            });

            // Fuzzy matching for partial words
            const titleLower = video.title.toLowerCase();
            const descLower = video.description.toLowerCase();
            queryWords.forEach(word => {
                if (titleLower.includes(word)) score += 2;
                if (descLower.includes(word)) score += 1;
            });

            if (score > 0) {
                scores[index] = score;
            }
        });

        // Sort by score
        const sortedIndices = Object.keys(scores)
            .sort((a, b) => scores[b] - scores[a])
            .map(i => parseInt(i));

        return sortedIndices.map(i => ({
            video: this.videos[i],
            score: scores[i]
        }));
    }

    // Apply filters to results
    applyFilters(results) {
        return results.filter(result => {
            const video = result.video;

            // Category filter
            if (this.filters.category && video.category !== this.filters.category) {
                return false;
            }

            // Duration filter
            if (this.filters.duration) {
                const duration = this.parseDuration(video.duration);
                switch (this.filters.duration) {
                    case 'short':
                        if (duration >= 600) return false; // >= 10 min
                        break;
                    case 'medium':
                        if (duration < 600 || duration > 900) return false; // 10-15 min
                        break;
                    case 'long':
                        if (duration <= 900) return false; // > 15 min
                        break;
                }
            }

            return true;
        });
    }

    // Parse ISO duration to seconds
    parseDuration(isoDuration) {
        const match = isoDuration.match(/PT(\d+)M/);
        return match ? parseInt(match[1]) * 60 : 0;
    }

    // Display search results
    displayResults(results, searchTime) {
        const resultsContainer = document.getElementById('search-results');
        const statsContainer = document.getElementById('search-stats');
        const resultCount = document.getElementById('result-count');
        const searchTimeEl = document.getElementById('search-time');

        if (!resultsContainer) return;

        // Update stats
        if (statsContainer) {
            statsContainer.classList.remove('hidden');
            resultCount.textContent = results.length;
            searchTimeEl.textContent = searchTime;
        }

        // Clear suggestions
        document.getElementById('search-suggestions')?.classList.add('hidden');

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-4xl mb-3">🔍</div>
                    <div class="text-slate-400">No videos found</div>
                    <div class="text-xs text-slate-500 mt-2">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        // Display results
        resultsContainer.innerHTML = results.map(result => {
            const video = result.video;
            const duration = this.parseDuration(video.duration) / 60;
            
            return `
                <a href="/videos/${video.slug}/" class="block p-4 hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
                    <div class="flex gap-4">
                        <div class="w-24 h-14 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                            <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="text-white font-semibold text-sm mb-1">
                                ${this.highlightMatch(video.shortTitle, resultsContainer)}
                            </div>
                            <div class="text-xs text-slate-400 mb-1">
                                ${video.register} • ${Math.round(duration)} min
                            </div>
                            <div class="text-xs text-slate-500 line-clamp-2">
                                ${this.highlightMatch(video.description, resultsContainer)}
                            </div>
                            <div class="flex gap-1 mt-2">
                                ${video.tags.slice(0, 3).map(tag => 
                                    `<span class="px-2 py-0.5 bg-slate-800 text-cyan-400 rounded text-xs">${tag}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="text-xs text-orange-400 font-bold">
                            ${result.score} pts
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    // Highlight search matches
    highlightMatch(text, container) {
        const input = document.getElementById('video-search-input');
        if (!input || !input.value) return text;

        const query = input.value.toLowerCase();
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-400">$1</mark>');
    }

    // Show search suggestions
    showSuggestions() {
        const resultsContainer = document.getElementById('search-results');
        const suggestionsContainer = document.getElementById('search-suggestions');
        const statsContainer = document.getElementById('search-stats');

        if (statsContainer) statsContainer.classList.add('hidden');
        if (suggestionsContainer) suggestionsContainer.classList.remove('hidden');

        if (resultsContainer) {
            // Show all videos by default
            resultsContainer.innerHTML = this.videos.map(video => {
                const duration = this.parseDuration(video.duration) / 60;
                
                return `
                    <a href="/videos/${video.slug}/" class="block p-4 hover:bg-slate-800/50 transition-colors border-b border-slate-800 last:border-0">
                        <div class="flex gap-4">
                            <div class="w-24 h-14 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                                <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1">
                                <div class="text-white font-semibold text-sm mb-1">${video.shortTitle}</div>
                                <div class="text-xs text-slate-400 mb-1">
                                    ${video.register} • ${Math.round(duration)} min
                                </div>
                                <div class="text-xs text-slate-500 line-clamp-2">
                                    ${video.description}
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
        }
    }

    // Load search history
    loadSearchHistory() {
        const stored = localStorage.getItem('blazeSearchHistory');
        return stored ? JSON.parse(stored) : [];
    }

    // Save search history
    saveSearchHistory(query) {
        if (!query || query.length < 3) return;

        // Remove duplicates and add to front
        this.searchHistory = this.searchHistory.filter(q => q !== query);
        this.searchHistory.unshift(query);

        // Keep last 20 searches
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }

        localStorage.setItem('blazeSearchHistory', JSON.stringify(this.searchHistory));
    }

    // Load popular searches
    loadPopularSearches() {
        // In production, this would come from analytics
        this.popularSearches = [
            'coaching',
            'analytics',
            'NIL',
            'championship',
            'ROI',
            'partnership'
        ];

        // Update UI
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            const tagsHtml = this.popularSearches.map(term => 
                `<span class="suggestion-tag px-2 py-1 bg-slate-800 text-cyan-400 rounded text-xs cursor-pointer hover:bg-slate-700">${term}</span>`
            ).join('');
            
            suggestionsContainer.innerHTML = `
                <div class="text-xs text-slate-400 mb-2">Popular searches</div>
                <div class="flex gap-2 flex-wrap">${tagsHtml}</div>
            `;
        }
    }

    // Track search event
    trackSearch(query, resultCount) {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'video_search',
                search_query: query,
                search_results: resultCount,
                filters_applied: Object.values(this.filters).some(f => f !== null)
            });
        }
    }
}

// Initialize search
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.VideoSearchEngine = new VideoSearchEngine();
        window.VideoSearchEngine.init();
    });
} else {
    window.VideoSearchEngine = new VideoSearchEngine();
    window.VideoSearchEngine.init();
}