#!/usr/bin/env node

// Quick test script to verify R2 storage and worker functionality

async function testStorageWorker() {
    console.log('🧪 Testing Blaze Intelligence Storage Worker');
    console.log('=============================================');
    
    const baseUrl = 'https://blaze-storage.humphrey-austin20.workers.dev';
    
    try {
        // Test 1: Health check
        console.log('\n1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();
        console.log(`   Status: ${healthResponse.status}`);
        console.log(`   Response: ${JSON.stringify(healthData, null, 2)}`);
        
        // Test 2: Try Cardinals data
        console.log('\n2️⃣ Testing Cardinals data endpoint...');
        const cardinalsResponse = await fetch(`${baseUrl}/api/data/mlb/cardinals`);
        const cardinalsData = await cardinalsResponse.json();
        console.log(`   Status: ${cardinalsResponse.status}`);
        console.log(`   Response: ${JSON.stringify(cardinalsData, null, 2)}`);
        
        // Test 3: Try a simple POST to create test data
        console.log('\n3️⃣ Testing data upload...');
        const testData = {
            roster: {
                players: [
                    {
                        name: "Test Player",
                        position: "1B", 
                        avg: ".300",
                        ops: ".850"
                    }
                ]
            },
            updated: new Date().toISOString()
        };
        
        const uploadResponse = await fetch(`${baseUrl}/api/data/mlb/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const uploadResult = await uploadResponse.json();
        console.log(`   Upload Status: ${uploadResponse.status}`);
        console.log(`   Response: ${JSON.stringify(uploadResult, null, 2)}`);
        
        // Test 4: Try to retrieve the test data
        console.log('\n4️⃣ Testing retrieval of uploaded data...');
        const retrieveResponse = await fetch(`${baseUrl}/api/data/mlb/test`);
        const retrieveData = await retrieveResponse.json();
        console.log(`   Status: ${retrieveResponse.status}`);
        console.log(`   Response: ${JSON.stringify(retrieveData, null, 2)}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Check if we need to install fetch
if (typeof fetch === 'undefined') {
    console.log('Installing node-fetch...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    global.fetch = require('node-fetch');
}

testStorageWorker();