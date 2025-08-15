#!/bin/bash

# Schema Registration Script
# Cardinals Pitcher Readiness System @ Busch Stadium

set -e

echo "🔧 Registering Avro schemas for Pitcher Readiness System..."

# Configuration
SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to register a schema
register_schema() {
    local subject=$1
    local schema=$2
    
    echo -n "Registering $subject... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/vnd.schemaregistry.v1+json" \
        -d "$schema" \
        "$SCHEMA_REGISTRY_URL/subjects/$subject/versions")
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ (HTTP $response)${NC}"
        return 1
    fi
}

# Function to check schema compatibility
check_compatibility() {
    local subject=$1
    local schema=$2
    
    echo -n "Checking compatibility for $subject... "
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/vnd.schemaregistry.v1+json" \
        -d "$schema" \
        "$SCHEMA_REGISTRY_URL/compatibility/subjects/$subject/versions/latest")
    
    if echo "$response" | grep -q '"is_compatible":true'; then
        echo -e "${GREEN}Compatible${NC}"
        return 0
    else
        echo -e "${YELLOW}New schema or incompatible${NC}"
        return 1
    fi
}

# Read the schemas from avro-schemas.json
SCHEMAS_FILE="./avro-schemas.json"

if [ ! -f "$SCHEMAS_FILE" ]; then
    echo -e "${RED}Error: avro-schemas.json not found${NC}"
    exit 1
fi

echo "Reading schemas from $SCHEMAS_FILE"
echo ""

# PitchEvent Schema
PITCH_EVENT_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"PitchEvent\",\"namespace\":\"com.cardinals.statcast\",\"fields\":[{\"name\":\"pitch_id\",\"type\":\"string\"},{\"name\":\"session_id\",\"type\":\"string\"},{\"name\":\"pitcher_id\",\"type\":\"string\"},{\"name\":\"event_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"pitch_type\",\"type\":[\"null\",\"string\"],\"default\":null},{\"name\":\"release_speed_mph\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"spin_rate_rpm\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"spin_axis_deg\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"extension_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"release_pos_x_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"release_pos_y_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"release_pos_z_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"vbreak_in\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"hbreak_in\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"plate_x_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"plate_z_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"tracking_qa\",\"type\":\"double\",\"default\":0.0},{\"name\":\"ingest_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}}]}"
}'

# EnvObservation Schema
ENV_OBSERVATION_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"EnvObservation\",\"namespace\":\"com.cardinals.env\",\"fields\":[{\"name\":\"venue_id\",\"type\":\"string\"},{\"name\":\"obs_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"temperature_f\",\"type\":\"float\"},{\"name\":\"humidity_pct\",\"type\":\"float\"},{\"name\":\"baro_hpa\",\"type\":\"float\"},{\"name\":\"wind_mph\",\"type\":\"float\"},{\"name\":\"wind_dir_deg\",\"type\":\"float\"},{\"name\":\"precip_bool\",\"type\":\"boolean\"},{\"name\":\"mound_hardness_idx_0_1\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"clay_moisture_idx_0_1\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"rig_vibration_idx_0_1\",\"type\":[\"null\",\"float\"],\"default\":null}]}"
}'

# CalibrationStatus Schema
CALIBRATION_STATUS_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"CalibrationStatus\",\"namespace\":\"com.cardinals.calibration\",\"fields\":[{\"name\":\"venue_id\",\"type\":\"string\"},{\"name\":\"session_id\",\"type\":[\"null\",\"string\"],\"default\":null},{\"name\":\"detected_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"calibration_confidence\",\"type\":\"float\"},{\"name\":\"action\",\"type\":{\"type\":\"enum\",\"name\":\"CalAction\",\"symbols\":[\"NONE\",\"REBASELINE\",\"FALLBACK\",\"ALERT\"]}}]}"
}'

# PitcherLive5m Schema
PITCHER_LIVE_5M_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"PitcherLive5m\",\"namespace\":\"com.cardinals.features\",\"fields\":[{\"name\":\"pitcher_id\",\"type\":\"string\"},{\"name\":\"feature_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"velo_delta_5\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"spin_consistency_20\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"release_height_var_25\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"command_var_20\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"tempo_ewma\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"env_adjusted_vbreak\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"feature_qa_min_5m\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"late_data_frac_5m\",\"type\":[\"null\",\"float\"],\"default\":null},{\"name\":\"calibration_confidence\",\"type\":[\"null\",\"float\"],\"default\":null}]}"
}'

# GameContext Schema
GAME_CONTEXT_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"GameContext\",\"namespace\":\"com.cardinals.game\",\"fields\":[{\"name\":\"session_id\",\"type\":\"string\"},{\"name\":\"event_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"inning\",\"type\":\"int\"},{\"name\":\"outs\",\"type\":\"int\"},{\"name\":\"base_state\",\"type\":\"string\"},{\"name\":\"score_diff\",\"type\":\"int\"},{\"name\":\"leverage_index\",\"type\":\"double\"},{\"name\":\"batter_id\",\"type\":\"string\"},{\"name\":\"batter_hand\",\"type\":\"string\"}]}"
}'

# BiomechSummary Schema
BIOMECH_SUMMARY_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"BiomechSummary\",\"namespace\":\"com.cardinals.biomech\",\"fields\":[{\"name\":\"biomech_id\",\"type\":\"string\"},{\"name\":\"session_id\",\"type\":\"string\"},{\"name\":\"ts_window\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"arm_slot_deg_mean\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"hip_shoulder_sep_deg\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"stride_len_ft\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"trunk_tilt_deg\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"pelvis_rot_vel_deg_s\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"elbow_valgus_nm_est\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"kinematic_qa\",\"type\":\"double\",\"default\":0.0}]}"
}'

# WearableSample Schema
WEARABLE_SAMPLE_SCHEMA='{
  "schema": "{\"type\":\"record\",\"name\":\"WearableSample\",\"namespace\":\"com.cardinals.wearable\",\"fields\":[{\"name\":\"pitcher_id\",\"type\":\"string\"},{\"name\":\"sample_ts\",\"type\":{\"type\":\"long\",\"logicalType\":\"timestamp-millis\"}},{\"name\":\"hr_bpm\",\"type\":[\"null\",\"int\"],\"default\":null},{\"name\":\"hrv_rmssd_ms\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"accel_g\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"gyro_dps\",\"type\":[\"null\",\"double\"],\"default\":null},{\"name\":\"rpe_1_10\",\"type\":[\"null\",\"int\"],\"default\":null},{\"name\":\"sleep_hours_prior\",\"type\":[\"null\",\"double\"],\"default\":null}]}"
}'

echo "📋 Registering schemas to Schema Registry at $SCHEMA_REGISTRY_URL"
echo "========================================================="
echo ""

# Register all schemas
register_schema "statcast.pitch.v1-value" "$PITCH_EVENT_SCHEMA"
register_schema "env.busch.v1-value" "$ENV_OBSERVATION_SCHEMA"
register_schema "calibration.status.v1-value" "$CALIBRATION_STATUS_SCHEMA"
register_schema "features.pitcher_live_5m.v2-value" "$PITCHER_LIVE_5M_SCHEMA"
register_schema "features.pitcher_live_5m.v2-key" '{"schema": "{\"type\":\"string\"}"}'
register_schema "context.game.v1-value" "$GAME_CONTEXT_SCHEMA"
register_schema "biomech.markerless.v1-value" "$BIOMECH_SUMMARY_SCHEMA"
register_schema "wearable.imu.v1-value" "$WEARABLE_SAMPLE_SCHEMA"

echo ""
echo "📊 Schema Registration Summary"
echo "=============================="

# List all registered subjects
echo ""
echo "Registered subjects:"
curl -s "$SCHEMA_REGISTRY_URL/subjects" | python3 -m json.tool | grep -E '^\s+"' | sed 's/[",]//g' | sed 's/^/  - /'

echo ""
echo -e "${GREEN}✅ Schema registration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start Flink job: ./start-flink-processor.sh"
echo "2. Initialize baselines: python populate-baselines.py"
echo "3. Run Helsley test: python test-helsley.py"