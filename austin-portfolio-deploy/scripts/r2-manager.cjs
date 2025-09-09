#!/usr/bin/env node

/**
 * Blaze Intelligence R2 Storage Manager
 * Handles data upload, download, and management for sports analytics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const R2_CONFIG = {
  ACCOUNT_ID: 'a12cb329d84130460eed99b816e4d0d3',
  BUCKET_NAME: 'blaze-intelligence-data',
  ENDPOINT: 'https://a12cb329d84130460eed99b816e4d0d3.r2.cloudflarestorage.com'
};

class R2Manager {
  constructor() {
    this.bucketName = R2_CONFIG.BUCKET_NAME;
    this.dataDir = path.join(__dirname, '..', 'data');
  }

  // Upload sports data to R2
  async uploadSportsData(sport, dataset, filePath) {
    try {
      console.log(`📤 Uploading ${sport}/${dataset} to R2...`);
      
      const r2Key = `sports-data/${sport}/${dataset}.json`;
      const command = `wrangler r2 object put ${this.bucketName}/${r2Key} --file="${filePath}"`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Successfully uploaded ${sport}/${dataset}`);
      
      return {
        success: true,
        key: r2Key,
        bucket: this.bucketName
      };
    } catch (error) {
      console.error(`❌ Error uploading ${sport}/${dataset}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download data from R2
  async downloadSportsData(sport, dataset, outputPath) {
    try {
      console.log(`📥 Downloading ${sport}/${dataset} from R2...`);
      
      const r2Key = `sports-data/${sport}/${dataset}.json`;
      const command = `wrangler r2 object get ${this.bucketName}/${r2Key} --file="${outputPath}"`;
      
      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Successfully downloaded to ${outputPath}`);
      
      return {
        success: true,
        localPath: outputPath
      };
    } catch (error) {
      console.error(`❌ Error downloading ${sport}/${dataset}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List all objects in bucket (using bucket info as proxy)
  async listObjects(prefix = 'sports-data/') {
    try {
      console.log(`📋 Checking bucket contents...`);
      
      // Since wrangler doesn't have list command, let's try to get bucket info
      const command = `wrangler r2 bucket list`;
      execSync(command, { stdio: 'inherit' });
      
      console.log(`\n📁 Bucket: ${this.bucketName} is available`);
      console.log(`🔗 Endpoint: ${R2_CONFIG.ENDPOINT}`);
      console.log(`\nTo list objects, use the Cloudflare dashboard or API`);
      
      return [];
    } catch (error) {
      console.error('❌ Error accessing bucket:', error.message);
      return [];
    }
  }

  // Upload all local data files
  async uploadAllLocalData() {
    console.log('🚀 Starting bulk upload of local data...');
    const results = [];

    // Sports data directories
    const sportsDataDirs = ['mlb', 'nfl', 'cfb', 'youth-baseball'];
    
    for (const sport of sportsDataDirs) {
      const sportDir = path.join(this.dataDir, sport);
      
      if (fs.existsSync(sportDir)) {
        const files = fs.readdirSync(sportDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
          const dataset = path.basename(file, '.json');
          const filePath = path.join(sportDir, file);
          const result = await this.uploadSportsData(sport, dataset, filePath);
          results.push({ sport, dataset, ...result });
        }
      }
    }

    // Also upload root-level data files
    if (fs.existsSync(this.dataDir)) {
      const rootFiles = fs.readdirSync(this.dataDir)
        .filter(f => f.endsWith('.json'));
      
      for (const file of rootFiles) {
        const dataset = path.basename(file, '.json');
        const filePath = path.join(this.dataDir, file);
        const result = await this.uploadSportsData('general', dataset, filePath);
        results.push({ sport: 'general', dataset, ...result });
      }
    }

    console.log('\n📊 Upload Summary:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\nFailed uploads:');
      failed.forEach(f => console.log(`  - ${f.sport}/${f.dataset}: ${f.error}`));
    }

    return results;
  }

  // Create sample data structure
  async createSampleData() {
    console.log('🏗️  Creating sample sports data structure...');

    const sampleData = {
      mlb: {
        cardinals: {
          roster: {
            players: [
              { name: 'Paul Goldschmidt', position: '1B', avg: '.317', ops: '.891' },
              { name: 'Nolan Arenado', position: '3B', avg: '.293', ops: '.824' }
            ],
            lastUpdated: new Date().toISOString()
          }
        }
      },
      nfl: {
        titans: {
          roster: {
            players: [
              { name: 'Will Levis', position: 'QB', completionPct: 62.1 },
              { name: 'Derrick Henry', position: 'RB', rushingYards: 1234 }
            ],
            lastUpdated: new Date().toISOString()
          }
        }
      },
      cfb: {
        longhorns: {
          stats: {
            wins: 8,
            losses: 2,
            rank: 15,
            lastUpdated: new Date().toISOString()
          }
        }
      }
    };

    // Create directories and files
    for (const [sport, teams] of Object.entries(sampleData)) {
      const sportDir = path.join(this.dataDir, sport);
      if (!fs.existsSync(sportDir)) {
        fs.mkdirSync(sportDir, { recursive: true });
      }

      for (const [team, data] of Object.entries(teams)) {
        const filePath = path.join(sportDir, `${team}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`📄 Created ${sport}/${team}.json`);
      }
    }

    console.log('✅ Sample data structure created');
    return sampleData;
  }
}

// CLI Interface
async function main() {
  const manager = new R2Manager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'upload':
      if (args.length === 3) {
        const [sport, dataset, filePath] = args;
        await manager.uploadSportsData(sport, dataset, filePath);
      } else {
        console.log('Usage: node r2-manager.cjs upload <sport> <dataset> <filePath>');
      }
      break;

    case 'download':
      if (args.length === 3) {
        const [sport, dataset, outputPath] = args;
        await manager.downloadSportsData(sport, dataset, outputPath);
      } else {
        console.log('Usage: node r2-manager.cjs download <sport> <dataset> <outputPath>');
      }
      break;

    case 'list':
      const prefix = args[0] || 'sports-data/';
      await manager.listObjects(prefix);
      break;

    case 'upload-all':
      await manager.uploadAllLocalData();
      break;

    case 'create-sample':
      await manager.createSampleData();
      break;

    case 'info':
      console.log('🏪 Blaze Intelligence R2 Storage Info:');
      console.log(`   Account ID: ${R2_CONFIG.ACCOUNT_ID}`);
      console.log(`   Bucket: ${R2_CONFIG.BUCKET_NAME}`);
      console.log(`   Endpoint: ${R2_CONFIG.ENDPOINT}`);
      break;

    default:
      console.log(`
🏪 Blaze Intelligence R2 Storage Manager

Commands:
  upload <sport> <dataset> <filePath>  Upload a data file to R2
  download <sport> <dataset> <output>  Download data from R2
  list [prefix]                        List objects in bucket
  upload-all                          Upload all local data files
  create-sample                       Create sample data structure
  info                                Show R2 configuration

Examples:
  node r2-manager.cjs upload mlb cardinals ./data/mlb/cardinals.json
  node r2-manager.cjs download nfl titans ./titans-data.json
  node r2-manager.cjs list sports-data/mlb/
  node r2-manager.cjs upload-all
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = R2Manager;