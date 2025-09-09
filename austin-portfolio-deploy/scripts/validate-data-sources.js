#!/usr/bin/env node

import FactChecker from '../src/utils/fact-checker.js';

async function validateDataSources() {
  console.log('🔍 Validating Data Sources');
  console.log('==========================\n');
  
  const factChecker = new FactChecker();
  
  const sources = [
    { 
      name: 'mlb', 
      endpoint: 'https://statsapi.mlb.com/api/v1/teams/138',
      format: 'json',
      description: 'St. Louis Cardinals via MLB Stats API'
    },
    { 
      name: 'nfl', 
      endpoint: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/10',
      format: 'json',
      description: 'Tennessee Titans via ESPN API'
    },
    { 
      name: 'cfb', 
      endpoint: 'https://api.collegefootballdata.com/teams?school=Texas',
      format: 'json',
      description: 'Texas Longhorns via CollegeFootballData API'
    }
  ];
  
  let allValid = true;
  const results = [];
  
  for (const source of sources) {
    try {
      console.log(`Testing ${source.description}...`);
      
      const result = await factChecker.validateDataSource(source.name, source.endpoint, source.format);
      results.push({ ...source, result });
      
      if (result.valid) {
        console.log(`✅ ${source.name.toUpperCase()}: VALID`);
        console.log(`   Source: ${result.source}`);
        console.log(`   Reliability: ${result.reliability}`);
        console.log(`   Update Frequency: ${result.updateFrequency}`);
        if (result.limitations) {
          console.log(`   ⚠️  Limitations: ${result.limitations}`);
        }
      } else {
        console.log(`❌ ${source.name.toUpperCase()}: INVALID`);
        console.log(`   Error: ${result.error}`);
        if (result.recommendation) {
          console.log(`   💡 Recommendation: ${result.recommendation}`);
        }
        allValid = false;
      }
      console.log('');
    } catch (error) {
      console.log(`💥 ${source.name.toUpperCase()}: EXCEPTION`);
      console.log(`   Error: ${error.message}`);
      allValid = false;
      console.log('');
    }
  }
  
  console.log('📊 Summary');
  console.log('==========');
  console.log(`Total Sources: ${sources.length}`);
  console.log(`Valid Sources: ${results.filter(r => r.result?.valid).length}`);
  console.log(`Invalid Sources: ${results.filter(r => !r.result?.valid).length}`);
  console.log(`Overall Status: ${allValid ? '✅ ALL VALID' : '❌ ISSUES FOUND'}`);
  
  if (!allValid) {
    console.log('\n🚨 Action Required:');
    console.log('- Fix invalid data sources before production deployment');
    console.log('- Ensure fallback data is available for unreliable sources');
    console.log('- Consider implementing circuit breaker pattern for failing APIs');
  }
  
  return allValid;
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  validateDataSources()
    .then(valid => {
      process.exit(valid ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default validateDataSources;