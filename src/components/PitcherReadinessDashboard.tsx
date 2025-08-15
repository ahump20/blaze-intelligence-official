// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Badge,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Sports as SportsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Line, Doughnut as Gauge, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface PitcherReadiness {
  pitcher_id: string;
  pitcher_name: string;
  readiness_index: number;
  fatigue_index: number;
  risk_index: number;
  confidence: number;
  status_band: 'GREEN' | 'YELLOW' | 'RED';
  expected_cap: number;
  role_fit: 'STARTER' | 'RELIEVER_HIGH_LEV' | 'RELIEVER_LOW_LEV' | 'REHAB';
  data_freshness_ms: number;
  late_data_frac_5m: number;
  calibration_confidence: number;
  last_updated: string;
  drivers_top3: string[];
  recommendations: string[];
}

interface FeatureMetrics {
  velo_delta_5: number;
  spin_consistency_20: number;
  release_height_var_25: number;
  command_var_20: number;
  tempo_ewma: number;
  env_adjusted_vbreak: number;
  feature_qa_min_5m: number;
}

interface CalibrationStatus {
  venue_id: string;
  confidence: number;
  last_calibration: string;
  action: 'NONE' | 'REBASELINE' | 'FALLBACK' | 'ALERT';
  minutes_since_calibration: number;
}

interface AlertItem {
  id: string;
  pitcher_id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  timestamp: string;
}

const PitcherReadinessDashboard: React.FC = () => {
  const [pitchers, setPitchers] = useState<PitcherReadiness[]>([]);
  const [selectedPitcher, setSelectedPitcher] = useState<string>('STL_656427'); // Default to Helsley
  const [featureMetrics, setFeatureMetrics] = useState<FeatureMetrics | null>(null);
  const [calibrationStatus, setCalibrationStatus] = useState<CalibrationStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pitcher readiness data
      const pitchersResponse = await fetch('/api/pitcher-readiness');
      if (!pitchersResponse.ok) throw new Error('Failed to fetch pitcher data');
      const pitchersData = await pitchersResponse.json();
      setPitchers(pitchersData);

      // Fetch feature metrics for selected pitcher
      if (selectedPitcher) {
        const metricsResponse = await fetch(`/api/pitcher-readiness/${selectedPitcher}/features`);
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setFeatureMetrics(metricsData);
        }
      }

      // Fetch calibration status
      const calibrationResponse = await fetch('/api/calibration/busch_iii');
      if (calibrationResponse.ok) {
        const calibrationData = await calibrationResponse.json();
        setCalibrationStatus(calibrationData);
      }

      // Fetch alerts
      const alertsResponse = await fetch('/api/alerts?active=true');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedPitcher]);

  // Real-time WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/pitcher-readiness`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'readiness_update':
          setPitchers(prev => 
            prev.map(p => 
              p.pitcher_id === data.pitcher_id 
                ? { ...p, ...data.data }
                : p
            )
          );
          break;
        case 'calibration_update':
          setCalibrationStatus(data.data);
          break;
        case 'alert':
          setAlerts(prev => [data.data, ...prev.slice(0, 9)]);
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, []);

  // Initial data fetch and periodic refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return '#4caf50';
      case 'YELLOW': return '#ff9800';
      case 'RED': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const selectedPitcherData = pitchers.find(p => p.pitcher_id === selectedPitcher);

  if (loading && pitchers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Pitcher Readiness Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <SportsIcon sx={{ fontSize: 40, color: '#c41e3a', mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Cardinals Pitcher Readiness
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Busch Stadium • Real-time Analytics
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Last Update: {formatTimestamp(lastUpdate.toISOString())}
          </Typography>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {/* Connection Status */}
          <Chip
            icon={ws ? <CheckCircleIcon /> : <ErrorIcon />}
            label={ws ? "Live" : "Offline"}
            color={ws ? "success" : "error"}
            size="small"
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Calibration Status Alert */}
      {calibrationStatus && calibrationStatus.confidence < 0.8 && (
        <Alert 
          severity={calibrationStatus.confidence < 0.6 ? "error" : "warning"} 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          Calibration Alert: Confidence at {(calibrationStatus.confidence * 100).toFixed(1)}% 
          ({calibrationStatus.minutes_since_calibration} min since last calibration)
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pitcher Selection & Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Pitchers
              </Typography>
              
              {pitchers.map((pitcher) => (
                <Box
                  key={pitcher.pitcher_id}
                  onClick={() => setSelectedPitcher(pitcher.pitcher_id)}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: selectedPitcher === pitcher.pitcher_id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: selectedPitcher === pitcher.pitcher_id ? 'action.selected' : 'transparent',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {pitcher.pitcher_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pitcher.role_fit}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={pitcher.status_band}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(pitcher.status_band),
                          color: 'white'
                        }}
                      />
                      
                      {pitcher.data_freshness_ms > 5000 && (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                    </Box>
                  </Box>
                  
                  <Box mt={1}>
                    <Typography variant="caption" display="block">
                      Readiness: {pitcher.readiness_index}% | 
                      Fatigue: {pitcher.fatigue_index}% | 
                      Risk: {pitcher.risk_index}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              
              {calibrationStatus && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Camera Calibration
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calibrationStatus.confidence * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.300',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: calibrationStatus.confidence > 0.8 ? '#4caf50' : 
                                       calibrationStatus.confidence > 0.6 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                  <Typography variant="caption">
                    {(calibrationStatus.confidence * 100).toFixed(1)}% confidence
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Data Quality
                </Typography>
                {selectedPitcherData && (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={(1 - selectedPitcherData.late_data_frac_5m) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.300'
                      }}
                    />
                    <Typography variant="caption">
                      {((1 - selectedPitcherData.late_data_frac_5m) * 100).toFixed(1)}% on-time data
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Dashboard */}
        <Grid item xs={12} md={8}>
          {selectedPitcherData && (
            <>
              {/* Readiness Metrics */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {selectedPitcherData.readiness_index}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Readiness Index
                      </Typography>
                      <Box mt={1}>
                        {selectedPitcherData.readiness_index >= 80 ? (
                          <TrendingUpIcon color="success" />
                        ) : (
                          <TrendingDownIcon color="error" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {selectedPitcherData.fatigue_index}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fatigue Index
                      </Typography>
                      <Box mt={1}>
                        <Chip 
                          label={selectedPitcherData.expected_cap + " pitches"}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main" fontWeight="bold">
                        {selectedPitcherData.risk_index}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Risk Index
                      </Typography>
                      <Typography variant="caption" display="block" mt={1}>
                        Confidence: {(selectedPitcherData.confidence * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Feature Metrics */}
              {featureMetrics && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Live Performance Metrics
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="h6" color={featureMetrics.velo_delta_5 < -1 ? 'error' : 'primary'}>
                            {featureMetrics.velo_delta_5.toFixed(1)} mph
                          </Typography>
                          <Typography variant="caption">Velocity Delta (5-pitch)</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="h6" color={featureMetrics.spin_consistency_20 > 0.15 ? 'warning' : 'primary'}>
                            {(featureMetrics.spin_consistency_20 * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption">Spin Consistency (20-pitch)</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="h6" color={featureMetrics.command_var_20 > 1.5 ? 'warning' : 'primary'}>
                            {featureMetrics.command_var_20.toFixed(2)} ft²
                          </Typography>
                          <Typography variant="caption">Command Variance</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6} md={3}>
                        <Box textAlign="center">
                          <Typography variant="h6" color="primary">
                            {featureMetrics.tempo_ewma.toFixed(1)}s
                          </Typography>
                          <Typography variant="caption">Pitch Tempo</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Recommendations
                  </Typography>
                  
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {selectedPitcherData.drivers_top3.map((driver, index) => (
                      <Chip
                        key={index}
                        label={driver}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  
                  {selectedPitcherData.recommendations.map((rec, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {rec}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </Grid>

        {/* Alerts Panel */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Active Alerts
                </Typography>
                <Badge badgeContent={alerts.length} color="error">
                  <WarningIcon color="action" />
                </Badge>
              </Box>
              
              {alerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No active alerts
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Pitcher</TableCell>
                        <TableCell>Alert Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Message</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts.slice(0, 5).map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                          <TableCell>
                            {pitchers.find(p => p.pitcher_id === alert.pitcher_id)?.pitcher_name || alert.pitcher_id}
                          </TableCell>
                          <TableCell>{alert.alert_type}</TableCell>
                          <TableCell>
                            <Chip
                              label={alert.severity}
                              size="small"
                              color={getSeverityColor(alert.severity) as any}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{alert.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PitcherReadinessDashboard;