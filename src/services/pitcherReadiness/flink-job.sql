-- Flink SQL Job for Pitcher Readiness Feature Computation
-- Handles 2-5s Hawk-Eye lag with watermarks and late data tolerance

-- =====================================================
-- 1. SOURCE TABLES WITH WATERMARKS
-- =====================================================

-- Pitch events with 7-second watermark for late data
CREATE TABLE pitch_events (
  pitch_id STRING,
  session_id STRING,
  pitcher_id STRING,
  event_ts TIMESTAMP(3),
  pitch_type STRING,
  release_speed_mph DOUBLE,
  spin_rate_rpm DOUBLE,
  spin_axis_deg DOUBLE,
  extension_ft DOUBLE,
  release_pos_x_ft DOUBLE,
  release_pos_y_ft DOUBLE,
  release_pos_z_ft DOUBLE,
  vbreak_in DOUBLE,
  hbreak_in DOUBLE,
  plate_x_ft DOUBLE,
  plate_z_ft DOUBLE,
  tracking_qa DOUBLE,
  ingest_ts TIMESTAMP(3),
  WATERMARK FOR event_ts AS event_ts - INTERVAL '7' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'statcast.pitch.v1',
  'properties.bootstrap.servers' = 'kafka-broker:9092',
  'format' = 'avro-confluent',
  'avro-confluent.schema-registry.url' = 'http://schema-registry:8081',
  'scan.startup.mode' = 'latest-offset'
);

-- Calibration status
CREATE TABLE cal_status (
  venue_id STRING,
  session_id STRING,
  detected_ts TIMESTAMP(3),
  calibration_confidence FLOAT,
  action STRING,
  WATERMARK FOR detected_ts AS detected_ts - INTERVAL '1' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'calibration.status.v1',
  'properties.bootstrap.servers' = 'kafka-broker:9092',
  'format' = 'avro-confluent',
  'avro-confluent.schema-registry.url' = 'http://schema-registry:8081',
  'scan.startup.mode' = 'latest-offset'
);

-- Environment observations
CREATE TABLE env_observations (
  venue_id STRING,
  obs_ts TIMESTAMP(3),
  temperature_f FLOAT,
  humidity_pct FLOAT,
  baro_hpa FLOAT,
  wind_mph FLOAT,
  wind_dir_deg FLOAT,
  precip_bool BOOLEAN,
  mound_hardness_idx_0_1 FLOAT,
  clay_moisture_idx_0_1 FLOAT,
  rig_vibration_idx_0_1 FLOAT,
  WATERMARK FOR obs_ts AS obs_ts - INTERVAL '10' SECOND
) WITH (
  'connector' = 'kafka',
  'topic' = 'env.busch.v1',
  'properties.bootstrap.servers' = 'kafka-broker:9092',
  'format' = 'avro-confluent',
  'avro-confluent.schema-registry.url' = 'http://schema-registry:8081',
  'scan.startup.mode' = 'latest-offset'
);

-- =====================================================
-- 2. UPSERT SINK FOR FEATURES
-- =====================================================

CREATE TABLE features_pitcher_live_5m_v2 (
  pitcher_id STRING,
  feature_ts TIMESTAMP(3),
  velo_delta_5 FLOAT,
  spin_consistency_20 FLOAT,
  release_height_var_25 FLOAT,
  command_var_20 FLOAT,
  tempo_ewma FLOAT,
  env_adjusted_vbreak FLOAT,
  feature_qa_min_5m FLOAT,
  late_data_frac_5m FLOAT,
  calibration_confidence FLOAT,
  PRIMARY KEY (pitcher_id) NOT ENFORCED
) WITH (
  'connector' = 'upsert-kafka',
  'topic' = 'features.pitcher_live_5m.v2',
  'key.format' = 'avro-confluent',
  'value.format' = 'avro-confluent',
  'properties.bootstrap.servers' = 'kafka-broker:9092',
  'avro-confluent.schema-registry.url' = 'http://schema-registry:8081'
);

-- =====================================================
-- 3. BASELINE NORMS (as temporal table for lookups)
-- =====================================================

CREATE TABLE baseline_norms (
  pitcher_id STRING,
  metric_name STRING,
  long_term_mean DOUBLE,
  sd DOUBLE,
  season_mean DOUBLE,
  sd_season DOUBLE,
  PRIMARY KEY (pitcher_id, metric_name) NOT ENFORCED
) WITH (
  'connector' = 'jdbc',
  'url' = 'jdbc:postgresql://localhost:5432/cardinals',
  'table-name' = 'baseline_norms',
  'username' = 'readiness_service',
  'password' = '${db.password}'
);

-- =====================================================
-- 4. FEATURE COMPUTATION VIEWS
-- =====================================================

-- Base view with late data detection
CREATE VIEW base_pitches AS
SELECT
  pitcher_id,
  event_ts,
  release_speed_mph,
  spin_rate_rpm,
  release_pos_z_ft,
  plate_x_ft,
  plate_z_ft,
  vbreak_in,
  tracking_qa,
  CASE 
    WHEN TIMESTAMPDIFF(SECOND, event_ts, ingest_ts) > 2 THEN 1.0 
    ELSE 0.0 
  END AS is_late,
  ingest_ts
FROM pitch_events
WHERE tracking_qa > 0.5;  -- Filter out very low quality

-- Rolling window features (N-pitch based)
CREATE VIEW rolling_pitch_features AS
SELECT
  pitcher_id,
  event_ts AS feature_ts,
  -- 5-pitch velocity
  AVG(release_speed_mph) OVER w5 AS velo_mean_5,
  -- 20-pitch spin consistency
  STDDEV_SAMP(spin_rate_rpm) OVER w20 AS spin_std_20,
  AVG(spin_rate_rpm) OVER w20 AS spin_mean_20,
  -- 25-pitch release height variance
  VAR_SAMP(release_pos_z_ft) OVER w25 AS release_height_var_25,
  -- 20-pitch command variance
  VAR_SAMP(plate_x_ft) OVER w20 + VAR_SAMP(plate_z_ft) OVER w20 AS command_var_20,
  -- Break consistency
  AVG(vbreak_in) OVER w15 AS vbreak_mean_15,
  -- Quality metrics
  MIN(tracking_qa) OVER w5 AS qa_min_5,
  AVG(is_late) OVER w5 AS late_frac_5,
  tracking_qa,
  is_late
FROM base_pitches
WINDOW 
  w5 AS (PARTITION BY pitcher_id ORDER BY event_ts ROWS BETWEEN 4 PRECEDING AND CURRENT ROW),
  w15 AS (PARTITION BY pitcher_id ORDER BY event_ts ROWS BETWEEN 14 PRECEDING AND CURRENT ROW),
  w20 AS (PARTITION BY pitcher_id ORDER BY event_ts ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
  w25 AS (PARTITION BY pitcher_id ORDER BY event_ts ROWS BETWEEN 24 PRECEDING AND CURRENT ROW);

-- Join with baselines to compute deltas
CREATE VIEW features_with_deltas AS
SELECT
  r.pitcher_id,
  r.feature_ts,
  -- Velocity delta from baseline
  r.velo_mean_5 - COALESCE(b_velo.long_term_mean, r.velo_mean_5) AS velo_delta_5,
  -- Spin consistency (normalized std dev)
  CASE 
    WHEN COALESCE(b_spin.season_mean, r.spin_mean_20) > 0 
    THEN r.spin_std_20 / COALESCE(b_spin.season_mean, r.spin_mean_20)
    ELSE NULL 
  END AS spin_consistency_20,
  -- Release height variance
  r.release_height_var_25,
  -- Command variance
  r.command_var_20,
  -- Break drift from baseline
  r.vbreak_mean_15 - COALESCE(b_break.season_mean, r.vbreak_mean_15) AS vbreak_drift_15,
  -- Quality metrics
  r.qa_min_5,
  r.late_frac_5
FROM rolling_pitch_features r
LEFT JOIN baseline_norms b_velo 
  ON r.pitcher_id = b_velo.pitcher_id 
  AND b_velo.metric_name = 'release_speed_mph'
LEFT JOIN baseline_norms b_spin 
  ON r.pitcher_id = b_spin.pitcher_id 
  AND b_spin.metric_name = 'spin_rate_rpm'
LEFT JOIN baseline_norms b_break 
  ON r.pitcher_id = b_break.pitcher_id 
  AND b_break.metric_name = 'vbreak_in';

-- Time-based QA metrics (5 minute windows)
CREATE VIEW qa_5m AS
SELECT
  pitcher_id,
  TUMBLE_END(event_ts, INTERVAL '30' SECOND) AS tick_ts,
  MIN(tracking_qa) AS feature_qa_min_5m,
  AVG(is_late) AS late_data_frac_5m,
  COUNT(*) AS pitch_count_30s
FROM base_pitches
GROUP BY 
  pitcher_id, 
  TUMBLE(event_ts, INTERVAL '30' SECOND);

-- Latest calibration confidence
CREATE VIEW cal_latest AS
SELECT
  venue_id,
  MAX(calibration_confidence) AS calibration_confidence,
  MAX(detected_ts) AS last_update_ts
FROM cal_status
WHERE venue_id = 'busch_iii'
GROUP BY venue_id;

-- Environment adjustments
CREATE VIEW env_latest AS
SELECT
  venue_id,
  LAST_VALUE(temperature_f) AS temperature_f,
  LAST_VALUE(humidity_pct) AS humidity_pct,
  LAST_VALUE(baro_hpa) AS baro_hpa,
  MAX(obs_ts) AS last_obs_ts
FROM env_observations
WHERE venue_id = 'busch_iii'
GROUP BY venue_id;

-- =====================================================
-- 5. TEMPO CALCULATION (EWMA approximation)
-- =====================================================

CREATE TEMPORARY FUNCTION tempo_ewma AS 'com.cardinals.flink.TempoEWMA';

CREATE VIEW features_with_tempo AS
SELECT
  pitcher_id,
  feature_ts,
  velo_delta_5,
  spin_consistency_20,
  release_height_var_25,
  command_var_20,
  vbreak_drift_15,
  tempo_ewma(pitcher_id, feature_ts) AS tempo_ewma,
  qa_min_5,
  late_frac_5
FROM features_with_deltas;

-- =====================================================
-- 6. ENVIRONMENT ADJUSTMENT
-- =====================================================

CREATE TEMPORARY FUNCTION adjust_vbreak AS 'com.cardinals.flink.AdjustVBreak';

CREATE VIEW features_env_adjusted AS
SELECT
  f.pitcher_id,
  f.feature_ts,
  f.velo_delta_5,
  f.spin_consistency_20,
  f.release_height_var_25,
  f.command_var_20,
  f.tempo_ewma,
  adjust_vbreak(
    f.vbreak_drift_15, 
    e.temperature_f, 
    e.humidity_pct, 
    e.baro_hpa
  ) AS env_adjusted_vbreak,
  f.qa_min_5,
  f.late_frac_5
FROM features_with_tempo f
CROSS JOIN env_latest e;

-- =====================================================
-- 7. FINAL MATERIALIZATION
-- =====================================================

INSERT INTO features_pitcher_live_5m_v2
SELECT
  f.pitcher_id,
  f.feature_ts,
  CAST(f.velo_delta_5 AS FLOAT),
  CAST(f.spin_consistency_20 AS FLOAT),
  CAST(f.release_height_var_25 AS FLOAT),
  CAST(f.command_var_20 AS FLOAT),
  CAST(f.tempo_ewma AS FLOAT),
  CAST(f.env_adjusted_vbreak AS FLOAT),
  CAST(COALESCE(q.feature_qa_min_5m, f.qa_min_5) AS FLOAT),
  CAST(COALESCE(q.late_data_frac_5m, f.late_frac_5) AS FLOAT),
  CAST(COALESCE(c.calibration_confidence, 0.95) AS FLOAT)
FROM features_env_adjusted f
LEFT JOIN qa_5m q
  ON f.pitcher_id = q.pitcher_id
  AND q.tick_ts <= f.feature_ts
  AND q.tick_ts > f.feature_ts - INTERVAL '30' SECOND
CROSS JOIN cal_latest c;

-- =====================================================
-- 8. MONITORING & ALERTING
-- =====================================================

-- Create monitoring view for Grafana
CREATE VIEW feature_monitoring AS
SELECT
  pitcher_id,
  feature_ts,
  feature_qa_min_5m,
  late_data_frac_5m,
  calibration_confidence,
  CASE
    WHEN feature_qa_min_5m < 0.85 THEN 'LOW_QA'
    WHEN late_data_frac_5m > 0.2 THEN 'HIGH_LATENCY'
    WHEN calibration_confidence < 0.7 THEN 'CAL_DRIFT'
    ELSE 'HEALTHY'
  END AS health_status,
  TIMESTAMPDIFF(MILLISECOND, feature_ts, CURRENT_TIMESTAMP) AS end_to_end_ms
FROM features_pitcher_live_5m_v2
WHERE feature_ts > CURRENT_TIMESTAMP - INTERVAL '5' MINUTE;

-- Alert on degraded conditions
CREATE TABLE alerts_sink (
  alert_id STRING,
  alert_type STRING,
  pitcher_id STRING,
  details STRING,
  severity STRING,
  alert_ts TIMESTAMP(3)
) WITH (
  'connector' = 'kafka',
  'topic' = 'alerts.readiness.v1',
  'properties.bootstrap.servers' = 'kafka-broker:9092',
  'format' = 'json'
);

INSERT INTO alerts_sink
SELECT
  MD5(CONCAT(pitcher_id, CAST(feature_ts AS STRING), health_status)) AS alert_id,
  health_status AS alert_type,
  pitcher_id,
  CONCAT(
    'QA:', CAST(feature_qa_min_5m AS STRING),
    ' Late:', CAST(late_data_frac_5m AS STRING),
    ' Cal:', CAST(calibration_confidence AS STRING)
  ) AS details,
  CASE
    WHEN health_status = 'LOW_QA' THEN 'HIGH'
    WHEN health_status = 'HIGH_LATENCY' THEN 'MEDIUM'
    WHEN health_status = 'CAL_DRIFT' THEN 'HIGH'
    ELSE 'LOW'
  END AS severity,
  feature_ts AS alert_ts
FROM feature_monitoring
WHERE health_status != 'HEALTHY';