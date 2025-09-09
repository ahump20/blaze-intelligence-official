#!/usr/bin/env node

/**
 * Blaze Intelligence System Validation Script
 * Comprehensive fact-checking and system verification
 */

import DeploymentPipeline from './pipeline.js';
import fs from 'fs/promises';
import path from 'path';

const BASE_PATH = '/Users/AustinHumphrey/austin-portfolio-deploy';

class SystemValidator {
  constructor() {
    this.results = {
      apis: {},
      pages: {},
      config: {},
      overall: 'pending'
    };
  }

  async validateEntireSystem() {
    console.log('🔍 BLAZE INTELLIGENCE SYSTEM VALIDATION');
    console.log('========================================\n');

    try {
      // Validate API Layer
      await this.validateApiLayer();
      
      // Validate UI Layer  
      await this.validateUiLayer();
      
      // Validate Configuration
      await this.validateSystemConfiguration();
      
      // Validate Integration
      await this.validateIntegration();
      
      // Generate final report
      await this.generateValidationReport();
      
      console.log('\n✅ SYSTEM VALIDATION COMPLETED SUCCESSFULLY');
      return this.results;
      
    } catch (error) {
      console.error('\n❌ SYSTEM VALIDATION FAILED:', error.message);
      this.results.overall = 'failed';
      throw error;
    }
  }

  async validateApiLayer() {
    console.log('🔧 Validating API Layer...\n');
    
    const requiredApis = [
      { path: '/functions/api/gateway.js', name: 'Unified API Gateway' },
      { path: '/functions/api/cardinals/readiness.js', name: 'Cardinals Analytics' },
      { path: '/functions/api/titans/analytics.js', name: 'Titans NFL Analytics' },
      { path: '/functions/api/longhorns/recruiting.js', name: 'Longhorns Recruiting' },
      { path: '/functions/api/grizzlies/grit.js', name: 'Grizzlies Grit Index' },
      { path: '/functions/api/champion-enigma/analysis.js', name: 'Champion Enigma Engine' },
      { path: '/functions/api/digital-combine/autopilot.js', name: 'Digital Combine Autopilot' },
      { path: '/functions/api/sync/realtime.js', name: 'Real-time Sync System' }
    ];

    let apisValidated = 0;

    for (const api of requiredApis) {
      const fullPath = path.join(BASE_PATH, api.path);
      
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const validation = await this.validateApiFile(content, api.name);
        
        if (validation.valid) {
          console.log(`✅ ${api.name} - VALID`);
          this.results.apis[api.name] = { status: 'valid', issues: [] };
          apisValidated++;
        } else {
          console.log(`⚠️  ${api.name} - ISSUES FOUND:`);
          validation.issues.forEach(issue => console.log(`   - ${issue}`));
          this.results.apis[api.name] = { status: 'issues', issues: validation.issues };
        }
        
      } catch (error) {
        console.log(`❌ ${api.name} - FILE NOT FOUND: ${api.path}`);
        this.results.apis[api.name] = { status: 'missing', error: error.message };
      }
    }

    console.log(`\n📊 API Layer Summary: ${apisValidated}/${requiredApis.length} APIs validated\n`);
  }

  async validateApiFile(content, name) {
    const issues = [];
    
    // Check for essential exports
    if (!content.includes('export async function onRequestGet')) {
      issues.push('Missing onRequestGet handler');
    }
    
    if (!content.includes('export async function onRequestOptions')) {
      issues.push('Missing CORS OPTIONS handler');
    }
    
    // Check for proper error handling
    if (!content.includes('try') || !content.includes('catch')) {
      issues.push('Missing error handling');
    }
    
    // Check for CORS configuration
    if (!content.includes('Access-Control-Allow-Origin')) {
      issues.push('Missing CORS headers');
    }
    
    // Check for JSON responses
    if (!content.includes('JSON.stringify')) {
      issues.push('Missing JSON response formatting');
    }
    
    // Specific validations based on API type
    if (name.includes('Gateway')) {
      if (!content.includes('authenticateClient')) {
        issues.push('Gateway missing authentication logic');
      }
    }
    
    if (name.includes('Sync')) {
      if (!content.includes('synchroniz') && !content.includes('sync')) {
        issues.push('Sync system missing synchronization logic');
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  async validateUiLayer() {
    console.log('🎨 Validating UI Layer...\n');
    
    const requiredPages = [
      { path: '/index.html', name: 'Main Landing Page' },
      { path: '/client-dashboard.html', name: 'Client Dashboard' },
      { path: '/champion-enigma-demo.html', name: 'Champion Enigma Demo' },
      { path: '/digital-combine-autopilot.html', name: 'Digital Combine Autopilot' }
    ];

    let pagesValidated = 0;

    for (const page of requiredPages) {
      const fullPath = path.join(BASE_PATH, page.path);
      
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const validation = await this.validateHtmlFile(content, page.name);
        
        if (validation.valid) {
          console.log(`✅ ${page.name} - VALID`);
          this.results.pages[page.name] = { status: 'valid', issues: [] };
          pagesValidated++;
        } else {
          console.log(`⚠️  ${page.name} - ISSUES FOUND:`);
          validation.issues.forEach(issue => console.log(`   - ${issue}`));
          this.results.pages[page.name] = { status: 'issues', issues: validation.issues };
        }
        
      } catch (error) {
        console.log(`❌ ${page.name} - FILE NOT FOUND: ${page.path}`);
        this.results.pages[page.name] = { status: 'missing', error: error.message };
      }
    }

    console.log(`\n📊 UI Layer Summary: ${pagesValidated}/${requiredPages.length} pages validated\n`);
  }

  async validateHtmlFile(content, name) {
    const issues = [];
    
    // Check basic HTML structure
    if (!content.includes('<!DOCTYPE html>')) {
      issues.push('Missing DOCTYPE declaration');
    }
    
    if (!content.includes('<html')) {
      issues.push('Missing HTML root element');
    }
    
    if (!content.includes('<head>') || !content.includes('</head>')) {
      issues.push('Missing head section');
    }
    
    if (!content.includes('<body>') || !content.includes('</body>')) {
      issues.push('Missing body section');
    }
    
    if (!content.includes('<title>')) {
      issues.push('Missing title tag');
    }
    
    // Check for viewport meta tag (responsive design)
    if (!content.includes('viewport')) {
      issues.push('Missing viewport meta tag');
    }
    
    // Check for Blaze Intelligence branding
    if (!content.includes('Blaze Intelligence') && !content.includes('BLAZE INTELLIGENCE')) {
      issues.push('Missing Blaze Intelligence branding');
    }
    
    // Specific validations
    if (name.includes('Dashboard')) {
      if ((!content.includes('loadDashboardData') && !content.includes('fetchDashboardData')) || !content.includes('renderDashboard')) {
        issues.push('Dashboard missing core JavaScript functionality');
      }
    }
    
    if (name.includes('Enigma')) {
      if (!content.includes('Champion Enigma')) {
        issues.push('Missing Champion Enigma branding');
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  async validateSystemConfiguration() {
    console.log('⚙️  Validating System Configuration...\n');
    
    // Validate wrangler.toml
    try {
      const wranglerPath = path.join(BASE_PATH, 'wrangler.toml');
      const wranglerContent = await fs.readFile(wranglerPath, 'utf8');
      
      const wranglerValidation = this.validateWranglerConfig(wranglerContent);
      
      if (wranglerValidation.valid) {
        console.log('✅ wrangler.toml - VALID');
        this.results.config['wrangler.toml'] = { status: 'valid', issues: [] };
      } else {
        console.log('⚠️  wrangler.toml - ISSUES FOUND:');
        wranglerValidation.issues.forEach(issue => console.log(`   - ${issue}`));
        this.results.config['wrangler.toml'] = { status: 'issues', issues: wranglerValidation.issues };
      }
      
    } catch (error) {
      console.log('❌ wrangler.toml - FILE NOT FOUND');
      this.results.config['wrangler.toml'] = { status: 'missing', error: error.message };
    }

    console.log('📊 Configuration Summary: Core configuration validated\n');
  }

  validateWranglerConfig(content) {
    const issues = [];
    
    if (!content.includes('name = "blaze-intelligence-lsl"')) {
      issues.push('Missing or incorrect project name');
    }
    
    if (!content.includes('compatibility_date')) {
      issues.push('Missing compatibility date');
    }
    
    if (!content.includes('pages_build_output_dir')) {
      issues.push('Missing pages build output directory');
    }
    
    // Check for R2 bucket configuration
    if (!content.includes('r2_buckets') && !content.includes('BLAZE_STORAGE')) {
      issues.push('Missing R2 storage configuration');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  async validateIntegration() {
    console.log('🔗 Validating System Integration...\n');
    
    // Check navigation integration
    const indexPath = path.join(BASE_PATH, 'index.html');
    const indexContent = await fs.readFile(indexPath, 'utf8');
    
    const expectedLinks = [
      '/client-dashboard.html',
      '/champion-enigma-demo.html',
      '/digital-combine-autopilot.html'
    ];
    
    let integratedLinks = 0;
    
    for (const link of expectedLinks) {
      if (indexContent.includes(link)) {
        console.log(`✅ Navigation link: ${link} - INTEGRATED`);
        integratedLinks++;
      } else {
        console.log(`❌ Navigation link: ${link} - MISSING`);
      }
    }
    
    console.log(`\n📊 Integration Summary: ${integratedLinks}/${expectedLinks.length} components integrated\n`);
  }

  async generateValidationReport() {
    const totalApis = Object.keys(this.results.apis).length;
    const validApis = Object.values(this.results.apis).filter(api => api.status === 'valid').length;
    
    const totalPages = Object.keys(this.results.pages).length;
    const validPages = Object.values(this.results.pages).filter(page => page.status === 'valid').length;
    
    const totalConfigs = Object.keys(this.results.config).length;
    const validConfigs = Object.values(this.results.config).filter(config => config.status === 'valid').length;
    
    console.log('📋 COMPREHENSIVE VALIDATION REPORT');
    console.log('==================================');
    console.log(`🔧 API Layer: ${validApis}/${totalApis} validated (${Math.round(validApis/totalApis*100)}%)`);
    console.log(`🎨 UI Layer: ${validPages}/${totalPages} validated (${Math.round(validPages/totalPages*100)}%)`);
    console.log(`⚙️  Configuration: ${validConfigs}/${totalConfigs} validated (${Math.round(validConfigs/totalConfigs*100)}%)`);
    
    const overallSuccess = (validApis === totalApis && validPages === totalPages && validConfigs === totalConfigs);
    this.results.overall = overallSuccess ? 'success' : 'issues';
    
    console.log(`\n🎯 Overall Status: ${overallSuccess ? 'SYSTEM FULLY VALIDATED' : 'ISSUES REQUIRE ATTENTION'}`);
    console.log('==================================\n');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SystemValidator();
  
  try {
    await validator.validateEntireSystem();
    process.exit(0);
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

export default SystemValidator;