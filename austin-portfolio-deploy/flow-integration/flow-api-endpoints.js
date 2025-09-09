// Blaze Intelligence Flow API Endpoints
// Add these to your main API server

// GET /flow/session/:id/metrics
app.get('/flow/session/:id/metrics', (req, res) => {
    const sessionId = req.params.id;
    
    // In production, load from database
    const metrics = {
        p_flow: Math.random() * 0.3 + 0.7, // 0.7-1.0
        alpha_theta_ratio: Math.random() * 2 + 2.5, // 2.5-4.5
        rmssd: Math.random() * 30 + 35, // 35-65ms
        fss2_mean: Math.random() * 3 + 6, // 6-9
        time_distortion: Math.random() * 0.4 + 0.6, // 0.6-1.0
        session_id: sessionId,
        timestamp: new Date().toISOString()
    };
    
    res.json(metrics);
});

// POST /flow/fss - Log FSS-2 responses
app.post('/flow/fss', (req, res) => {
    const { session_id, fss2_score, timestamp } = req.body;
    
    // Validate FSS-2 score (1-9 scale)
    if (!fss2_score || fss2_score < 1 || fss2_score > 9) {
        return res.status(400).json({ error: 'Invalid FSS-2 score' });
    }
    
    // In production, save to database
    console.log('FSS-2 Response logged:', { session_id, fss2_score, timestamp });
    
    res.json({ 
        success: true, 
        logged_at: new Date().toISOString(),
        session_id 
    });
});

// POST /flow/coaching-cue - Record coaching cues and resets
app.post('/flow/coaching-cue', (req, res) => {
    const { session_id, cue_type, cue_data, timestamp } = req.body;
    
    const validCueTypes = ['reset', 'enhance', 'difficulty_change', 'focus_redirect'];
    
    if (!validCueTypes.includes(cue_type)) {
        return res.status(400).json({ error: 'Invalid cue type' });
    }
    
    // In production, save to database
    console.log('Coaching cue logged:', { session_id, cue_type, cue_data, timestamp });
    
    res.json({ 
        success: true, 
        cue_logged_at: new Date().toISOString(),
        session_id,
        cue_type 
    });
});

// GET /flow/dashboard - Flow dashboard data
app.get('/flow/dashboard', (req, res) => {
    const dashboard = {
        active_sessions: 1,
        avg_flow_probability: 0.847,
        avg_alpha_theta: 3.2,
        avg_hrv: 45.6,
        total_flow_minutes: 156,
        peak_flow_achieved: true,
        flow_trends: [
            { time: '09:00', flow: 0.6 },
            { time: '09:15', flow: 0.75 },
            { time: '09:30', flow: 0.85 },
            { time: '09:45', flow: 0.9 }
        ],
        recommendations: [
            'Maintain current challenge level',
            'Consider 5-minute meditation break',
            'Alpha/theta ratio optimal'
        ]
    };
    
    res.json(dashboard);
});