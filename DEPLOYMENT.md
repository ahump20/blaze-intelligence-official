# 🚀 Blaze Intelligence - Production Deployment Guide

Complete guide for deploying the enhanced Blaze Intelligence platform to production with all features enabled.

## 🏗️ Pre-Deployment Checklist

### ✅ Required Accounts & API Keys
- [ ] **Auth0 Account** - User authentication
- [ ] **Stripe Account** - Payment processing  
- [ ] **OpenAI API Key** - AI chat assistant
- [ ] **Google Gemini API Key** - AI fallback provider
- [ ] **SportsRadar API Key** - Live sports data
- [ ] **Google Analytics 4** - Website analytics
- [ ] **Hotjar Account** - User behavior analytics  
- [ ] **Mixpanel Account** - Event tracking
- [ ] **Vercel Account** - Hosting platform

### ✅ Environment Setup
- [ ] Production API keys configured
- [ ] Domain configured (optional)
- [ ] SSL certificate (automatic with Vercel)
- [ ] CDN enabled (automatic with Vercel)

## 🔧 Environment Variables Configuration

### Production Environment Variables
Create a `.env.production.local` file with the following variables:

```bash
# Authentication
REACT_APP_AUTH0_DOMAIN=your-production-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_production_auth0_client_id

# Payments
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_publishable_key

# AI Services
REACT_APP_OPENAI_API_KEY=sk-your-openai-production-api-key
REACT_APP_GEMINI_API_KEY=your-gemini-production-api-key

# Sports Data
REACT_APP_SPORTSRADAR_API_KEY=your-sportsradar-production-api-key

# Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=G-your-ga4-measurement-id
REACT_APP_HOTJAR_ID=your-hotjar-site-id
REACT_APP_MIXPANEL_TOKEN=your-mixpanel-token

# Real-time (Optional)
REACT_APP_WEBSOCKET_URL=wss://api.blazeintelligence.com

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_SOCIAL_LOGIN=true
REACT_APP_ENABLE_PAYMENTS=true
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_ENABLE_REAL_TIME=true
```

## 🚀 Deployment Methods

### Method 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add all environment variables from the template above
   - Redeploy after adding variables

### Method 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=build
   ```

4. **Configure Environment Variables**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add all production variables

### Method 3: Using Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Follow the prompts for your hosting platform
```

## 🔐 Security Configuration

### Auth0 Setup
1. **Application Settings**
   - Application Type: Single Page Application
   - Allowed Callback URLs: `https://your-domain.com/`
   - Allowed Logout URLs: `https://your-domain.com/`
   - Allowed Web Origins: `https://your-domain.com`

2. **Social Connections** (Optional)
   - Enable Google, Facebook, Twitter, etc.
   - Configure OAuth credentials

### Stripe Configuration
1. **Webhook Endpoints**
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`

2. **Product Catalog**
   - Create products for each subscription tier
   - Configure pricing and billing intervals

## 📊 Analytics Setup

### Google Analytics 4
1. **Create GA4 Property**
   - Go to Google Analytics
   - Create new property
   - Copy Measurement ID (G-XXXXXXXXXX)

2. **Enhanced Ecommerce**
   - Enable enhanced ecommerce tracking
   - Configure conversion events

### Hotjar Configuration
1. **Create Hotjar Site**
   - Add your domain
   - Copy Site ID
   - Configure heatmaps and recordings

### Mixpanel Setup
1. **Create Mixpanel Project**
   - Copy project token
   - Configure event tracking
   - Set up conversion funnels

## 🎯 Domain Configuration (Optional)

### Custom Domain Setup
1. **Add Domain to Hosting Platform**
   - Vercel: Project Settings → Domains
   - Netlify: Site Settings → Domain management

2. **Update DNS Records**
   - Add CNAME record pointing to hosting platform
   - Configure SSL (automatic with most platforms)

3. **Update Environment Variables**
   - Update Auth0 URLs
   - Update API base URLs
   - Update analytics domain settings

## 🧪 Production Testing

### Pre-Launch Checklist
- [ ] **Authentication Flow**
  - Sign up with email
  - Social login (if enabled)
  - Password reset
  - Profile management

- [ ] **Payment Processing**
  - Subscription signup
  - Plan upgrades/downgrades
  - Payment failures
  - Webhook handling

- [ ] **AI Features**
  - Chat assistant responses
  - Feature gating by plan
  - Error handling
  - Response times

- [ ] **Real-time Features**
  - Live game updates
  - Notifications
  - WebSocket connections
  - Data accuracy

- [ ] **Analytics Tracking**
  - Page views
  - User events
  - Conversion tracking
  - Error tracking

### Performance Testing
```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --output=html

# Load testing
npx artillery quick --count 10 --num 5 https://your-domain.com
```

## 📈 Post-Deployment Monitoring

### Key Metrics to Monitor
- **Performance**
  - Page load times
  - API response times
  - Error rates
  - Uptime

- **User Engagement**
  - Active users
  - Session duration
  - Feature usage
  - Conversion rates

- **Business Metrics**
  - Subscription signups
  - Revenue
  - Churn rate
  - Customer lifetime value

### Monitoring Tools
- **Vercel Analytics** - Built-in performance monitoring
- **Google Analytics** - User behavior and conversions
- **Hotjar** - User session recordings and heatmaps
- **Mixpanel** - Event tracking and funnel analysis
- **Stripe Dashboard** - Payment and subscription metrics

## 🔄 Continuous Deployment

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npm run clean
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify API keys are valid

3. **Analytics Not Working**
   - Check browser console for errors
   - Verify tracking IDs are correct
   - Ensure analytics scripts are loading

4. **Payment Issues**
   - Verify Stripe keys (test vs live)
   - Check webhook configurations
   - Test with Stripe test cards

### Support Resources
- **Documentation**: [Your project docs URL]
- **Support Email**: support@blazeintelligence.com
- **GitHub Issues**: [Your GitHub repo]/issues
- **Discord**: [Your Discord server]

## 🎉 Launch Checklist

- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Analytics tracking verified
- [ ] Payment processing tested
- [ ] Performance optimized
- [ ] Error monitoring active
- [ ] Backup/recovery plan in place
- [ ] Support documentation updated
- [ ] Team trained on production environment

## 📞 Emergency Contacts

- **Platform Issues**: Vercel/Netlify support
- **Payment Issues**: Stripe support
- **Analytics Issues**: Google Analytics support
- **Authentication Issues**: Auth0 support

---

**🔥 Your Blaze Intelligence platform is now ready for production!**

Monitor performance, gather user feedback, and iterate based on data. The analytics setup will provide valuable insights for continuous improvement and growth.

🤖 *Generated with [Claude Code](https://claude.ai/code)*