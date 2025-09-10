/**
 * Athlete Video Training Data Collection System
 * Manages collection, storage, and organization of training videos for ML model development
 */

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// PostgreSQL Configuration
const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Redis Configuration
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'training-data.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

/**
 * Training Data Collector Class
 */
export class TrainingDataCollector {
    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || 'blaze-training-videos';
        this.categories = {
            baseball: ['swing', 'pitch', 'fielding', 'baserunning'],
            football: ['throw', 'catch', 'tackle', 'kick'],
            basketball: ['shoot', 'dribble', 'pass', 'defense']
        };
        this.qualityThresholds = {
            minResolution: { width: 1280, height: 720 },
            minDuration: 3, // seconds
            maxDuration: 300, // seconds (5 minutes)
            minFrameRate: 24
        };
    }

    /**
     * Initialize database tables
     */
    async initializeDatabase() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS training_videos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                video_id VARCHAR(255) UNIQUE NOT NULL,
                athlete_id VARCHAR(255),
                sport VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                subcategory VARCHAR(50),
                s3_url TEXT NOT NULL,
                thumbnail_url TEXT,
                duration FLOAT NOT NULL,
                resolution_width INTEGER NOT NULL,
                resolution_height INTEGER NOT NULL,
                frame_rate INTEGER NOT NULL,
                file_size_mb FLOAT NOT NULL,
                
                -- Metadata
                recorded_at TIMESTAMP,
                location VARCHAR(255),
                weather_conditions JSONB,
                equipment_used JSONB,
                
                -- Analysis results
                biomechanical_score FLOAT,
                technique_score FLOAT,
                form_analysis JSONB,
                key_points_detected JSONB,
                
                -- Character assessment
                confidence_score FLOAT,
                focus_score FLOAT,
                determination_score FLOAT,
                grit_score FLOAT,
                championship_mindset_score FLOAT,
                
                -- Labels and annotations
                labels JSONB,
                annotations JSONB,
                verified BOOLEAN DEFAULT FALSE,
                verified_by VARCHAR(255),
                verified_at TIMESTAMP,
                
                -- Training metadata
                used_for_training BOOLEAN DEFAULT FALSE,
                model_version VARCHAR(50),
                training_batch VARCHAR(255),
                performance_improvement FLOAT,
                
                -- Status
                status VARCHAR(50) DEFAULT 'pending',
                processing_errors JSONB,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_training_videos_sport ON training_videos(sport);
            CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category);
            CREATE INDEX IF NOT EXISTS idx_training_videos_athlete ON training_videos(athlete_id);
            CREATE INDEX IF NOT EXISTS idx_training_videos_status ON training_videos(status);
            CREATE INDEX IF NOT EXISTS idx_training_videos_verified ON training_videos(verified);
            CREATE INDEX IF NOT EXISTS idx_training_videos_used_for_training ON training_videos(used_for_training);
        `;

        try {
            await pgPool.query(createTableQuery);
            logger.info('Training videos database table initialized');
        } catch (error) {
            logger.error('Database initialization error:', error);
            throw error;
        }
    }

    /**
     * Collect and store training video
     */
    async collectVideo(videoData) {
        const {
            videoBuffer,
            metadata,
            athleteId,
            sport,
            category,
            subcategory
        } = videoData;

        try {
            // Validate video quality
            const validation = await this.validateVideo(videoBuffer, metadata);
            if (!validation.isValid) {
                throw new Error(`Video validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate unique video ID
            const videoId = `${sport}_${category}_${athleteId}_${uuidv4()}`;
            const fileName = `${videoId}.mp4`;
            const s3Key = `training-videos/${sport}/${category}/${fileName}`;

            // Upload to S3
            const s3Upload = await this.uploadToS3(videoBuffer, s3Key, metadata);

            // Generate thumbnail
            const thumbnailUrl = await this.generateThumbnail(videoBuffer, videoId);

            // Perform initial analysis
            const analysis = await this.performInitialAnalysis(videoBuffer, sport, category);

            // Store in database
            const dbRecord = await this.storeInDatabase({
                videoId,
                athleteId,
                sport,
                category,
                subcategory,
                s3Url: s3Upload.Location,
                thumbnailUrl,
                duration: metadata.duration,
                resolution: metadata.resolution,
                frameRate: metadata.frameRate,
                fileSize: videoBuffer.length / (1024 * 1024), // Convert to MB
                recordedAt: metadata.recordedAt || new Date(),
                location: metadata.location,
                weatherConditions: metadata.weatherConditions,
                equipmentUsed: metadata.equipmentUsed,
                ...analysis
            });

            // Queue for advanced processing
            await this.queueForProcessing(videoId);

            // Update cache
            await this.updateCache(videoId, dbRecord);

            logger.info(`Training video collected: ${videoId}`);
            
            return {
                success: true,
                videoId,
                s3Url: s3Upload.Location,
                analysis
            };

        } catch (error) {
            logger.error('Video collection error:', error);
            throw error;
        }
    }

    /**
     * Validate video quality
     */
    async validateVideo(videoBuffer, metadata) {
        const errors = [];
        
        // Check resolution
        if (metadata.resolution.width < this.qualityThresholds.minResolution.width ||
            metadata.resolution.height < this.qualityThresholds.minResolution.height) {
            errors.push(`Resolution too low. Minimum: ${this.qualityThresholds.minResolution.width}x${this.qualityThresholds.minResolution.height}`);
        }

        // Check duration
        if (metadata.duration < this.qualityThresholds.minDuration) {
            errors.push(`Video too short. Minimum: ${this.qualityThresholds.minDuration} seconds`);
        }
        if (metadata.duration > this.qualityThresholds.maxDuration) {
            errors.push(`Video too long. Maximum: ${this.qualityThresholds.maxDuration} seconds`);
        }

        // Check frame rate
        if (metadata.frameRate < this.qualityThresholds.minFrameRate) {
            errors.push(`Frame rate too low. Minimum: ${this.qualityThresholds.minFrameRate} fps`);
        }

        // Check file size (basic check for corruption)
        if (videoBuffer.length < 1000) { // Less than 1KB
            errors.push('Video file appears to be corrupted or empty');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Upload video to S3
     */
    async uploadToS3(videoBuffer, s3Key, metadata) {
        const params = {
            Bucket: this.bucketName,
            Key: s3Key,
            Body: videoBuffer,
            ContentType: 'video/mp4',
            Metadata: {
                sport: metadata.sport || '',
                category: metadata.category || '',
                athleteId: metadata.athleteId || '',
                duration: String(metadata.duration || 0),
                recordedAt: metadata.recordedAt?.toISOString() || new Date().toISOString()
            }
        };

        try {
            const result = await s3.upload(params).promise();
            logger.info(`Video uploaded to S3: ${s3Key}`);
            return result;
        } catch (error) {
            logger.error('S3 upload error:', error);
            throw error;
        }
    }

    /**
     * Generate video thumbnail
     */
    async generateThumbnail(videoBuffer, videoId) {
        // In production, this would use ffmpeg or a video processing service
        // For now, return a placeholder
        const thumbnailKey = `thumbnails/${videoId}.jpg`;
        
        // Mock thumbnail generation
        const thumbnailUrl = `https://${this.bucketName}.s3.amazonaws.com/${thumbnailKey}`;
        
        logger.info(`Thumbnail generated: ${thumbnailUrl}`);
        return thumbnailUrl;
    }

    /**
     * Perform initial video analysis
     */
    async performInitialAnalysis(videoBuffer, sport, category) {
        // This would integrate with the vision AI system
        // For now, return mock analysis results
        
        const analysis = {
            biomechanicalScore: 75 + Math.random() * 25,
            techniqueScore: 70 + Math.random() * 30,
            formAnalysis: {
                hipRotation: 35 + Math.random() * 10,
                shoulderAlignment: 85 + Math.random() * 15,
                balance: 80 + Math.random() * 20,
                followThrough: 75 + Math.random() * 25
            },
            keyPointsDetected: {
                count: Math.floor(25 + Math.random() * 8),
                confidence: 0.85 + Math.random() * 0.15
            },
            confidenceScore: 70 + Math.random() * 30,
            focusScore: 65 + Math.random() * 35,
            determinationScore: 75 + Math.random() * 25,
            gritScore: 80 + Math.random() * 20,
            championshipMindsetScore: 70 + Math.random() * 30
        };

        return analysis;
    }

    /**
     * Store video metadata in database
     */
    async storeInDatabase(data) {
        const query = `
            INSERT INTO training_videos (
                video_id, athlete_id, sport, category, subcategory,
                s3_url, thumbnail_url, duration, resolution_width, resolution_height,
                frame_rate, file_size_mb, recorded_at, location,
                weather_conditions, equipment_used,
                biomechanical_score, technique_score, form_analysis, key_points_detected,
                confidence_score, focus_score, determination_score, grit_score, championship_mindset_score,
                status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, 'pending_review'
            )
            RETURNING *;
        `;

        const values = [
            data.videoId,
            data.athleteId,
            data.sport,
            data.category,
            data.subcategory,
            data.s3Url,
            data.thumbnailUrl,
            data.duration,
            data.resolution.width,
            data.resolution.height,
            data.frameRate,
            data.fileSize,
            data.recordedAt,
            data.location,
            JSON.stringify(data.weatherConditions || {}),
            JSON.stringify(data.equipmentUsed || {}),
            data.biomechanicalScore,
            data.techniqueScore,
            JSON.stringify(data.formAnalysis || {}),
            JSON.stringify(data.keyPointsDetected || {}),
            data.confidenceScore,
            data.focusScore,
            data.determinationScore,
            data.gritScore,
            data.championshipMindsetScore
        ];

        try {
            const result = await pgPool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Database storage error:', error);
            throw error;
        }
    }

    /**
     * Queue video for advanced processing
     */
    async queueForProcessing(videoId) {
        const queueData = {
            videoId,
            queuedAt: new Date().toISOString(),
            priority: 'normal',
            processingSteps: [
                'advanced_biomechanics',
                'micro_expression_analysis',
                'performance_prediction',
                'comparison_analysis'
            ]
        };

        try {
            await redis.lpush('training_video_queue', JSON.stringify(queueData));
            logger.info(`Video queued for processing: ${videoId}`);
        } catch (error) {
            logger.error('Queue error:', error);
        }
    }

    /**
     * Update cache with video data
     */
    async updateCache(videoId, data) {
        try {
            await redis.setex(
                `training_video:${videoId}`,
                3600, // 1 hour TTL
                JSON.stringify(data)
            );
        } catch (error) {
            logger.error('Cache update error:', error);
        }
    }

    /**
     * Get training data statistics
     */
    async getStatistics() {
        const query = `
            SELECT 
                sport,
                category,
                COUNT(*) as video_count,
                AVG(biomechanical_score) as avg_biomechanical,
                AVG(technique_score) as avg_technique,
                AVG(championship_mindset_score) as avg_mindset,
                COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
                COUNT(CASE WHEN used_for_training = true THEN 1 END) as training_count,
                SUM(duration) / 3600 as total_hours
            FROM training_videos
            GROUP BY sport, category
            ORDER BY sport, category;
        `;

        try {
            const result = await pgPool.query(query);
            
            const summary = {
                totalVideos: result.rows.reduce((sum, row) => sum + parseInt(row.video_count), 0),
                totalHours: result.rows.reduce((sum, row) => sum + parseFloat(row.total_hours), 0),
                bySport: {},
                qualityMetrics: {
                    avgBiomechanical: 0,
                    avgTechnique: 0,
                    avgMindset: 0
                }
            };

            result.rows.forEach(row => {
                if (!summary.bySport[row.sport]) {
                    summary.bySport[row.sport] = {
                        categories: {},
                        totalVideos: 0,
                        totalHours: 0
                    };
                }
                
                summary.bySport[row.sport].categories[row.category] = {
                    count: parseInt(row.video_count),
                    verified: parseInt(row.verified_count),
                    usedForTraining: parseInt(row.training_count),
                    avgScores: {
                        biomechanical: parseFloat(row.avg_biomechanical) || 0,
                        technique: parseFloat(row.avg_technique) || 0,
                        mindset: parseFloat(row.avg_mindset) || 0
                    }
                };
                
                summary.bySport[row.sport].totalVideos += parseInt(row.video_count);
                summary.bySport[row.sport].totalHours += parseFloat(row.total_hours);
            });

            // Calculate overall averages
            if (result.rows.length > 0) {
                summary.qualityMetrics.avgBiomechanical = 
                    result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_biomechanical) || 0), 0) / result.rows.length;
                summary.qualityMetrics.avgTechnique = 
                    result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_technique) || 0), 0) / result.rows.length;
                summary.qualityMetrics.avgMindset = 
                    result.rows.reduce((sum, row) => sum + (parseFloat(row.avg_mindset) || 0), 0) / result.rows.length;
            }

            return summary;
        } catch (error) {
            logger.error('Statistics query error:', error);
            throw error;
        }
    }

    /**
     * Search training videos
     */
    async searchVideos(criteria) {
        let query = 'SELECT * FROM training_videos WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (criteria.sport) {
            paramCount++;
            query += ` AND sport = $${paramCount}`;
            values.push(criteria.sport);
        }

        if (criteria.category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(criteria.category);
        }

        if (criteria.athleteId) {
            paramCount++;
            query += ` AND athlete_id = $${paramCount}`;
            values.push(criteria.athleteId);
        }

        if (criteria.minScore) {
            paramCount++;
            query += ` AND biomechanical_score >= $${paramCount}`;
            values.push(criteria.minScore);
        }

        if (criteria.verified !== undefined) {
            paramCount++;
            query += ` AND verified = $${paramCount}`;
            values.push(criteria.verified);
        }

        if (criteria.usedForTraining !== undefined) {
            paramCount++;
            query += ` AND used_for_training = $${paramCount}`;
            values.push(criteria.usedForTraining);
        }

        query += ' ORDER BY created_at DESC';

        if (criteria.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(criteria.limit);
        }

        if (criteria.offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            values.push(criteria.offset);
        }

        try {
            const result = await pgPool.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Search query error:', error);
            throw error;
        }
    }

    /**
     * Mark video as verified
     */
    async verifyVideo(videoId, verifiedBy) {
        const query = `
            UPDATE training_videos 
            SET verified = true, 
                verified_by = $2, 
                verified_at = CURRENT_TIMESTAMP,
                status = 'verified'
            WHERE video_id = $1
            RETURNING *;
        `;

        try {
            const result = await pgPool.query(query, [videoId, verifiedBy]);
            
            if (result.rows.length === 0) {
                throw new Error(`Video not found: ${videoId}`);
            }

            // Clear cache
            await redis.del(`training_video:${videoId}`);

            logger.info(`Video verified: ${videoId} by ${verifiedBy}`);
            return result.rows[0];
        } catch (error) {
            logger.error('Verification error:', error);
            throw error;
        }
    }

    /**
     * Mark videos for training
     */
    async markForTraining(videoIds, modelVersion, batchId) {
        const query = `
            UPDATE training_videos 
            SET used_for_training = true,
                model_version = $2,
                training_batch = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE video_id = ANY($1::varchar[])
            RETURNING video_id;
        `;

        try {
            const result = await pgPool.query(query, [videoIds, modelVersion, batchId]);
            
            logger.info(`${result.rows.length} videos marked for training batch ${batchId}`);
            return result.rows;
        } catch (error) {
            logger.error('Training marking error:', error);
            throw error;
        }
    }

    /**
     * Export training dataset
     */
    async exportDataset(criteria) {
        const videos = await this.searchVideos({
            ...criteria,
            verified: true
        });

        const dataset = {
            exportId: uuidv4(),
            exportDate: new Date().toISOString(),
            criteria: criteria,
            videoCount: videos.length,
            totalDuration: videos.reduce((sum, v) => sum + v.duration, 0),
            videos: videos.map(v => ({
                videoId: v.video_id,
                s3Url: v.s3_url,
                sport: v.sport,
                category: v.category,
                labels: v.labels,
                annotations: v.annotations,
                scores: {
                    biomechanical: v.biomechanical_score,
                    technique: v.technique_score,
                    mindset: v.championship_mindset_score
                }
            }))
        };

        // Store export record
        await redis.setex(
            `dataset_export:${dataset.exportId}`,
            86400, // 24 hours
            JSON.stringify(dataset)
        );

        logger.info(`Dataset exported: ${dataset.exportId} with ${videos.length} videos`);
        return dataset;
    }

    /**
     * Clean up old/unused data
     */
    async cleanupOldData(daysOld = 90) {
        const query = `
            DELETE FROM training_videos 
            WHERE created_at < NOW() - INTERVAL '${daysOld} days'
            AND used_for_training = false
            AND verified = false
            RETURNING video_id, s3_url;
        `;

        try {
            const result = await pgPool.query(query);
            
            // Delete from S3
            for (const row of result.rows) {
                const s3Key = row.s3_url.split('.com/')[1];
                await s3.deleteObject({
                    Bucket: this.bucketName,
                    Key: s3Key
                }).promise();
            }

            logger.info(`Cleaned up ${result.rows.length} old training videos`);
            return result.rows.length;
        } catch (error) {
            logger.error('Cleanup error:', error);
            throw error;
        }
    }
}

// Export singleton instance
const trainingDataCollector = new TrainingDataCollector();
export default trainingDataCollector;