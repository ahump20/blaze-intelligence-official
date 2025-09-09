// Advanced Biometric Visualization Shaders for Lone Star Legends
// GPU-accelerated rendering for Champion Enigma metrics

export const BiometricShaders = {
    // Champion Aura Vertex Shader
    championAuraVertex: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        uniform float auraIntensity;
        
        void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            // Pulsing aura effect
            vec3 newPosition = position;
            float pulse = sin(time * 2.0) * 0.1 * auraIntensity;
            newPosition += normal * pulse;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,

    // Champion Aura Fragment Shader
    championAuraFragment: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        uniform float auraIntensity;
        uniform vec3 auraColor;
        uniform float championScore;
        
        void main() {
            // Create aura gradient based on Champion Enigma score
            float radialGradient = 1.0 - length(vUv - 0.5) * 2.0;
            radialGradient = pow(radialGradient, 2.0);
            
            // Animate intensity based on time and score
            float pulse = sin(time * 3.0 + championScore) * 0.3 + 0.7;
            float intensity = radialGradient * pulse * auraIntensity;
            
            // Color based on Champion Enigma dimensions
            vec3 finalColor = auraColor * intensity;
            
            // Add sparkle effect for high scores
            if (championScore > 8.5) {
                float sparkle = sin(time * 10.0 + vPosition.x * 50.0) * 
                               sin(time * 12.0 + vPosition.y * 30.0);
                sparkle = smoothstep(0.8, 1.0, sparkle);
                finalColor += vec3(1.0) * sparkle * 0.3;
            }
            
            gl_FragColor = vec4(finalColor, intensity * 0.6);
        }
    `,

    // Flow State Particle Vertex Shader
    flowStateVertex: `
        attribute vec3 velocity;
        attribute float life;
        attribute float size;
        varying float vLife;
        varying vec3 vVelocity;
        uniform float time;
        uniform float flowIntensity;
        
        void main() {
            vLife = life;
            vVelocity = velocity;
            
            // Particle movement based on flow state
            vec3 newPosition = position + velocity * time * flowIntensity;
            
            // Sine wave movement for flow effect
            newPosition.y += sin(time * 2.0 + position.x * 0.1) * flowIntensity;
            newPosition.x += cos(time * 1.5 + position.z * 0.1) * flowIntensity * 0.5;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = size * (1.0 + flowIntensity) * (100.0 / length(gl_Position.xyz));
        }
    `,

    // Flow State Particle Fragment Shader
    flowStateFragment: `
        varying float vLife;
        varying vec3 vVelocity;
        uniform vec3 flowColor;
        uniform float flowIntensity;
        
        void main() {
            // Circular particle shape
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;
            
            // Fade based on particle life and distance from center
            float alpha = (1.0 - dist * 2.0) * vLife * flowIntensity;
            
            // Color intensity based on velocity
            float velocityIntensity = length(vVelocity) * 0.1;
            vec3 finalColor = flowColor * (1.0 + velocityIntensity);
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,

    // Heat Map Vertex Shader for Muscle Activation
    heatMapVertex: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // Heat Map Fragment Shader
    heatMapFragment: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform float muscleTension;
        uniform sampler2D tensionMap;
        uniform vec3 lowTensionColor;
        uniform vec3 midTensionColor;
        uniform vec3 highTensionColor;
        
        vec3 heatMapColor(float value) {
            if (value < 0.5) {
                return mix(lowTensionColor, midTensionColor, value * 2.0);
            } else {
                return mix(midTensionColor, highTensionColor, (value - 0.5) * 2.0);
            }
        }
        
        void main() {
            // Sample tension data
            float tension = texture2D(tensionMap, vUv).r * muscleTension;
            
            // Add temporal variation
            tension += sin(time * 3.0 + vPosition.x * 10.0) * 0.1;
            tension = clamp(tension, 0.0, 1.0);
            
            // Apply heat map coloring
            vec3 color = heatMapColor(tension);
            
            // Add pulsing effect for high tension areas
            if (tension > 0.8) {
                float pulse = sin(time * 5.0) * 0.2 + 0.8;
                color *= pulse;
            }
            
            gl_FragColor = vec4(color, 0.7);
        }
    `,

    // Stress Response Vertex Shader
    stressResponseVertex: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        uniform float stressLevel;
        
        void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            // Jitter effect for high stress
            vec3 newPosition = position;
            if (stressLevel > 0.7) {
                float jitter = sin(time * 20.0 + position.x * 100.0) * 
                              sin(time * 25.0 + position.y * 80.0) * 
                              (stressLevel - 0.7) * 0.02;
                newPosition += normal * jitter;
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,

    // Stress Response Fragment Shader
    stressResponseFragment: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float time;
        uniform float stressLevel;
        uniform vec3 calmColor;
        uniform vec3 stressColor;
        
        void main() {
            // Color interpolation based on stress level
            vec3 color = mix(calmColor, stressColor, stressLevel);
            
            // Add heat signature effect
            float heatPattern = sin(time * 4.0 + vPosition.y * 5.0) * 0.3 + 0.7;
            color *= heatPattern;
            
            // Intensity flicker for extreme stress
            if (stressLevel > 0.9) {
                float flicker = sin(time * 15.0) * 0.4 + 0.6;
                color *= flicker;
            }
            
            // Fresnel effect for rim lighting
            float fresnel = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
            fresnel = pow(fresnel, 2.0);
            color += vec3(1.0, 0.3, 0.0) * fresnel * stressLevel * 0.5;
            
            gl_FragColor = vec4(color, 0.8);
        }
    `,

    // Velocity Vector Visualization Vertex Shader
    velocityVectorVertex: `
        attribute vec3 velocity;
        attribute float magnitude;
        varying vec3 vVelocity;
        varying float vMagnitude;
        uniform float time;
        uniform float vectorScale;
        
        void main() {
            vVelocity = velocity;
            vMagnitude = magnitude;
            
            // Scale vector based on magnitude
            vec3 scaledPosition = position + velocity * vectorScale * magnitude;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(scaledPosition, 1.0);
        }
    `,

    // Velocity Vector Fragment Shader
    velocityVectorFragment: `
        varying vec3 vVelocity;
        varying float vMagnitude;
        uniform vec3 lowVelocityColor;
        uniform vec3 highVelocityColor;
        
        void main() {
            // Color based on velocity magnitude
            vec3 color = mix(lowVelocityColor, highVelocityColor, vMagnitude);
            
            // Alpha based on magnitude for visibility
            float alpha = clamp(vMagnitude * 2.0, 0.3, 1.0);
            
            gl_FragColor = vec4(color, alpha);
        }
    `,

    // Neural Pathway Vertex Shader
    neuralPathwayVertex: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform float neuralActivity;
        
        void main() {
            vUv = uv;
            vPosition = position;
            
            // Simulate neural firing
            vec3 newPosition = position;
            float firing = sin(time * 10.0 + position.x * 20.0) * neuralActivity;
            firing = smoothstep(0.8, 1.0, firing);
            newPosition += vec3(0.0, firing * 0.1, 0.0);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,

    // Neural Pathway Fragment Shader
    neuralPathwayFragment: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform float neuralActivity;
        uniform vec3 synapseColor;
        
        void main() {
            // Create branching pattern
            float pattern = abs(sin(vPosition.x * 10.0) * cos(vPosition.z * 8.0));
            pattern = smoothstep(0.7, 1.0, pattern);
            
            // Neural firing animation
            float firing = sin(time * 15.0 + vPosition.x * 30.0) * neuralActivity;
            firing = smoothstep(0.6, 1.0, firing);
            
            // Combine pattern with firing
            float intensity = pattern * firing;
            vec3 color = synapseColor * intensity;
            
            // Add electrical glow
            if (intensity > 0.5) {
                color += vec3(0.5, 0.8, 1.0) * (intensity - 0.5) * 2.0;
            }
            
            gl_FragColor = vec4(color, intensity * 0.8);
        }
    `,

    // Trajectory Prediction Vertex Shader
    trajectoryVertex: `
        attribute float timeOffset;
        varying float vTimeOffset;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 initialVelocity;
        uniform vec3 gravity;
        uniform float predictiveAccuracy;
        
        void main() {
            vTimeOffset = timeOffset;
            vPosition = position;
            
            // Calculate predicted position
            float t = timeOffset;
            vec3 predictedPos = position + initialVelocity * t + 0.5 * gravity * t * t;
            
            // Add uncertainty based on prediction accuracy
            float uncertainty = (1.0 - predictiveAccuracy) * timeOffset;
            predictedPos += vec3(
                sin(time + t * 10.0) * uncertainty,
                cos(time + t * 8.0) * uncertainty,
                sin(time + t * 12.0) * uncertainty
            );
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(predictedPos, 1.0);
        }
    `,

    // Trajectory Prediction Fragment Shader
    trajectoryFragment: `
        varying float vTimeOffset;
        varying vec3 vPosition;
        uniform float predictiveAccuracy;
        uniform vec3 trajectoryColor;
        
        void main() {
            // Fade trajectory over time
            float alpha = 1.0 - vTimeOffset * 0.1;
            alpha *= predictiveAccuracy;
            
            // Color intensity based on confidence
            vec3 color = trajectoryColor * predictiveAccuracy;
            
            // Add uncertainty visualization
            if (predictiveAccuracy < 0.8) {
                float uncertainty = sin(vTimeOffset * 20.0) * 0.3 + 0.7;
                color *= uncertainty;
            }
            
            gl_FragColor = vec4(color, alpha);
        }
    `
};

// Biometric Material Factory
export class BiometricMaterialFactory {
    static createChampionAuraMaterial(championScore = 8.5) {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.championAuraVertex,
            fragmentShader: BiometricShaders.championAuraFragment,
            uniforms: {
                time: { value: 0.0 },
                auraIntensity: { value: championScore / 10.0 },
                auraColor: { value: new THREE.Color(0xBF5700) },
                championScore: { value: championScore }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
    
    static createFlowStateParticles(flowIntensity = 0.8) {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.flowStateVertex,
            fragmentShader: BiometricShaders.flowStateFragment,
            uniforms: {
                time: { value: 0.0 },
                flowIntensity: { value: flowIntensity },
                flowColor: { value: new THREE.Color(0x00BFFF) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending
        });
    }
    
    static createHeatMapMaterial(muscleTension = 0.7) {
        // Create tension texture
        const tensionTexture = this.generateTensionTexture();
        
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.heatMapVertex,
            fragmentShader: BiometricShaders.heatMapFragment,
            uniforms: {
                time: { value: 0.0 },
                muscleTension: { value: muscleTension },
                tensionMap: { value: tensionTexture },
                lowTensionColor: { value: new THREE.Color(0x0000FF) },
                midTensionColor: { value: new THREE.Color(0x00FF00) },
                highTensionColor: { value: new THREE.Color(0xFF0000) }
            },
            transparent: true
        });
    }
    
    static createStressResponseMaterial(stressLevel = 0.5) {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.stressResponseVertex,
            fragmentShader: BiometricShaders.stressResponseFragment,
            uniforms: {
                time: { value: 0.0 },
                stressLevel: { value: stressLevel },
                calmColor: { value: new THREE.Color(0x00FF00) },
                stressColor: { value: new THREE.Color(0xFF0000) }
            },
            transparent: true
        });
    }
    
    static createVelocityVectorMaterial() {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.velocityVectorVertex,
            fragmentShader: BiometricShaders.velocityVectorFragment,
            uniforms: {
                time: { value: 0.0 },
                vectorScale: { value: 1.0 },
                lowVelocityColor: { value: new THREE.Color(0xFFFF00) },
                highVelocityColor: { value: new THREE.Color(0xFF0000) }
            },
            transparent: true
        });
    }
    
    static createNeuralPathwayMaterial(neuralActivity = 0.8) {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.neuralPathwayVertex,
            fragmentShader: BiometricShaders.neuralPathwayFragment,
            uniforms: {
                time: { value: 0.0 },
                neuralActivity: { value: neuralActivity },
                synapseColor: { value: new THREE.Color(0x00FFFF) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending
        });
    }
    
    static createTrajectoryMaterial(predictiveAccuracy = 0.9) {
        return new THREE.ShaderMaterial({
            vertexShader: BiometricShaders.trajectoryVertex,
            fragmentShader: BiometricShaders.trajectoryFragment,
            uniforms: {
                time: { value: 0.0 },
                initialVelocity: { value: new THREE.Vector3(0, 0, -30) },
                gravity: { value: new THREE.Vector3(0, -32.2, 0) },
                predictiveAccuracy: { value: predictiveAccuracy },
                trajectoryColor: { value: new THREE.Color(0xFFFFFF) }
            },
            transparent: true
        });
    }
    
    static generateTensionTexture() {
        const size = 256;
        const data = new Uint8Array(size * size * 4);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const idx = (i * size + j) * 4;
                
                // Generate muscle tension pattern
                const x = i / size;
                const y = j / size;
                const tension = Math.sin(x * Math.PI * 4) * Math.cos(y * Math.PI * 3) * 0.5 + 0.5;
                
                data[idx] = tension * 255;     // R
                data[idx + 1] = tension * 255; // G
                data[idx + 2] = tension * 255; // B
                data[idx + 3] = 255;           // A
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.needsUpdate = true;
        return texture;
    }
    
    // Update all material uniforms
    static updateMaterials(materials, time) {
        materials.forEach(material => {
            if (material.uniforms && material.uniforms.time) {
                material.uniforms.time.value = time;
            }
        });
    }
}

// Performance optimization utilities
export class BiometricOptimizer {
    static enableLOD(scene, camera) {
        // Level of Detail optimization for biometric effects
        const lodObjects = [];
        
        scene.traverse((object) => {
            if (object.userData.biometricEffect) {
                const lod = new THREE.LOD();
                
                // High detail (close)
                lod.addLevel(object, 0);
                
                // Medium detail
                const mediumDetail = object.clone();
                this.reduceBiometricComplexity(mediumDetail, 0.5);
                lod.addLevel(mediumDetail, 50);
                
                // Low detail (far)
                const lowDetail = object.clone();
                this.reduceBiometricComplexity(lowDetail, 0.2);
                lod.addLevel(lowDetail, 100);
                
                lodObjects.push(lod);
            }
        });
        
        return lodObjects;
    }
    
    static reduceBiometricComplexity(object, factor) {
        // Reduce particle count, shader complexity, etc.
        if (object.geometry && object.geometry.attributes.position) {
            const positions = object.geometry.attributes.position.array;
            const reducedCount = Math.floor(positions.length * factor);
            object.geometry.setDrawRange(0, reducedCount);
        }
    }
    
    static enableFrustumCulling(scene, camera) {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4();
        
        return {
            update: () => {
                matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                frustum.setFromProjectionMatrix(matrix);
                
                scene.traverse((object) => {
                    if (object.userData.biometricEffect) {
                        object.visible = frustum.intersectsObject(object);
                    }
                });
            }
        };
    }
    
    static enableInstancedRendering(biometricObjects) {
        // Convert similar biometric effects to instanced rendering
        const instancedGroups = new Map();
        
        biometricObjects.forEach(object => {
            const key = object.geometry.type + '_' + object.material.type;
            if (!instancedGroups.has(key)) {
                instancedGroups.set(key, []);
            }
            instancedGroups.get(key).push(object);
        });
        
        const instancedMeshes = [];
        
        instancedGroups.forEach((objects, key) => {
            if (objects.length > 10) { // Worth instancing
                const geometry = objects[0].geometry;
                const material = objects[0].material;
                const instancedMesh = new THREE.InstancedMesh(geometry, material, objects.length);
                
                objects.forEach((object, index) => {
                    instancedMesh.setMatrixAt(index, object.matrixWorld);
                });
                
                instancedMeshes.push(instancedMesh);
            }
        });
        
        return instancedMeshes;
    }
}