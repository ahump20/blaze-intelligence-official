/**
 * Blaze Intelligence Fact Checking and Content Validation System
 * Ensures all claims are accurate, verifiable, and properly attributed
 */

class FactChecker {
  constructor() {
    this.validatedClaims = new Map();
    this.contentGuidelines = this.loadContentGuidelines();
    this.dataSourceValidation = this.loadDataSourceValidation();
  }

  loadContentGuidelines() {
    return {
      // Prohibited claims
      prohibited: [
        'trusted by pro teams',
        'used by professional organizations',
        'proven results',
        'guaranteed outcomes',
        'industry leading',
        'best in class'
      ],
      
      // Required disclaimers
      requiresDisclaimer: [
        'sub-100ms latency',
        '94.6% accuracy',
        'championship results',
        'competitive edge'
      ],
      
      // Savings claims must be within factual range
      savingsRange: {
        min: 67,
        max: 80,
        competitors: ['Hudl', 'SportsCode', 'Krossover']
      },
      
      // Performance claims require methodology links
      performanceClaims: [
        'latency',
        'accuracy',
        'response time',
        'uptime'
      ]
    };
  }

  loadDataSourceValidation() {
    return {
      mlb: {
        official: 'MLB Stats API',
        url: 'https://statsapi.mlb.com',
        reliability: 'high',
        updateFrequency: 'real-time',
        limitations: 'Rate limited, may have delays during high traffic'
      },
      nfl: {
        official: 'ESPN API',
        url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
        reliability: 'high', 
        updateFrequency: 'real-time',
        limitations: 'Third-party API, not official NFL'
      },
      cfb: {
        official: 'CollegeFootballData API',
        url: 'https://api.collegefootballdata.com',
        reliability: 'high',
        updateFrequency: 'daily',
        limitations: 'Academic/educational use, not real-time during games'
      }
    };
  }

  // Validate content against guidelines
  validateContent(content) {
    const issues = [];
    const contentLower = content.toLowerCase();

    // Check for prohibited claims
    this.contentGuidelines.prohibited.forEach(claim => {
      if (contentLower.includes(claim.toLowerCase())) {
        issues.push({
          type: 'prohibited_claim',
          claim: claim,
          severity: 'high',
          message: `Prohibited claim "${claim}" found in content`,
          fix: 'Remove or replace with factual statement'
        });
      }
    });

    // Check for unsupported performance claims
    this.contentGuidelines.performanceClaims.forEach(claim => {
      if (contentLower.includes(claim)) {
        const hasMethodsLink = content.includes('Methods & Definitions') || 
                              content.includes('/docs/methodology');
        if (!hasMethodsLink) {
          issues.push({
            type: 'missing_methodology',
            claim: claim,
            severity: 'medium',
            message: `Performance claim "${claim}" requires methodology link`,
            fix: 'Add link to "Methods & Definitions" documentation'
          });
        }
      }
    });

    // Check savings claims
    const savingsPattern = /(\d+)%?\s*(?:savings?|cheaper|less expensive)/gi;
    const savingsMatches = content.match(savingsPattern);
    if (savingsMatches) {
      savingsMatches.forEach(match => {
        const percentage = parseInt(match.match(/\d+/)[0]);
        if (percentage < this.contentGuidelines.savingsRange.min || 
            percentage > this.contentGuidelines.savingsRange.max) {
          issues.push({
            type: 'invalid_savings_claim',
            claim: match,
            severity: 'high',
            message: `Savings claim ${percentage}% outside validated range (${this.contentGuidelines.savingsRange.min}-${this.contentGuidelines.savingsRange.max}%)`,
            fix: `Use validated savings range: ${this.contentGuidelines.savingsRange.min}-${this.contentGuidelines.savingsRange.max}%`
          });
        }
      });
    }

    return issues;
  }

  // Validate data source accuracy
  async validateDataSource(source, endpoint, expectedFormat) {
    try {
      const validation = this.dataSourceValidation[source];
      if (!validation) {
        return {
          valid: false,
          error: 'Unknown data source',
          recommendation: 'Use validated data sources: MLB Stats API, ESPN API, or CollegeFootballData'
        };
      }

      // Test API endpoint accessibility
      const response = await fetch(endpoint, { method: 'HEAD' });
      const accessible = response.ok;

      return {
        valid: accessible,
        source: validation.official,
        reliability: validation.reliability,
        updateFrequency: validation.updateFrequency,
        limitations: validation.limitations,
        accessible: accessible,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        recommendation: 'Check network connectivity and API endpoint'
      };
    }
  }

  // Generate fact-checked content improvements
  generateContentImprovements(content) {
    const improvements = [];
    const issues = this.validateContent(content);

    issues.forEach(issue => {
      switch (issue.type) {
        case 'prohibited_claim':
          improvements.push({
            original: issue.claim,
            improved: this.generateFactualAlternative(issue.claim),
            reason: 'Replace unsubstantiated claim with factual statement'
          });
          break;

        case 'missing_methodology':
          improvements.push({
            original: content,
            improved: content + ' <a href="/docs/methodology" class="methods-link">View Methods & Definitions</a>',
            reason: 'Add methodology link for performance claims'
          });
          break;

        case 'invalid_savings_claim':
          const validRange = `${this.contentGuidelines.savingsRange.min}-${this.contentGuidelines.savingsRange.max}%`;
          improvements.push({
            original: issue.claim,
            improved: `${validRange} savings compared to traditional solutions`,
            reason: 'Use validated savings range with proper attribution'
          });
          break;
      }
    });

    return improvements;
  }

  generateFactualAlternative(prohibitedClaim) {
    const alternatives = {
      'trusted by pro teams': 'designed for professional-grade analytics',
      'used by professional organizations': 'built to professional standards',
      'proven results': 'data-driven insights',
      'guaranteed outcomes': 'advanced analytics capabilities',
      'industry leading': 'innovative approach',
      'best in class': 'comprehensive platform'
    };

    return alternatives[prohibitedClaim.toLowerCase()] || 'advanced sports analytics platform';
  }

  // Create content validation report
  async generateValidationReport(content, dataSources = []) {
    const contentIssues = this.validateContent(content);
    const dataValidations = await Promise.all(
      dataSources.map(source => this.validateDataSource(source.name, source.endpoint, source.format))
    );

    return {
      timestamp: new Date().toISOString(),
      contentValidation: {
        totalIssues: contentIssues.length,
        issues: contentIssues,
        improvements: this.generateContentImprovements(content)
      },
      dataSourceValidation: {
        sources: dataValidations,
        allValid: dataValidations.every(v => v.valid),
        recommendedSources: Object.keys(this.dataSourceValidation)
      },
      complianceStatus: {
        contentCompliant: contentIssues.length === 0,
        dataSourcesValid: dataValidations.every(v => v.valid),
        overallScore: this.calculateComplianceScore(contentIssues, dataValidations)
      },
      recommendations: this.generateRecommendations(contentIssues, dataValidations)
    };
  }

  calculateComplianceScore(contentIssues, dataValidations) {
    const contentScore = Math.max(0, 100 - (contentIssues.length * 10));
    const dataScore = (dataValidations.filter(v => v.valid).length / dataValidations.length) * 100;
    return Math.round((contentScore + dataScore) / 2);
  }

  generateRecommendations(contentIssues, dataValidations) {
    const recommendations = [];

    // High priority: Remove prohibited claims
    const prohibitedIssues = contentIssues.filter(i => i.type === 'prohibited_claim');
    if (prohibitedIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'content_accuracy',
        action: 'Remove prohibited claims immediately',
        details: prohibitedIssues.map(i => i.claim)
      });
    }

    // Medium priority: Add methodology links
    const methodologyIssues = contentIssues.filter(i => i.type === 'missing_methodology');
    if (methodologyIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'documentation',
        action: 'Add methodology documentation links',
        details: 'Create /docs/methodology page explaining measurement methods'
      });
    }

    // Data source improvements
    const invalidSources = dataValidations.filter(v => !v.valid);
    if (invalidSources.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_integrity',
        action: 'Fix invalid data sources',
        details: invalidSources.map(s => s.error)
      });
    }

    return recommendations;
  }

  // Real-time content monitoring
  startContentMonitoring(contentSelector) {
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const element = mutation.target.closest(contentSelector);
          if (element) {
            this.validateElementContent(element);
          }
        }
      });
    });

    document.querySelectorAll(contentSelector).forEach(element => {
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });

    return observer;
  }

  validateElementContent(element) {
    const content = element.textContent || element.innerHTML;
    const issues = this.validateContent(content);
    
    if (issues.length > 0) {
      console.warn('Content validation issues found:', issues);
      
      // Add visual indicator for content issues
      element.setAttribute('data-content-issues', issues.length);
      element.style.setProperty('--content-validation-issues', issues.length);
      
      // Add tooltip with issues
      element.title = `Content validation issues: ${issues.map(i => i.message).join('; ')}`;
    } else {
      element.removeAttribute('data-content-issues');
      element.style.removeProperty('--content-validation-issues');
      element.title = '';
    }
  }
}

// Create global fact checker instance (browser only)
if (typeof window !== 'undefined') {
  window.factChecker = new FactChecker();
}

// Export for ES modules
export default FactChecker;