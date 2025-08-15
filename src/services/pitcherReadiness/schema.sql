-- Pitcher Readiness System - Cardinals @ Busch Stadium
-- Minimal schema diffs (add-only) for production deployment

-- =====================================================
-- 0) MINIMAL DIFFS TO EXISTING SCHEMA (ADD-ONLY)
-- =====================================================

-- A) Event timing + lateness handling
ALTER TABLE pitch_event ADD COLUMN IF NOT EXISTS 
    ingest_ts timestamptz NOT NULL DEFAULT now();
ALTER TABLE pitch_event ADD COLUMN IF NOT EXISTS 
    processing_ts timestamptz NOT NULL DEFAULT now();

ALTER TABLE pitch_tracking_statcast ADD COLUMN IF NOT EXISTS 
    arrival_ts timestamptz NOT NULL DEFAULT now();  -- when enriched record lands
ALTER TABLE pitch_tracking_statcast ADD COLUMN IF NOT EXISTS 
    source_seq bigint;  -- vendor sequence if provided

ALTER TABLE readiness_inference ADD COLUMN IF NOT EXISTS 
    data_freshness_ms int;  -- max(event_ts..generated_ts) across joined features
ALTER TABLE readiness_inference ADD COLUMN IF NOT EXISTS 
    late_data_frac_5m double precision;  -- fraction of late events in last 5m features

-- B) Calibration drift handling
ALTER TABLE ref_camera_calibration ADD COLUMN IF NOT EXISTS 
    calibration_confidence double precision DEFAULT 0.95;

CREATE TABLE IF NOT EXISTS calibration_shift_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id text NOT NULL,
    detected_ts timestamptz NOT NULL,
    session_id text,
    old_calibration_set_id text,
    new_calibration_set_id text,
    reason text CHECK (reason IN ('WEATHER', 'VIBRATION', 'MANUAL', 'AUTO_THRESHOLD')),
    pre_qa double precision,
    post_qa double precision,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE environment_observation ADD COLUMN IF NOT EXISTS 
    rig_vibration_idx_0_1 double precision;  -- optional sensor or inferred

-- C) Feature lineage & cutover
ALTER TABLE feature_snapshot ADD COLUMN IF NOT EXISTS 
    feature_contract_version text NOT NULL DEFAULT 'live_5m_v1';
ALTER TABLE feature_snapshot ADD COLUMN IF NOT EXISTS 
    backfill_lookback_days int DEFAULT 0;

ALTER TABLE baseline_norms ADD COLUMN IF NOT EXISTS 
    season_label text DEFAULT '2024';
ALTER TABLE baseline_norms ADD COLUMN IF NOT EXISTS 
    n_samples bigint;

-- =====================================================
-- 1) CORE DOMAIN TABLES
-- =====================================================

-- Reference tables
CREATE TABLE IF NOT EXISTS ref_pitcher (
    pitcher_id text PRIMARY KEY,
    name text NOT NULL,
    birthdate date,
    handedness text CHECK (handedness IN ('L', 'R', 'S')),
    height_in int,
    weight_lb int,
    dominant_pitch_types text[],
    mlbam_id text UNIQUE,
    org_join_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_venue (
    venue_id text PRIMARY KEY,
    name text NOT NULL,
    city text,
    tz text,
    altitude_ft int,
    dimensions_json jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_camera_calibration (
    camera_calibration_set_id text PRIMARY KEY,
    venue_id text REFERENCES ref_venue(venue_id),
    valid_from timestamptz NOT NULL,
    valid_to timestamptz NOT NULL,
    rig_meta_json jsonb,
    calibration_confidence double precision DEFAULT 0.95,
    created_at timestamptz DEFAULT now()
);

-- Session management
CREATE TABLE IF NOT EXISTS session (
    session_id text PRIMARY KEY,
    pitcher_id text NOT NULL REFERENCES ref_pitcher(pitcher_id),
    venue_id text NOT NULL REFERENCES ref_venue(venue_id),
    session_type text NOT NULL CHECK (session_type IN ('GAME', 'BULLPEN', 'LIVE_BP', 'REHAB', 'SIDES')),
    start_ts timestamptz NOT NULL,
    end_ts timestamptz,
    opponent_team_id text,
    context_id text,
    camera_calibration_set_id text REFERENCES ref_camera_calibration(camera_calibration_set_id),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_session_pitcher_ts ON session(pitcher_id, start_ts DESC);
CREATE INDEX idx_session_venue_date ON session(venue_id, date(start_ts));

-- Game context
CREATE TABLE IF NOT EXISTS game_context_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text REFERENCES session(session_id),
    event_ts timestamptz NOT NULL,
    inning int,
    pitch_number_in_pa int,
    outs int CHECK (outs BETWEEN 0 AND 3),
    base_state text,
    score_diff int,
    leverage_index double precision,
    batter_id text,
    batter_hand text CHECK (batter_hand IN ('L', 'R', 'S'))
);

CREATE INDEX idx_game_context_session_ts ON game_context_event(session_id, event_ts);

-- Pitch events
CREATE TABLE IF NOT EXISTS pitch_event (
    pitch_id text PRIMARY KEY,
    session_id text NOT NULL REFERENCES session(session_id),
    event_ts timestamptz NOT NULL,
    pitch_type text,
    px double precision,
    pz double precision,
    called_strike boolean,
    swing boolean,
    whiff boolean,
    batted_ball boolean,
    result_code text,
    ingest_ts timestamptz NOT NULL DEFAULT now(),
    processing_ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pitch_event_session ON pitch_event(session_id, event_ts);
CREATE INDEX idx_pitch_event_ts ON pitch_event(event_ts);

-- Pitch tracking (Statcast/Hawk-Eye)
CREATE TABLE IF NOT EXISTS pitch_tracking_statcast (
    pitch_id text PRIMARY KEY REFERENCES pitch_event(pitch_id),
    release_speed_mph double precision,
    release_pos_x_ft double precision,
    release_pos_y_ft double precision,
    release_pos_z_ft double precision,
    extension_ft double precision,
    spin_rate_rpm double precision,
    spin_axis_deg double precision,
    vbreak_in double precision,
    hbreak_in double precision,
    approach_angle_deg double precision,
    plate_x_ft double precision,
    plate_z_ft double precision,
    induced_break_in double precision,
    seam_shift_deg double precision,
    tracking_qa double precision CHECK (tracking_qa BETWEEN 0 AND 1),
    arrival_ts timestamptz NOT NULL DEFAULT now(),
    source_seq bigint
);

-- Environment observations
CREATE TABLE IF NOT EXISTS environment_observation (
    venue_id text,
    obs_ts timestamptz,
    temperature_f double precision,
    humidity_pct double precision,
    baro_hpa double precision,
    wind_mph double precision,
    wind_dir_deg double precision,
    precip_bool boolean,
    mound_hardness_idx_0_1 double precision,
    clay_moisture_idx_0_1 double precision,
    rig_vibration_idx_0_1 double precision,
    source text,
    PRIMARY KEY (venue_id, obs_ts)
);

CREATE INDEX idx_env_obs_venue_recent ON environment_observation(venue_id, obs_ts DESC);

-- Workload tracking
CREATE TABLE IF NOT EXISTS workload_day (
    pitcher_id text REFERENCES ref_pitcher(pitcher_id),
    date_utc date,
    pitches_game int DEFAULT 0,
    pitches_pen int DEFAULT 0,
    high_stress_pitches int DEFAULT 0,
    total_throws int DEFAULT 0,
    days_rest int,
    travel_miles_48h int,
    travel_timezones_48h int,
    PRIMARY KEY (pitcher_id, date_utc)
);

-- Baseline norms
CREATE TABLE IF NOT EXISTS baseline_norms (
    pitcher_id text REFERENCES ref_pitcher(pitcher_id),
    metric_name text,
    long_term_mean double precision,
    sd double precision,
    season_mean double precision,
    sd_season double precision,
    season_label text DEFAULT '2024',
    n_samples bigint,
    update_ts timestamptz DEFAULT now(),
    PRIMARY KEY (pitcher_id, metric_name)
);

-- Feature snapshots
CREATE TABLE IF NOT EXISTS feature_snapshot (
    snapshot_id text PRIMARY KEY,
    generated_ts timestamptz NOT NULL,
    pitcher_id text NOT NULL REFERENCES ref_pitcher(pitcher_id),
    feature_map_json jsonb NOT NULL,
    source_spans_json jsonb,
    hash text NOT NULL,
    feature_contract_version text NOT NULL DEFAULT 'live_5m_v1',
    backfill_lookback_days int DEFAULT 0
);

CREATE INDEX idx_feature_snapshot_pitcher ON feature_snapshot(pitcher_id, generated_ts DESC);

-- Readiness inferences
CREATE TABLE IF NOT EXISTS readiness_inference (
    inference_id text PRIMARY KEY,
    snapshot_id text NOT NULL REFERENCES feature_snapshot(snapshot_id),
    readiness_index double precision CHECK (readiness_index BETWEEN 0 AND 100),
    fatigue_index double precision CHECK (fatigue_index BETWEEN 0 AND 100),
    risk_index double precision CHECK (risk_index BETWEEN 0 AND 100),
    confidence double precision CHECK (confidence BETWEEN 0 AND 1),
    status_band text CHECK (status_band IN ('GREEN', 'YELLOW', 'RED')),
    expected_cap int,
    role_fit text CHECK (role_fit IN ('STARTER', 'RELIEVER_HIGH_LEV', 'RELIEVER_LOW_LEV', 'REHAB')),
    model_version text NOT NULL,
    explanation_json jsonb,
    data_freshness_ms int,
    late_data_frac_5m double precision,
    generated_ts timestamptz DEFAULT now()
);

CREATE INDEX idx_readiness_inference_ts ON readiness_inference(generated_ts DESC);

-- Pitcher readiness view (materialized for UI)
CREATE MATERIALIZED VIEW IF NOT EXISTS pitcher_readiness_view AS
SELECT 
    p.pitcher_id,
    p.name AS pitcher_name,
    'STL' AS team_id,
    ri.generated_ts AS readiness_ts,
    s.context_id,
    ri.readiness_index,
    ri.fatigue_index,
    ri.risk_index,
    ri.confidence,
    ri.status_band,
    ri.expected_cap,
    ri.role_fit,
    ri.explanation_json->>'drivers_top3' AS drivers_top3,
    ri.explanation_json->>'recommendations' AS recommendations,
    ri.model_version,
    ri.data_freshness_ms,
    ri.late_data_frac_5m,
    CASE 
        WHEN ri.data_freshness_ms > 5000 THEN 'STALE'
        WHEN ri.late_data_frac_5m > 0.2 THEN 'DELAYED'
        ELSE 'FRESH'
    END AS data_quality
FROM readiness_inference ri
JOIN feature_snapshot fs ON ri.snapshot_id = fs.snapshot_id
JOIN ref_pitcher p ON fs.pitcher_id = p.pitcher_id
LEFT JOIN session s ON s.pitcher_id = p.pitcher_id 
    AND s.start_ts = (
        SELECT MAX(start_ts) 
        FROM session 
        WHERE pitcher_id = p.pitcher_id
    )
WHERE ri.generated_ts > now() - interval '24 hours';

CREATE UNIQUE INDEX ON pitcher_readiness_view(pitcher_id, readiness_ts, context_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pitch_event_ingest ON pitch_event(ingest_ts);
CREATE INDEX IF NOT EXISTS idx_pitch_tracking_arrival ON pitch_tracking_statcast(arrival_ts);
CREATE INDEX IF NOT EXISTS idx_calibration_shift_venue ON calibration_shift_event(venue_id, detected_ts DESC);
CREATE INDEX IF NOT EXISTS idx_baseline_norms_lookup ON baseline_norms(pitcher_id, metric_name, season_label);

-- =====================================================
-- PARTITIONING FOR SCALE (optional but recommended)
-- =====================================================

-- Partition pitch_event by month for efficient querying
-- ALTER TABLE pitch_event PARTITION BY RANGE (event_ts);
-- CREATE TABLE pitch_event_2025_08 PARTITION OF pitch_event
--     FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- =====================================================
-- GRANTS (adjust per your security model)
-- =====================================================

-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readiness_readonly;
-- GRANT INSERT, UPDATE ON readiness_inference, feature_snapshot TO readiness_service;
-- GRANT ALL ON pitcher_readiness_view TO readiness_api;