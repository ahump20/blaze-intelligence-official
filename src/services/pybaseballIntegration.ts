// PyBaseball Integration Service for Advanced MLB Statistics
// Connects to pybaseball Python library for comprehensive baseball analytics

import axios from 'axios';

interface PitchData {
  pitch_type: string;
  release_speed: number;
  release_spin_rate: number;
  release_pos_x: number;
  release_pos_y: number;
  release_pos_z: number;
  pfx_x: number;
  pfx_z: number;
  plate_x: number;
  plate_z: number;
  vx0: number;
  vy0: number;
  vz0: number;
  ax: number;
  ay: number;
  az: number;
}

interface StatcastData {
  player_name: string;
  launch_speed: number;
  launch_angle: number;
  distance: number;
  ev95percent: number;
  barrels: number;
  barrel_batted_rate: number;
  solidcontact_pct: number;
  flareburner_pct: number;
  max_distance: number;
  avg_distance: number;
  max_ev: number;
  avg_ev: number;
  fbld: number;
  gb: number;
  max_hip_speed: number;
  avg_hip_speed: number;
}

interface PlayerStats {
  batting: {
    avg: number;
    obp: number;
    slg: number;
    ops: number;
    woba: number;
    wrc_plus: number;
    war: number;
    barrel_rate: number;
    hard_hit_rate: number;
    sprint_speed: number;
  };
  pitching: {
    era: number;
    whip: number;
    k9: number;
    bb9: number;
    fip: number;
    xfip: number;
    siera: number;
    stuff_plus: number;
    location_plus: number;
    pitching_plus: number;
  };
  fielding: {
    outs_above_average: number;
    defensive_runs_saved: number;
    ultimate_zone_rating: number;
    arm_strength: number;
    exchange_time: number;
    pop_time: number;
    framing_runs: number;
  };
}

interface TeamAnalytics {
  team_id: string;
  team_name: string;
  pythagorean_wins: number;
  base_runs: number;
  team_war: number;
  defensive_efficiency: number;
  pace_of_play: number;
  clutch_factor: number;
  leverage_index: number;
  run_differential: number;
  strength_of_schedule: number;
}

export class PyBaseballIntegration {
  private apiUrl: string;
  private wsConnection: WebSocket | null = null;

  constructor() {
    this.apiUrl = process.env.REACT_APP_PYBASEBALL_API_URL || 'http://localhost:8001/pybaseball';
  }

  // Initialize Python backend connection
  async initialize(): Promise<void> {
    try {
      const response = await axios.post(`${this.apiUrl}/initialize`, {
        features: ['statcast', 'advanced_metrics', 'projections', 'live_data']
      });
      
      if (response.data.websocket_url) {
        this.connectWebSocket(response.data.websocket_url);
      }
      
      console.log('PyBaseball integration initialized:', response.data);
    } catch (error) {
      console.error('Failed to initialize PyBaseball:', error);
      throw error;
    }
  }

  // Connect to real-time data stream
  private connectWebSocket(url: string): void {
    this.wsConnection = new WebSocket(url);
    
    this.wsConnection.onopen = () => {
      console.log('Connected to PyBaseball real-time stream');
    };
    
    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeData(data);
    };
    
    this.wsConnection.onerror = (error) => {
      console.error('PyBaseball WebSocket error:', error);
    };
  }

  // Handle real-time baseball data
  private handleRealtimeData(data: any): void {
    // Process live pitch data, game events, etc.
    if (data.type === 'pitch') {
      this.processPitchData(data.pitch);
    } else if (data.type === 'hit') {
      this.processHitData(data.hit);
    } else if (data.type === 'game_event') {
      this.processGameEvent(data.event);
    }
  }

  // Get Statcast data for a player
  async getStatcastData(playerId: string, startDate?: string, endDate?: string): Promise<StatcastData> {
    try {
      const response = await axios.get(`${this.apiUrl}/statcast/${playerId}`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Statcast data:', error);
      throw error;
    }
  }

  // Get advanced pitching metrics
  async getPitchingMetrics(pitcherId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/pitching/advanced/${pitcherId}`);
      return {
        ...response.data,
        pitch_arsenal: await this.getPitchArsenal(pitcherId),
        release_characteristics: await this.getReleaseData(pitcherId),
        pitch_sequencing: await this.getPitchSequencing(pitcherId)
      };
    } catch (error) {
      console.error('Error fetching pitching metrics:', error);
      throw error;
    }
  }

  // Get batting analytics
  async getBattingAnalytics(batterId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/batting/analytics/${batterId}`);
      return {
        ...response.data,
        spray_chart: await this.getSprayChart(batterId),
        plate_discipline: await this.getPlateDiscipline(batterId),
        situational_hitting: await this.getSituationalStats(batterId)
      };
    } catch (error) {
      console.error('Error fetching batting analytics:', error);
      throw error;
    }
  }

  // Get team-level analytics
  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    try {
      const response = await axios.get(`${this.apiUrl}/team/analytics/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      throw error;
    }
  }

  // Get player projections
  async getProjections(playerId: string, system: 'steamer' | 'zips' | 'pecota' = 'steamer'): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/projections/${system}/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projections:', error);
      throw error;
    }
  }

  // Get historical data
  async getHistoricalStats(playerId: string, startYear: number, endYear: number): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/historical/${playerId}`, {
        params: { start_year: startYear, end_year: endYear }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical stats:', error);
      throw error;
    }
  }

  // Advanced sabermetrics calculations
  async calculateSabermetrics(stats: any): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/sabermetrics/calculate`, stats);
      return response.data;
    } catch (error) {
      console.error('Error calculating sabermetrics:', error);
      throw error;
    }
  }

  // Get pitch-by-pitch data
  async getPitchByPitchData(gameId: string): Promise<PitchData[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/game/pitches/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pitch-by-pitch data:', error);
      throw error;
    }
  }

  // Helper methods for specific analytics
  private async getPitchArsenal(pitcherId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/pitching/arsenal/${pitcherId}`);
    return response.data;
  }

  private async getReleaseData(pitcherId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/pitching/release/${pitcherId}`);
    return response.data;
  }

  private async getPitchSequencing(pitcherId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/pitching/sequencing/${pitcherId}`);
    return response.data;
  }

  private async getSprayChart(batterId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/batting/spray/${batterId}`);
    return response.data;
  }

  private async getPlateDiscipline(batterId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/batting/discipline/${batterId}`);
    return response.data;
  }

  private async getSituationalStats(batterId: string): Promise<any> {
    const response = await axios.get(`${this.apiUrl}/batting/situational/${batterId}`);
    return response.data;
  }

  private processPitchData(pitch: PitchData): void {
    // Process and emit pitch data to UI
    window.dispatchEvent(new CustomEvent('pybaseball:pitch', { detail: pitch }));
  }

  private processHitData(hit: any): void {
    // Process and emit hit data to UI
    window.dispatchEvent(new CustomEvent('pybaseball:hit', { detail: hit }));
  }

  private processGameEvent(event: any): void {
    // Process and emit game events to UI
    window.dispatchEvent(new CustomEvent('pybaseball:game_event', { detail: event }));
  }

  // Cleanup
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

// Export singleton instance
export const pybaseball = new PyBaseballIntegration();