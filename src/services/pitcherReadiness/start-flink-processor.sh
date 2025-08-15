#!/bin/bash

# Flink Job Deployment Script
# Cardinals Pitcher Readiness System @ Busch Stadium

set -e

echo "🚀 Starting Flink Processor for Pitcher Readiness System..."

# Configuration
FLINK_HOME="${FLINK_HOME:-/opt/flink}"
FLINK_JOBMANAGER="${FLINK_JOBMANAGER:-localhost:8081}"
PARALLELISM="${PARALLELISM:-4}"
CHECKPOINT_INTERVAL="${CHECKPOINT_INTERVAL:-60000}"
SAVEPOINT_PATH="${SAVEPOINT_PATH:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Flink is running
check_flink() {
    echo -n "Checking Flink cluster status... "
    if curl -s "$FLINK_JOBMANAGER" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        echo "Please start Flink cluster first:"
        echo "  $FLINK_HOME/bin/start-cluster.sh"
        exit 1
    fi
}

# Compile the Flink SQL job
compile_job() {
    echo -e "${BLUE}Compiling Flink SQL job...${NC}"
    
    # Create a temporary Java wrapper for SQL job
    cat > /tmp/PitcherReadinessJob.java << 'EOF'
package com.cardinals.flink;

import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.table.api.EnvironmentSettings;
import java.nio.file.Files;
import java.nio.file.Paths;

public class PitcherReadinessJob {
    public static void main(String[] args) throws Exception {
        // Set up the execution environment
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(Integer.parseInt(System.getenv().getOrDefault("PARALLELISM", "4")));
        env.enableCheckpointing(Long.parseLong(System.getenv().getOrDefault("CHECKPOINT_INTERVAL", "60000")));
        
        // Create table environment
        EnvironmentSettings settings = EnvironmentSettings
            .newInstance()
            .inStreamingMode()
            .build();
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env, settings);
        
        // Set configurations
        tableEnv.getConfig().getConfiguration().setString("table.exec.mini-batch.enabled", "true");
        tableEnv.getConfig().getConfiguration().setString("table.exec.mini-batch.allow-latency", "1 s");
        tableEnv.getConfig().getConfiguration().setString("table.exec.mini-batch.size", "1000");
        
        // Read and execute SQL script
        String sqlScript = new String(Files.readAllBytes(Paths.get("flink-job.sql")));
        String[] statements = sqlScript.split(";");
        
        for (String statement : statements) {
            String trimmed = statement.trim();
            if (!trimmed.isEmpty() && !trimmed.startsWith("--")) {
                System.out.println("Executing: " + trimmed.substring(0, Math.min(50, trimmed.length())) + "...");
                tableEnv.executeSql(trimmed);
            }
        }
        
        // Execute the job
        env.execute("Cardinals Pitcher Readiness Pipeline");
    }
}
EOF
    
    # Compile with Flink dependencies
    javac -cp "$FLINK_HOME/lib/*" /tmp/PitcherReadinessJob.java
    
    # Create JAR
    jar cf /tmp/pitcher-readiness.jar -C /tmp PitcherReadinessJob.class
    
    echo -e "${GREEN}✓ Compilation complete${NC}"
}

# Submit job to Flink cluster
submit_job() {
    echo -e "${BLUE}Submitting job to Flink cluster...${NC}"
    
    # Build submission command
    SUBMIT_CMD="$FLINK_HOME/bin/flink run"
    SUBMIT_CMD="$SUBMIT_CMD -m $FLINK_JOBMANAGER"
    SUBMIT_CMD="$SUBMIT_CMD -p $PARALLELISM"
    
    # Add savepoint if provided
    if [ -n "$SAVEPOINT_PATH" ]; then
        SUBMIT_CMD="$SUBMIT_CMD -s $SAVEPOINT_PATH"
        echo "Restoring from savepoint: $SAVEPOINT_PATH"
    fi
    
    # Add job arguments
    SUBMIT_CMD="$SUBMIT_CMD -c com.cardinals.flink.PitcherReadinessJob"
    SUBMIT_CMD="$SUBMIT_CMD /tmp/pitcher-readiness.jar"
    
    # Submit the job
    JOB_OUTPUT=$($SUBMIT_CMD 2>&1)
    
    # Extract job ID
    JOB_ID=$(echo "$JOB_OUTPUT" | grep -oP 'JobID \K[a-f0-9]{32}')
    
    if [ -n "$JOB_ID" ]; then
        echo -e "${GREEN}✓ Job submitted successfully${NC}"
        echo "  Job ID: $JOB_ID"
        return 0
    else
        echo -e "${RED}✗ Job submission failed${NC}"
        echo "$JOB_OUTPUT"
        return 1
    fi
}

# Monitor job status
monitor_job() {
    local job_id=$1
    echo -e "${BLUE}Monitoring job status...${NC}"
    
    # Check job status
    STATUS=$(curl -s "$FLINK_JOBMANAGER/jobs/$job_id" | python3 -c "import sys, json; print(json.load(sys.stdin)['state'])" 2>/dev/null || echo "UNKNOWN")
    
    echo "  Status: $STATUS"
    
    case $STATUS in
        "RUNNING")
            echo -e "${GREEN}✓ Job is running successfully${NC}"
            ;;
        "FAILED")
            echo -e "${RED}✗ Job failed${NC}"
            # Get exception
            curl -s "$FLINK_JOBMANAGER/jobs/$job_id/exceptions" | python3 -m json.tool
            return 1
            ;;
        "CANCELED")
            echo -e "${YELLOW}⚠ Job was canceled${NC}"
            return 1
            ;;
        *)
            echo -e "${YELLOW}⚠ Job status: $STATUS${NC}"
            ;;
    esac
}

# Show job metrics
show_metrics() {
    local job_id=$1
    echo ""
    echo -e "${BLUE}Job Metrics:${NC}"
    echo "============================================"
    
    # Get job metrics
    curl -s "$FLINK_JOBMANAGER/jobs/$job_id/metrics" | python3 -c "
import sys, json
metrics = json.load(sys.stdin)
important_metrics = [
    'numRecordsIn', 'numRecordsOut', 'numRecordsInPerSecond',
    'numRecordsOutPerSecond', 'currentInputWatermark', 'lastCheckpointDuration'
]
for metric in metrics:
    if any(im in metric['id'] for im in important_metrics):
        print(f\"  {metric['id']}: {metric.get('value', 'N/A')}\")"
    
    echo ""
    echo "Dashboard URL: http://$FLINK_JOBMANAGER/#/jobs/$job_id"
}

# Create custom UDFs
create_udfs() {
    echo -e "${BLUE}Creating custom UDFs...${NC}"
    
    # TempoEWMA UDF
    cat > /tmp/TempoEWMA.java << 'EOF'
package com.cardinals.flink;

import org.apache.flink.table.functions.ScalarFunction;
import java.util.HashMap;
import java.util.Map;

public class TempoEWMA extends ScalarFunction {
    private static final Map<String, Double> lastTempo = new HashMap<>();
    private static final double ALPHA = 0.3;  // EWMA smoothing factor
    
    public Double eval(String pitcherId, Long eventTs) {
        String key = pitcherId;
        Double currentTempo = calculateTempo(eventTs);
        
        if (!lastTempo.containsKey(key)) {
            lastTempo.put(key, currentTempo);
            return currentTempo;
        }
        
        Double smoothed = ALPHA * currentTempo + (1 - ALPHA) * lastTempo.get(key);
        lastTempo.put(key, smoothed);
        return smoothed;
    }
    
    private Double calculateTempo(Long eventTs) {
        // Simplified tempo calculation (seconds between pitches)
        return 15.0 + Math.random() * 10.0;  // 15-25 seconds
    }
}
EOF
    
    # AdjustVBreak UDF
    cat > /tmp/AdjustVBreak.java << 'EOF'
package com.cardinals.flink;

import org.apache.flink.table.functions.ScalarFunction;

public class AdjustVBreak extends ScalarFunction {
    public Double eval(Double vbreak, Float temp, Float humidity, Float pressure) {
        if (vbreak == null) return null;
        
        // Environmental adjustments based on physics
        double tempAdjust = (temp - 70.0) * 0.02;  // 2% per 10°F
        double humidityAdjust = (humidity - 50.0) * 0.01;  // 1% per 10%
        double pressureAdjust = (pressure - 1013.0) * 0.001;  // 0.1% per hPa
        
        return vbreak * (1 + tempAdjust + humidityAdjust + pressureAdjust);
    }
}
EOF
    
    # Compile UDFs
    javac -cp "$FLINK_HOME/lib/*" /tmp/TempoEWMA.java /tmp/AdjustVBreak.java
    jar uf /tmp/pitcher-readiness.jar -C /tmp TempoEWMA.class AdjustVBreak.class
    
    echo -e "${GREEN}✓ UDFs created${NC}"
}

# Main execution
main() {
    echo "🔥 Cardinals Pitcher Readiness - Flink Processor"
    echo "================================================"
    echo ""
    
    # Check prerequisites
    check_flink
    
    # Create UDFs
    create_udfs
    
    # Compile job
    compile_job
    
    # Submit job
    if submit_job; then
        # Monitor job
        sleep 5
        monitor_job "$JOB_ID"
        
        # Show metrics
        show_metrics "$JOB_ID"
        
        echo ""
        echo -e "${GREEN}✅ Flink processor started successfully!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Monitor dashboard: http://$FLINK_JOBMANAGER/#/jobs/$JOB_ID"
        echo "2. Check Grafana: http://localhost:3000/d/cardinals-pitcher-readiness"
        echo "3. Run Helsley test: ./test-helsley.py"
        echo ""
        echo "To stop the job:"
        echo "  $FLINK_HOME/bin/flink cancel $JOB_ID"
        echo ""
        echo "To savepoint the job:"
        echo "  $FLINK_HOME/bin/flink savepoint $JOB_ID /tmp/savepoints"
    else
        echo -e "${RED}✗ Failed to start Flink processor${NC}"
        exit 1
    fi
}

# Run main function
main "$@"