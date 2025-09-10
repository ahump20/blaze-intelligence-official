/**
 * VideoAnalysisService Tests
 */

const VideoAnalysisService = require('../src/services/VideoAnalysisService').default;

// Mock dependencies
jest.mock('react-native-fs', () => ({
  stat: jest.fn(() => Promise.resolve({ size: 1024000 })),
  readFile: jest.fn(() => Promise.resolve('mock-base64-data'))
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(() => Promise.resolve({ 
      data: { 
        uploadUrl: 'https://mock-s3-url.com/video.mp4?signature=mock',
        analysisId: 'analysis_123'
      } 
    })),
    get: jest.fn(() => Promise.resolve({ 
      data: { 
        status: 'completed',
        results: {
          blazeScore: 85,
          biomechanics: { hipRotation: 92 },
          microExpressions: { confidence: 88 }
        }
      } 
    }))
  }))
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200
  })
);

describe('VideoAnalysisService', () => {
  let service;

  beforeEach(() => {
    service = new VideoAnalysisService();
    jest.clearAllMocks();
  });

  test('should analyze video successfully', async () => {
    const mockVideoPath = '/path/to/video.mp4';
    const mockSport = 'baseball';

    const result = await service.analyzeVideo(mockVideoPath, mockSport);

    expect(result).toBeDefined();
    expect(result.blazeScore).toBeGreaterThan(0);
  });

  test('should prepare video file correctly', async () => {
    const mockVideoPath = '/path/to/video.mp4';
    
    const fileData = await service.prepareVideoFile(mockVideoPath);

    expect(fileData).toHaveProperty('name');
    expect(fileData).toHaveProperty('type', 'video/mp4');
    expect(fileData).toHaveProperty('size');
    expect(fileData).toHaveProperty('data');
  });

  test('should simulate realtime analysis', () => {
    const realtimeData = service.simulateRealtimeAnalysis();

    expect(realtimeData).toHaveProperty('biomechanics');
    expect(realtimeData).toHaveProperty('microExpressions');
    expect(realtimeData).toHaveProperty('blazeScore');
    expect(realtimeData).toHaveProperty('championshipPotential');

    // Check value ranges
    expect(realtimeData.blazeScore).toBeGreaterThanOrEqual(70);
    expect(realtimeData.blazeScore).toBeLessThanOrEqual(100);
  });

  test('should handle upload errors gracefully', async () => {
    // Mock a failed upload
    global.fetch = jest.fn(() => Promise.reject(new Error('Upload failed')));

    const mockVideoPath = '/path/to/video.mp4';
    const mockSport = 'football';

    await expect(service.analyzeVideo(mockVideoPath, mockSport))
      .rejects.toThrow('Upload failed');
  });

  test('should get analysis status', async () => {
    const analysisId = 'analysis_123';
    
    const status = await service.getAnalysisStatus(analysisId);

    expect(status).toHaveProperty('status', 'completed');
  });

  test('should get analysis results', async () => {
    const analysisId = 'analysis_123';
    
    const results = await service.getAnalysisResults(analysisId);

    expect(results).toHaveProperty('results');
    expect(results.results).toHaveProperty('blazeScore');
    expect(results.results).toHaveProperty('biomechanics');
    expect(results.results).toHaveProperty('microExpressions');
  });
});