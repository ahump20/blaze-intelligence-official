#!/usr/bin/env node

// Blaze Intelligence Automated Agents Launcher
// Starts both Digital-Combine Autopilot and Cardinals Readiness Board agents

const { spawn } = require('child_process');
const path = require('path');

const agents = [
    {
        name: 'Cardinals Readiness Board',
        script: './agents/cardinals-readiness-board.js',
        interval: '10 minutes'
    },
    {
        name: 'Digital-Combine Autopilot',
        script: './agents/digital-combine-autopilot.js',
        interval: '30 minutes'
    }
];

console.log('🔥 BLAZE INTELLIGENCE - Agent Management System');
console.log('='.repeat(50));
console.log('Starting automated data processing agents...\n');

// Function to start an agent
function startAgent(agent) {
    console.log(`🚀 Starting ${agent.name} (runs every ${agent.interval})...`);
    
    const agentProcess = spawn('node', [agent.script], {
        cwd: __dirname,
        env: { ...process.env },
        stdio: 'inherit'
    });

    agentProcess.on('error', (err) => {
        console.error(`❌ Failed to start ${agent.name}:`, err);
    });

    agentProcess.on('exit', (code) => {
        if (code !== 0) {
            console.error(`⚠️ ${agent.name} exited with code ${code}. Restarting in 5 seconds...`);
            setTimeout(() => startAgent(agent), 5000);
        }
    });

    return agentProcess;
}

// Start all agents
const runningAgents = agents.map(agent => ({
    ...agent,
    process: startAgent(agent)
}));

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down agents...');
    runningAgents.forEach(agent => {
        if (agent.process) {
            agent.process.kill();
        }
    });
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Termination signal received, shutting down...');
    runningAgents.forEach(agent => {
        if (agent.process) {
            agent.process.kill();
        }
    });
    process.exit(0);
});

// Keep the main process running
console.log('\n✅ All agents started successfully');
console.log('Press Ctrl+C to stop all agents\n');

// Add health monitoring
setInterval(() => {
    console.log(`📊 Status Check - ${new Date().toLocaleTimeString()}`);
    runningAgents.forEach(agent => {
        if (agent.process && !agent.process.killed) {
            console.log(`  ✅ ${agent.name}: Running`);
        } else {
            console.log(`  ❌ ${agent.name}: Stopped`);
        }
    });
}, 60000); // Check every minute