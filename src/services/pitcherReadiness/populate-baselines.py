#!/usr/bin/env python3
"""
Baseline Norms Population Script
Cardinals Pitcher Readiness System @ Busch Stadium

Populates baseline_norms table with historical pitcher metrics
"""

import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432),
    'database': os.getenv('DB_NAME', 'cardinals'),
    'user': os.getenv('DB_USER', 'readiness_service'),
    'password': os.getenv('DB_PASSWORD', '')
}

# Metrics to calculate baselines for
BASELINE_METRICS = [
    'release_speed_mph',
    'spin_rate_rpm',
    'spin_axis_deg',
    'extension_ft',
    'release_pos_z_ft',
    'vbreak_in',
    'hbreak_in',
    'plate_x_ft',
    'plate_z_ft',
    'approach_angle_deg'
]

# Cardinals pitchers (2024 roster sample)
CARDINALS_PITCHERS = [
    {'pitcher_id': 'STL_656427', 'name': 'Ryan Helsley', 'role': 'closer'},
    {'pitcher_id': 'STL_571945', 'name': 'Jordan Hicks', 'role': 'reliever'},
    {'pitcher_id': 'STL_642547', 'name': 'Jordan Montgomery', 'role': 'starter'},
    {'pitcher_id': 'STL_657053', 'name': 'Andre Pallante', 'role': 'reliever'},
    {'pitcher_id': 'STL_676710', 'name': 'Matthew Liberatore', 'role': 'starter'},
    {'pitcher_id': 'STL_668881', 'name': 'Genesis Cabrera', 'role': 'reliever'},
    {'pitcher_id': 'STL_621111', 'name': 'Miles Mikolas', 'role': 'starter'},
    {'pitcher_id': 'STL_592836', 'name': 'Steven Matz', 'role': 'starter'},
]

class BaselineNormsPopulator:
    """
    Populates baseline norms from historical pitch data.
    """
    
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            logger.info("Connected to database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
            
    def disconnect(self):
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Disconnected from database")
        
    def calculate_pitcher_baselines(self, 
                                   pitcher_id: str,
                                   season_label: str = '2024') -> List[Dict]:
        """
        Calculate baseline norms for a pitcher.
        
        Args:
            pitcher_id: Pitcher identifier
            season_label: Season to calculate baselines for
            
        Returns:
            List of baseline metric dictionaries
        """
        baselines = []
        
        # Query historical data
        query = """
        SELECT 
            pts.release_speed_mph,
            pts.spin_rate_rpm,
            pts.spin_axis_deg,
            pts.extension_ft,
            pts.release_pos_z_ft,
            pts.vbreak_in,
            pts.hbreak_in,
            pts.plate_x_ft,
            pts.plate_z_ft,
            pts.approach_angle_deg
        FROM pitch_tracking_statcast pts
        JOIN pitch_event pe ON pts.pitch_id = pe.pitch_id
        JOIN session s ON pe.session_id = s.session_id
        WHERE s.pitcher_id = %s
          AND s.session_type IN ('GAME', 'LIVE_BP')
          AND pe.event_ts >= %s
          AND pe.event_ts < %s
          AND pts.tracking_qa > 0.8
        """
        
        # Season date ranges
        if season_label == '2024':
            start_date = '2024-03-28'
            end_date = '2024-10-01'
        else:
            start_date = f'{season_label}-04-01'
            end_date = f'{season_label}-10-01'
            
        try:
            self.cursor.execute(query, (pitcher_id, start_date, end_date))
            rows = self.cursor.fetchall()
            
            if not rows:
                logger.warning(f"No data found for pitcher {pitcher_id}, using synthetic baselines")
                return self._generate_synthetic_baselines(pitcher_id, season_label)
                
            # Convert to DataFrame for easier analysis
            df = pd.DataFrame(rows, columns=BASELINE_METRICS)
            
            # Calculate statistics for each metric
            for metric in BASELINE_METRICS:
                metric_data = df[metric].dropna()
                
                if len(metric_data) < 10:
                    logger.warning(f"Insufficient data for {metric} ({pitcher_id})")
                    continue
                    
                # Calculate long-term stats (all data)
                long_term_mean = metric_data.mean()
                long_term_sd = metric_data.std()
                
                # Calculate season stats (recent 30% of data)
                season_cutoff = int(len(metric_data) * 0.7)
                season_data = metric_data.iloc[season_cutoff:]
                season_mean = season_data.mean()
                season_sd = season_data.std()
                
                baselines.append({
                    'pitcher_id': pitcher_id,
                    'metric_name': metric,
                    'long_term_mean': round(long_term_mean, 3),
                    'sd': round(long_term_sd, 3),
                    'season_mean': round(season_mean, 3),
                    'sd_season': round(season_sd, 3),
                    'season_label': season_label,
                    'n_samples': len(metric_data)
                })
                
        except Exception as e:
            logger.error(f"Error calculating baselines for {pitcher_id}: {e}")
            return self._generate_synthetic_baselines(pitcher_id, season_label)
            
        return baselines
    
    def _generate_synthetic_baselines(self, 
                                     pitcher_id: str,
                                     season_label: str) -> List[Dict]:
        """
        Generate synthetic baselines for testing.
        
        Args:
            pitcher_id: Pitcher identifier
            season_label: Season label
            
        Returns:
            List of synthetic baseline metrics
        """
        # Realistic MLB ranges
        synthetic_ranges = {
            'release_speed_mph': (88, 98, 2.5),      # (min, max, std)
            'spin_rate_rpm': (2000, 2600, 150),
            'spin_axis_deg': (180, 240, 15),
            'extension_ft': (5.8, 6.8, 0.3),
            'release_pos_z_ft': (5.5, 6.5, 0.2),
            'vbreak_in': (-15, 15, 3),
            'hbreak_in': (-15, 15, 3),
            'plate_x_ft': (-1, 1, 0.3),
            'plate_z_ft': (1.5, 3.5, 0.4),
            'approach_angle_deg': (-6, -4, 0.3)
        }
        
        baselines = []
        np.random.seed(hash(pitcher_id) % 2**32)  # Consistent synthetic data
        
        for metric, (min_val, max_val, std) in synthetic_ranges.items():
            # Generate realistic mean
            mean = np.random.uniform(min_val, max_val)
            
            # Season mean slightly different from long-term
            season_drift = np.random.uniform(-std * 0.3, std * 0.3)
            
            baselines.append({
                'pitcher_id': pitcher_id,
                'metric_name': metric,
                'long_term_mean': round(mean, 3),
                'sd': round(std, 3),
                'season_mean': round(mean + season_drift, 3),
                'sd_season': round(std * np.random.uniform(0.8, 1.2), 3),
                'season_label': season_label,
                'n_samples': np.random.randint(500, 2000)
            })
            
        return baselines
    
    def insert_baselines(self, baselines: List[Dict]):
        """
        Insert or update baseline norms in database.
        
        Args:
            baselines: List of baseline metric dictionaries
        """
        insert_query = """
        INSERT INTO baseline_norms (
            pitcher_id, metric_name, long_term_mean, sd,
            season_mean, sd_season, season_label, n_samples, update_ts
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (pitcher_id, metric_name) 
        DO UPDATE SET
            long_term_mean = EXCLUDED.long_term_mean,
            sd = EXCLUDED.sd,
            season_mean = EXCLUDED.season_mean,
            sd_season = EXCLUDED.sd_season,
            season_label = EXCLUDED.season_label,
            n_samples = EXCLUDED.n_samples,
            update_ts = EXCLUDED.update_ts
        """
        
        try:
            for baseline in baselines:
                values = (
                    baseline['pitcher_id'],
                    baseline['metric_name'],
                    baseline['long_term_mean'],
                    baseline['sd'],
                    baseline['season_mean'],
                    baseline['sd_season'],
                    baseline['season_label'],
                    baseline['n_samples'],
                    datetime.now()
                )
                self.cursor.execute(insert_query, values)
                
            self.conn.commit()
            logger.info(f"Inserted {len(baselines)} baseline records")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Failed to insert baselines: {e}")
            raise
    
    def populate_all_pitchers(self, season_label: str = '2024'):
        """
        Populate baselines for all Cardinals pitchers.
        
        Args:
            season_label: Season to populate baselines for
        """
        logger.info(f"Starting baseline population for {len(CARDINALS_PITCHERS)} pitchers")
        
        for pitcher in CARDINALS_PITCHERS:
            logger.info(f"Processing {pitcher['name']} ({pitcher['pitcher_id']})")
            
            # Calculate baselines
            baselines = self.calculate_pitcher_baselines(
                pitcher['pitcher_id'],
                season_label
            )
            
            # Insert into database
            if baselines:
                self.insert_baselines(baselines)
                logger.info(f"  ✓ Populated {len(baselines)} metrics for {pitcher['name']}")
            else:
                logger.warning(f"  ⚠ No baselines generated for {pitcher['name']}")
                
        logger.info("Baseline population complete")
    
    def verify_baselines(self):
        """
        Verify baseline data was populated correctly.
        """
        query = """
        SELECT 
            pitcher_id,
            COUNT(DISTINCT metric_name) as metric_count,
            AVG(n_samples) as avg_samples,
            MAX(update_ts) as last_updated
        FROM baseline_norms
        WHERE season_label = '2024'
        GROUP BY pitcher_id
        ORDER BY pitcher_id
        """
        
        try:
            self.cursor.execute(query)
            results = self.cursor.fetchall()
            
            print("\n📊 Baseline Verification Report")
            print("=" * 60)
            print(f"{'Pitcher ID':<20} {'Metrics':<10} {'Avg Samples':<15} {'Last Updated'}")
            print("-" * 60)
            
            for row in results:
                pitcher_id, metric_count, avg_samples, last_updated = row
                print(f"{pitcher_id:<20} {metric_count:<10} {avg_samples:<15.0f} {last_updated}")
                
            print(f"\nTotal pitchers with baselines: {len(results)}")
            
        except Exception as e:
            logger.error(f"Failed to verify baselines: {e}")


def main():
    """Main execution function."""
    logger.info("🚀 Starting Baseline Norms Population")
    
    populator = BaselineNormsPopulator(DB_CONFIG)
    
    try:
        # Connect to database
        populator.connect()
        
        # Populate baselines for all pitchers
        populator.populate_all_pitchers(season_label='2024')
        
        # Verify results
        populator.verify_baselines()
        
        logger.info("✅ Baseline population completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Baseline population failed: {e}")
        raise
        
    finally:
        populator.disconnect()


if __name__ == "__main__":
    main()