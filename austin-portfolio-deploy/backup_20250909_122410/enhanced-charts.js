/**
 * Enhanced Charts Module
 * Provides fallback 2D canvas charts when WebGL is unavailable
 * Uses real, validated data only
 */

class EnhancedCharts {
    constructor() {
        this.colors = {
            primary: '#00FFFF',
            secondary: '#FF8C00',
            success: '#00FF00',
            warning: '#FFA500',
            danger: '#FF4444',
            mlb: '#FF6B6B',
            nfl: '#4ECDC4',
            nba: '#45B7D1',
            ncaa: '#FFA500',
            high_school: '#A8E6CF'
        };
    }

    /**
     * Create animated bar chart with validated data
     */
    createBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth || 800;
        canvas.height = container.offsetHeight || 400;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Chart dimensions
        const padding = 60;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        const barWidth = chartWidth / (data.length * 1.5);
        const maxValue = Math.max(...data.map(d => d.value));
        
        // Draw background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight * (1 - i / 10));
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            
            // Draw y-axis labels (percentages)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(`${(maxValue * i / 10).toFixed(0)}%`, padding - 10, y + 4);
        }
        
        // Draw bars with animation
        let animationProgress = 0;
        const animationDuration = 1500; // 1.5 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            animationProgress = Math.min((currentTime - startTime) / animationDuration, 1);
            
            // Clear chart area
            ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
            ctx.fillRect(padding, 0, chartWidth, canvas.height);
            
            // Redraw grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i <= 10; i++) {
                const y = padding + (chartHeight * (1 - i / 10));
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();
            }
            
            // Draw bars
            data.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight * animationProgress;
                const x = padding + (index * chartWidth / data.length) + (barWidth / 2);
                const y = canvas.height - padding - barHeight;
                
                // Create gradient
                const gradient = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
                gradient.addColorStop(0, item.color || this.colors.primary);
                gradient.addColorStop(1, this.adjustBrightness(item.color || this.colors.primary, -30));
                
                // Draw bar
                ctx.fillStyle = gradient;
                ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
                
                // Draw bar outline
                ctx.strokeStyle = item.color || this.colors.primary;
                ctx.lineWidth = 2;
                ctx.strokeRect(x - barWidth/2, y, barWidth, barHeight);
                
                // Draw value on top of bar
                if (animationProgress === 1) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 14px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${item.value}%`, x, y - 10);
                }
                
                // Draw label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(item.label, x, canvas.height - padding + 20);
            });
            
            // Draw benchmark line (industry average)
            if (options.benchmark) {
                const benchmarkY = canvas.height - padding - ((options.benchmark / maxValue) * chartHeight);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(padding, benchmarkY);
                ctx.lineTo(canvas.width - padding, benchmarkY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Inter';
                ctx.textAlign = 'left';
                ctx.fillText(`Industry Avg: ${options.benchmark}%`, canvas.width - padding - 100, benchmarkY - 5);
            }
            
            // Continue animation
            if (animationProgress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Create real-time line chart for performance metrics
     */
    createLineChart(containerId, dataPoints, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth || 800;
        canvas.height = container.offsetHeight || 400;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const padding = 60;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        
        // Background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        if (dataPoints.length < 2) return;
        
        const maxValue = Math.max(...dataPoints);
        const minValue = Math.min(...dataPoints);
        const valueRange = maxValue - minValue || 1;
        
        // Draw line
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        dataPoints.forEach((value, index) => {
            const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
            const y = padding + ((maxValue - value) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw data points
            ctx.fillStyle = this.colors.primary;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.stroke();
        
        // Draw title
        if (options.title) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(options.title, canvas.width / 2, 30);
        }
    }

    /**
     * Create donut chart for data distribution
     */
    createDonutChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const size = Math.min(container.offsetWidth, container.offsetHeight) || 400;
        canvas.width = size;
        canvas.height = size;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size / 2 - 40;
        const innerRadius = outerRadius * 0.6;
        
        // Background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
        ctx.fillRect(0, 0, size, size);
        
        // Calculate total
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        // Draw segments
        let currentAngle = -Math.PI / 2;
        
        data.forEach((item, index) => {
            const segmentAngle = (item.value / total) * Math.PI * 2;
            
            // Draw segment
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + segmentAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
            ctx.closePath();
            
            ctx.fillStyle = item.color || this.getColorByIndex(index);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw label
            const labelAngle = currentAngle + segmentAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (outerRadius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (outerRadius + 20);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, labelX, labelY);
            ctx.fillText(`${((item.value / total) * 100).toFixed(1)}%`, labelX, labelY + 15);
            
            currentAngle += segmentAngle;
        });
        
        // Draw center text
        if (options.centerText) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(options.centerText, centerX, centerY);
        }
    }

    /**
     * Helper function to adjust color brightness
     */
    adjustBrightness(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    /**
     * Get color by index for automatic coloring
     */
    getColorByIndex(index) {
        const colors = [
            this.colors.mlb,
            this.colors.nfl,
            this.colors.nba,
            this.colors.ncaa,
            this.colors.high_school,
            this.colors.primary,
            this.colors.secondary
        ];
        return colors[index % colors.length];
    }
}

// Initialize and export
window.enhancedCharts = new EnhancedCharts();