#!/bin/bash

# Blaze Intelligence Deployment Script
# This script builds and prepares the application for deployment

echo "🔥 Deploying Blaze Intelligence..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the application
echo "🏗️ Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📊 Build Statistics:"
    du -sh build/
    echo ""
    echo "🚀 Ready for deployment!"
    echo ""
    echo "Deployment options:"
    echo "1. Vercel: vercel --prod"
    echo "2. Netlify: netlify deploy --prod --dir=build"
    echo "3. Serve locally: npx serve -s build"
    echo ""
    echo "🌟 Features included:"
    echo "- Real-time sports data integration"
    echo "- AI-powered chat assistant"
    echo "- User authentication with Auth0"
    echo "- Stripe payment processing"
    echo "- Social sharing functionality"
    echo "- Responsive design"
    echo "- Progressive Web App capabilities"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi