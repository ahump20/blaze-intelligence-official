#!/bin/bash

# Production Deployment Script
# Cardinals Pitcher Readiness System @ Busch Stadium
# Enterprise-grade deployment with health checks and rollback capability

set -e

echo "🚀 Cardinals Pitcher Readiness System - Production Deployment"
echo "============================================================="

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
NAMESPACE="${NAMESPACE:-cardinals-readiness}"
HELM_CHART_VERSION="${HELM_CHART_VERSION:-1.0.0}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-registry.cardinals.mlb}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check URLs
HEALTH_ENDPOINTS=(
    "http://flink-jobmanager:8081/jobs"
    "http://kafka:9092"
    "http://schema-registry:8081/subjects"
    "http://postgres:5432"
    "http://redis:6379"
    "http://grafana:3000/api/health"
    "http://pitcher-readiness-api:8000/health"
)

# Deployment stages
STAGES=(
    "pre_deployment_checks"
    "backup_existing_state"
    "deploy_infrastructure"
    "deploy_data_pipeline"
    "deploy_api_services"
    "deploy_monitoring"
    "health_checks"
    "smoke_tests"
    "enable_traffic"
    "post_deployment_validation"
)

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        error "kubectl not configured or cluster not accessible"
    fi
    success "Kubernetes cluster accessible"
    
    # Check if Helm is installed
    if ! command -v helm &> /dev/null; then
        error "Helm not installed"
    fi
    success "Helm available"
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log "Creating namespace $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    fi
    success "Namespace $NAMESPACE ready"
    
    # Verify Docker images exist
    for service in api flink-processor data-generator; do
        image="$DOCKER_REGISTRY/cardinals-$service:$IMAGE_TAG"
        if ! docker manifest inspect "$image" &> /dev/null; then
            error "Docker image not found: $image"
        fi
    done
    success "All Docker images verified"
    
    # Check resource quotas
    kubectl describe quota -n "$NAMESPACE" || warning "No resource quotas found"
    
    # Validate configuration
    if [[ ! -f "helm/values-$ENVIRONMENT.yaml" ]]; then
        error "Configuration file not found: helm/values-$ENVIRONMENT.yaml"
    fi
    success "Configuration validated"
}

# Backup existing state
backup_existing_state() {
    log "Creating backup of existing state..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup Kubernetes resources
    kubectl get all -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/k8s-resources.yaml" || true
    
    # Backup Flink savepoints
    if kubectl get pods -n "$NAMESPACE" -l app=flink-jobmanager &> /dev/null; then
        log "Creating Flink savepoint..."
        kubectl exec -n "$NAMESPACE" \
            deployment/flink-jobmanager -- \
            flink savepoint \
            --savepoint-path /tmp/savepoints/deployment-$(date +%s) \
            $(kubectl exec -n "$NAMESPACE" deployment/flink-jobmanager -- flink list | grep RUNNING | awk '{print $4}' | head -1) \
            || warning "Failed to create Flink savepoint"
    fi
    
    # Backup database schema
    kubectl exec -n "$NAMESPACE" deployment/postgres -- \
        pg_dump -U cardinals_user -d cardinals --schema-only > "$BACKUP_DIR/schema.sql" || warning "Database backup failed"
    
    # Backup Grafana dashboards
    kubectl exec -n "$NAMESPACE" deployment/grafana -- \
        tar czf - /var/lib/grafana/dashboards > "$BACKUP_DIR/grafana-dashboards.tar.gz" || warning "Grafana backup failed"
    
    success "Backup created in $BACKUP_DIR"
    echo "$BACKUP_DIR" > .last-backup
}

# Deploy infrastructure components
deploy_infrastructure() {
    log "Deploying infrastructure components..."
    
    # Install Kafka operator if not exists
    if ! helm list -n kafka-operator | grep -q kafka-operator; then
        helm repo add strimzi https://strimzi.io/charts/
        helm repo update
        helm install kafka-operator strimzi/strimzi-kafka-operator -n kafka-operator --create-namespace
        kubectl wait --for=condition=available --timeout=300s deployment/strimzi-cluster-operator -n kafka-operator
    fi
    success "Kafka operator ready"
    
    # Deploy Kafka cluster
    kubectl apply -f k8s/kafka-cluster.yaml -n "$NAMESPACE"
    kubectl wait --for=condition=Ready kafka/cardinals-kafka -n "$NAMESPACE" --timeout=600s
    success "Kafka cluster deployed"
    
    # Deploy PostgreSQL
    helm upgrade --install postgres \
        charts/postgresql \
        -n "$NAMESPACE" \
        -f helm/values-$ENVIRONMENT.yaml \
        --set postgresql.auth.database=cardinals \
        --set postgresql.auth.username=cardinals_user \
        --set postgresql.persistence.size=100Gi
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n "$NAMESPACE"
    success "PostgreSQL deployed"
    
    # Deploy Redis
    helm upgrade --install redis \
        charts/redis \
        -n "$NAMESPACE" \
        -f helm/values-$ENVIRONMENT.yaml \
        --set auth.enabled=false \
        --set master.persistence.size=20Gi
    kubectl wait --for=condition=available --timeout=300s deployment/redis-master -n "$NAMESPACE"
    success "Redis deployed"
    
    # Initialize database schema
    kubectl exec -n "$NAMESPACE" deployment/postgres -- \
        psql -U cardinals_user -d cardinals -f /docker-entrypoint-initdb.d/schema.sql || warning "Schema already exists"
    success "Database schema initialized"
}

# Deploy data pipeline
deploy_data_pipeline() {
    log "Deploying data pipeline..."
    
    # Deploy Flink cluster
    helm upgrade --install flink \
        charts/flink \
        -n "$NAMESPACE" \
        -f helm/values-$ENVIRONMENT.yaml \
        --set jobmanager.replicas=2 \
        --set taskmanager.replicas=4 \
        --set taskmanager.resources.memory=4Gi
    
    kubectl wait --for=condition=available --timeout=300s deployment/flink-jobmanager -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/flink-taskmanager -n "$NAMESPACE"
    success "Flink cluster deployed"
    
    # Register Avro schemas
    kubectl exec -n "$NAMESPACE" deployment/schema-registry -- \
        bash -c "cd /app && ./register-schemas.sh"
    success "Schemas registered"
    
    # Deploy Flink job
    kubectl create configmap flink-job-sql \
        --from-file=flink-job.sql \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Submit Flink job
    kubectl exec -n "$NAMESPACE" deployment/flink-jobmanager -- \
        flink run -d /opt/flink/lib/pitcher-readiness.jar
    success "Flink job submitted"
    
    # Deploy Feast feature store
    helm upgrade --install feast \
        charts/feast \
        -n "$NAMESPACE" \
        -f helm/values-$ENVIRONMENT.yaml
    kubectl wait --for=condition=available --timeout=300s deployment/feast-feature-server -n "$NAMESPACE"
    success "Feast feature store deployed"
}

# Deploy API services
deploy_api_services() {
    log "Deploying API services..."
    
    # Deploy pitcher readiness API
    helm upgrade --install pitcher-readiness-api \
        charts/pitcher-readiness-api \
        -n "$NAMESPACE" \
        -f helm/values-$ENVIRONMENT.yaml \
        --set image.tag="$IMAGE_TAG" \
        --set replicas=3 \
        --set autoscaling.enabled=true \
        --set autoscaling.minReplicas=3 \
        --set autoscaling.maxReplicas=10 \
        --set resources.requests.memory=512Mi \
        --set resources.requests.cpu=250m \
        --set resources.limits.memory=1Gi \
        --set resources.limits.cpu=500m
    
    kubectl wait --for=condition=available --timeout=300s deployment/pitcher-readiness-api -n "$NAMESPACE"
    success "API services deployed"
    
    # Update ingress configuration
    kubectl apply -f k8s/ingress.yaml -n "$NAMESPACE"
    success "Ingress configured"
}

# Deploy monitoring stack
deploy_monitoring() {
    log "Deploying monitoring stack..."
    
    # Deploy Prometheus
    helm upgrade --install prometheus \
        prometheus-community/kube-prometheus-stack \
        -n monitoring \
        --create-namespace \
        -f helm/values-monitoring.yaml \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi
    
    # Deploy Grafana dashboards
    kubectl create configmap grafana-dashboards \
        --from-file=grafana-dashboard.json \
        -n monitoring \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus-grafana -n monitoring
    success "Monitoring stack deployed"
    
    # Configure alerts
    kubectl apply -f k8s/alert-rules.yaml -n monitoring
    success "Alert rules configured"
}

# Health checks
health_checks() {
    log "Running health checks..."
    
    local failed_checks=0
    
    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        log "Checking $endpoint..."
        
        # Use kubectl port-forward for internal services
        if [[ $endpoint == *"localhost"* ]]; then
            if curl -f "$endpoint/health" &> /dev/null; then
                success "$endpoint healthy"
            else
                error "Health check failed for $endpoint"
                ((failed_checks++))
            fi
        else
            # Use kubectl exec for cluster-internal checks
            service_name=$(echo "$endpoint" | cut -d: -f2 | sed 's|//||')
            if kubectl exec -n "$NAMESPACE" deployment/"$service_name" -- curl -f localhost:8080/health &> /dev/null; then
                success "$service_name healthy"
            else
                warning "Health check failed for $service_name"
                ((failed_checks++))
            fi
        fi
    done
    
    if [[ $failed_checks -gt 0 ]]; then
        error "$failed_checks health checks failed"
    fi
    
    success "All health checks passed"
}

# Smoke tests
smoke_tests() {
    log "Running smoke tests..."
    
    # Deploy test pod
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: smoke-test
  namespace: $NAMESPACE
spec:
  restartPolicy: Never
  containers:
  - name: test
    image: $DOCKER_REGISTRY/cardinals-test:$IMAGE_TAG
    command: ["python", "test-helsley.py"]
    env:
    - name: KAFKA_BOOTSTRAP_SERVERS
      value: "kafka:9092"
    - name: API_ENDPOINT
      value: "http://pitcher-readiness-api:8000"
EOF

    # Wait for test completion
    kubectl wait --for=condition=Complete pod/smoke-test -n "$NAMESPACE" --timeout=300s
    
    # Check test results
    if kubectl logs pod/smoke-test -n "$NAMESPACE" | grep -q "✅ Helsley smoke test completed successfully"; then
        success "Smoke tests passed"
    else
        error "Smoke tests failed"
    fi
    
    # Cleanup test pod
    kubectl delete pod smoke-test -n "$NAMESPACE"
}

# Enable traffic
enable_traffic() {
    log "Enabling production traffic..."
    
    # Update service mesh configuration for gradual rollout
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: pitcher-readiness-api
  namespace: $NAMESPACE
  annotations:
    traffic.istio.io/weight: "100"
spec:
  selector:
    app: pitcher-readiness-api
    version: $IMAGE_TAG
  ports:
  - port: 8000
    targetPort: 8000
EOF

    success "Production traffic enabled"
}

# Post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    # Verify data flow
    log "Verifying data flow through pipeline..."
    
    # Check Kafka topic message counts
    kafka_messages=$(kubectl exec -n "$NAMESPACE" deployment/kafka -- \
        kafka-console-consumer \
        --bootstrap-server localhost:9092 \
        --topic statcast.pitch.v1 \
        --max-messages 1 \
        --timeout-ms 10000 | wc -l)
    
    if [[ $kafka_messages -gt 0 ]]; then
        success "Data flowing through Kafka"
    else
        warning "No data detected in Kafka topics"
    fi
    
    # Check Flink job status
    flink_status=$(kubectl exec -n "$NAMESPACE" deployment/flink-jobmanager -- \
        flink list | grep RUNNING | wc -l)
    
    if [[ $flink_status -gt 0 ]]; then
        success "Flink jobs running"
    else
        error "No running Flink jobs detected"
    fi
    
    # Validate API responses
    api_response=$(kubectl exec -n "$NAMESPACE" deployment/pitcher-readiness-api -- \
        curl -s localhost:8000/api/pitcher-readiness | jq -r 'length')
    
    if [[ $api_response -gt 0 ]]; then
        success "API returning data"
    else
        warning "API not returning expected data"
    fi
    
    # Check Grafana dashboards
    dashboard_count=$(kubectl exec -n monitoring deployment/prometheus-grafana -- \
        find /var/lib/grafana/dashboards -name "*.json" | wc -l)
    
    if [[ $dashboard_count -gt 0 ]]; then
        success "Grafana dashboards available"
    else
        warning "No Grafana dashboards found"
    fi
    
    success "Post-deployment validation completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    if [[ -f .last-backup ]]; then
        BACKUP_DIR=$(cat .last-backup)
        log "Restoring from backup: $BACKUP_DIR"
        
        # Restore Kubernetes resources
        kubectl apply -f "$BACKUP_DIR/k8s-resources.yaml" -n "$NAMESPACE" || warning "K8s restore failed"
        
        # Restore Flink savepoint
        if [[ -f "$BACKUP_DIR/flink-savepoint" ]]; then
            savepoint_path=$(cat "$BACKUP_DIR/flink-savepoint")
            kubectl exec -n "$NAMESPACE" deployment/flink-jobmanager -- \
                flink run -s "$savepoint_path" /opt/flink/lib/pitcher-readiness.jar || warning "Flink restore failed"
        fi
        
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log "Starting deployment of Cardinals Pitcher Readiness System"
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    log "Image Tag: $IMAGE_TAG"
    echo ""
    
    # Trap for cleanup on failure
    trap 'error "Deployment failed. Use ./deploy-production.sh rollback to restore"; exit 1' ERR
    
    # Execute deployment stages
    for stage in "${STAGES[@]}"; do
        log "Executing stage: $stage"
        $stage
        success "Stage $stage completed"
        echo ""
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
    echo "================================"
    echo "Environment: $ENVIRONMENT"
    echo "Duration: ${duration}s"
    echo "Image Tag: $IMAGE_TAG"
    echo ""
    echo "📊 Access Points:"
    echo "  - API: https://api.cardinals.mlb/pitcher-readiness"
    echo "  - Grafana: https://monitoring.cardinals.mlb"
    echo "  - Flink UI: https://flink.cardinals.mlb"
    echo ""
    echo "🔍 Next Steps:"
    echo "  1. Monitor dashboards for data flow"
    echo "  2. Verify alerts are firing correctly"
    echo "  3. Run full integration tests"
    echo "  4. Enable automated scaling"
    echo ""
    success "Cardinals Pitcher Readiness System is live at Busch Stadium! ⚾🔥"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        health_checks
        ;;
    "smoke")
        smoke_tests
        ;;
    *)
        main
        ;;
esac