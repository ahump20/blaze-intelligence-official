// Enhanced Chart.js configurations with animations and visual effects
// Premium chart visualizations for sports analytics

class EnhancedCharts {
    constructor() {
        this.charts = {};
        this.initChartDefaults();
    }

    initChartDefaults() {
        // Set global Chart.js defaults for consistent styling
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.font.weight = '500';
            
            // Animation defaults
            Chart.defaults.animation.duration = 2000;
            Chart.defaults.animation.easing = 'easeInOutQuart';
        }
    }

    createPerformanceRadar(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const gradientFill = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradientFill.addColorStop(0, 'rgba(191, 87, 0, 0.4)');
        gradientFill.addColorStop(1, 'rgba(191, 87, 0, 0.1)');

        const gradientFill2 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradientFill2.addColorStop(0, 'rgba(155, 203, 235, 0.4)');
        gradientFill2.addColorStop(1, 'rgba(155, 203, 235, 0.1)');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.labels || ['Speed', 'Power', 'Accuracy', 'Endurance', 'Agility', 'Strategy'],
                datasets: [{
                    label: data.team1 || 'Home Team',
                    data: data.values1 || [85, 92, 78, 88, 95, 82],
                    backgroundColor: gradientFill,
                    borderColor: '#BF5700',
                    borderWidth: 2,
                    pointBackgroundColor: '#BF5700',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#BF5700',
                    pointRadius: 5,
                    pointHoverRadius: 8
                }, {
                    label: data.team2 || 'Away Team',
                    data: data.values2 || [78, 85, 92, 82, 88, 90],
                    backgroundColor: gradientFill2,
                    borderColor: '#9BCBEB',
                    borderWidth: 2,
                    pointBackgroundColor: '#9BCBEB',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#9BCBEB',
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    onComplete: function() {
                        // Add glow effect after animation
                        const chartArea = this.chart.chartArea;
                        const ctx = this.chart.ctx;
                        ctx.save();
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = 'rgba(191, 87, 0, 0.5)';
                        ctx.restore();
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '600'
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            size: 16,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r + '%';
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            circular: true
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });

        // Animate data updates periodically
        this.startRadarAnimation(canvasId);
    }

    createProgressBars(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '1.5rem';

        data.forEach((item, index) => {
            const barWrapper = document.createElement('div');
            barWrapper.className = 'progress-bar-wrapper';
            barWrapper.style.opacity = '0';
            barWrapper.style.transform = 'translateX(-50px)';
            
            const label = document.createElement('div');
            label.style.display = 'flex';
            label.style.justifyContent = 'space-between';
            label.style.marginBottom = '0.5rem';
            label.innerHTML = `
                <span style="color: rgba(255, 255, 255, 0.9); font-weight: 600;">${item.label}</span>
                <span class="progress-value" style="color: #BF5700; font-weight: 700;">${item.value}%</span>
            `;
            
            const barContainer = document.createElement('div');
            barContainer.style.width = '100%';
            barContainer.style.height = '12px';
            barContainer.style.background = 'rgba(255, 255, 255, 0.1)';
            barContainer.style.borderRadius = '6px';
            barContainer.style.overflow = 'hidden';
            barContainer.style.position = 'relative';
            
            const barFill = document.createElement('div');
            barFill.className = 'progress-bar-fill';
            barFill.style.width = '0%';
            barFill.style.height = '100%';
            barFill.style.background = `linear-gradient(90deg, #BF5700 0%, #FF6B35 100%)`;
            barFill.style.borderRadius = '6px';
            barFill.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            barFill.style.position = 'relative';
            barFill.style.boxShadow = '0 0 20px rgba(191, 87, 0, 0.5)';
            
            // Add shimmer effect
            const shimmer = document.createElement('div');
            shimmer.style.position = 'absolute';
            shimmer.style.top = '0';
            shimmer.style.left = '-100%';
            shimmer.style.width = '100%';
            shimmer.style.height = '100%';
            shimmer.style.background = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)';
            shimmer.style.animation = 'shimmer 2s infinite';
            
            barFill.appendChild(shimmer);
            barContainer.appendChild(barFill);
            barWrapper.appendChild(label);
            barWrapper.appendChild(barContainer);
            container.appendChild(barWrapper);
            
            // Animate in sequence
            setTimeout(() => {
                barWrapper.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                barWrapper.style.opacity = '1';
                barWrapper.style.transform = 'translateX(0)';
                
                setTimeout(() => {
                    barFill.style.width = `${item.value}%`;
                }, 100);
            }, index * 100);
        });

        // Add shimmer animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 200%; }
            }
        `;
        document.head.appendChild(style);
    }

    createLiveLineChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(191, 87, 0, 0.4)');
        gradient.addColorStop(0.5, 'rgba(191, 87, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(191, 87, 0, 0)');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
                datasets: [{
                    label: 'Performance Score',
                    data: data.values || [65, 72, 84, 91, 95],
                    fill: true,
                    backgroundColor: gradient,
                    borderColor: '#BF5700',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#BF5700',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#BF5700',
                    pointHoverBorderWidth: 3,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart',
                    onProgress: function(animation) {
                        const progress = animation.currentStep / animation.numSteps;
                        const ctx = this.chart.ctx;
                        ctx.globalAlpha = progress;
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            size: 16,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return 'Score: ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        // Simulate live data updates
        this.startLiveUpdates(canvasId);
    }

    createDonutChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || ['Offense', 'Defense', 'Special Teams'],
                datasets: [{
                    data: data.values || [45, 35, 20],
                    backgroundColor: [
                        'rgba(191, 87, 0, 0.8)',
                        'rgba(155, 203, 235, 0.8)',
                        'rgba(0, 178, 169, 0.8)'
                    ],
                    borderColor: [
                        '#BF5700',
                        '#9BCBEB',
                        '#00B2A9'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            size: 16,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return label + ': ' + percentage + '%';
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        // Add center text
        this.addCenterText(canvasId, '94.6%', 'Accuracy');
    }

    addCenterText(canvasId, mainText, subText) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        Chart.register({
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                
                ctx.restore();
                const fontSize = (height / 114).toFixed(2);
                ctx.font = `bold ${fontSize * 2}em Inter`;
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#BF5700';
                
                const text = mainText;
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2 - 10;
                
                ctx.fillText(text, textX, textY);
                
                ctx.font = `${fontSize * 0.8}em Inter`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
                ctx.fillText(subText, subTextX, textY + 25);
                
                ctx.save();
            }
        });
    }

    startRadarAnimation(chartId) {
        setInterval(() => {
            const chart = this.charts[chartId];
            if (!chart) return;
            
            // Simulate data fluctuation
            chart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(value => {
                    const change = (Math.random() - 0.5) * 10;
                    const newValue = value + change;
                    return Math.max(0, Math.min(100, newValue));
                });
            });
            
            chart.update('none'); // Update without animation for smooth transition
        }, 3000);
    }

    startLiveUpdates(chartId) {
        setInterval(() => {
            const chart = this.charts[chartId];
            if (!chart) return;
            
            // Add new data point and remove old one
            const newValue = Math.random() * 30 + 70;
            chart.data.datasets[0].data.push(newValue);
            if (chart.data.datasets[0].data.length > 10) {
                chart.data.datasets[0].data.shift();
                chart.data.labels.shift();
            }
            
            // Add new label
            const labelNum = parseInt(chart.data.labels[chart.data.labels.length - 1].replace(/\D/g, '')) + 1;
            chart.data.labels.push(`T${labelNum}`);
            
            chart.update('none');
        }, 2000);
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Initialize enhanced charts when ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedCharts = new EnhancedCharts();
    
    // Example usage - create charts if canvas elements exist
    if (document.getElementById('performanceRadar')) {
        window.enhancedCharts.createPerformanceRadar('performanceRadar', {});
    }
    
    if (document.getElementById('progressBars')) {
        window.enhancedCharts.createProgressBars('progressBars', [
            { label: 'Passing Accuracy', value: 94 },
            { label: 'Field Goal %', value: 87 },
            { label: 'Red Zone Efficiency', value: 91 },
            { label: '3rd Down Conversion', value: 78 },
            { label: 'Turnover Ratio', value: 85 }
        ]);
    }
    
    if (document.getElementById('livePerformance')) {
        window.enhancedCharts.createLiveLineChart('livePerformance', {});
    }
    
    if (document.getElementById('teamDistribution')) {
        window.enhancedCharts.createDonutChart('teamDistribution', {});
    }
});