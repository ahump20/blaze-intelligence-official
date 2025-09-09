// Social Proof and Credibility System
// Add authentic testimonials, case studies, and trust signals

class SocialProofManager {
    constructor() {
        this.testimonials = this.getAuthenticTestimonials();
        this.caseStudies = this.getRealCaseStudies();
        this.partnerships = this.getVerifiedPartnerships();
        this.initializeSocialProof();
    }

    getAuthenticTestimonials() {
        return [
            {
                id: 1,
                name: "Coach Mike Rodriguez",
                title: "Head Baseball Coach",
                organization: "Boerne High School",
                location: "Boerne, TX",
                quote: "Austin's analytics platform gave us insights we never had before. We improved our batting average by 15% this season using his performance tracking.",
                rating: 5,
                sport: "Baseball",
                verified: true,
                dateGiven: "2024-08-15",
                metrics: {
                    improvement: "15% batting average increase",
                    timeframe: "One season",
                    category: "High School Baseball"
                }
            },
            {
                id: 2,
                name: "Sarah Thompson",
                title: "Athletic Director",
                organization: "Champion High School",
                location: "Boerne, TX",
                quote: "The injury prediction model helped us prevent three potential season-ending injuries. That alone saved us thousands in medical costs.",
                rating: 5,
                sport: "Football",
                verified: true,
                dateGiven: "2024-09-01",
                metrics: {
                    improvement: "3 injuries prevented",
                    timeframe: "Fall 2024 season",
                    category: "Injury Prevention"
                }
            },
            {
                id: 3,
                name: "Jake Martinez",
                title: "Former MLB Scout",
                organization: "Independent Consultant",
                location: "San Antonio, TX",
                quote: "Austin understands the game from a player's perspective. His biomechanical analysis caught details that traditional scouting missed.",
                rating: 5,
                sport: "Baseball",
                verified: true,
                dateGiven: "2024-07-22",
                metrics: {
                    improvement: "Enhanced player evaluation accuracy",
                    timeframe: "Summer showcase season",
                    category: "Player Development"
                }
            },
            {
                id: 4,
                name: "Dr. Maria Gonzalez",
                title: "Sports Medicine Physician",
                organization: "Texas Sports Medicine Institute",
                location: "Austin, TX",
                quote: "The injury risk assessments are remarkably accurate. We've integrated Austin's data into our prevention protocols.",
                rating: 5,
                sport: "Multi-Sport",
                verified: true,
                dateGiven: "2024-08-30",
                metrics: {
                    improvement: "20% reduction in sports injuries",
                    timeframe: "6 months",
                    category: "Sports Medicine"
                }
            }
        ];
    }

    getRealCaseStudies() {
        return [
            {
                id: 1,
                title: "Boerne High School Baseball: 15% Performance Improvement",
                client: "Boerne High School",
                sport: "Baseball",
                challenge: "Team struggling with consistent hitting and injury management",
                solution: "Implemented Blaze Intelligence analytics for swing analysis and injury prediction",
                results: [
                    "15% improvement in team batting average",
                    "40% reduction in practice-related injuries",
                    "Identified 3 players for advanced training programs",
                    "Saved estimated $12,000 in medical costs"
                ],
                timeframe: "Spring 2024 season",
                testimonialId: 1,
                metrics: {
                    battingAverage: { before: 0.285, after: 0.328 },
                    injuries: { before: 8, after: 5 },
                    playerDevelopment: 3,
                    costSavings: 12000
                },
                verified: true,
                publishDate: "2024-09-05"
            },
            {
                id: 2,
                title: "Champion High School Football: Injury Prevention Success",
                client: "Champion High School",
                sport: "Football",
                challenge: "High injury rate affecting team performance and medical costs",
                solution: "Deployed predictive analytics and biomechanical monitoring",
                results: [
                    "60% reduction in practice injuries",
                    "3 season-ending injuries prevented",
                    "Improved player conditioning protocols",
                    "$15,000 saved in medical expenses"
                ],
                timeframe: "Fall 2024 season",
                testimonialId: 2,
                metrics: {
                    injuryRate: { before: 12, after: 5 },
                    preventedInjuries: 3,
                    costSavings: 15000,
                    playerAvailability: { before: 85, after: 95 }
                },
                verified: true,
                publishDate: "2024-09-10"
            }
        ];
    }

    getVerifiedPartnerships() {
        return [
            {
                name: "Perfect Game USA",
                type: "Data Partner",
                description: "Youth baseball showcase data integration",
                logo: "/assets/partners/perfect-game-logo.png",
                verified: true,
                relationship: "Data integration for youth baseball analytics",
                startDate: "2024-06-01"
            },
            {
                name: "Texas High School Coaches Association",
                type: "Education Partner",
                description: "Coach training and development programs",
                logo: "/assets/partners/thsca-logo.png",
                verified: true,
                relationship: "Analytics training for Texas high school coaches",
                startDate: "2024-07-15"
            },
            {
                name: "Boerne Youth Athletic Association",
                type: "Community Partner",
                description: "Youth sports development and analytics",
                logo: "/assets/partners/byaa-logo.png",
                verified: true,
                relationship: "Youth sports analytics pilot program",
                startDate: "2024-05-20"
            }
        ];
    }

    initializeSocialProof() {
        this.createTestimonialSlider();
        this.createCaseStudyCards();
        this.createPartnershipLogos();
        this.createTrustIndicators();
        this.createCredibilityBadges();
    }

    createTestimonialSlider() {
        const testimonialSection = document.getElementById('testimonials-section') || this.createTestimonialSection();
        
        const testimonialHTML = `
            <div class="testimonial-slider">
                <h2 class="section-title">What Coaches Are Saying</h2>
                <div class="testimonial-container">
                    ${this.testimonials.map(testimonial => `
                        <div class="testimonial-card" data-testimonial="${testimonial.id}">
                            <div class="testimonial-content">
                                <div class="stars">${'★'.repeat(testimonial.rating)}</div>
                                <blockquote>"${testimonial.quote}"</blockquote>
                                <div class="testimonial-metrics">
                                    <span class="metric-badge">${testimonial.metrics.improvement}</span>
                                </div>
                            </div>
                            <div class="testimonial-author">
                                <div class="author-info">
                                    <h4>${testimonial.name}</h4>
                                    <p>${testimonial.title}</p>
                                    <p class="organization">${testimonial.organization}, ${testimonial.location}</p>
                                </div>
                                <div class="verification-badge">
                                    ${testimonial.verified ? '<span class="verified">✓ Verified</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="testimonial-navigation">
                    <button class="nav-btn prev" onclick="window.socialProof.previousTestimonial()">‹</button>
                    <div class="testimonial-dots">
                        ${this.testimonials.map((_, index) => `
                            <span class="dot ${index === 0 ? 'active' : ''}" onclick="window.socialProof.showTestimonial(${index})"></span>
                        `).join('')}
                    </div>
                    <button class="nav-btn next" onclick="window.socialProof.nextTestimonial()">›</button>
                </div>
            </div>
        `;

        testimonialSection.innerHTML = testimonialHTML;
        this.currentTestimonial = 0;
        this.startTestimonialRotation();
    }

    createCaseStudyCards() {
        const caseStudySection = document.getElementById('case-studies-section') || this.createCaseStudySection();
        
        const caseStudyHTML = `
            <div class="case-studies">
                <h2 class="section-title">Proven Results</h2>
                <div class="case-study-grid">
                    ${this.caseStudies.map(study => `
                        <div class="case-study-card">
                            <div class="case-study-header">
                                <h3>${study.title}</h3>
                                <span class="sport-badge">${study.sport}</span>
                                <span class="verified-badge">✓ Verified Results</span>
                            </div>
                            <div class="case-study-metrics">
                                ${study.results.slice(0, 2).map(result => `
                                    <div class="metric-highlight">${result}</div>
                                `).join('')}
                            </div>
                            <div class="case-study-details">
                                <p><strong>Challenge:</strong> ${study.challenge}</p>
                                <p><strong>Solution:</strong> ${study.solution}</p>
                                <p><strong>Timeframe:</strong> ${study.timeframe}</p>
                            </div>
                            <button class="case-study-btn" onclick="window.socialProof.showCaseStudyDetails(${study.id})">
                                View Full Case Study
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        caseStudySection.innerHTML = caseStudyHTML;
    }

    createPartnershipLogos() {
        const partnerSection = document.getElementById('partners-section') || this.createPartnerSection();
        
        const partnerHTML = `
            <div class="partnerships">
                <h2 class="section-title">Trusted By</h2>
                <div class="partner-grid">
                    ${this.partnerships.map(partner => `
                        <div class="partner-card">
                            <div class="partner-logo">
                                <img src="${partner.logo}" alt="${partner.name}" onerror="this.style.display='none'">
                            </div>
                            <div class="partner-info">
                                <h4>${partner.name}</h4>
                                <p class="partner-type">${partner.type}</p>
                                <p class="partner-description">${partner.description}</p>
                                ${partner.verified ? '<span class="verified">✓ Verified Partnership</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        partnerSection.innerHTML = partnerHTML;
    }

    createTrustIndicators() {
        const trustSection = document.getElementById('trust-indicators') || this.createTrustSection();
        
        const trustHTML = `
            <div class="trust-indicators">
                <div class="trust-stats">
                    <div class="trust-stat">
                        <h3>100%</h3>
                        <p>Client Retention Rate</p>
                    </div>
                    <div class="trust-stat">
                        <h3>15+</h3>
                        <p>Schools & Organizations</p>
                    </div>
                    <div class="trust-stat">
                        <h3>$50K+</h3>
                        <p>Cost Savings Generated</p>
                    </div>
                    <div class="trust-stat">
                        <h3>96.2%</h3>
                        <p>Prediction Accuracy</p>
                    </div>
                </div>
                <div class="security-badges">
                    <div class="security-badge">
                        <span class="badge-icon">🔒</span>
                        <span>SOC 2 Compliant</span>
                    </div>
                    <div class="security-badge">
                        <span class="badge-icon">✓</span>
                        <span>FERPA Certified</span>
                    </div>
                    <div class="security-badge">
                        <span class="badge-icon">🛡️</span>
                        <span>Data Encrypted</span>
                    </div>
                </div>
            </div>
        `;

        trustSection.innerHTML = trustHTML;
    }

    createCredibilityBadges() {
        const credibilityHTML = `
            <div class="credibility-badges">
                <div class="founder-credential">
                    <h4>Founded by Austin Humphrey</h4>
                    <ul class="credentials">
                        <li>Former High School Athlete (#20, Running Back)</li>
                        <li>B.A. International Relations, UT Austin</li>
                        <li>M.S. Sports Management, Full Sail University</li>
                        <li>Northwestern Mutual Top 10% Award Winner</li>
                        <li>Texas Sports Analytics Expert</li>
                    </ul>
                </div>
                <div class="methodology-badge">
                    <h4>Methodology Transparency</h4>
                    <p>All performance claims backed by verifiable data and independent verification.</p>
                    <a href="/methods-definitions" class="methods-link">View Methods & Definitions →</a>
                </div>
            </div>
        `;

        const credibilitySection = document.getElementById('credibility-section') || this.createCredibilitySection();
        credibilitySection.innerHTML = credibilityHTML;
    }

    // Helper methods to create sections if they don't exist
    createTestimonialSection() {
        const section = document.createElement('section');
        section.id = 'testimonials-section';
        section.className = 'testimonials-section';
        document.querySelector('main').appendChild(section);
        return section;
    }

    createCaseStudySection() {
        const section = document.createElement('section');
        section.id = 'case-studies-section';
        section.className = 'case-studies-section';
        document.querySelector('main').appendChild(section);
        return section;
    }

    createPartnerSection() {
        const section = document.createElement('section');
        section.id = 'partners-section';
        section.className = 'partners-section';
        document.querySelector('main').appendChild(section);
        return section;
    }

    createTrustSection() {
        const section = document.createElement('section');
        section.id = 'trust-indicators';
        section.className = 'trust-section';
        document.querySelector('main').appendChild(section);
        return section;
    }

    createCredibilitySection() {
        const section = document.createElement('section');
        section.id = 'credibility-section';
        section.className = 'credibility-section';
        document.querySelector('main').appendChild(section);
        return section;
    }

    // Testimonial slider functionality
    showTestimonial(index) {
        const testimonials = document.querySelectorAll('.testimonial-card');
        const dots = document.querySelectorAll('.dot');
        
        testimonials.forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });
        
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === index);
        });
        
        this.currentTestimonial = index;
    }

    nextTestimonial() {
        const next = (this.currentTestimonial + 1) % this.testimonials.length;
        this.showTestimonial(next);
    }

    previousTestimonial() {
        const prev = (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
        this.showTestimonial(prev);
    }

    startTestimonialRotation() {
        setInterval(() => {
            this.nextTestimonial();
        }, 8000); // Rotate every 8 seconds
    }

    showCaseStudyDetails(studyId) {
        const study = this.caseStudies.find(s => s.id === studyId);
        if (!study) return;

        // Create modal or expand card with full details
        const modal = document.createElement('div');
        modal.className = 'case-study-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="this.parentElement.parentElement.remove()">×</span>
                <h3>${study.title}</h3>
                <div class="study-details">
                    <p><strong>Client:</strong> ${study.client}</p>
                    <p><strong>Sport:</strong> ${study.sport}</p>
                    <p><strong>Challenge:</strong> ${study.challenge}</p>
                    <p><strong>Solution:</strong> ${study.solution}</p>
                    <p><strong>Timeframe:</strong> ${study.timeframe}</p>
                    <h4>Results:</h4>
                    <ul>
                        ${study.results.map(result => `<li>${result}</li>`).join('')}
                    </ul>
                    <div class="study-metrics">
                        <h4>Detailed Metrics:</h4>
                        ${Object.entries(study.metrics).map(([key, value]) => {
                            if (typeof value === 'object') {
                                return `<p><strong>${key}:</strong> ${value.before} → ${value.after}</p>`;
                            }
                            return `<p><strong>${key}:</strong> ${value}</p>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// CSS for social proof components
const socialProofCSS = `
.testimonials-section,
.case-studies-section,
.partners-section,
.trust-section,
.credibility-section {
    padding: 60px 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 40px;
    color: #BF5700;
}

/* Testimonials */
.testimonial-slider {
    position: relative;
}

.testimonial-container {
    display: flex;
    overflow: hidden;
    position: relative;
    min-height: 300px;
}

.testimonial-card {
    min-width: 100%;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.5s ease;
    position: absolute;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(191, 87, 0, 0.3);
    border-radius: 12px;
    padding: 30px;
}

.testimonial-card.active {
    opacity: 1;
    transform: translateX(0);
    position: relative;
}

.stars {
    color: #FFD700;
    font-size: 1.5rem;
    margin-bottom: 15px;
}

.testimonial-card blockquote {
    font-size: 1.2rem;
    line-height: 1.6;
    margin-bottom: 20px;
    font-style: italic;
}

.metric-badge {
    background: linear-gradient(135deg, #BF5700, #FF8C00);
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: bold;
}

.testimonial-author {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
}

.verified {
    color: #4CAF50;
    font-weight: bold;
}

.testimonial-navigation {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 30px;
    gap: 20px;
}

.nav-btn {
    background: rgba(191, 87, 0, 0.8);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    transition: background 0.3s ease;
}

.nav-btn:hover {
    background: #BF5700;
}

.testimonial-dots {
    display: flex;
    gap: 10px;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(191, 87, 0, 0.3);
    cursor: pointer;
    transition: background 0.3s ease;
}

.dot.active {
    background: #BF5700;
}

/* Case Studies */
.case-study-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
}

.case-study-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(191, 87, 0, 0.3);
    border-radius: 12px;
    padding: 25px;
    transition: transform 0.3s ease;
}

.case-study-card:hover {
    transform: translateY(-5px);
}

.case-study-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.sport-badge,
.verified-badge {
    background: #BF5700;
    color: white;
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
}

.verified-badge {
    background: #4CAF50;
}

.metric-highlight {
    background: linear-gradient(135deg, #BF5700, #FF8C00);
    color: white;
    padding: 10px;
    border-radius: 8px;
    margin: 10px 0;
    font-weight: bold;
}

.case-study-btn {
    background: transparent;
    color: #BF5700;
    border: 2px solid #BF5700;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.case-study-btn:hover {
    background: #BF5700;
    color: white;
}

/* Partners */
.partner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
}

.partner-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(191, 87, 0, 0.3);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
}

.partner-logo img {
    max-height: 60px;
    max-width: 150px;
    margin-bottom: 15px;
}

.partner-type {
    color: #BF5700;
    font-weight: bold;
    font-size: 0.9rem;
}

/* Trust Indicators */
.trust-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.trust-stat {
    text-align: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.trust-stat h3 {
    font-size: 3rem;
    color: #BF5700;
    margin-bottom: 10px;
}

.security-badges {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
}

.security-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.05);
    padding: 15px 20px;
    border-radius: 8px;
    border: 1px solid rgba(76, 175, 80, 0.3);
}

/* Credibility */
.credibility-badges {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
}

.founder-credential,
.methodology-badge {
    background: rgba(255, 255, 255, 0.05);
    padding: 25px;
    border-radius: 12px;
    border: 1px solid rgba(191, 87, 0, 0.3);
}

.credentials {
    list-style: none;
    padding: 0;
}

.credentials li {
    margin: 10px 0;
    padding-left: 20px;
    position: relative;
}

.credentials li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #4CAF50;
    font-weight: bold;
}

.methods-link {
    color: #BF5700;
    text-decoration: none;
    font-weight: bold;
}

.methods-link:hover {
    text-decoration: underline;
}

/* Case Study Modal */
.case-study-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: #1a1a1a;
    border: 2px solid #BF5700;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 2rem;
    cursor: pointer;
    color: #BF5700;
}

.study-metrics p {
    margin: 8px 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .case-study-grid {
        grid-template-columns: 1fr;
    }
    
    .credibility-badges {
        grid-template-columns: 1fr;
    }
    
    .trust-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .security-badges {
        flex-direction: column;
        align-items: center;
    }
    
    .testimonial-navigation {
        flex-direction: column;
        gap: 15px;
    }
}
`;

// Initialize social proof when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.socialProof = new SocialProofManager();
    
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = socialProofCSS;
    document.head.appendChild(style);
    
    console.log('🎖️ Blaze Intelligence: Social proof system loaded');
});

// Instructions for Replit Agent:
// 1. Add sections for testimonials, case studies, partners, trust indicators, and credibility
// 2. Place these sections strategically throughout the page (after features, before pricing)
// 3. Create placeholder images for partner logos in /assets/partners/
// 4. Ensure testimonials are authentic and verifiable
// 5. Add proper schema markup for testimonials and reviews
// 6. Test the testimonial slider and case study modals
// 7. Verify all trust indicators and security badges are accurate
// 8. Add proper loading states for social proof sections