/**
 * Blaze Vision AI Test Suite
 * Tests for biomechanical analysis, micro-expression detection, and character assessment
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import BlazeVisionAI from '../austin-portfolio-deploy/js/blaze-vision-ai.js';

// Mock MediaPipe models
const mockPose = {
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn()
};

const mockFaceMesh = {
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn()
};

// Mock global objects
global.Pose = jest.fn(() => mockPose);
global.FaceMesh = jest.fn(() => mockFaceMesh);
global.Camera = jest.fn();

describe('BlazeVisionAI', () => {
    let blazeVisionAI;
    
    beforeEach(() => {
        blazeVisionAI = new BlazeVisionAI();
        
        // Mock DOM elements
        document.body.innerHTML = `
            <video id="video-input"></video>
            <canvas id="output-canvas"></canvas>
            <div id="biomechanical-metrics"></div>
            <div id="micro-expression-metrics"></div>
            <div id="character-metrics"></div>
        `;
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            await blazeVisionAI.initialize();
            
            expect(blazeVisionAI.isInitialized).toBe(true);
            expect(global.Pose).toHaveBeenCalled();
            expect(global.FaceMesh).toHaveBeenCalled();
        });
        
        it('should set correct model options', async () => {
            await blazeVisionAI.initialize();
            
            expect(mockPose.setOptions).toHaveBeenCalledWith({
                modelComplexity: 2,
                smoothLandmarks: true,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });
            
            expect(mockFaceMesh.setOptions).toHaveBeenCalledWith({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });
        });
    });
    
    describe('Biomechanical Analysis', () => {
        const mockLandmarks = [
            // Generate 33 pose landmarks
            ...Array(33).fill(null).map((_, i) => ({
                x: Math.random(),
                y: Math.random(),
                z: Math.random(),
                visibility: Math.random()
            }))
        ];
        
        it('should calculate hip rotation correctly', () => {
            const rotation = blazeVisionAI.calculateHipRotation(mockLandmarks);
            
            expect(rotation).toBeGreaterThanOrEqual(0);
            expect(rotation).toBeLessThanOrEqual(180);
        });
        
        it('should calculate shoulder tilt', () => {
            const tilt = blazeVisionAI.calculateShoulderTilt(mockLandmarks);
            
            expect(tilt).toBeGreaterThanOrEqual(-180);
            expect(tilt).toBeLessThanOrEqual(180);
        });
        
        it('should calculate knee flexion angle', () => {
            const flexion = blazeVisionAI.calculateKneeFlexion(mockLandmarks);
            
            expect(flexion).toBeGreaterThanOrEqual(0);
            expect(flexion).toBeLessThanOrEqual(180);
        });
        
        it('should calculate elbow angle for throwing mechanics', () => {
            const angle = blazeVisionAI.calculateElbowAngle(mockLandmarks);
            
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(180);
        });
        
        it('should calculate center of gravity', () => {
            const cog = blazeVisionAI.calculateCenterOfGravity(mockLandmarks);
            
            expect(cog).toHaveProperty('x');
            expect(cog).toHaveProperty('y');
            expect(cog.x).toBeGreaterThanOrEqual(0);
            expect(cog.x).toBeLessThanOrEqual(1);
            expect(cog.y).toBeGreaterThanOrEqual(0);
            expect(cog.y).toBeLessThanOrEqual(1);
        });
        
        it('should calculate balance score', () => {
            const balance = blazeVisionAI.calculateBalance(mockLandmarks);
            
            expect(balance).toBeGreaterThanOrEqual(0);
            expect(balance).toBeLessThanOrEqual(100);
        });
        
        it('should calculate form score', () => {
            const metrics = blazeVisionAI.analyzeBiomechanics(mockLandmarks);
            
            expect(metrics.formScore).toBeGreaterThanOrEqual(0);
            expect(metrics.formScore).toBeLessThanOrEqual(100);
        });
        
        it('should identify optimal hip rotation for baseball swing', () => {
            // Set specific landmarks for optimal swing
            const optimalLandmarks = [...mockLandmarks];
            // Simulate 35-degree hip rotation (optimal range: 30-45)
            optimalLandmarks[23] = { x: 0.4, y: 0.5 }; // Left hip
            optimalLandmarks[24] = { x: 0.6, y: 0.5 }; // Right hip
            optimalLandmarks[11] = { x: 0.35, y: 0.3 }; // Left shoulder
            optimalLandmarks[12] = { x: 0.65, y: 0.3 }; // Right shoulder
            
            const rotation = blazeVisionAI.calculateHipRotation(optimalLandmarks);
            const metrics = blazeVisionAI.analyzeBiomechanics(optimalLandmarks);
            
            expect(rotation).toBeGreaterThanOrEqual(30);
            expect(rotation).toBeLessThanOrEqual(45);
            expect(metrics.formScore).toBeGreaterThan(70); // Good form
        });
    });
    
    describe('Micro-Expression Analysis', () => {
        const mockFaceLandmarks = [
            // Generate 468 face landmarks
            ...Array(468).fill(null).map((_, i) => ({
                x: Math.random(),
                y: Math.random(),
                z: Math.random()
            }))
        ];
        
        it('should calculate eye openness', () => {
            const openness = blazeVisionAI.calculateEyeOpenness(mockFaceLandmarks);
            
            expect(openness).toBeGreaterThanOrEqual(0);
            expect(typeof openness).toBe('number');
        });
        
        it('should track blink rate', () => {
            const blinkRate = blazeVisionAI.trackBlinkRate(mockFaceLandmarks);
            
            expect(blinkRate).toBeGreaterThanOrEqual(0);
            expect(blinkRate).toBeLessThanOrEqual(60); // Normal range: 10-20 blinks/min
        });
        
        it('should calculate gaze direction', () => {
            const gaze = blazeVisionAI.calculateGazeDirection(mockFaceLandmarks);
            
            expect(gaze).toHaveProperty('horizontal');
            expect(gaze).toHaveProperty('vertical');
            expect(gaze.horizontal).toBeGreaterThanOrEqual(0);
            expect(gaze.horizontal).toBeLessThanOrEqual(1);
        });
        
        it('should calculate mouth curvature for emotion', () => {
            const curvature = blazeVisionAI.calculateMouthCurvature(mockFaceLandmarks);
            
            expect(typeof curvature).toBe('number');
            // Positive = smile, Negative = frown
        });
        
        it('should calculate jaw tension', () => {
            const tension = blazeVisionAI.calculateJawTension(mockFaceLandmarks);
            
            expect(tension).toBeGreaterThanOrEqual(0);
            expect(typeof tension).toBe('number');
        });
        
        it('should calculate eyebrow height', () => {
            const height = blazeVisionAI.calculateEyebrowHeight(mockFaceLandmarks);
            
            expect(height).toBeGreaterThanOrEqual(0);
            expect(typeof height).toBe('number');
        });
        
        it('should calculate eyebrow furrow', () => {
            const furrow = blazeVisionAI.calculateEyebrowFurrow(mockFaceLandmarks);
            
            expect(furrow).toBeGreaterThanOrEqual(0);
            expect(typeof furrow).toBe('number');
        });
        
        it('should analyze complete micro-expressions', () => {
            const expressions = blazeVisionAI.analyzeMicroExpressions(mockFaceLandmarks);
            
            expect(expressions).toHaveProperty('eyeOpenness');
            expect(expressions).toHaveProperty('blinkRate');
            expect(expressions).toHaveProperty('gazeDirection');
            expect(expressions).toHaveProperty('mouthCurvature');
            expect(expressions).toHaveProperty('jawTension');
            expect(expressions).toHaveProperty('eyebrowHeight');
            expect(expressions).toHaveProperty('eyebrowFurrow');
        });
    });
    
    describe('Character Assessment', () => {
        const mockExpressions = {
            eyeOpenness: 30,
            blinkRate: 15,
            gazeDirection: { horizontal: 0.5, vertical: 0.5 },
            mouthCurvature: -5,
            jawTension: 40,
            eyebrowHeight: 25,
            eyebrowFurrow: 35
        };
        
        it('should calculate determination score', () => {
            const determination = blazeVisionAI.calculateDetermination(mockExpressions);
            
            expect(determination).toBeGreaterThanOrEqual(0);
            expect(determination).toBeLessThanOrEqual(100);
        });
        
        it('should calculate focus score', () => {
            const focus = blazeVisionAI.calculateFocus(mockExpressions);
            
            expect(focus).toBeGreaterThanOrEqual(0);
            expect(focus).toBeLessThanOrEqual(100);
        });
        
        it('should calculate confidence score', () => {
            const confidence = blazeVisionAI.calculateConfidence(mockExpressions);
            
            expect(confidence).toBeGreaterThanOrEqual(0);
            expect(confidence).toBeLessThanOrEqual(100);
        });
        
        it('should calculate grit score', () => {
            const determination = 75;
            const grit = blazeVisionAI.calculateGrit(mockExpressions, determination);
            
            expect(grit).toBeGreaterThanOrEqual(0);
            expect(grit).toBeLessThanOrEqual(100);
        });
        
        it('should calculate coachability', () => {
            const coachability = blazeVisionAI.calculateCoachability(mockExpressions);
            
            expect(coachability).toBeGreaterThanOrEqual(0);
            expect(coachability).toBeLessThanOrEqual(100);
        });
        
        it('should calculate pressure response', () => {
            const response = blazeVisionAI.calculatePressureResponse(mockExpressions);
            
            expect(response).toBeGreaterThanOrEqual(0);
            expect(response).toBeLessThanOrEqual(100);
        });
        
        it('should calculate competitiveness', () => {
            const competitiveness = blazeVisionAI.calculateCompetitiveness(mockExpressions);
            
            expect(competitiveness).toBeGreaterThanOrEqual(0);
            expect(competitiveness).toBeLessThanOrEqual(100);
        });
        
        it('should calculate championship mindset score', () => {
            const traits = blazeVisionAI.assessCharacter(mockExpressions);
            
            expect(traits.championshipMindset).toBeGreaterThanOrEqual(0);
            expect(traits.championshipMindset).toBeLessThanOrEqual(100);
        });
        
        it('should assess complete character profile', () => {
            const traits = blazeVisionAI.assessCharacter(mockExpressions);
            
            expect(traits).toHaveProperty('grit');
            expect(traits).toHaveProperty('determination');
            expect(traits).toHaveProperty('focus');
            expect(traits).toHaveProperty('confidence');
            expect(traits).toHaveProperty('coachability');
            expect(traits).toHaveProperty('leadershipPotential');
            expect(traits).toHaveProperty('pressureResponse');
            expect(traits).toHaveProperty('competitiveness');
            expect(traits).toHaveProperty('mentalToughness');
            expect(traits).toHaveProperty('championshipMindset');
            
            // All values should be percentages
            Object.values(traits).forEach(value => {
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(100);
            });
        });
        
        it('should identify championship-level traits', () => {
            // Simulate expressions of a champion athlete
            const championExpressions = {
                eyeOpenness: 45, // Focused but alert
                blinkRate: 12, // Low blink rate = high focus
                gazeDirection: { horizontal: 0.5, vertical: 0.5 }, // Centered gaze
                mouthCurvature: 5, // Slight confidence smile
                jawTension: 35, // Moderate tension = determination
                eyebrowHeight: 20, // Relaxed but engaged
                eyebrowFurrow: 25 // Some concentration
            };
            
            const traits = blazeVisionAI.assessCharacter(championExpressions);
            
            expect(traits.championshipMindset).toBeGreaterThan(60);
            expect(traits.focus).toBeGreaterThan(50);
            expect(traits.determination).toBeGreaterThan(40);
        });
    });
    
    describe('Blaze Score Calculation', () => {
        it('should calculate overall Blaze Score', () => {
            blazeVisionAI.metrics = {
                biomechanical: { formScore: 85 },
                character: { 
                    championshipMindset: 75,
                    focus: 80
                }
            };
            
            const blazeScore = blazeVisionAI.calculateBlazeScore();
            
            expect(blazeScore).toBeGreaterThanOrEqual(0);
            expect(blazeScore).toBeLessThanOrEqual(100);
            expect(blazeScore).toBe(Math.round(85 * 0.4 + 75 * 0.4 + 80 * 0.2));
        });
    });
    
    describe('Export Functionality', () => {
        it('should export complete metrics', () => {
            blazeVisionAI.metrics = {
                biomechanical: { formScore: 85 },
                microExpression: { eyeOpenness: 30 },
                character: { championshipMindset: 75 }
            };
            
            const exported = blazeVisionAI.exportMetrics();
            
            expect(exported).toHaveProperty('timestamp');
            expect(exported).toHaveProperty('biomechanical');
            expect(exported).toHaveProperty('microExpression');
            expect(exported).toHaveProperty('character');
            expect(exported).toHaveProperty('blazeScore');
            
            expect(new Date(exported.timestamp)).toBeInstanceOf(Date);
        });
    });
    
    describe('Score Range Validation', () => {
        it('should score within optimal range correctly', () => {
            const score1 = blazeVisionAI.scoreInRange(35, 30, 45, 60); // Within range
            expect(score1).toBe(100);
            
            const score2 = blazeVisionAI.scoreInRange(25, 30, 45, 60); // Below range
            expect(score2).toBeLessThan(100);
            expect(score2).toBeGreaterThan(0);
            
            const score3 = blazeVisionAI.scoreInRange(50, 30, 45, 60); // Above range
            expect(score3).toBeLessThan(100);
            expect(score3).toBeGreaterThan(0);
            
            const score4 = blazeVisionAI.scoreInRange(100, 30, 45, 60); // Far outside
            expect(score4).toBe(0);
        });
    });
    
    describe('UI Updates', () => {
        beforeEach(() => {
            blazeVisionAI = new BlazeVisionAI();
        });
        
        it('should update biomechanical display', () => {
            const metrics = {
                formScore: 85,
                hipRotation: 35.5,
                shoulderTilt: 15.2,
                balance: 92,
                explosiveness: 88
            };
            
            blazeVisionAI.updateBiomechanicalDisplay(metrics);
            
            const display = document.getElementById('biomechanical-metrics');
            expect(display.innerHTML).toContain('85/100');
            expect(display.innerHTML).toContain('35.5°');
            expect(display.innerHTML).toContain('92%');
        });
        
        it('should update micro-expression display', () => {
            const expressions = {
                eyeOpenness: 30,
                jawTension: 45,
                eyebrowFurrow: 25
            };
            
            blazeVisionAI.updateMicroExpressionDisplay(expressions);
            
            const display = document.getElementById('micro-expression-metrics');
            expect(display.innerHTML).toContain('30');
            expect(display.innerHTML).toContain('45');
            expect(display.innerHTML).toContain('25');
        });
        
        it('should update character display', () => {
            const traits = {
                championshipMindset: 78,
                grit: 82,
                determination: 75,
                focus: 88,
                mentalToughness: 80,
                pressureResponse: 70
            };
            
            blazeVisionAI.updateCharacterDisplay(traits);
            
            const display = document.getElementById('character-metrics');
            expect(display.innerHTML).toContain('78/100');
            expect(display.innerHTML).toContain('82%');
            expect(display.innerHTML).toContain('88%');
        });
    });
});

describe('Integration Tests', () => {
    it('should process complete analysis pipeline', async () => {
        const blazeVisionAI = new BlazeVisionAI();
        await blazeVisionAI.initialize();
        
        // Simulate pose results
        const poseResults = {
            poseLandmarks: Array(33).fill(null).map(() => ({
                x: Math.random(),
                y: Math.random(),
                z: Math.random()
            })),
            image: new Image()
        };
        
        blazeVisionAI.processPoseResults(poseResults);
        
        expect(blazeVisionAI.metrics.biomechanical).toBeDefined();
        expect(blazeVisionAI.metrics.biomechanical.formScore).toBeGreaterThanOrEqual(0);
        
        // Simulate face results
        const faceResults = {
            multiFaceLandmarks: [
                Array(468).fill(null).map(() => ({
                    x: Math.random(),
                    y: Math.random(),
                    z: Math.random()
                }))
            ]
        };
        
        blazeVisionAI.processFaceResults(faceResults);
        
        expect(blazeVisionAI.metrics.microExpression).toBeDefined();
        expect(blazeVisionAI.metrics.character).toBeDefined();
        expect(blazeVisionAI.metrics.character.championshipMindset).toBeGreaterThanOrEqual(0);
    });
});