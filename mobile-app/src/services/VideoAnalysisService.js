/**
 * Video Analysis Service
 * Handles video upload and analysis coordination with backend
 */

import axios from 'axios';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.blaze-intelligence.com';

export class VideoAnalysisService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async analyzeVideo(videoPath, sport) {
    try {
      // First, upload the video
      const uploadUrl = await this.getUploadUrl();
      const videoFile = await this.prepareVideoFile(videoPath);
      
      // Upload to S3
      await this.uploadToS3(uploadUrl, videoFile);
      
      // Start analysis
      const analysisResult = await this.startAnalysis({
        videoUrl: uploadUrl.split('?')[0], // Remove query params
        sport: sport,
        timestamp: new Date().toISOString(),
        device: Platform.OS,
      });
      
      return analysisResult;
    } catch (error) {
      console.error('Video analysis error:', error);
      throw error;
    }
  }

  async getUploadUrl() {
    const response = await this.apiClient.post('/api/video/upload-url', {
      fileType: 'video/mp4',
      purpose: 'training-analysis'
    });
    return response.data.uploadUrl;
  }

  async prepareVideoFile(videoPath) {
    const fileStats = await RNFS.stat(videoPath);
    const fileData = await RNFS.readFile(videoPath, 'base64');
    
    return {
      name: `video_${Date.now()}.mp4`,
      type: 'video/mp4',
      size: fileStats.size,
      data: fileData,
      path: videoPath
    };
  }

  async uploadToS3(uploadUrl, videoFile) {
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'ios' ? videoFile.path.replace('file://', '') : videoFile.path,
      type: videoFile.type,
      name: videoFile.name,
    });

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
      headers: {
        'Content-Type': videoFile.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload video to S3');
    }

    return response;
  }

  async startAnalysis(metadata) {
    const response = await this.apiClient.post('/api/video/analyze', {
      ...metadata,
      analysisTypes: [
        'biomechanics',
        'micro-expressions',
        'form-assessment',
        'character-metrics',
        'performance-prediction'
      ]
    });

    return response.data;
  }

  async getAnalysisStatus(analysisId) {
    const response = await this.apiClient.get(`/api/video/analysis/${analysisId}/status`);
    return response.data;
  }

  async getAnalysisResults(analysisId) {
    const response = await this.apiClient.get(`/api/video/analysis/${analysisId}/results`);
    return response.data;
  }

  // Real-time analysis simulation for demo
  simulateRealtimeAnalysis() {
    return {
      biomechanics: {
        hipRotation: Math.floor(75 + Math.random() * 25),
        shoulderAlignment: Math.floor(70 + Math.random() * 30),
        kneeFlexion: Math.floor(65 + Math.random() * 35),
        spineAngle: Math.floor(80 + Math.random() * 20),
      },
      microExpressions: {
        confidence: Math.floor(60 + Math.random() * 40),
        focus: Math.floor(70 + Math.random() * 30),
        determination: Math.floor(75 + Math.random() * 25),
        composure: Math.floor(65 + Math.random() * 35),
      },
      blazeScore: Math.floor(70 + Math.random() * 30),
      championshipPotential: Math.floor(60 + Math.random() * 40),
    };
  }
}

export default VideoAnalysisService;