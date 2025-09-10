#!/bin/bash

# Blaze Intelligence Mobile App - Android Build Script
# This script builds the Android APK for testing and production

set -e

echo "🔥 Blaze Intelligence - Android Build Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the mobile-app directory."
    exit 1
fi

# Check for required environment variables
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ Error: ANDROID_HOME environment variable not set"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf android/app/build
cd android && ./gradlew clean && cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate bundle
echo "📱 Generating React Native bundle..."
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# Build types
BUILD_TYPE=${1:-debug}

case $BUILD_TYPE in
    "debug")
        echo "🔧 Building debug APK..."
        cd android && ./gradlew assembleDebug && cd ..
        echo "✅ Debug APK built successfully!"
        echo "📍 Location: android/app/build/outputs/apk/debug/app-debug.apk"
        ;;
    "release")
        echo "🚀 Building release APK..."
        
        # Check for signing config
        if [ ! -f "android/app/blaze-release-key.keystore" ]; then
            echo "⚠️  Creating release keystore..."
            keytool -genkey -v -keystore android/app/blaze-release-key.keystore -alias blaze-key -keyalg RSA -keysize 2048 -validity 10000 \
                -dname "CN=Blaze Intelligence, OU=Mobile, O=Blaze Intelligence, L=Austin, ST=Texas, C=US" \
                -storepass blazeintelligence -keypass blazeintelligence
        fi
        
        cd android && ./gradlew assembleRelease && cd ..
        echo "✅ Release APK built successfully!"
        echo "📍 Location: android/app/build/outputs/apk/release/app-release.apk"
        ;;
    "bundle")
        echo "📦 Building Android App Bundle (AAB)..."
        cd android && ./gradlew bundleRelease && cd ..
        echo "✅ App Bundle built successfully!"
        echo "📍 Location: android/app/build/outputs/bundle/release/app-release.aab"
        ;;
    *)
        echo "❌ Invalid build type. Use: debug, release, or bundle"
        exit 1
        ;;
esac

# Run tests after build
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Generate build info
echo "📊 Generating build info..."
cat > build-info.json << EOF
{
  "buildType": "$BUILD_TYPE",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "android",
  "version": "$(node -p "require('./package.json').version")",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF

echo "🎉 Build completed successfully!"
echo "📋 Build info saved to build-info.json"