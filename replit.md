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

## Key Features
- Real-time game analysis and predictive intelligence
- Injury prevention AI and video intelligence
- Mobile command center and global recruiting leaderboard
- Contact forms and athlete dashboard
- Integration hub for sports data connections

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