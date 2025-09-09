// Legal Compliance and Copyright Protection Module
// Protects against NIL, copyright, and trademark issues

const LegalCompliance = {
  // Data attribution requirements
  dataAttribution: {
    mlb: "MLB data provided by MLB Advanced Media. All rights reserved.",
    nfl: "NFL data provided under license. All rights reserved.",
    nba: "NBA data provided under license. All rights reserved.",
    ncaa: "NCAA data for educational and analytical purposes only."
  },

  // NIL compliance for athlete data
  nilCompliance: {
    disclaimers: {
      general: "All athlete performance metrics are derived from publicly available statistics.",
      nil: "NIL valuations are estimates based on public data and do not represent actual compensation.",
      images: "No athlete likenesses or images are used without proper licensing.",
      names: "Athlete names are used for statistical analysis only under fair use provisions."
    },
    
    // Anonymization for demo/showcase modes
    anonymizeAthleteData(data) {
      return {
        ...data,
        name: `Player ${data.id || Math.random().toString(36).substr(2, 5)}`,
        team: `Team ${data.teamId || 'A'}`,
        image: null
      };
    }
  },

  // Team and league trademark protection
  trademarkProtection: {
    useGenericNames: true,
    teamMapping: {
      'Cardinals': 'Red Team A',
      'Longhorns': 'Orange Team B',
      'Cowboys': 'Blue Team C'
    },
    
    sanitizeTeamName(name) {
      if (this.useGenericNames) {
        return this.teamMapping[name] || `Team ${name.charAt(0)}`;
      }
      return name;
    }
  },

  // API usage compliance
  apiCompliance: {
    rateLimit: {
      mlb: { requests: 500, window: '1h' },
      nfl: { requests: 1000, window: '1d' },
      nba: { requests: 1000, window: '1d' }
    },
    
    checkRateLimit(api, count) {
      const limit = this.rateLimit[api];
      return count < limit.requests;
    }
  },

  // Privacy and consent management
  privacyConsent: {
    biometricDataConsent: false,
    performanceTrackingConsent: false,
    
    requireConsent(dataType) {
      const consentModal = `
        <div class="consent-modal">
          <h3>Data Usage Consent Required</h3>
          <p>This feature requires consent to process ${dataType} data.</p>
          <button onclick="LegalCompliance.grantConsent('${dataType}')">I Consent</button>
          <button onclick="LegalCompliance.denyConsent()">Decline</button>
        </div>
      `;
      return consentModal;
    },
    
    grantConsent(dataType) {
      localStorage.setItem(`consent_${dataType}`, 'granted');
      this[`${dataType}Consent`] = true;
    }
  },

  // Fair use guidelines
  fairUse: {
    educational: true,
    transformative: true,
    commercial: false,
    
    addDisclaimer(element) {
      const disclaimer = document.createElement('div');
      disclaimer.className = 'legal-disclaimer';
      disclaimer.innerHTML = `
        <small>
          Data used for analytical and educational purposes only.
          ${this.dataAttribution.mlb}
        </small>
      `;
      element.appendChild(disclaimer);
    }
  }
};

// Export for use across platform
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LegalCompliance;
} else {
  window.LegalCompliance = LegalCompliance;
}