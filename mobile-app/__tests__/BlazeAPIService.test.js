/**
 * BlazeAPIService Tests
 */

const BlazeAPIService = require('../src/services/BlazeAPIService').default;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => {
    const storage = {
      'authToken': 'mock-token-123',
      'userProfile': JSON.stringify({
        id: 'user_123',
        name: 'Test User',
        blazeScore: 85
      })
    };
    return Promise.resolve(storage[key]);
  }),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve())
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    post: jest.fn(() => Promise.resolve({ 
      data: { 
        success: true,
        token: 'new-token-456',
        user: { id: 'user_123', name: 'Test User' }
      } 
    })),
    get: jest.fn(() => Promise.resolve({
      data: {
        Cardinals: { blazeScore: 152, wins: 85, losses: 77 },
        status: 'active'
      }
    })),
    put: jest.fn(() => Promise.resolve({
      data: { success: true, message: 'Updated successfully' }
    }))
  }))
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null
}));

describe('BlazeAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should login successfully', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const result = await BlazeAPIService.login(email, password);

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
  });

  test('should get MLB data', async () => {
    const team = 'Cardinals';
    
    const data = await BlazeAPIService.getMLBData(team);

    expect(data).toHaveProperty('Cardinals');
    expect(data.Cardinals).toHaveProperty('blazeScore');
  });

  test('should get NFL data', async () => {
    const team = 'Titans';
    
    const data = await BlazeAPIService.getNFLData(team);

    expect(data).toBeDefined();
  });

  test('should get NBA data', async () => {
    const team = 'Grizzlies';
    
    const data = await BlazeAPIService.getNBAData(team);

    expect(data).toBeDefined();
  });

  test('should get NCAA data', async () => {
    const team = 'Longhorns';
    
    const data = await BlazeAPIService.getNCAAData(team);

    expect(data).toBeDefined();
  });

  test('should upload video', async () => {
    const mockVideoFile = {
      uri: '/path/to/video.mp4',
      type: 'video/mp4',
      name: 'test-video.mp4'
    };

    const result = await BlazeAPIService.uploadVideo(mockVideoFile);

    expect(result).toBeDefined();
  });

  test('should calculate Blaze Score', async () => {
    const performanceData = {
      biomechanics: { hipRotation: 85, shoulderAlignment: 90 },
      microExpressions: { confidence: 88, focus: 92 },
      sport: 'baseball'
    };

    const result = await BlazeAPIService.calculateBlazeScore(performanceData);

    expect(result).toBeDefined();
  });

  test('should connect WebSocket', () => {
    const mockOnMessage = jest.fn();
    
    BlazeAPIService.connectWebSocket(mockOnMessage);

    expect(WebSocket).toHaveBeenCalled();
  });

  test('should subscribe to sports data', () => {
    const mockOnMessage = jest.fn();
    BlazeAPIService.connectWebSocket(mockOnMessage);
    
    BlazeAPIService.subscribeToSportsData(['MLB', 'NFL']);

    // WebSocket send should be called for subscription
    const wsInstance = WebSocket.mock.instances[0];
    expect(wsInstance.send).toHaveBeenCalled();
  });

  test('should handle health check', async () => {
    const health = await BlazeAPIService.healthCheck();

    expect(health).toBeDefined();
  });

  test('should calculate NIL value', async () => {
    const athleteData = {
      sport: 'football',
      position: 'QB',
      stats: { completions: 250, yards: 3500, touchdowns: 28 },
      socialFollowing: 15000
    };

    const result = await BlazeAPIService.calculateNILValue(athleteData);

    expect(result).toBeDefined();
  });

  test('should logout and clear data', async () => {
    await BlazeAPIService.logout();

    // Should disconnect WebSocket and clear storage
    expect(BlazeAPIService.wsClient).toBeNull();
  });
});