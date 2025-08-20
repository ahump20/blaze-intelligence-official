// Interactive Comparison Component
// Enhances static comparison table with interactive features

class InteractiveComparison {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.data = this.loadComparisonData();
        this.activeFilters = new Set();
        this.selectedCompetitors = new Set(['blaze', 'hudl', 'synergy', 'sportvu']);
        
        this.init();
    }
    
    loadComparisonData() {
        return {
            categories: [
                {
                    name: 'AI & Analytics',
                    features: [
                        { name: 'Real-time AI Predictions', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: '✓' },
                        { name: 'Injury Risk Prediction', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: '✗' },
                        { name: 'Championship Probability', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: '✗' },
                        { name: 'Player Load Management', blaze: '✓', hudl: 'Basic', synergy: 'Basic', sportvu: '✓' },
                        { name: 'Cross-Sport Analytics', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: '✗' }
                    ]
                },
                {
                    name: 'Data Integration',
                    features: [
                        { name: 'Live Game Feed', blaze: '✓', hudl: '✗', synergy: '✓', sportvu: '✓' },
                        { name: 'Wearable Device Sync', blaze: '✓', hudl: 'Limited', synergy: '✗', sportvu: '✓' },
                        { name: 'Video Analysis Integration', blaze: '✓', hudl: '✓', synergy: '✓', sportvu: 'Basic' },
                        { name: 'Third-party APIs', blaze: '✓', hudl: 'Limited', synergy: 'Limited', sportvu: 'Basic' },
                        { name: 'Custom Data Sources', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: 'Basic' }
                    ]
                },
                {
                    name: 'User Experience',
                    features: [
                        { name: 'Mobile App', blaze: '✓', hudl: '✓', synergy: '✓', sportvu: 'Basic' },
                        { name: 'Real-time Dashboard', blaze: '✓', hudl: 'Basic', synergy: '✓', sportvu: '✓' },
                        { name: 'Customizable Reports', blaze: '✓', hudl: '✓', synergy: 'Basic', sportvu: 'Basic' },
                        { name: 'Coach Portal', blaze: '✓', hudl: '✓', synergy: '✓', sportvu: 'Basic' },
                        { name: 'Player Self-Service', blaze: '✓', hudl: 'Limited', synergy: '✗', sportvu: '✗' }
                    ]
                },
                {
                    name: 'Support & Training',
                    features: [
                        { name: '24/7 Game Day Support', blaze: '✓', hudl: '✗', synergy: 'Limited', sportvu: 'Limited' },
                        { name: 'Dedicated Success Manager', blaze: '✓', hudl: 'Premium Only', synergy: 'Premium Only', sportvu: '✗' },
                        { name: 'On-site Training', blaze: '✓', hudl: 'Extra Cost', synergy: 'Extra Cost', sportvu: 'Extra Cost' },
                        { name: 'Custom Integrations', blaze: '✓', hudl: 'Limited', synergy: 'Limited', sportvu: '✗' },
                        { name: 'Championship Guarantee', blaze: '✓', hudl: '✗', synergy: '✗', sportvu: '✗' }
                    ]
                }
            ],
            competitors: {
                blaze: { name: 'Blaze Intelligence', color: '#CC5500', highlight: true },
                hudl: { name: 'Hudl', color: '#666', highlight: false },
                synergy: { name: 'Synergy Sports', color: '#666', highlight: false },
                sportvu: { name: 'SportVU', color: '#666', highlight: false }
            }
        };
    }
    
    init() {
        if (!this.container) return;
        
        this.createFilterControls();
        this.createComparisonTable();
        this.bindEvents();
        
        // Animate in after load
        setTimeout(() => {
            this.container.classList.add('interactive-loaded');
        }, 100);
    }
    
    createFilterControls() {
        const filterHTML = `
            <div class="comparison-filters">
                <div class="filter-section">
                    <h4>Show Categories:</h4>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-category="all">All Features</button>
                        ${this.data.categories.map(cat => 
                            `<button class="filter-btn" data-category="${cat.name.toLowerCase().replace(/\s+/g, '-')}">${cat.name}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="filter-section">
                    <h4>Compare Against:</h4>
                    <div class="competitor-toggles">
                        ${Object.entries(this.data.competitors).map(([key, comp]) => `
                            <label class="competitor-toggle ${comp.highlight ? 'highlight' : ''}">
                                <input type="checkbox" data-competitor="${key}" ${this.selectedCompetitors.has(key) ? 'checked' : ''}>
                                <span class="toggle-label">${comp.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="filter-section">
                    <button class="advantage-btn" data-filter="advantage">Show Blaze Advantages Only</button>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('afterbegin', filterHTML);
    }
    
    createComparisonTable() {
        const selectedCompetitorsList = Array.from(this.selectedCompetitors);
        const gridCols = `2fr ${selectedCompetitorsList.map(() => '1fr').join(' ')}`;
        
        const tableHTML = `
            <div class="interactive-comparison-table" style="--grid-cols: ${gridCols}">
                <div class="table-header">
                    <div class="header-cell feature">Features</div>
                    ${selectedCompetitorsList.map(key => {
                        const comp = this.data.competitors[key];
                        return `<div class="header-cell ${key} ${comp.highlight ? 'highlight' : ''}" style="--comp-color: ${comp.color}">${comp.name}</div>`;
                    }).join('')}
                </div>
                
                ${this.data.categories.map(category => `
                    <div class="category-section" data-category="${category.name.toLowerCase().replace(/\s+/g, '-')}">
                        <div class="category-header">
                            <h3>${category.name}</h3>
                        </div>
                        
                        ${category.features.map(feature => `
                            <div class="table-row" data-feature="${feature.name.toLowerCase().replace(/\s+/g, '-')}">
                                <div class="table-cell feature">${feature.name}</div>
                                ${selectedCompetitorsList.map(key => {
                                    const value = feature[key];
                                    const cellClass = this.getCellClass(value, key);
                                    return `<div class="table-cell ${key} ${cellClass}">${this.formatCellValue(value)}</div>`;
                                }).join('')}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Remove existing table and add new one
        const existingTable = this.container.querySelector('.interactive-comparison-table');
        if (existingTable) existingTable.remove();
        
        this.container.insertAdjacentHTML('beforeend', tableHTML);
    }
    
    getCellClass(value, competitor) {
        if (competitor === 'blaze' && value === '✓') return 'advantage';
        if (value === '✓') return 'check';
        if (value === '✗') return 'cross';
        if (value.includes('Basic') || value.includes('Limited')) return 'partial';
        return 'basic';
    }
    
    formatCellValue(value) {
        if (value === '✓') return '<span class="icon-check">✓</span>';
        if (value === '✗') return '<span class="icon-cross">✗</span>';
        return value;
    }
    
    bindEvents() {
        // Category filters
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.filter-btn')) {
                this.handleCategoryFilter(e.target);
            }
            
            if (e.target.matches('.advantage-btn')) {
                this.handleAdvantageFilter(e.target);
            }
        });
        
        // Competitor toggles
        this.container.addEventListener('change', (e) => {
            if (e.target.matches('input[data-competitor]')) {
                this.handleCompetitorToggle(e.target);
            }
        });
    }
    
    handleCategoryFilter(btn) {
        // Update active button
        this.container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        const sections = this.container.querySelectorAll('.category-section');
        
        if (category === 'all') {
            sections.forEach(section => section.style.display = 'block');
        } else {
            sections.forEach(section => {
                section.style.display = section.dataset.category === category ? 'block' : 'none';
            });
        }
        
        this.animateTableUpdate();
    }
    
    handleAdvantageFilter(btn) {
        btn.classList.toggle('active');
        const showAdvantageOnly = btn.classList.contains('active');
        
        const rows = this.container.querySelectorAll('.table-row');
        rows.forEach(row => {
            const blazeCell = row.querySelector('.table-cell.blaze');
            const hasAdvantage = blazeCell && blazeCell.classList.contains('advantage');
            
            if (showAdvantageOnly) {
                row.style.display = hasAdvantage ? 'grid' : 'none';
            } else {
                row.style.display = 'grid';
            }
        });
        
        btn.textContent = showAdvantageOnly ? 'Show All Features' : 'Show Blaze Advantages Only';
        this.animateTableUpdate();
    }
    
    handleCompetitorToggle(checkbox) {
        const competitor = checkbox.dataset.competitor;
        
        if (checkbox.checked) {
            this.selectedCompetitors.add(competitor);
        } else {
            this.selectedCompetitors.delete(competitor);
        }
        
        // Always keep Blaze selected
        this.selectedCompetitors.add('blaze');
        
        // Rebuild table with new competitors
        this.createComparisonTable();
        this.animateTableUpdate();
    }
    
    animateTableUpdate() {
        const table = this.container.querySelector('.interactive-comparison-table');
        if (table) {
            table.classList.add('updating');
            setTimeout(() => table.classList.remove('updating'), 300);
        }
    }
}

// Auto-mount when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const comparisonContainer = document.querySelector('.comparison-section .container');
    if (comparisonContainer) {
        new InteractiveComparison('.comparison-section .container');
    }
});

// Export for manual mounting
window.InteractiveComparison = InteractiveComparison;