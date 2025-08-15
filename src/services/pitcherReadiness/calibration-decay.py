#!/usr/bin/env python3
"""
Calibration Confidence Decay Function
Cardinals Pitcher Readiness System @ Busch Stadium

Handles mid-game camera rig drift with exponential decay
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class CalibrationConfidenceDecay:
    """
    Manages calibration confidence with temporal decay based on:
    - Time since last calibration
    - Environmental factors (vibration, weather)
    - Historical drift patterns
    """
    
    def __init__(self, 
                 initial_confidence: float = 0.95,
                 half_life_minutes: float = 45.0,
                 min_confidence: float = 0.5):
        """
        Initialize calibration decay model.
        
        Args:
            initial_confidence: Starting confidence after fresh calibration
            half_life_minutes: Time for confidence to decay by 50%
            min_confidence: Floor value for confidence
        """
        self.initial_confidence = initial_confidence
        self.half_life_minutes = half_life_minutes
        self.min_confidence = min_confidence
        self.decay_rate = np.log(2) / half_life_minutes
        
        # Environmental factor weights
        self.env_weights = {
            'vibration': 2.0,  # Doubles decay rate
            'wind': 1.5,       # 50% faster decay
            'temperature_delta': 1.3,  # 30% faster for big temp changes
            'humidity_delta': 1.2      # 20% faster for humidity changes
        }
        
    def calculate_confidence(self,
                            last_calibration_ts: datetime,
                            current_ts: datetime,
                            env_factors: Optional[Dict[str, float]] = None) -> float:
        """
        Calculate current calibration confidence with decay.
        
        Args:
            last_calibration_ts: Timestamp of last calibration
            current_ts: Current timestamp
            env_factors: Environmental factors affecting decay
            
        Returns:
            Current confidence value [0, 1]
        """
        # Time since calibration
        minutes_elapsed = (current_ts - last_calibration_ts).total_seconds() / 60.0
        
        # Adjust decay rate based on environment
        effective_decay_rate = self._adjust_decay_rate(self.decay_rate, env_factors)
        
        # Exponential decay
        confidence = self.initial_confidence * np.exp(-effective_decay_rate * minutes_elapsed)
        
        # Apply floor
        confidence = max(confidence, self.min_confidence)
        
        # Log if below threshold
        if confidence < 0.7:
            logger.warning(f"Calibration confidence low: {confidence:.3f} after {minutes_elapsed:.1f} minutes")
            
        return confidence
    
    def _adjust_decay_rate(self, 
                          base_rate: float,
                          env_factors: Optional[Dict[str, float]] = None) -> float:
        """
        Adjust decay rate based on environmental factors.
        
        Args:
            base_rate: Base decay rate
            env_factors: Environmental measurements
            
        Returns:
            Adjusted decay rate
        """
        if not env_factors:
            return base_rate
            
        multiplier = 1.0
        
        # Vibration effect (0-1 scale)
        if 'rig_vibration_idx' in env_factors:
            vibration = env_factors['rig_vibration_idx']
            if vibration > 0.3:  # Significant vibration
                multiplier *= 1 + (self.env_weights['vibration'] - 1) * vibration
                
        # Wind effect (mph)
        if 'wind_mph' in env_factors:
            wind = env_factors['wind_mph']
            if wind > 15:  # Strong wind
                wind_factor = min(wind / 30, 1.0)  # Normalize to 0-1
                multiplier *= 1 + (self.env_weights['wind'] - 1) * wind_factor
                
        # Temperature change effect
        if 'temperature_delta_f' in env_factors:
            temp_delta = abs(env_factors['temperature_delta_f'])
            if temp_delta > 5:  # Significant temperature change
                temp_factor = min(temp_delta / 15, 1.0)  # Normalize to 0-1
                multiplier *= 1 + (self.env_weights['temperature_delta'] - 1) * temp_factor
                
        # Humidity change effect
        if 'humidity_delta_pct' in env_factors:
            humidity_delta = abs(env_factors['humidity_delta_pct'])
            if humidity_delta > 10:  # Significant humidity change
                humidity_factor = min(humidity_delta / 30, 1.0)  # Normalize to 0-1
                multiplier *= 1 + (self.env_weights['humidity_delta'] - 1) * humidity_factor
                
        return base_rate * multiplier
    
    def recommend_recalibration(self,
                               confidence: float,
                               qa_score: float,
                               late_data_frac: float) -> Tuple[bool, str]:
        """
        Determine if recalibration is needed.
        
        Args:
            confidence: Current calibration confidence
            qa_score: Tracking quality score
            late_data_frac: Fraction of late-arriving data
            
        Returns:
            (should_recalibrate, reason)
        """
        if confidence < 0.6:
            return True, f"Low calibration confidence: {confidence:.2f}"
            
        if qa_score < 0.7 and confidence < 0.8:
            return True, f"Low QA + declining calibration: QA={qa_score:.2f}, Cal={confidence:.2f}"
            
        if late_data_frac > 0.3 and confidence < 0.75:
            return True, f"High latency + calibration drift: Late={late_data_frac:.2f}, Cal={confidence:.2f}"
            
        return False, "Calibration acceptable"
    
    def get_action(self, confidence: float) -> str:
        """
        Determine action based on confidence level.
        
        Args:
            confidence: Current calibration confidence
            
        Returns:
            Action to take: NONE, REBASELINE, FALLBACK, or ALERT
        """
        if confidence >= 0.8:
            return "NONE"
        elif confidence >= 0.7:
            return "REBASELINE"  # Use recent good data for baseline
        elif confidence >= 0.6:
            return "FALLBACK"    # Use backup tracking system
        else:
            return "ALERT"       # Manual intervention needed


class CalibrationManager:
    """
    Manages calibration lifecycle and transitions.
    """
    
    def __init__(self):
        self.decay_model = CalibrationConfidenceDecay()
        self.calibration_history = []
        self.last_calibration_ts = None
        self.last_env_snapshot = {}
        
    def update_calibration(self, 
                          venue_id: str,
                          session_id: str,
                          confidence: float = 0.95):
        """
        Record new calibration event.
        """
        self.last_calibration_ts = datetime.now()
        self.calibration_history.append({
            'venue_id': venue_id,
            'session_id': session_id,
            'timestamp': self.last_calibration_ts,
            'confidence': confidence
        })
        logger.info(f"Calibration updated for {venue_id}: confidence={confidence}")
        
    def get_current_confidence(self,
                              current_ts: Optional[datetime] = None,
                              env_snapshot: Optional[Dict] = None) -> Dict:
        """
        Get current calibration status with all metrics.
        """
        if not self.last_calibration_ts:
            return {
                'confidence': 0.5,
                'action': 'ALERT',
                'reason': 'No calibration found',
                'should_recalibrate': True
            }
            
        current_ts = current_ts or datetime.now()
        
        # Calculate environmental deltas
        env_factors = {}
        if env_snapshot:
            if self.last_env_snapshot:
                env_factors['temperature_delta_f'] = (
                    env_snapshot.get('temperature_f', 70) - 
                    self.last_env_snapshot.get('temperature_f', 70)
                )
                env_factors['humidity_delta_pct'] = (
                    env_snapshot.get('humidity_pct', 50) - 
                    self.last_env_snapshot.get('humidity_pct', 50)
                )
            env_factors['rig_vibration_idx'] = env_snapshot.get('rig_vibration_idx_0_1', 0)
            env_factors['wind_mph'] = env_snapshot.get('wind_mph', 0)
            self.last_env_snapshot = env_snapshot
            
        # Calculate confidence with decay
        confidence = self.decay_model.calculate_confidence(
            self.last_calibration_ts,
            current_ts,
            env_factors
        )
        
        # Get recommended action
        action = self.decay_model.get_action(confidence)
        
        # Check if recalibration needed (mock QA score for now)
        qa_score = env_snapshot.get('tracking_qa', 0.9) if env_snapshot else 0.9
        late_frac = env_snapshot.get('late_data_frac', 0.05) if env_snapshot else 0.05
        should_recalibrate, reason = self.decay_model.recommend_recalibration(
            confidence, qa_score, late_frac
        )
        
        return {
            'confidence': round(confidence, 3),
            'action': action,
            'reason': reason,
            'should_recalibrate': should_recalibrate,
            'minutes_since_calibration': (
                (current_ts - self.last_calibration_ts).total_seconds() / 60.0
                if self.last_calibration_ts else None
            ),
            'env_factors': env_factors
        }


# Example usage and testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Initialize manager
    manager = CalibrationManager()
    
    # Fresh calibration at game start
    manager.update_calibration('busch_iii', 'game_2025_08_15_1900')
    
    # Simulate game progression
    start_time = datetime.now()
    
    # Check confidence over time with varying conditions
    scenarios = [
        (15, {'temperature_f': 75, 'humidity_pct': 60, 'wind_mph': 5, 'rig_vibration_idx_0_1': 0.1}),
        (30, {'temperature_f': 73, 'humidity_pct': 62, 'wind_mph': 8, 'rig_vibration_idx_0_1': 0.15}),
        (45, {'temperature_f': 71, 'humidity_pct': 65, 'wind_mph': 12, 'rig_vibration_idx_0_1': 0.25}),
        (60, {'temperature_f': 68, 'humidity_pct': 68, 'wind_mph': 18, 'rig_vibration_idx_0_1': 0.4}),
        (90, {'temperature_f': 65, 'humidity_pct': 72, 'wind_mph': 20, 'rig_vibration_idx_0_1': 0.5}),
    ]
    
    print("\n🎯 Calibration Confidence Decay Simulation")
    print("=" * 60)
    
    for minutes, env in scenarios:
        check_time = start_time + timedelta(minutes=minutes)
        status = manager.get_current_confidence(check_time, env)
        
        print(f"\nTime: +{minutes} minutes")
        print(f"  Confidence: {status['confidence']:.3f}")
        print(f"  Action: {status['action']}")
        print(f"  Reason: {status['reason']}")
        print(f"  Environment: Wind={env['wind_mph']}mph, Vibration={env['rig_vibration_idx_0_1']:.2f}")
        
        if status['should_recalibrate']:
            print(f"  ⚠️  RECALIBRATION RECOMMENDED")