# Blaze Intelligence Website - Replit Project

## Overview
Elite sports analytics platform website for championship teams. This is a static website with modern HTML/CSS/JavaScript built to showcase Blaze Intelligence's sports analytics platform and services.

## Project Structure
- **Frontend**: Static HTML/CSS/JavaScript with Express.js development server
- **Build System**: Node.js with ES modules, markdown processing for content pages
- **Deployment**: Configured for Replit autoscale deployment
- **Content**: Markdown-based content system for manifesto, playbooks, and documentation

## Current Setup (Last updated: 2025-01-09)
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