# Cardinals Pitcher Readiness System @ Busch Stadium

Enterprise-grade real-time pitcher readiness system with robust handling of 2-5s Hawk-Eye lag, mid-game calibration drift, and feature model transitions.

## 🎯 System Overview

This system provides real-time pitcher readiness assessment for the St. Louis Cardinals at Busch Stadium, featuring:

- **2-5 Second Latency Handling**: Watermark-based stream processing for late-arriving Hawk-Eye data
- **Calibration Drift Management**: Exponential decay models with environmental factor adjustments
- **Feature Model Cutover**: A/B testing framework for seamless v1→v2 transitions
- **Production-Ready Monitoring**: Comprehensive Grafana dashboards and alerting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hawk-Eye      │────│     Kafka       │────│     Flink       │
│   Statcast      │    │   (12 topics)   │    │  (Watermarks)   │
│   Environment   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grafana       │────│   PostgreSQL    │────│  Feature Store  │
│  Monitoring     │    │   (Baselines)   │    │    (Redis)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Readiness API  │────│  React UI       │
                       │   (FastAPI)     │    │ (Real-time)     │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Local Development

1. **Start the stack**:
```bash
docker-compose up -d
```

2. **Initialize data**:
```bash
./kafka-setup.sh
./register-schemas.sh
python populate-baselines.py
```

3. **Start Flink processor**:
```bash
./start-flink-processor.sh
```

4. **Run Helsley test**:
```bash
python test-helsley.py
```

5. **Access dashboards**:
- Grafana: http://localhost:3000 (admin/cardinals)
- Flink UI: http://localhost:8080
- Kafka UI: http://localhost:8082
- API: http://localhost:8000

### Production Deployment

```bash
# Configure environment
export ENVIRONMENT=production
export DOCKER_REGISTRY=registry.cardinals.mlb
export IMAGE_TAG=$(git rev-parse --short HEAD)

# Deploy to Kubernetes
./deploy-production.sh

# Monitor deployment
kubectl get pods -n cardinals-readiness
```

## 📊 Key Features

### Latency Handling
- **7-second watermarks** for late data tolerance
- **Late data fraction tracking** with 20% threshold alerts
- **Automatic reprocessing** for critical missed events

### Calibration Management
- **45-minute half-life decay** with environmental adjustments
- **Automatic recalibration triggers** at 70% confidence
- **Multi-factor environmental impact** (wind, vibration, temperature)

### Feature Engineering
- **5-pitch velocity delta** from seasonal baselines
- **20-pitch spin consistency** with normalized standard deviation
- **25-pitch release height variance** for mechanical consistency
- **Environment-adjusted break values** with physics-based corrections

### Real-time Monitoring
- **Sub-100ms UI updates** via WebSocket connections
- **Comprehensive alerting** for quality degradation
- **End-to-end latency tracking** with P99 metrics

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://cardinals_user:password@postgres:5432/cardinals
REDIS_URL=redis://redis:6379

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
SCHEMA_REGISTRY_URL=http://schema-registry:8081

# Feature Store
FEAST_REDIS_CONN_STRING=redis:6379
FEAST_POSTGRES_CONN_STRING=postgresql://cardinals_user:password@postgres:5432/cardinals

# API
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

### Flink Configuration

```yaml
parallelism.default: 4
execution.checkpointing.interval: 60s
execution.checkpointing.timeout: 10min
state.checkpoints.dir: s3://cardinals-checkpoints/
state.savepoints.dir: s3://cardinals-savepoints/
```

## 📈 Monitoring & Alerts

### Key Metrics

- **Readiness Index**: 0-100% composite score
- **Fatigue Index**: 0-100% accumulated fatigue
- **Risk Index**: 0-100% injury/performance risk
- **Calibration Confidence**: 50-95% tracking quality
- **Data Freshness**: <5s target latency

### Alert Thresholds

```yaml
critical:
  - readiness_index < 60
  - calibration_confidence < 0.6
  - late_data_frac > 0.3
  - feature_qa_min < 0.7

warning:
  - readiness_index < 80
  - calibration_confidence < 0.8
  - late_data_frac > 0.2
  - velocity_delta < -2.0
```

## 🧪 Testing

### Unit Tests
```bash
pytest tests/unit/ -v
```

### Integration Tests
```bash
pytest tests/integration/ -v
```

### Smoke Tests
```bash
python test-helsley.py
```

### Load Tests
```bash
python test-load.py --pitchers 25 --rate 100
```

## 📦 Components

### Core Services

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Kafka** | Event streaming | Confluent Platform |
| **Flink** | Stream processing | Apache Flink 1.17 |
| **PostgreSQL** | Baseline storage | PostgreSQL 15 |
| **Redis** | Feature cache | Redis 7 |
| **FastAPI** | REST API | Python 3.11 |
| **React** | Dashboard UI | TypeScript + MUI |

### Data Pipeline

| Stage | Input | Output | Latency |
|-------|-------|--------|---------|
| **Ingestion** | Hawk-Eye events | Kafka topics | <500ms |
| **Processing** | Raw streams | Features | <2s |
| **Storage** | Features | Redis cache | <100ms |
| **API** | Cache + DB | REST responses | <50ms |
| **UI** | WebSocket | Live updates | <100ms |

### Schema Evolution

| Version | Features | Status | Cutover Date |
|---------|----------|--------|--------------|
| **v1** | Basic 5-feature set | Deprecated | 2025-08-01 |
| **v2** | Late data + calibration | Production | 2025-08-15 |
| **v3** | Biomechanics integration | Development | 2025-09-01 |

## 🔒 Security

### Data Protection
- **BIPA compliance** for biometric data handling
- **CCPA compliance** for California residents
- **Encryption at rest** for all stored data
- **TLS 1.3** for all network communication

### Access Control
- **RBAC** with pitcher-specific permissions
- **API key rotation** every 90 days
- **Audit logging** for all data access
- **VPN-only access** for production systems

## 🆘 Troubleshooting

### Common Issues

**High Latency**
```bash
# Check Kafka lag
kubectl exec -n cardinals-readiness deployment/kafka -- \
  kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group flink-processor

# Check Flink backpressure
kubectl port-forward -n cardinals-readiness svc/flink-jobmanager 8081:8081
# Visit: http://localhost:8081/#/jobs
```

**Calibration Drift**
```bash
# Check calibration status
curl http://localhost:8000/api/calibration/busch_iii

# Trigger manual recalibration
curl -X POST http://localhost:8000/api/calibration/busch_iii/recalibrate
```

**Missing Data**
```bash
# Check data flow
kubectl logs -n cardinals-readiness deployment/flink-taskmanager

# Verify schema registry
curl http://localhost:8081/subjects
```

### Performance Tuning

**Flink Optimization**
```yaml
# Increase parallelism for high-volume games
parallelism.default: 8
taskmanager.memory.flink.size: 2g
taskmanager.numberOfTaskSlots: 4

# Optimize checkpointing
execution.checkpointing.min-pause: 30s
execution.checkpointing.max-concurrent-checkpoints: 1
```

**Redis Optimization**
```bash
# Monitor memory usage
redis-cli info memory

# Configure eviction policy
config set maxmemory-policy allkeys-lru
config set maxmemory 1gb
```

## 📚 References

### Cardinals Integration
- [Player Development Database Schema](docs/database-schema.md)
- [Hawk-Eye Integration Guide](docs/hawkeye-integration.md)
- [Statcast API Documentation](docs/statcast-api.md)

### External Documentation
- [Apache Flink Documentation](https://flink.apache.org/docs/)
- [Feast Feature Store](https://docs.feast.dev/)
- [Confluent Kafka Platform](https://docs.confluent.io/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-metric`
3. Run tests: `pytest tests/ -v`
4. Submit pull request with comprehensive description

## 📄 License

Copyright © 2025 St. Louis Cardinals. All rights reserved.

---

**For Cardinals personnel**: Contact the Performance Analytics team for access and training.
**For technical support**: Email tech-support@cardinals.mlb or Slack #pitcher-readiness

🔥⚾ **Built with ❤️ for Cardinals Nation** ⚾🔥