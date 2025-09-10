#!/bin/bash

# Blaze Intelligence Mobile App - iOS Build Script
# This script builds the iOS app for testing and production

set -e

echo "🔥 Blaze Intelligence - iOS Build Script"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the mobile-app directory."
    exit 1
fi

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: iOS builds require macOS"
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode command line tools not found"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install CocoaPods dependencies
echo "🍫 Installing CocoaPods..."
cd ios && pod install && cd ..

# Build configuration
SCHEME="BlazeIntelligenceMobile"
WORKSPACE="ios/BlazeIntelligenceMobile.xcworkspace"
BUILD_TYPE=${1:-debug}
CONFIGURATION=${2:-Debug}

case $BUILD_TYPE in
    "debug")
        echo "🔧 Building debug version..."
        npx react-native run-ios --configuration Debug
        ;;
    "release")
        echo "🚀 Building release version..."
        
        # Clean build folder
        echo "🧹 Cleaning build folder..."
        xcodebuild clean -workspace "$WORKSPACE" -scheme "$SCHEME"
        
        # Build for device
        echo "📱 Building for device..."
        xcodebuild archive \
            -workspace "$WORKSPACE" \
            -scheme "$SCHEME" \
            -configuration Release \
            -archivePath "build/BlazeIntelligence.xcarchive" \
            -allowProvisioningUpdates
        
        echo "✅ Archive created successfully!"
        echo "📍 Location: build/BlazeIntelligence.xcarchive"
        ;;
    "simulator")
        echo "📱 Building for simulator..."
        npx react-native run-ios --simulator "iPhone 15 Pro"
        ;;
    "export")
        echo "📤 Exporting IPA..."
        
        # Export options plist
        cat > ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF
        
        xcodebuild -exportArchive \
            -archivePath "build/BlazeIntelligence.xcarchive" \
            -exportPath "build/export" \
            -exportOptionsPlist ExportOptions.plist
        
        echo "✅ IPA exported successfully!"
        echo "📍 Location: build/export/BlazeIntelligenceMobile.ipa"
        ;;
    *)
        echo "❌ Invalid build type. Use: debug, release, simulator, or export"
        exit 1
        ;;
esac

# Run tests after build (for debug/release builds)
if [[ "$BUILD_TYPE" == "debug" || "$BUILD_TYPE" == "release" ]]; then
    echo "🧪 Running tests..."
    npm test -- --watchAll=false
fi

# Generate build info
echo "📊 Generating build info..."
cat > build-info.json << EOF
{
  "buildType": "$BUILD_TYPE",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platform": "ios",
  "configuration": "$CONFIGURATION",
  "version": "$(node -p "require('./package.json').version")",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF

echo "🎉 Build completed successfully!"
echo "📋 Build info saved to build-info.json"