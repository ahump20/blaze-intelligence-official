import React, { useState, useRef, useCallback } from 'react';
import { ProcessingJob, AnalysisConfig, AnalysisResult } from '../types/video-intelligence';

interface VideoAnalysisInterfaceProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
}

const VideoAnalysisInterface: React.FC<VideoAnalysisInterfaceProps> = ({
  onAnalysisComplete,
  onError
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    sport: 'baseball',
    trackPlayers: true,
    trackBall: true,
    detectField: true,
    extractMetrics: true,
    realTimeMode: false,
    confidenceThreshold: 0.75,
    outputFormat: 'json'
  });
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      onError?.('Please upload a valid video file (MP4, AVI, MOV, WebM)');
      return;
    }

    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.('File size must be less than 500MB');
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [onError]);

  const startAnalysis = useCallback(async () => {
    if (!uploadedFile) {
      onError?.('Please upload a video file first');
      return;
    }

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', uploadedFile);
      formData.append('config', JSON.stringify(analysisConfig));

      // Start analysis job
      const response = await fetch('/api/video-intelligence/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const { jobId } = await response.json();
      
      // Start polling for progress
      pollJobStatus(jobId);
      
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Analysis failed');
    }
  }, [uploadedFile, analysisConfig, onError]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/video-intelligence/job/${jobId}`);
        const job: ProcessingJob = await response.json();
        
        setCurrentJob(job);

        if (job.status === 'completed' && job.result) {
          setResults(prev => [...prev, job.result!]);
          onAnalysisComplete?.(job.result);
          setCurrentJob(null);
        } else if (job.status === 'failed') {
          onError?.(job.error || 'Analysis failed');
          setCurrentJob(null);
        } else if (job.status === 'processing' || job.status === 'queued') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        onError?.('Failed to check job status');
        setCurrentJob(null);
      }
    };

    poll();
  }, [onAnalysisComplete, onError]);

  const resetAnalysis = useCallback(() => {
    setUploadedFile(null);
    setCurrentJob(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-analysis-interface">
      <div className="interface-header">
        <h2>🎬 Video Intelligence Analysis</h2>
        <p>Upload sports video for AI-powered analysis and insights</p>
      </div>

      <div className="upload-section">
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          {!uploadedFile ? (
            <div className="upload-placeholder">
              <div className="upload-icon">📹</div>
              <h3>Upload Video File</h3>
              <p>Drag and drop or click to select</p>
              <p className="file-types">Supports MP4, AVI, MOV, WebM (max 500MB)</p>
            </div>
          ) : (
            <div className="file-info">
              <div className="file-details">
                <h4>{uploadedFile.name}</h4>
                <p>Size: {formatBytes(uploadedFile.size)}</p>
                <p>Type: {uploadedFile.type}</p>
              </div>
              <button onClick={resetAnalysis} className="remove-file">
                Remove
              </button>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {previewUrl && (
        <div className="video-preview">
          <h3>Video Preview</h3>
          <video
            ref={videoPreviewRef}
            src={previewUrl}
            controls
            className="preview-video"
            onLoadedMetadata={() => {
              const video = videoPreviewRef.current;
              if (video) {
                console.log(`Video duration: ${formatDuration(video.duration)}`);
              }
            }}
          />
        </div>
      )}

      <div className="analysis-config">
        <h3>Analysis Configuration</h3>
        
        <div className="config-grid">
          <div className="config-group">
            <label>Sport</label>
            <select
              value={analysisConfig.sport}
              onChange={(e) => setAnalysisConfig(prev => ({ ...prev, sport: e.target.value }))}
            >
              <option value="baseball">Baseball</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="soccer">Soccer</option>
            </select>
          </div>

          <div className="config-group">
            <label>Confidence Threshold</label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={analysisConfig.confidenceThreshold}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                confidenceThreshold: parseFloat(e.target.value) 
              }))}
            />
            <span>{(analysisConfig.confidenceThreshold * 100).toFixed(0)}%</span>
          </div>

          <div className="config-group">
            <label>Output Format</label>
            <select
              value={analysisConfig.outputFormat}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                outputFormat: e.target.value as 'json' | 'csv' | 'video' 
              }))}
            >
              <option value="json">JSON Data</option>
              <option value="csv">CSV Export</option>
              <option value="video">Annotated Video</option>
            </select>
          </div>
        </div>

        <div className="config-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={analysisConfig.trackPlayers}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                trackPlayers: e.target.checked 
              }))}
            />
            Track Players
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={analysisConfig.trackBall}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                trackBall: e.target.checked 
              }))}
            />
            Track Ball
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={analysisConfig.detectField}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                detectField: e.target.checked 
              }))}
            />
            Detect Field
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={analysisConfig.extractMetrics}
              onChange={(e) => setAnalysisConfig(prev => ({ 
                ...prev, 
                extractMetrics: e.target.checked 
              }))}
            />
            Extract Metrics
          </label>
        </div>
      </div>

      <div className="analysis-controls">
        <button
          onClick={startAnalysis}
          disabled={!uploadedFile || !!currentJob}
          className="analyze-button"
        >
          {currentJob ? 'Analyzing...' : 'Start Analysis'}
        </button>
      </div>

      {currentJob && (
        <div className="analysis-progress">
          <h3>Analysis Progress</h3>
          <div className="progress-info">
            <p>Status: <span className="status">{currentJob.status}</span></p>
            <p>Progress: <span className="progress">{currentJob.progress}%</span></p>
            {currentJob.status === 'processing' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${currentJob.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          {results.map((result, index) => (
            <div key={index} className="result-card">
              <div className="result-header">
                <h4>Analysis #{index + 1}</h4>
                <span className="processing-time">
                  {formatDuration(result.processingTime / 1000)}
                </span>
              </div>
              
              <div className="result-summary">
                <div className="summary-stat">
                  <label>Players Tracked:</label>
                  <span>{result.summary.playerCount}</span>
                </div>
                <div className="summary-stat">
                  <label>Avg Player Speed:</label>
                  <span>{result.summary.avgPlayerVelocity.toFixed(1)} mph</span>
                </div>
                <div className="summary-stat">
                  <label>Max Player Speed:</label>
                  <span>{result.summary.maxPlayerVelocity.toFixed(1)} mph</span>
                </div>
                {result.summary.ballVelocity && (
                  <div className="summary-stat">
                    <label>Ball Speed:</label>
                    <span>{result.summary.ballVelocity.toFixed(1)} mph</span>
                  </div>
                )}
              </div>

              <div className="key-moments">
                <h5>Key Moments ({result.summary.keyMoments.length})</h5>
                {result.summary.keyMoments.slice(0, 3).map((moment, idx) => (
                  <div key={idx} className="moment">
                    <span className="timestamp">{formatDuration(moment.timestamp)}</span>
                    <span className="description">{moment.description}</span>
                    <span className="confidence">{(moment.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              <div className="insights">
                <h5>AI Insights</h5>
                <ul>
                  {result.summary.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .video-analysis-interface {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
          color: white;
          border-radius: 12px;
        }

        .interface-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .interface-header h2 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .upload-section {
          margin-bottom: 30px;
        }

        .upload-area {
          border: 2px dashed #BF5700;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-area:hover {
          border-color: #e67e00;
          background: rgba(191, 87, 0, 0.05);
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .upload-placeholder h3 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .file-types {
          color: #888;
          font-size: 14px;
        }

        .file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-details h4 {
          margin: 0 0 5px 0;
          color: #BF5700;
        }

        .remove-file {
          background: #ff4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .video-preview {
          margin-bottom: 30px;
        }

        .preview-video {
          width: 100%;
          max-height: 400px;
          border-radius: 8px;
        }

        .analysis-config {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .config-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .config-group label {
          color: #BF5700;
          font-weight: bold;
        }

        .config-group select,
        .config-group input[type="range"] {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .config-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .analysis-controls {
          text-align: center;
          margin-bottom: 30px;
        }

        .analyze-button {
          background: #BF5700;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .analyze-button:hover:not(:disabled) {
          background: #e67e00;
        }

        .analyze-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analysis-progress {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }

        .progress-fill {
          height: 100%;
          background: #BF5700;
          transition: width 0.3s ease;
        }

        .status {
          color: #BF5700;
          text-transform: capitalize;
        }

        .progress {
          color: #BF5700;
          font-weight: bold;
        }

        .analysis-results {
          margin-top: 30px;
        }

        .result-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result-header h4 {
          margin: 0;
          color: #BF5700;
        }

        .processing-time {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .result-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-stat label {
          color: #888;
          font-size: 14px;
        }

        .summary-stat span {
          color: #BF5700;
          font-weight: bold;
          font-size: 16px;
        }

        .key-moments {
          margin-bottom: 20px;
        }

        .key-moments h5 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .moment {
          display: grid;
          grid-template-columns: 60px 1fr 60px;
          gap: 10px;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .moment .timestamp {
          color: #BF5700;
          font-size: 12px;
          font-weight: bold;
        }

        .moment .confidence {
          color: #4CAF50;
          font-size: 12px;
          text-align: right;
        }

        .insights h5 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .insights ul {
          margin: 0;
          padding-left: 20px;
        }

        .insights li {
          margin-bottom: 5px;
          color: #ccc;
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysisInterface;