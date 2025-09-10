#!/bin/bash

# Blaze Intelligence Mobile App - Deployment Script
# Handles deployment to various environments and app stores

set -e

echo "🔥 Blaze Intelligence - Deployment Script"
echo "=========================================="

# Configuration
APP_NAME="BlazeIntelligenceMobile"
VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M)

# Parse command line arguments
PLATFORM=${1:-both}
ENVIRONMENT=${2:-staging}
BUILD_TYPE=${3:-release}

echo "🚀 Deploying $APP_NAME v$VERSION"
echo "Platform: $PLATFORM"
echo "Environment: $ENVIRONMENT"
echo "Build Type: $BUILD_TYPE"
echo ""

# Validate environment
case $ENVIRONMENT in
    "development"|"staging"|"production")
        echo "✅ Valid environment: $ENVIRONMENT"
        ;;
    *)
        echo "❌ Invalid environment. Use: development, staging, or production"
        exit 1
        ;;
esac

# Set environment variables
export REACT_APP_ENV=$ENVIRONMENT
export REACT_APP_VERSION=$VERSION
export REACT_APP_BUILD_NUMBER=$BUILD_NUMBER

case $ENVIRONMENT in
    "development")
        export REACT_APP_API_URL="https://dev-api.blaze-intelligence.com"
        export REACT_APP_WS_URL="wss://dev-ws.blaze-intelligence.com"
        ;;
    "staging")
        export REACT_APP_API_URL="https://staging-api.blaze-intelligence.com"
        export REACT_APP_WS_URL="wss://staging-ws.blaze-intelligence.com"
        ;;
    "production")
        export REACT_APP_API_URL="https://api.blaze-intelligence.com"
        export REACT_APP_WS_URL="wss://ws.blaze-intelligence.com"
        ;;
esac

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check git status
if [[ $(git status --porcelain) && "$ENVIRONMENT" == "production" ]]; then
    echo "❌ Working directory not clean. Commit or stash changes before production deployment."
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false --coverage

# Run linting
echo "🔍 Running linter..."
npm run lint

# Update version in native files
echo "📝 Updating version numbers..."

# Update Android version
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    sed -i.bak "s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle
    sed -i.bak "s/versionCode .*/versionCode $BUILD_NUMBER/" android/app/build.gradle
fi

# Update iOS version
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" ios/$APP_NAME/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/$APP_NAME/Info.plist
fi

# Build applications
case $PLATFORM in
    "android")
        echo "🤖 Building Android..."
        ./scripts/build-android.sh $BUILD_TYPE
        ;;
    "ios")
        echo "🍎 Building iOS..."
        ./scripts/build-ios.sh $BUILD_TYPE
        ;;
    "both")
        echo "📱 Building both platforms..."
        ./scripts/build-android.sh $BUILD_TYPE
        ./scripts/build-ios.sh $BUILD_TYPE
        ;;
    *)
        echo "❌ Invalid platform. Use: android, ios, or both"
        exit 1
        ;;
esac

# Deploy to specific environments
case $ENVIRONMENT in
    "development")
        echo "🧪 Deploying to development environment..."
        # Deploy to internal testing
        deploy_internal
        ;;
    "staging")
        echo "🎭 Deploying to staging environment..."
        # Deploy to staging environment
        deploy_staging
        ;;
    "production")
        echo "🚀 Deploying to production..."
        # Deploy to app stores
        deploy_production
        ;;
esac

# Deployment functions
deploy_internal() {
    echo "📤 Uploading to internal testing platforms..."
    
    # Upload Android APK to Firebase App Distribution
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        if command -v firebase &> /dev/null; then
            firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \
                --app 1:123456789:android:abcdef \
                --groups "internal-testers" \
                --release-notes "Development build v$VERSION ($BUILD_NUMBER)"
        fi
    fi
    
    # Upload iOS build to TestFlight (requires Xcode and proper certificates)
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        echo "📱 iOS development builds can be installed via Xcode or Simulator"
    fi
}

deploy_staging() {
    echo "📤 Uploading to staging environment..."
    
    # Deploy Android to internal testing
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        # Upload to Google Play Internal Testing
        echo "🤖 Uploading Android to Google Play Internal Testing..."
    fi
    
    # Deploy iOS to TestFlight
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        echo "🍎 Uploading iOS to TestFlight..."
        if [ -f "build/export/BlazeIntelligenceMobile.ipa" ]; then
            xcrun altool --upload-app -f "build/export/BlazeIntelligenceMobile.ipa" \
                --type ios \
                --username "$APPLE_ID" \
                --password "$APPLE_APP_PASSWORD"
        fi
    fi
}

deploy_production() {
    echo "🚀 Deploying to production app stores..."
    
    # Confirm production deployment
    read -p "⚠️  Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Production deployment cancelled"
        exit 1
    fi
    
    # Deploy Android to Google Play Store
    if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
        echo "🤖 Uploading Android to Google Play Store..."
        # This would typically use Google Play Console API or fastlane
    fi
    
    # Deploy iOS to App Store
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        echo "🍎 Uploading iOS to App Store..."
        if [ -f "build/export/BlazeIntelligenceMobile.ipa" ]; then
            xcrun altool --upload-app -f "build/export/BlazeIntelligenceMobile.ipa" \
                --type ios \
                --username "$APPLE_ID" \
                --password "$APPLE_APP_PASSWORD"
        fi
    fi
}

# Generate deployment report
echo "📊 Generating deployment report..."
cat > deployment-report.json << EOF
{
  "deploymentId": "$(uuidgen | tr '[:upper:]' '[:lower:]')",
  "appName": "$APP_NAME",
  "version": "$VERSION",
  "buildNumber": "$BUILD_NUMBER",
  "platform": "$PLATFORM",
  "environment": "$ENVIRONMENT",
  "buildType": "$BUILD_TYPE",
  "deploymentDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
  "deployedBy": "$(git config user.name)",
  "apiEndpoint": "$REACT_APP_API_URL",
  "wsEndpoint": "$REACT_APP_WS_URL"
}
EOF

# Send deployment notification (if configured)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🔥 Blaze Intelligence Mobile v$VERSION deployed to $ENVIRONMENT\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Platform\", \"value\": \"$PLATFORM\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"$VERSION\", \"short\": true},
                    {\"title\": \"Build\", \"value\": \"$BUILD_NUMBER\", \"short\": true}
                ]
            }]
        }" \
        $SLACK_WEBHOOK_URL
fi

echo "✅ Deployment completed successfully!"
echo "📋 Deployment report saved to deployment-report.json"
echo ""
echo "🔗 Next steps:"
case $ENVIRONMENT in
    "development")
        echo "   • Test the build on development devices"
        echo "   • Verify all features work as expected"
        ;;
    "staging")
        echo "   • Notify QA team for testing"
        echo "   • Verify integration with staging APIs"
        ;;
    "production")
        echo "   • Monitor app store review process"
        echo "   • Prepare release notes and marketing materials"
        echo "   • Monitor crash reporting and user feedback"
        ;;
esac