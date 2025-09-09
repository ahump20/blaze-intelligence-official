/**
 * Blaze Intelligence - Report Delivery Worker
 * Cloudflare Worker for automated report distribution
 */

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // Handle CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        
        // Health check endpoint
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Route handlers
        if (url.pathname === '/api/report/generate') {
            return handleGenerateReport(request, env);
        }
        
        if (url.pathname === '/api/report/schedule') {
            return handleScheduleReport(request, env);
        }
        
        if (url.pathname === '/api/report/send') {
            return handleSendReport(request, env);
        }
        
        if (url.pathname === '/api/report/status') {
            return handleReportStatus(request, env);
        }
        
        return new Response('Report Worker Active', { status: 200 });
    },
    
    async scheduled(event, env, ctx) {
        // This runs on a schedule defined in wrangler.toml
        ctx.waitUntil(generateScheduledReports(env));
    },
    
    async queue(batch, env) {
        // Process queued report sending jobs
        for (const message of batch.messages) {
            const { reportId, recipients } = message.body;
            
            try {
                // Fetch report from KV
                const reportData = await env.REPORTS.get(reportId);
                if (reportData) {
                    const report = JSON.parse(reportData);
                    // Send to recipients (in production, use email service)
                    console.log(`Sending report ${reportId} to ${recipients.join(', ')}`);
                    
                    // Update status
                    report.status = 'sent';
                    report.sentAt = new Date().toISOString();
                    await env.REPORTS.put(reportId, JSON.stringify(report));
                }
                
                // Acknowledge message
                message.ack();
            } catch (error) {
                console.error(`Failed to process report ${reportId}:`, error);
                // Retry the message
                message.retry();
            }
        }
    }
};

/**
 * Generate report on demand
 */
async function handleGenerateReport(request, env) {
    try {
        const data = await request.json();
        const { type = 'daily', recipients, format = 'html' } = data;
        
        // Fetch metrics from KV or D1
        const metrics = await fetchMetrics(env);
        
        // Generate report content
        const report = generateReportContent(type, metrics);
        
        // Store report in KV
        const reportId = `report_${Date.now()}`;
        await env.REPORTS.put(reportId, JSON.stringify({
            type,
            content: report,
            generated: new Date().toISOString(),
            recipients,
            status: 'pending'
        }), {
            expirationTtl: 2592000 // 30 days
        });
        
        // Queue for sending
        if (recipients && recipients.length > 0) {
            await env.REPORT_QUEUE.send({
                reportId,
                recipients,
                type: 'immediate'
            });
        }
        
        return new Response(JSON.stringify({
            success: true,
            reportId,
            message: 'Report generated successfully'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * Schedule a report
 */
async function handleScheduleReport(request, env) {
    try {
        const data = await request.json();
        const { type, schedule, recipients } = data;
        
        // Store schedule in KV
        const scheduleId = `schedule_${type}_${Date.now()}`;
        await env.SCHEDULES.put(scheduleId, JSON.stringify({
            type,
            schedule, // cron format
            recipients,
            active: true,
            created: new Date().toISOString()
        }));
        
        return new Response(JSON.stringify({
            success: true,
            scheduleId,
            message: 'Report scheduled successfully'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * Send a report via email
 */
async function handleSendReport(request, env) {
    try {
        const data = await request.json();
        const { reportId, recipients } = data;
        
        // Fetch report from KV
        const reportData = await env.REPORTS.get(reportId);
        if (!reportData) {
            throw new Error('Report not found');
        }
        
        const report = JSON.parse(reportData);
        
        // Send via email service (Mailgun/SendGrid)
        const results = await Promise.all(recipients.map(recipient => 
            sendEmail(env, {
                to: recipient,
                subject: `Blaze Intelligence - ${report.type} Report`,
                html: report.content
            })
        ));
        
        // Update report status
        report.status = 'sent';
        report.sentAt = new Date().toISOString();
        await env.REPORTS.put(reportId, JSON.stringify(report));
        
        return new Response(JSON.stringify({
            success: true,
            sent: results.length,
            message: 'Report sent successfully'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * Get report status
 */
async function handleReportStatus(request, env) {
    try {
        const url = new URL(request.url);
        const reportId = url.searchParams.get('id');
        
        if (!reportId) {
            // Return recent reports
            const list = await env.REPORTS.list({ limit: 10 });
            const reports = await Promise.all(
                list.keys.map(async key => {
                    const data = await env.REPORTS.get(key.name);
                    return { id: key.name, ...JSON.parse(data) };
                })
            );
            
            return new Response(JSON.stringify({
                reports: reports.map(r => ({
                    id: r.id,
                    type: r.type,
                    generated: r.generated,
                    status: r.status
                }))
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        // Return specific report status
        const reportData = await env.REPORTS.get(reportId);
        if (!reportData) {
            return new Response(JSON.stringify({
                error: 'Report not found'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        const report = JSON.parse(reportData);
        return new Response(JSON.stringify({
            id: reportId,
            type: report.type,
            generated: report.generated,
            status: report.status,
            sentAt: report.sentAt
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

/**
 * Generate scheduled reports
 */
async function generateScheduledReports(env) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const date = now.getDate();
    
    // Fetch all active schedules
    const schedulesList = await env.SCHEDULES.list();
    
    for (const key of schedulesList.keys) {
        const scheduleData = await env.SCHEDULES.get(key.name);
        const schedule = JSON.parse(scheduleData);
        
        if (!schedule.active) continue;
        
        let shouldRun = false;
        
        // Check schedule type
        if (schedule.type === 'daily' && hour === 9) {
            shouldRun = true;
        } else if (schedule.type === 'weekly' && day === 1 && hour === 9) {
            shouldRun = true;
        } else if (schedule.type === 'monthly' && date === 1 && hour === 9) {
            shouldRun = true;
        }
        
        if (shouldRun) {
            // Generate and queue report
            const metrics = await fetchMetrics(env);
            const report = generateReportContent(schedule.type, metrics);
            
            const reportId = `report_${Date.now()}`;
            await env.REPORTS.put(reportId, JSON.stringify({
                type: schedule.type,
                content: report,
                generated: new Date().toISOString(),
                recipients: schedule.recipients,
                status: 'pending'
            }));
            
            // Queue for sending
            await env.REPORT_QUEUE.send({
                reportId,
                recipients: schedule.recipients,
                type: 'scheduled'
            });
        }
    }
}

/**
 * Fetch metrics from storage
 */
async function fetchMetrics(env) {
    // In production, this would fetch from D1 or KV
    // For now, return sample metrics
    return {
        video: {
            totalViews: 12543,
            avgCompletionRate: 68.5,
            topVideos: [
                { id: 'sports-conversation', views: 4521, completion: 72 },
                { id: 'dmk-final-presentation', views: 3876, completion: 65 },
                { id: 'ut-dctf-nil-sponsorship', views: 4146, completion: 69 }
            ]
        },
        experiments: [
            {
                name: 'Video Player Enhancement',
                winner: 'championship',
                lift: 23.5,
                confidence: 98
            }
        ],
        funnel: {
            totalConversionRate: 2.3,
            stages: [
                { name: 'Landing', count: 10000 },
                { name: 'Video View', count: 7500 },
                { name: 'Engagement', count: 5000 },
                { name: 'Contact', count: 500 },
                { name: 'Conversion', count: 230 }
            ]
        },
        recommendations: {
            ctr: 8.7,
            totalImpressions: 45000,
            totalClicks: 3915
        }
    };
}

/**
 * Generate report content
 */
function generateReportContent(type, metrics) {
    const timestamp = new Date().toLocaleString();
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Blaze Intelligence - ${type} Report</title>
            <style>
                body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e2e8f0; padding: 20px; }
                .header { background: linear-gradient(135deg, #FF8C00, #D2691E); padding: 30px; border-radius: 12px; margin-bottom: 30px; }
                .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }
                .metric-value { font-weight: bold; color: #FF8C00; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏆 ${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
                <div>Generated: ${timestamp}</div>
            </div>
            
            <h2>Key Metrics</h2>
            <div class="metric">
                <span>Total Video Views</span>
                <span class="metric-value">${metrics.video.totalViews.toLocaleString()}</span>
            </div>
            <div class="metric">
                <span>Avg Completion Rate</span>
                <span class="metric-value">${metrics.video.avgCompletionRate}%</span>
            </div>
            <div class="metric">
                <span>Conversion Rate</span>
                <span class="metric-value">${metrics.funnel.totalConversionRate}%</span>
            </div>
            <div class="metric">
                <span>Recommendation CTR</span>
                <span class="metric-value">${metrics.recommendations.ctr}%</span>
            </div>
            
            <p style="text-align: center; opacity: 0.7; margin-top: 40px;">
                Blaze Intelligence - Championship Analytics
            </p>
        </body>
        </html>
    `;
}

/**
 * Send email via service
 */
async function sendEmail(env, { to, subject, html }) {
    // In production, use Mailgun or SendGrid
    // For now, log the email
    console.log('Sending email:', { to, subject });
    
    // Simulate API call
    return {
        success: true,
        messageId: `msg_${Date.now()}`
    };
}