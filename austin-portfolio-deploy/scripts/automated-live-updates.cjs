#!/usr/bin/env node

/**
 * Automated Live Updates for Blaze Intelligence
 * Runs every 10 minutes to update live data
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'live-data-updater.cjs');
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

console.log('🚀 Starting Blaze Intelligence Automated Live Updates');
console.log('📅 Started:', new Date().toISOString());
console.log('⏰ Update Interval: 10 minutes');
console.log('');

function runUpdate() {
  console.log('🔄 Running scheduled update...');
  
  const updateProcess = spawn('node', [SCRIPT_PATH], {
    stdio: 'inherit'
  });
  
  updateProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Update completed successfully');
      console.log('⏰ Next update:', new Date(Date.now() + UPDATE_INTERVAL).toLocaleTimeString());
    } else {
      console.error('❌ Update failed with code:', code);
    }
    console.log('');
  });
  
  updateProcess.on('error', (error) => {
    console.error('💥 Update process error:', error.message);
  });
}

// Run initial update
runUpdate();

// Schedule recurring updates
setInterval(runUpdate, UPDATE_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down automated updates...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating automated updates...');
  process.exit(0);
});