/**
 * Database Backup and Recovery System
 * Automated backups with disaster recovery for production
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

class BackupSystem {
  constructor(logger = null) {
    this.logger = logger;
    this.backupDir = path.join(process.cwd(), 'backups');
    this.retentionDays = 30; // Keep backups for 30 days
    this.maxBackups = 50; // Maximum number of backups to keep
    
    this.schedules = {
      hourly: '0 * * * *',    // Every hour
      daily: '0 2 * * *',     // Daily at 2 AM
      weekly: '0 2 * * 0',    // Weekly on Sunday at 2 AM
      monthly: '0 2 1 * *'    // Monthly on 1st at 2 AM
    };
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      await this.ensureBackupDirectory();
      await this.scheduleBackups();
      console.log('✅ Backup system initialized');
      
      if (this.logger) {
        this.logger.logHealth('backup', 'initialized', {
          backupDir: this.backupDir,
          retentionDays: this.retentionDays
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize backup system:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'backup-system' });
      }
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Create subdirectories for different backup types
      const subdirs = ['database', 'files', 'logs', 'configs'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.backupDir, subdir), { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  /**
   * Create database backup using pg_dump
   */
  async createDatabaseBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-${type}-${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, 'database', filename);

    try {
      // Database connection parameters from environment
      const dbConfig = {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'blaze_intelligence',
        username: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD
      };

      console.log(`📦 Creating ${type} database backup: ${filename}`);

      // Run pg_dump command
      const pgDump = spawn('pg_dump', [
        '-h', dbConfig.host,
        '-p', dbConfig.port.toString(),
        '-U', dbConfig.username,
        '-d', dbConfig.database,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '--create'
      ], {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password
        }
      });

      // Compress the dump
      const gzip = createGzip({ level: 9 });
      const output = createWriteStream(filepath);

      // Pipe: pg_dump -> gzip -> file
      pgDump.stdout.pipe(gzip).pipe(output);

      return new Promise((resolve, reject) => {
        let error = '';
        
        pgDump.stderr.on('data', (data) => {
          error += data.toString();
        });

        pgDump.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Database backup created: ${filename}`);
            if (this.logger) {
              this.logger.logBusiness('database_backup_created', {
                type,
                filename,
                filepath,
                timestamp
              });
            }
            resolve({ filename, filepath, size: this.getFileSize(filepath) });
          } else {
            const errorMsg = `pg_dump failed with code ${code}: ${error}`;
            console.error('❌ Database backup failed:', errorMsg);
            if (this.logger) {
              this.logger.logError(new Error(errorMsg), { component: 'backup-database' });
            }
            reject(new Error(errorMsg));
          }
        });

        pgDump.on('error', (err) => {
          console.error('❌ pg_dump process error:', err);
          reject(err);
        });
      });

    } catch (error) {
      console.error('❌ Database backup error:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'backup-database', type });
      }
      throw error;
    }
  }

  /**
   * Create file system backup (uploads, logs, configs)
   */
  async createFileBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backups = [];

    try {
      // Backup uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (await this.directoryExists(uploadsDir)) {
        const uploadsBackup = await this.createDirectoryBackup(uploadsDir, 'files', `uploads-${type}-${timestamp}`);
        backups.push(uploadsBackup);
      }

      // Backup logs directory
      const logsDir = path.join(process.cwd(), 'logs');
      if (await this.directoryExists(logsDir)) {
        const logsBackup = await this.createDirectoryBackup(logsDir, 'logs', `logs-${type}-${timestamp}`);
        backups.push(logsBackup);
      }

      // Backup configuration files
      const configFiles = [
        'package.json',
        'ecosystem.config.js',
        '.env.production.example',
        'replit.md'
      ];

      const configBackup = await this.createConfigBackup(configFiles, type, timestamp);
      if (configBackup) {
        backups.push(configBackup);
      }

      console.log(`✅ File backups created: ${backups.length} archives`);
      return backups;

    } catch (error) {
      console.error('❌ File backup error:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'backup-files', type });
      }
      throw error;
    }
  }

  /**
   * Create backup of a directory
   */
  async createDirectoryBackup(sourceDir, backupType, name) {
    const filename = `${name}.tar.gz`;
    const filepath = path.join(this.backupDir, backupType, filename);

    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-czf', filepath,
        '-C', path.dirname(sourceDir),
        path.basename(sourceDir)
      ]);

      tar.on('close', (code) => {
        if (code === 0) {
          resolve({ filename, filepath, size: this.getFileSize(filepath) });
        } else {
          reject(new Error(`tar failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  /**
   * Create configuration files backup
   */
  async createConfigBackup(configFiles, type, timestamp) {
    const filename = `configs-${type}-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, 'configs', filename);
    
    // Filter existing files
    const existingFiles = [];
    for (const file of configFiles) {
      if (await this.fileExists(file)) {
        existingFiles.push(file);
      }
    }

    if (existingFiles.length === 0) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-czf', filepath,
        ...existingFiles
      ]);

      tar.on('close', (code) => {
        if (code === 0) {
          resolve({ filename, filepath, size: this.getFileSize(filepath) });
        } else {
          reject(new Error(`Config backup tar failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupFile) {
    try {
      console.log(`🔄 Restoring database from: ${backupFile}`);

      const dbConfig = {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'blaze_intelligence',
        username: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD
      };

      // Decompress and restore
      const gunzip = createGunzip();
      const input = createReadStream(backupFile);

      const psql = spawn('psql', [
        '-h', dbConfig.host,
        '-p', dbConfig.port.toString(),
        '-U', dbConfig.username,
        '-d', dbConfig.database,
        '--no-password'
      ], {
        env: {
          ...process.env,
          PGPASSWORD: dbConfig.password
        }
      });

      // Pipe: file -> gunzip -> psql
      input.pipe(gunzip).pipe(psql.stdin);

      return new Promise((resolve, reject) => {
        let error = '';
        
        psql.stderr.on('data', (data) => {
          error += data.toString();
        });

        psql.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database restored successfully');
            if (this.logger) {
              this.logger.logBusiness('database_restored', { backupFile });
            }
            resolve();
          } else {
            const errorMsg = `psql failed with code ${code}: ${error}`;
            console.error('❌ Database restore failed:', errorMsg);
            reject(new Error(errorMsg));
          }
        });

        psql.on('error', reject);
      });

    } catch (error) {
      console.error('❌ Database restore error:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'restore-database', backupFile });
      }
      throw error;
    }
  }

  /**
   * Schedule automated backups
   */
  async scheduleBackups() {
    // In production, you would use a proper cron job scheduler
    // For now, we'll use simple intervals
    
    // Daily backup at 2 AM (if running at that time)
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(2, 0, 0, 0); // 2 AM
    
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1); // Tomorrow at 2 AM
    }

    const msUntilBackup = nextBackup.getTime() - now.getTime();
    
    setTimeout(() => {
      this.runScheduledBackup();
      // Then run every 24 hours
      setInterval(() => this.runScheduledBackup(), 24 * 60 * 60 * 1000);
    }, msUntilBackup);

    console.log(`⏰ Next automated backup scheduled for: ${nextBackup.toLocaleString()}`);
  }

  /**
   * Run scheduled backup
   */
  async runScheduledBackup() {
    try {
      console.log('🕐 Running scheduled backup...');
      
      const databaseBackup = await this.createDatabaseBackup('scheduled');
      const fileBackups = await this.createFileBackup('scheduled');
      
      await this.cleanOldBackups();
      
      console.log('✅ Scheduled backup completed');
      
      if (this.logger) {
        this.logger.logBusiness('scheduled_backup_completed', {
          database: databaseBackup,
          files: fileBackups.length
        });
      }
      
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'scheduled-backup' });
      }
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const backupTypes = ['database', 'files', 'logs', 'configs'];
      let deletedCount = 0;
      
      for (const type of backupTypes) {
        const typeDir = path.join(this.backupDir, type);
        
        try {
          const files = await fs.readdir(typeDir);
          const fileStats = await Promise.all(
            files.map(async (file) => {
              const filePath = path.join(typeDir, file);
              const stats = await fs.stat(filePath);
              return { file, filePath, mtime: stats.mtime };
            })
          );

          // Sort by modification time (oldest first)
          fileStats.sort((a, b) => a.mtime - b.mtime);

          // Delete old files
          for (const { file, filePath, mtime } of fileStats) {
            if (mtime < cutoffDate || fileStats.length > this.maxBackups) {
              await fs.unlink(filePath);
              deletedCount++;
              console.log(`🗑️  Deleted old backup: ${file}`);
            }
          }
          
        } catch (error) {
          console.warn(`Warning: Could not clean ${type} backups:`, error.message);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ Cleaned ${deletedCount} old backup files`);
      }
      
    } catch (error) {
      console.error('❌ Backup cleanup error:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'backup-cleanup' });
      }
    }
  }

  /**
   * Get backup status and statistics
   */
  async getBackupStatus() {
    try {
      const status = {
        enabled: true,
        backupDir: this.backupDir,
        retentionDays: this.retentionDays,
        types: {}
      };

      const backupTypes = ['database', 'files', 'logs', 'configs'];
      
      for (const type of backupTypes) {
        const typeDir = path.join(this.backupDir, type);
        
        try {
          const files = await fs.readdir(typeDir);
          const fileStats = await Promise.all(
            files.map(async (file) => {
              const filePath = path.join(typeDir, file);
              const stats = await fs.stat(filePath);
              return { file, size: stats.size, mtime: stats.mtime };
            })
          );

          status.types[type] = {
            count: files.length,
            totalSize: fileStats.reduce((sum, f) => sum + f.size, 0),
            latest: fileStats.length > 0 ? fileStats.reduce((latest, f) => 
              f.mtime > latest.mtime ? f : latest
            ) : null
          };
          
        } catch (error) {
          status.types[type] = { error: error.message };
        }
      }
      
      return status;
      
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }

  /**
   * Utility functions
   */
  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async directoryExists(dirpath) {
    try {
      const stats = await fs.stat(dirpath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  getFileSize(filepath) {
    try {
      const stats = fs.statSync(filepath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

export default BackupSystem;