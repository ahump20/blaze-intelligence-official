#!/bin/bash

# Blaze Vision AI - Team Onboarding Script
# Quick setup for baseball teams to start using the Tell Detector platform

set -e

echo "🔥 Blaze Vision AI - Team Onboarding"
echo "======================================"
echo ""

# Collect team information
read -p "Enter team name: " TEAM_NAME
read -p "Enter team code (e.g., STL for St. Louis): " TEAM_CODE
read -p "Enter primary contact email: " CONTACT_EMAIL
read -p "Enter sport (baseball/softball): " SPORT

# Generate API credentials
SESSION_ID=$(uuidgen || cat /proc/sys/kernel/random/uuid)
echo ""
echo "✅ Generated Session ID: $SESSION_ID"

# Test gateway connection
echo ""
echo "🔍 Testing gateway connection..."
HEALTH_CHECK=$(curl -s https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz)
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo "✅ Gateway is healthy and operational"
else
    echo "❌ Gateway health check failed"
    exit 1
fi

# Create test session
echo ""
echo "📊 Creating test session..."
TEST_RESPONSE=$(curl -s -X POST https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/vision/sessions \
  -H "Content-Type: application/json" \
  -H "X-Dev-Mode: true" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"player_id\": \"${TEAM_CODE}_Test_Player\",
    \"sport\": \"$SPORT\",
    \"target_fps\": 60,
    \"enable_face\": true,
    \"enable_pose\": true
  }")

if [[ $TEST_RESPONSE == *"success"* ]]; then
    echo "✅ Test session created successfully"
else
    echo "❌ Failed to create test session"
    exit 1
fi

# Generate configuration file
CONFIG_FILE="${TEAM_CODE}_blaze_config.json"
cat > $CONFIG_FILE << EOF
{
  "team": {
    "name": "$TEAM_NAME",
    "code": "$TEAM_CODE",
    "sport": "$SPORT",
    "contact": "$CONTACT_EMAIL"
  },
  "api": {
    "gateway_url": "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev",
    "headers": {
      "Content-Type": "application/json",
      "X-Dev-Mode": "true"
    }
  },
  "settings": {
    "target_fps": 60,
    "enable_face": true,
    "enable_pose": true,
    "enable_rpg": false,
    "camera_setup": {
      "face_camera": {
        "fps": 240,
        "resolution": [1920, 1080],
        "position": "pitcher_mound_front"
      },
      "body_camera": {
        "fps": 60,
        "resolution": [1920, 1080],
        "position": "third_base_line"
      }
    }
  },
  "thresholds": {
    "grit_warning": 45,
    "grit_critical": 35,
    "risk_warning": 0.6,
    "risk_critical": 0.8
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo ""
echo "✅ Configuration file created: $CONFIG_FILE"

# Generate sample integration code
SAMPLE_FILE="${TEAM_CODE}_sample_integration.js"
cat > $SAMPLE_FILE << 'EOF'
// Blaze Vision AI - Sample Integration
// Replace TEAM_CODE with your actual team code

const GATEWAY_URL = 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev';

class BlazeVisionClient {
  constructor(teamCode) {
    this.teamCode = teamCode;
    this.sessions = new Map();
  }

  async createSession(playerId) {
    const sessionId = crypto.randomUUID();
    
    const response = await fetch(`${GATEWAY_URL}/vision/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dev-Mode': 'true'
      },
      body: JSON.stringify({
        session_id: sessionId,
        player_id: `${this.teamCode}_${playerId}`,
        sport: 'baseball',
        target_fps: 60,
        enable_face: true,
        enable_pose: true
      })
    });

    const result = await response.json();
    if (result.success) {
      this.sessions.set(playerId, sessionId);
      console.log(`✅ Session created for ${playerId}: ${sessionId}`);
    }
    
    return sessionId;
  }

  async sendTelemetry(playerId, telemetryData) {
    const sessionId = this.sessions.get(playerId);
    if (!sessionId) {
      throw new Error(`No active session for player: ${playerId}`);
    }

    const response = await fetch(`${GATEWAY_URL}/vision/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dev-Mode': 'true'
      },
      body: JSON.stringify([{
        session_id: sessionId,
        t: Date.now(),
        ...telemetryData
      }])
    });

    const result = await response.json();
    if (result.success && result.scores.length > 0) {
      const score = result.scores[0];
      console.log(`📊 Grit Index: ${score.grit} | Risk: ${score.risk}`);
      
      // Check for warnings
      if (score.grit < 45) {
        console.warn(`⚠️ LOW GRIT WARNING for ${playerId}: ${score.grit}`);
      }
      if (score.risk > 0.6) {
        console.warn(`⚠️ HIGH RISK WARNING for ${playerId}: ${score.risk}`);
      }
      
      return score;
    }
  }

  async endSession(playerId) {
    const sessionId = this.sessions.get(playerId);
    if (!sessionId) return;

    await fetch(`${GATEWAY_URL}/vision/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'X-Dev-Mode': 'true'
      }
    });

    this.sessions.delete(playerId);
    console.log(`✅ Session ended for ${playerId}`);
  }
}

// Usage Example
async function runExample() {
  const client = new BlazeVisionClient('TEAM_CODE');
  
  // Start session for a player
  await client.createSession('Nolan_Arenado');
  
  // Send sample telemetry
  await client.sendTelemetry('Nolan_Arenado', {
    face: {
      au_intensities: {
        au4: 0.15,
        au5_7: 0.08,
        au9_10: 0.12,
        au14: 0.05,
        au17_23_24: 0.22
      }
    },
    pose: {
      angles: {
        arm_slot: 85.2,
        shoulder_separation: 42.1,
        stride_length: 0.68,
        release_height: 6.2,
        balance_score: 0.82,
        consistency_score: 0.76
      }
    },
    device: {
      fps: 60,
      resolution: [1920, 1080],
      has_webgpu: true,
      has_webgl: true,
      camera_count: 2
    }
  });
  
  // End session
  await client.endSession('Nolan_Arenado');
}

// Run the example
runExample().catch(console.error);
EOF

sed -i "" "s/TEAM_CODE/${TEAM_CODE}/g" $SAMPLE_FILE 2>/dev/null || sed -i "s/TEAM_CODE/${TEAM_CODE}/g" $SAMPLE_FILE

echo "✅ Sample integration code created: $SAMPLE_FILE"

# Create quick start guide
GUIDE_FILE="${TEAM_CODE}_quick_start_guide.md"
cat > $GUIDE_FILE << EOF
# Blaze Vision AI - Quick Start Guide
## Team: $TEAM_NAME ($TEAM_CODE)

### 🚀 Getting Started

1. **Gateway Endpoint**
   - Production: https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev
   - Coach UI: https://blaze-coach-ui.pages.dev

2. **Authentication**
   - Development: Add header \`X-Dev-Mode: true\`
   - Production: JWT token (contact support for setup)

3. **Player ID Format**
   - Format: \`${TEAM_CODE}_FirstName_LastName\`
   - Example: \`${TEAM_CODE}_Nolan_Arenado\`

### 📊 Key Metrics

- **Grit Index (0-100)**: Overall performance score
  - 70-100: Excellent
  - 50-70: Good
  - 35-50: Warning
  - 0-35: Critical

- **Breakdown Risk (0-1)**: Fatigue/stress indicator
  - 0-0.3: Low risk
  - 0.3-0.6: Medium risk
  - 0.6-0.8: High risk
  - 0.8-1.0: Critical risk

### 🎥 Camera Setup

**Face Camera (Micro-expressions)**
- Position: Front of pitcher's mound
- FPS: 240 (minimum 120)
- Focus: Head and shoulders

**Body Camera (Biomechanics)**
- Position: Third base line
- FPS: 60
- Focus: Full body mechanics

### 🔥 Real-time Coaching Cues

- **Green (Grit > 70)**: Optimal performance
- **Yellow (Grit 45-70)**: Monitor closely
- **Red (Grit < 45)**: Intervention needed

### 📞 Support

- Documentation: API_DOCUMENTATION.md
- Contact: $CONTACT_EMAIL
- Gateway Health: https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz

### 🏆 Best Practices

1. Start sessions before warm-ups
2. Monitor Grit Index trends, not just single values
3. Use game situation updates for accurate leverage
4. Review session analytics daily
5. Establish player baselines over 5+ sessions

Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "✅ Quick start guide created: $GUIDE_FILE"

# Display summary
echo ""
echo "========================================="
echo "🎯 Team Onboarding Complete!"
echo "========================================="
echo ""
echo "Team: $TEAM_NAME ($TEAM_CODE)"
echo "Sport: $SPORT"
echo "Contact: $CONTACT_EMAIL"
echo ""
echo "📁 Generated Files:"
echo "  1. $CONFIG_FILE - Team configuration"
echo "  2. $SAMPLE_FILE - Integration code"
echo "  3. $GUIDE_FILE - Quick start guide"
echo ""
echo "🔗 Important URLs:"
echo "  - Gateway: https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev"
echo "  - Coach UI: https://blaze-coach-ui.pages.dev"
echo "  - Health Check: https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz"
echo ""
echo "📊 Next Steps:"
echo "  1. Review the quick start guide"
echo "  2. Test the sample integration code"
echo "  3. Set up cameras according to specifications"
echo "  4. Create sessions for your players"
echo "  5. Start collecting real-time data!"
echo ""
echo "🔥 Welcome to Blaze Vision AI!"