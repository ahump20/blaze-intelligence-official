#!/bin/bash

# Kafka Topics Setup for Pitcher Readiness System
# Cardinals @ Busch Stadium Implementation

echo "🔥 Setting up Kafka topics for Pitcher Readiness System..."

# Configuration
KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"
SCHEMA_REGISTRY_URL="${SCHEMA_REGISTRY_URL:-http://localhost:8081}"
REPLICATION_FACTOR="${REPLICATION_FACTOR:-3}"

# =====================================================
# CREATE TOPICS
# =====================================================

echo "📡 Creating raw pitch events topic..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic statcast.pitch.v1 \
  --partitions 12 \
  --replication-factor $REPLICATION_FACTOR \
  --config retention.ms=604800000 \
  --config compression.type=snappy \
  --config min.insync.replicas=2 \
  --if-not-exists

echo "🏟️ Creating environment observations topic..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic env.busch.v1 \
  --partitions 3 \
  --replication-factor $REPLICATION_FACTOR \
  --config retention.ms=2592000000 \
  --config compression.type=snappy \
  --config min.insync.replicas=2 \
  --if-not-exists

echo "📐 Creating calibration status topic..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic calibration.status.v1 \
  --partitions 1 \
  --replication-factor $REPLICATION_FACTOR \
  --config cleanup.policy=compact \
  --config min.insync.replicas=2 \
  --if-not-exists

echo "📊 Creating computed features topic..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic features.pitcher_live_5m.v2 \
  --partitions 6 \
  --replication-factor $REPLICATION_FACTOR \
  --config cleanup.policy=compact,delete \
  --config min.cleanable.dirty.ratio=0.5 \
  --config segment.ms=86400000 \
  --config retention.ms=172800000 \
  --if-not-exists

echo "🎮 Creating game context topic..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic context.game.v1 \
  --partitions 6 \
  --replication-factor $REPLICATION_FACTOR \
  --config retention.ms=604800000 \
  --config compression.type=snappy \
  --if-not-exists

echo "🏋️ Creating biomechanics topic (for training)..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic biomech.markerless.v1 \
  --partitions 3 \
  --replication-factor $REPLICATION_FACTOR \
  --config retention.ms=2592000000 \
  --config compression.type=snappy \
  --if-not-exists

echo "⌚ Creating wearables topic (training only)..."
kafka-topics --create \
  --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS \
  --topic wearable.imu.v1 \
  --partitions 3 \
  --replication-factor $REPLICATION_FACTOR \
  --config retention.ms=604800000 \
  --config compression.type=snappy \
  --if-not-exists

# =====================================================
# LIST TOPICS TO VERIFY
# =====================================================

echo ""
echo "✅ Topics created. Current topics:"
kafka-topics --list --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS | grep -E "(statcast|env|calibration|features|context|biomech|wearable)"

echo ""
echo "🔍 Topic details:"
for topic in statcast.pitch.v1 env.busch.v1 calibration.status.v1 features.pitcher_live_5m.v2; do
  echo ""
  echo "Topic: $topic"
  kafka-topics --describe --topic $topic --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS
done

echo ""
echo "✅ Kafka setup complete!"
echo ""
echo "Next steps:"
echo "1. Register Avro schemas: ./register-schemas.sh"
echo "2. Start Flink job: ./start-flink-processor.sh"
echo "3. Initialize baselines: ./populate-baselines.sh"
echo "4. Run Helsley test: ./test-helsley.sh"