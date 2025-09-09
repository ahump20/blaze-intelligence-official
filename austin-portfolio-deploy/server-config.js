/**
 * Blaze Intelligence Server Configuration
 * Production-ready server with WebSocket and real-time data pipelines
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import BlazeWebSocketServer from './api/websocket-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment configuration
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Logger configuration
const logger = winston.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'blaze-intelligence' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Redis configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('connect', () => {
    logger.info('✅ Connected to Redis');
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});

// Create Express app
const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
    cors: {
        origin: NODE_ENV === 'production' 
            ? ['https://blaze-intelligence.pages.dev', 'https://blaze-intelligence.com']
            : '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 
                       "https://cdn.jsdelivr.net", 
                       "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            mediaSrc: ["'self'", "blob:"]
        }
    }
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

app.use('/api', limiter);

// Static files
app.use(express.static(path.join(__dirname, '.')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API Routes
import cardinalsReadinessRouter from './api/cardinals-readiness.js';
import visionAnalysisRouter from './api/vision-analysis.js';
import teamIntelligenceRouter from './api/team-intelligence.js';
import nilCalculatorRouter from './api/nil-calculator.js';

app.use('/api/cardinals-readiness', cardinalsReadinessRouter);
app.use('/api/vision-analysis', visionAnalysisRouter);
app.use('/api/team-intelligence', teamIntelligenceRouter);
app.use('/api/nil-calculator', nilCalculatorRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check Redis connection
        await redis.ping();
        
        // Check WebSocket connections
        const wsStatus = io.engine.clientsCount;
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: 'connected',
                websocket: `${wsStatus} clients connected`,
                api: 'operational'
            },
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Analytics endpoint
app.post('/api/analytics', async (req, res) => {
    try {
        const { team, timestamp, analytics } = req.body;
        
        // Store analytics in Redis
        const key = `analytics:${team}:${Date.now()}`;
        await redis.setex(key, 3600, JSON.stringify({
            team,
            timestamp,
            analytics
        }));
        
        // Broadcast to connected clients
        io.to(`team:${team}`).emit('analytics', analytics);
        
        res.json({ success: true });
    } catch (error) {
        logger.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to process analytics' });
    }
});

// Vision analysis endpoint
app.post('/api/vision-analysis', async (req, res) => {
    try {
        const { video, sport } = req.body;
        
        // Store request in queue
        const jobId = `vision:${Date.now()}`;
        await redis.lpush('vision_queue', JSON.stringify({
            jobId,
            video,
            sport,
            timestamp: new Date().toISOString()
        }));
        
        res.json({ 
            success: true, 
            jobId,
            message: 'Analysis queued for processing' 
        });
    } catch (error) {
        logger.error('Vision analysis error:', error);
        res.status(500).json({ error: 'Failed to queue analysis' });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`New Socket.IO connection: ${socket.id}`);
    
    // Join team rooms
    socket.on('join-team', (team) => {
        socket.join(`team:${team}`);
        logger.info(`Socket ${socket.id} joined team: ${team}`);
    });
    
    // Handle real-time metrics
    socket.on('metrics', async (data) => {
        // Store metrics
        await redis.setex(`metrics:${socket.id}`, 300, JSON.stringify(data));
        
        // Broadcast to team room
        if (data.team) {
            io.to(`team:${data.team}`).emit('team-metrics', data);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/neural-coach', (req, res) => {
    res.sendFile(path.join(__dirname, 'neural-coach-enhanced.html'));
});

app.get('/coach-enhanced', (req, res) => {
    res.sendFile(path.join(__dirname, 'coach-enhanced.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ 
        error: NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
});

// Start servers
async function startServers() {
    try {
        // Start HTTP/Socket.IO server
        server.listen(PORT, () => {
            logger.info(`🚀 Blaze Intelligence server running on port ${PORT}`);
            logger.info(`🌍 Environment: ${NODE_ENV}`);
        });
        
        // Start WebSocket server
        const wsServer = new BlazeWebSocketServer(WS_PORT);
        await wsServer.initialize();
        
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, shutting down gracefully...');
            
            // Close HTTP server
            server.close(() => {
                logger.info('HTTP server closed');
            });
            
            // Close Socket.IO
            io.close(() => {
                logger.info('Socket.IO server closed');
            });
            
            // Close Redis
            await redis.quit();
            logger.info('Redis connection closed');
            
            // Close WebSocket server
            await wsServer.shutdown();
            
            process.exit(0);
        });
        
        process.on('SIGINT', async () => {
            logger.info('SIGINT received, shutting down...');
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('Failed to start servers:', error);
        process.exit(1);
    }
}

// Start everything
startServers();

export { app, server, io, redis, logger };