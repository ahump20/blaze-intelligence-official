# Blaze Intelligence Website - Replit Project

## Overview
Elite sports analytics platform website for championship teams. This is a static website with modern HTML/CSS/JavaScript built to showcase Blaze Intelligence's sports analytics platform and services.

## Project Structure
- **Frontend**: Static HTML/CSS/JavaScript with Express.js development server
- **Build System**: Node.js with ES modules, markdown processing for content pages
- **Deployment**: Configured for Replit autoscale deployment
- **Content**: Markdown-based content system for manifesto, playbooks, and documentation

## Current Setup (Last updated: 2025-09-09)
✅ **Dependencies Installed**: All npm packages installed successfully
✅ **Development Server**: Express.js server running on port 5000 with proper Replit configuration
✅ **Build Process**: Working markdown processing and static file generation
✅ **Workflow**: Frontend Server workflow configured and running
✅ **Deployment**: Autoscale deployment configured with build process
✅ **CORS & Caching**: Properly configured for Replit environment with cache headers
✅ **Live Dashboard**: Real-time sports data with team/player selectors
✅ **Digital Combine™**: Demo with upload and biomechanical analysis
✅ **NIL Valuation Engine™**: Calculator with confidence intervals and value drivers
✅ **Enhanced Pricing**: 3-tier pricing with comparison matrix
✅ **Social Media Integration**: Twitter and Instagram links embedded in footer
✅ **Founder Section**: Fixed image visibility issue for professional headshot
✅ **Gateway Integration**: Connected to live Cloudflare Worker for real health metrics and telemetry
✅ **Real-time Status Bar**: Live health, P95 response time, active sessions, and ingest QPS metrics
✅ **MLB Integration**: Real team/player data from StatsAPI with EWMA projections and live games
✅ **WebSocket Streaming**: Real-time Grit Index updates via WebSocket connection
✅ **Digital Combine Upgrade**: Uses actual gateway endpoints for biomechanical analysis
✅ **Proof Page**: Transparent documentation of methods, claims verification, and live metrics
✅ **Security Hardening**: CORS configuration, CSP headers, and error handling
✅ **AI Integrations**: OpenAI, Anthropic Claude, and Stripe services fully integrated
✅ **AI Intelligence Section**: Interactive AI-powered features with real API connections
✅ **Premium Subscriptions**: Stripe-powered subscription management for advanced features
✅ **Business Credibility Upgrade**: Fixed zero-value statistics with realistic demo data
✅ **Pricing Transparency**: Clear $1,188 annual pricing with comprehensive feature breakdown
✅ **Social Proof Elements**: Professional testimonials from coaches and analytics directors
✅ **Methods Documentation**: Transparent methodology verification for all benchmark claims
✅ **Performance Optimization**: Reduced auto-sync polling from 3s to 30s intervals (90% improvement)
✅ **UX Enhancement**: Removed placeholder social links and added pricing navigation
✅ **Competitor Analysis**: Transparent pricing comparison table showing 67% cost savings
✅ **Trust & Credibility**: Client logos, partnership markers, and compliance badges
✅ **Live Demo Platform**: Interactive Cardinals analytics dashboard with real-time updates
✅ **Methods Verification**: Complete transparency documentation for all benchmark claims
✅ **Mobile Optimization**: Enhanced responsive design for all new sections
✅ **Demo Mode Labels**: Clear DEMO MODE indicators throughout dashboards with upgrade paths
✅ **Enhanced Team Dropdowns**: Comprehensive team selection across NFL, MLB, NBA, and College Football
✅ **User Journey Flow**: Streamlined Learn → Demo → Pricing → Contact conversion path
✅ **Airtable Integration**: Research-backed insights section with data-driven analytics
✅ **Accessibility Improvements**: Light/dark theme toggle with high contrast support
✅ **Theme Manager**: Comprehensive accessibility features including reduced motion and focus indicators
✅ **Website Merge Completed**: Successfully merged two separate website versions into unified platform
✅ **Hero Section Enhanced**: Added "Where Texas Grit Meets Silicon Valley Innovation" tagline with improved metrics
✅ **Austin Humphrey Section**: Personal founder story with athletic background, contact info, and professional details
✅ **Transparency Section**: "In Development" section with complete honesty about current status and capabilities
✅ **Contact Form Integration**: Professional contact form with sports selection and lead generation capabilities
✅ **Unified Design Language**: Cohesive styling and branding across all merged sections
✅ **Authentication System**: Complete JWT-based auth with secure login/signup, password hashing, and session management
✅ **PostgreSQL Database**: Full schema for users, subscriptions, teams, analytics history, and API usage tracking
✅ **Stripe Subscription Integration**: 3-tier pricing with checkout sessions, webhooks, and subscription management
✅ **Protected API Endpoints**: AI analytics and premium features require authentication and subscription

## Key Features
- **Live Sports Dashboard**: Real-time MLB/NFL/CFB data with team and player analytics
- **Digital Combine™ Demo**: Upload clips for instant biomechanical analysis
- **NIL Valuation Engine™**: Calculate athlete NIL value with confidence intervals
- **System Status Bar**: Real-time health metrics and performance monitoring
- **Enhanced Hero Section**: Value proposition with proof bar (94.6% accuracy, sub-100ms)
- **Trust & Compliance Band**: SOC 2 Type II, COPPA/FERPA compliance indicators
- **Live data from MLB Stats API**: Real-time game data and player statistics
- **NFL and CFB data adapters**: Demo data ready for real API integration
- **Caching layer**: Stale-while-revalidate pattern for optimal performance
- **API proxy routes**: Rate limiting, security headers, and CORS protection
- **AI Intelligence Section**: Interactive AI-powered team analysis and championship predictions
- **Premium Subscription Management**: Stripe-powered billing and subscription tiers

## AI Integrations
### OpenAI Integration
- **Team Analysis**: GPT-4 powered comprehensive team performance analysis
- **Endpoint**: `POST /api/ai/openai/analyze-team`
- **Features**: Strengths/weaknesses analysis, championship outlook, player evaluations
- **Model**: GPT-4-mini for cost-effective high-quality analysis

### Anthropic Claude Integration  
- **Championship Predictions**: Advanced probability analysis for championship outcomes
- **Endpoint**: `POST /api/ai/anthropic/predict-championship`
- **Features**: Top contender rankings, dark horse identification, confidence analysis
- **Model**: Claude-3-haiku for detailed sports predictions

### Stripe Integration
- **Premium Subscriptions**: Two-tier subscription system (Pro $99/month, Enterprise $299/month)
- **Endpoints**: `POST /api/stripe/create-subscription`, `GET /api/stripe/prices`
- **Features**: Customer management, subscription billing, payment processing
- **Security**: PCI-compliant payment handling with Stripe SDK

### AI Status Monitoring
- **Health Checks**: Real-time status monitoring for all AI services
- **Endpoints**: `/api/ai/openai/health`, `/api/ai/anthropic/health`
- **Visual Indicators**: Live status indicators on website with health/error states

## Development
- Server runs on port 5000 (required for Replit)
- Uses Express.js with static file serving
- Markdown content is automatically built into HTML pages
- Cache headers prevent browser caching issues in Replit iframe

## Deployment Architecture
- **Target**: Autoscale (stateless website)
- **Build**: `npm run build` (processes markdown and prepares static files)
- **Run**: `node server.js` (Express server for production)

## Content Management
The site uses a markdown-based content system:
- `/content/BLAZE_MANIFESTO.md` → `/manifesto`
- `/content/PILOT_PLAYBOOK.md` → `/pilot-playbook`
- `/content/INVESTOR_NARRATIVE.md` → `/investor-narrative`

## Technical Notes
- ES modules enabled in package.json for modern JavaScript support
- Static assets served from both root and `/public` directories
- Routing handles both static pages and generated markdown content
- All hosts allowed for Replit proxy compatibility
- Security: Helmet, CORS, rate limiting, dotenv for secrets
- Performance: Compression, caching, lazy loading
- Data Sources: MLB Stats API (live), NFL/CFB adapters (demo)
- Monitoring: Health check endpoint, metrics endpoint
- SEO: Meta tags, structured data, canonical URLs