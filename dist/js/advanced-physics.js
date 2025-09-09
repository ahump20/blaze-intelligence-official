// Advanced Physics Engine for Lone Star Legends
// WebAssembly-powered physics with biomechanical simulation

export class AdvancedPhysicsEngine {
    constructor() {
        this.world = null;
        this.bodies = new Map();
        this.joints = new Map();
        this.biomechanics = new BiomechanicsSimulator();
        this.ballPhysics = new BaseballPhysics();
        this.aiFielding = new FieldingAI();
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            // Initialize Rapier physics engine (WebAssembly)
            await import('@dimforge/rapier3d-compat').then(RAPIER => {
                this.RAPIER = RAPIER;
                this.world = new RAPIER.World({ x: 0.0, y: -32.2, z: 0.0 }); // ft/s²
                this.isInitialized = true;
                console.log('Advanced Physics Engine initialized with WebAssembly');
            });
        } catch (error) {
            console.warn('WebAssembly physics failed, falling back to Cannon.js');
            this.initializeFallback();
        }
    }
    
    initializeFallback() {
        // Fallback to Cannon.js if WebAssembly fails
        this.world = new CANNON.World();
        this.world.gravity.set(0, -32.2, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 20;
        this.isInitialized = true;
    }
    
    createPlayerBody(position, playerData) {
        if (!this.isInitialized) return null;
        
        const bodyDef = {
            position: position,
            mass: 180, // pounds converted to kg
            dimensions: { height: 6, width: 1.5, depth: 1 }, // feet
            biomechanics: this.biomechanics.createPlayerProfile(playerData)
        };
        
        let body;
        if (this.RAPIER) {
            body = this.createRapierPlayerBody(bodyDef);
        } else {
            body = this.createCannonPlayerBody(bodyDef);
        }
        
        const playerId = `player_${Date.now()}_${Math.random()}`;
        this.bodies.set(playerId, body);
        
        return { id: playerId, body: body, biomechanics: bodyDef.biomechanics };
    }
    
    createRapierPlayerBody(bodyDef) {
        const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(bodyDef.position.x, bodyDef.position.y, bodyDef.position.z);
        
        const body = this.world.createRigidBody(bodyDesc);
        
        // Create compound collider for player
        const headCollider = this.RAPIER.ColliderDesc.ball(0.5)
            .setTranslation(0, bodyDef.dimensions.height - 0.5, 0)
            .setDensity(0.1);
        
        const torsoCollider = this.RAPIER.ColliderDesc.cuboid(
            bodyDef.dimensions.width / 2, 
            bodyDef.dimensions.height / 3, 
            bodyDef.dimensions.depth / 2
        ).setTranslation(0, bodyDef.dimensions.height / 2, 0)
         .setDensity(0.8);
        
        const legCollider = this.RAPIER.ColliderDesc.cuboid(
            bodyDef.dimensions.width / 3,
            bodyDef.dimensions.height / 4,
            bodyDef.dimensions.depth / 3
        ).setTranslation(0, bodyDef.dimensions.height / 4, 0)
         .setDensity(0.7);
        
        this.world.createCollider(headCollider, body);
        this.world.createCollider(torsoCollider, body);
        this.world.createCollider(legCollider, body);
        
        return body;
    }
    
    createCannonPlayerBody(bodyDef) {
        const body = new CANNON.Body({ mass: bodyDef.mass * 0.453592 }); // Convert to kg
        
        // Head
        const headShape = new CANNON.Sphere(0.5);
        body.addShape(headShape, new CANNON.Vec3(0, bodyDef.dimensions.height - 0.5, 0));
        
        // Torso
        const torsoShape = new CANNON.Box(new CANNON.Vec3(
            bodyDef.dimensions.width / 2,
            bodyDef.dimensions.height / 3,
            bodyDef.dimensions.depth / 2
        ));
        body.addShape(torsoShape, new CANNON.Vec3(0, bodyDef.dimensions.height / 2, 0));
        
        // Legs
        const legShape = new CANNON.Box(new CANNON.Vec3(
            bodyDef.dimensions.width / 3,
            bodyDef.dimensions.height / 4,
            bodyDef.dimensions.depth / 3
        ));
        body.addShape(legShape, new CANNON.Vec3(0, bodyDef.dimensions.height / 4, 0));
        
        body.position.set(bodyDef.position.x, bodyDef.position.y, bodyDef.position.z);
        this.world.add(body);
        
        return body;
    }
    
    createBaseball(position, velocity = { x: 0, y: 0, z: 0 }) {
        const ballData = {
            mass: 0.145, // kg (5.125 oz)
            radius: 0.073, // meters (2.86 inches)
            position: position,
            velocity: velocity,
            spinRate: 0,
            spinAxis: { x: 0, y: 1, z: 0 }
        };
        
        let body;
        if (this.RAPIER) {
            const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(position.x, position.y, position.z);
            body = this.world.createRigidBody(bodyDesc);
            
            const colliderDesc = this.RAPIER.ColliderDesc.ball(ballData.radius)
                .setRestitution(0.5)
                .setFriction(0.3);
            this.world.createCollider(colliderDesc, body);
            
            body.setLinvel(velocity, true);
        } else {
            body = new CANNON.Body({ mass: ballData.mass });
            const ballShape = new CANNON.Sphere(ballData.radius);
            body.addShape(ballShape);
            body.position.set(position.x, position.y, position.z);
            body.velocity.set(velocity.x, velocity.y, velocity.z);
            body.material = new CANNON.Material({ restitution: 0.5, friction: 0.3 });
            this.world.add(body);
        }
        
        const ballId = `ball_${Date.now()}`;
        this.bodies.set(ballId, body);
        
        return {
            id: ballId,
            body: body,
            physics: new BaseballFlightPhysics(ballData),
            tracking: new BallTrackingSystem()
        };
    }
    
    step(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update biomechanics
        this.biomechanics.update(deltaTime);
        
        // Update ball physics with aerodynamics
        this.updateBallAerodynamics(deltaTime);
        
        // Update AI fielding decisions
        this.aiFielding.update(deltaTime, this.bodies);
        
        // Step physics simulation
        if (this.RAPIER) {
            this.world.step();
        } else {
            this.world.step(deltaTime);
        }
    }
    
    updateBallAerodynamics(deltaTime) {
        this.bodies.forEach((body, id) => {
            if (id.startsWith('ball_')) {
                const ballEntity = this.getBallEntity(id);
                if (ballEntity && ballEntity.physics) {
                    ballEntity.physics.updateAerodynamics(body, deltaTime);
                }
            }
        });
    }
    
    getBallEntity(ballId) {
        // Retrieve full ball entity with physics data
        return this.ballPhysics.getBall(ballId);
    }
    
    applyForceToPlayer(playerId, force, point = null) {
        const body = this.bodies.get(playerId);
        if (!body) return;
        
        if (this.RAPIER) {
            if (point) {
                body.addForceAtPoint(force, point, true);
            } else {
                body.addForce(force, true);
            }
        } else {
            if (point) {
                body.applyForce(new CANNON.Vec3(force.x, force.y, force.z), 
                               new CANNON.Vec3(point.x, point.y, point.z));
            } else {
                body.force.set(force.x, force.y, force.z);
            }
        }
    }
    
    getPlayerPosition(playerId) {
        const body = this.bodies.get(playerId);
        if (!body) return null;
        
        if (this.RAPIER) {
            const pos = body.translation();
            return { x: pos.x, y: pos.y, z: pos.z };
        } else {
            return { x: body.position.x, y: body.position.y, z: body.position.z };
        }
    }
    
    setPlayerPosition(playerId, position) {
        const body = this.bodies.get(playerId);
        if (!body) return;
        
        if (this.RAPIER) {
            body.setTranslation(position, true);
        } else {
            body.position.set(position.x, position.y, position.z);
        }
    }
    
    getPlayerVelocity(playerId) {
        const body = this.bodies.get(playerId);
        if (!body) return null;
        
        if (this.RAPIER) {
            const vel = body.linvel();
            return { x: vel.x, y: vel.y, z: vel.z };
        } else {
            return { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z };
        }
    }
}

// Biomechanics Simulation System
class BiomechanicsSimulator {
    constructor() {
        this.players = new Map();
        this.jointConstraints = new Map();
        this.muscleGroups = new Map();
    }
    
    createPlayerProfile(playerData) {
        const profile = {
            // Physical attributes
            height: playerData.height || 6.0,
            weight: playerData.weight || 180,
            reach: playerData.reach || 6.5,
            
            // Biomechanical properties
            flexibility: playerData.flexibility || 0.8,
            balance: playerData.balance || 0.85,
            coordination: playerData.coordination || 0.9,
            
            // Champion Enigma metrics
            clutchGene: playerData.clutchGene || 8.0,
            flowState: playerData.flowState || 8.5,
            mentalFortress: playerData.mentalFortress || 8.2,
            
            // Muscle groups
            muscleGroups: this.initializeMuscleGroups(playerData),
            
            // Joint constraints
            joints: this.initializeJoints(playerData),
            
            // Fatigue system
            fatigue: 0.0,
            stamina: playerData.stamina || 0.9,
            
            // Injury risk
            injuryRisk: 0.0,
            previousInjuries: playerData.injuries || []
        };
        
        return profile;
    }
    
    initializeMuscleGroups(playerData) {
        return {
            legs: {
                quadriceps: { strength: 0.9, fatigue: 0.0, activation: 0.0 },
                hamstrings: { strength: 0.85, fatigue: 0.0, activation: 0.0 },
                calves: { strength: 0.8, fatigue: 0.0, activation: 0.0 },
                glutes: { strength: 0.9, fatigue: 0.0, activation: 0.0 }
            },
            core: {
                abs: { strength: 0.85, fatigue: 0.0, activation: 0.0 },
                obliques: { strength: 0.8, fatigue: 0.0, activation: 0.0 },
                lowerBack: { strength: 0.8, fatigue: 0.0, activation: 0.0 }
            },
            arms: {
                shoulders: { strength: 0.85, fatigue: 0.0, activation: 0.0 },
                biceps: { strength: 0.8, fatigue: 0.0, activation: 0.0 },
                triceps: { strength: 0.8, fatigue: 0.0, activation: 0.0 },
                forearms: { strength: 0.75, fatigue: 0.0, activation: 0.0 }
            }
        };
    }
    
    initializeJoints(playerData) {
        return {
            spine: { flexibility: 0.8, stability: 0.9 },
            hips: { flexibility: 0.85, stability: 0.85 },
            knees: { flexibility: 0.9, stability: 0.9 },
            ankles: { flexibility: 0.8, stability: 0.8 },
            shoulders: { flexibility: 0.9, stability: 0.7 },
            elbows: { flexibility: 0.95, stability: 0.9 },
            wrists: { flexibility: 0.9, stability: 0.8 }
        };
    }
    
    update(deltaTime) {
        this.players.forEach((profile, playerId) => {
            // Update muscle fatigue
            this.updateMuscleFatigue(profile, deltaTime);
            
            // Update injury risk
            this.updateInjuryRisk(profile, deltaTime);
            
            // Update Champion Enigma metrics based on physical state
            this.updateChampionMetrics(profile, deltaTime);
        });
    }
    
    updateMuscleFatigue(profile, deltaTime) {
        Object.values(profile.muscleGroups).forEach(group => {
            Object.values(group).forEach(muscle => {
                // Fatigue increases with activation
                muscle.fatigue += muscle.activation * deltaTime * 0.01;
                muscle.fatigue = Math.min(muscle.fatigue, 1.0);
                
                // Recovery when not activated
                if (muscle.activation < 0.1) {
                    muscle.fatigue -= profile.stamina * deltaTime * 0.005;
                    muscle.fatigue = Math.max(muscle.fatigue, 0.0);
                }
            });
        });
    }
    
    updateInjuryRisk(profile, deltaTime) {
        let totalActivation = 0;
        let totalFatigue = 0;
        let muscleCount = 0;
        
        Object.values(profile.muscleGroups).forEach(group => {
            Object.values(group).forEach(muscle => {
                totalActivation += muscle.activation;
                totalFatigue += muscle.fatigue;
                muscleCount++;
            });
        });
        
        const avgActivation = totalActivation / muscleCount;
        const avgFatigue = totalFatigue / muscleCount;
        
        // Injury risk increases with high activation and fatigue
        profile.injuryRisk = (avgActivation * 0.3 + avgFatigue * 0.7) * (1 - profile.balance);
        profile.injuryRisk = Math.min(profile.injuryRisk, 1.0);
    }
    
    updateChampionMetrics(profile, deltaTime) {
        // Flow state improves with balanced activation
        const balanceScore = this.calculateMuscleBalance(profile);
        profile.flowState += (balanceScore - 0.5) * deltaTime * 0.1;
        profile.flowState = Math.max(0, Math.min(10, profile.flowState));
        
        // Mental fortress decreases with fatigue
        const avgFatigue = this.getAverageFatigue(profile);
        profile.mentalFortress -= avgFatigue * deltaTime * 0.05;
        profile.mentalFortress = Math.max(0, Math.min(10, profile.mentalFortress));
    }
    
    calculateMuscleBalance(profile) {
        // Calculate how balanced muscle activation is
        const activations = [];
        Object.values(profile.muscleGroups).forEach(group => {
            Object.values(group).forEach(muscle => {
                activations.push(muscle.activation);
            });
        });
        
        const mean = activations.reduce((a, b) => a + b, 0) / activations.length;
        const variance = activations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / activations.length;
        
        return 1.0 - Math.min(variance, 1.0); // Lower variance = better balance
    }
    
    getAverageFatigue(profile) {
        let totalFatigue = 0;
        let muscleCount = 0;
        
        Object.values(profile.muscleGroups).forEach(group => {
            Object.values(group).forEach(muscle => {
                totalFatigue += muscle.fatigue;
                muscleCount++;
            });
        });
        
        return totalFatigue / muscleCount;
    }
    
    simulateMovement(playerId, movementType, intensity = 1.0) {
        const profile = this.players.get(playerId);
        if (!profile) return;
        
        // Activate appropriate muscle groups based on movement
        switch (movementType) {
            case 'sprint':
                this.activateMuscleMarch(profile.muscleGroups.legs, intensity);
                this.activateMuscleMarch(profile.muscleGroups.core, intensity * 0.7);
                break;
                
            case 'throw':
                this.activateMuscleMarch(profile.muscleGroups.arms, intensity);
                this.activateMuscleMarch(profile.muscleGroups.core, intensity * 0.9);
                break;
                
            case 'swing':
                this.activateMuscleMarch(profile.muscleGroups.core, intensity);
                this.activateMuscleMarch(profile.muscleGroups.arms, intensity * 0.8);
                this.activateMuscleMarch(profile.muscleGroups.legs, intensity * 0.6);
                break;
                
            case 'field':
                this.activateMuscleMarch(profile.muscleGroups.legs, intensity * 0.8);
                this.activateMuscleMarch(profile.muscleGroups.core, intensity * 0.7);
                this.activateMuscleMarch(profile.muscleGroups.arms, intensity * 0.5);
                break;
        }
    }
    
    activateMuscleMarch(muscleGroup, intensity) {
        Object.values(muscleGroup).forEach(muscle => {
            muscle.activation = Math.min(muscle.activation + intensity, 1.0);
        });
    }
}

// Advanced Baseball Flight Physics
class BaseballFlightPhysics {
    constructor(ballData) {
        this.mass = ballData.mass;
        this.radius = ballData.radius;
        this.area = Math.PI * this.radius * this.radius;
        this.circumference = 2 * Math.PI * this.radius;
        
        // Aerodynamic properties
        this.dragCoefficient = 0.3;
        this.magnusCoefficient = 0.1;
        this.airDensity = 1.225; // kg/m³ at sea level
        
        // Spin properties
        this.spinRate = ballData.spinRate || 0; // RPM
        this.spinAxis = ballData.spinAxis || { x: 0, y: 1, z: 0 };
        
        // Environmental factors
        this.windVelocity = { x: 0, y: 0, z: 0 };
        this.temperature = 70; // Fahrenheit
        this.humidity = 0.5;
        this.altitude = 0; // feet above sea level
    }
    
    updateAerodynamics(body, deltaTime) {
        const velocity = this.getVelocity(body);
        const speed = this.getSpeed(velocity);
        
        if (speed < 0.1) return; // Minimal aerodynamic effects at low speeds
        
        // Calculate air density based on environmental conditions
        const adjustedAirDensity = this.calculateAirDensity();
        
        // Drag force
        const dragForce = this.calculateDragForce(velocity, speed, adjustedAirDensity);
        
        // Magnus force (due to spin)
        const magnusForce = this.calculateMagnusForce(velocity, speed, adjustedAirDensity);
        
        // Apply forces
        this.applyForce(body, {
            x: dragForce.x + magnusForce.x,
            y: dragForce.y + magnusForce.y,
            z: dragForce.z + magnusForce.z
        });
    }
    
    calculateDragForce(velocity, speed, airDensity) {
        const dragMagnitude = 0.5 * airDensity * this.area * this.dragCoefficient * speed * speed;
        
        return {
            x: -dragMagnitude * (velocity.x / speed),
            y: -dragMagnitude * (velocity.y / speed),
            z: -dragMagnitude * (velocity.z / speed)
        };
    }
    
    calculateMagnusForce(velocity, speed, airDensity) {
        const spinVelocity = (this.spinRate * 2 * Math.PI / 60) * this.radius; // m/s
        const magnusMagnitude = 0.5 * airDensity * this.area * this.magnusCoefficient * speed * spinVelocity;
        
        // Magnus force is perpendicular to both velocity and spin axis
        const cross = this.crossProduct(this.normalizeVector(velocity), this.spinAxis);
        
        return {
            x: magnusMagnitude * cross.x,
            y: magnusMagnitude * cross.y,
            z: magnusMagnitude * cross.z
        };
    }
    
    calculateAirDensity() {
        // Adjust air density based on temperature, humidity, and altitude
        const tempKelvin = (this.temperature - 32) * 5/9 + 273.15;
        const pressureRatio = Math.pow(1 - 0.0065 * this.altitude * 0.3048 / 288.15, 5.256);
        
        return this.airDensity * pressureRatio * (288.15 / tempKelvin) * (1 - 0.378 * this.humidity);
    }
    
    getVelocity(body) {
        if (body.linvel) {
            const vel = body.linvel();
            return { x: vel.x, y: vel.y, z: vel.z };
        } else {
            return { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z };
        }
    }
    
    getSpeed(velocity) {
        return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
    }
    
    normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
        if (magnitude === 0) return { x: 0, y: 0, z: 0 };
        
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude,
            z: vector.z / magnitude
        };
    }
    
    crossProduct(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }
    
    applyForce(body, force) {
        if (body.addForce) {
            body.addForce(force, true);
        } else {
            body.force.x += force.x;
            body.force.y += force.y;
            body.force.z += force.z;
        }
    }
}

// AI Fielding System
class FieldingAI {
    constructor() {
        this.players = new Map();
        this.ballTracking = null;
        this.fieldingDecisions = new Map();
    }
    
    update(deltaTime, bodies) {
        // Find ball and active fielders
        this.updateBallTracking(bodies);
        this.updateFieldingDecisions(deltaTime, bodies);
        this.executeFieldingMovements(deltaTime, bodies);
    }
    
    updateBallTracking(bodies) {
        bodies.forEach((body, id) => {
            if (id.startsWith('ball_')) {
                this.ballTracking = {
                    id: id,
                    body: body,
                    position: this.getPosition(body),
                    velocity: this.getVelocity(body),
                    inPlay: this.isBallInPlay(body)
                };
            }
        });
    }
    
    updateFieldingDecisions(deltaTime, bodies) {
        if (!this.ballTracking || !this.ballTracking.inPlay) return;
        
        const fielders = this.getFielders(bodies);
        const ballPosition = this.ballTracking.position;
        const ballVelocity = this.ballTracking.velocity;
        
        // Predict ball landing position
        const landingPosition = this.predictBallLanding(ballPosition, ballVelocity);
        
        // Determine which fielder should make the play
        const primaryFielder = this.selectPrimaryFielder(fielders, landingPosition);
        
        // Assign fielding responsibilities
        fielders.forEach((fielder, id) => {
            if (id === primaryFielder.id) {
                this.fieldingDecisions.set(id, {
                    role: 'primary',
                    target: landingPosition,
                    urgency: this.calculateUrgency(fielder.position, landingPosition),
                    approach: this.determineApproach(fielder, landingPosition)
                });
            } else {
                this.fieldingDecisions.set(id, {
                    role: 'backup',
                    target: this.calculateBackupPosition(fielder, landingPosition),
                    urgency: 0.3,
                    approach: 'position'
                });
            }
        });
    }
    
    executeFieldingMovements(deltaTime, bodies) {
        this.fieldingDecisions.forEach((decision, playerId) => {
            const body = bodies.get(playerId);
            if (!body) return;
            
            const currentPosition = this.getPosition(body);
            const targetPosition = decision.target;
            
            // Calculate movement vector
            const movement = {
                x: targetPosition.x - currentPosition.x,
                y: 0, // Keep on ground
                z: targetPosition.z - currentPosition.z
            };
            
            const distance = Math.sqrt(movement.x * movement.x + movement.z * movement.z);
            
            if (distance > 1.0) { // Only move if not close enough
                // Normalize and scale by urgency and player speed
                const speed = 15 * decision.urgency; // ft/s
                const normalizedMovement = {
                    x: (movement.x / distance) * speed * deltaTime,
                    y: 0,
                    z: (movement.z / distance) * speed * deltaTime
                };
                
                // Apply movement force
                this.applyMovementForce(body, normalizedMovement);
                
                // Rotate player to face target
                this.orientPlayerToTarget(body, targetPosition);
            }
        });
    }
    
    getFielders(bodies) {
        const fielders = new Map();
        
        bodies.forEach((body, id) => {
            if (id.startsWith('player_') && !id.includes('batter')) {
                fielders.set(id, {
                    id: id,
                    body: body,
                    position: this.getPosition(body),
                    speed: 15, // ft/s base speed
                    range: 10, // fielding range in feet
                    skill: 0.8 // fielding skill 0-1
                });
            }
        });
        
        return fielders;
    }
    
    predictBallLanding(position, velocity) {
        // Simple ballistic trajectory prediction
        const gravity = -32.2; // ft/s²
        const timeToGround = (-velocity.y - Math.sqrt(velocity.y * velocity.y - 2 * gravity * position.y)) / gravity;
        
        return {
            x: position.x + velocity.x * timeToGround,
            y: 0,
            z: position.z + velocity.z * timeToGround,
            timeToLand: timeToGround
        };
    }
    
    selectPrimaryFielder(fielders, landingPosition) {
        let closestFielder = null;
        let shortestTime = Infinity;
        
        fielders.forEach((fielder) => {
            const distance = this.calculateDistance(fielder.position, landingPosition);
            const timeToReach = distance / fielder.speed;
            
            if (timeToReach < shortestTime && timeToReach < landingPosition.timeToLand) {
                shortestTime = timeToReach;
                closestFielder = fielder;
            }
        });
        
        return closestFielder || fielders.values().next().value;
    }
    
    calculateUrgency(playerPosition, targetPosition) {
        const distance = this.calculateDistance(playerPosition, targetPosition);
        return Math.min(1.0, 20.0 / Math.max(distance, 1.0)); // Higher urgency for closer targets
    }
    
    determineApproach(fielder, landingPosition) {
        const distance = this.calculateDistance(fielder.position, landingPosition);
        
        if (distance < 5) return 'catch';
        if (distance < 15) return 'charge';
        return 'position';
    }
    
    calculateBackupPosition(fielder, landingPosition) {
        // Position backup fielders behind the primary fielder
        const angle = Math.atan2(
            landingPosition.z - fielder.position.z,
            landingPosition.x - fielder.position.x
        );
        
        return {
            x: landingPosition.x + Math.cos(angle + Math.PI) * 10,
            y: 0,
            z: landingPosition.z + Math.sin(angle + Math.PI) * 10
        };
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    getPosition(body) {
        if (body.translation) {
            const pos = body.translation();
            return { x: pos.x, y: pos.y, z: pos.z };
        } else {
            return { x: body.position.x, y: body.position.y, z: body.position.z };
        }
    }
    
    getVelocity(body) {
        if (body.linvel) {
            const vel = body.linvel();
            return { x: vel.x, y: vel.y, z: vel.z };
        } else {
            return { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z };
        }
    }
    
    isBallInPlay(body) {
        const position = this.getPosition(body);
        const velocity = this.getVelocity(body);
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        
        return speed > 5.0 && position.y > 0.1; // Ball is moving and above ground
    }
    
    applyMovementForce(body, force) {
        if (body.addForce) {
            body.addForce(force, true);
        } else {
            body.force.x += force.x;
            body.force.y += force.y;
            body.force.z += force.z;
        }
    }
    
    orientPlayerToTarget(body, target) {
        const position = this.getPosition(body);
        const direction = {
            x: target.x - position.x,
            z: target.z - position.z
        };
        
        const angle = Math.atan2(direction.z, direction.x);
        
        if (body.setRotation) {
            body.setRotation({ x: 0, y: angle, z: 0 }, true);
        } else {
            body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
        }
    }
}

// Ball Tracking System for Analytics
class BallTrackingSystem {
    constructor() {
        this.trajectory = [];
        this.maxTrajectoryPoints = 1000;
        this.analytics = {
            maxVelocity: 0,
            flightTime: 0,
            spinRate: 0,
            totalDistance: 0
        };
    }
    
    update(position, velocity, deltaTime) {
        // Record trajectory point
        this.trajectory.push({
            position: { ...position },
            velocity: { ...velocity },
            timestamp: Date.now()
        });
        
        // Limit trajectory size
        if (this.trajectory.length > this.maxTrajectoryPoints) {
            this.trajectory.shift();
        }
        
        // Update analytics
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        this.analytics.maxVelocity = Math.max(this.analytics.maxVelocity, speed);
        this.analytics.flightTime += deltaTime;
        
        if (this.trajectory.length > 1) {
            const prevPoint = this.trajectory[this.trajectory.length - 2];
            const distance = Math.sqrt(
                Math.pow(position.x - prevPoint.position.x, 2) +
                Math.pow(position.y - prevPoint.position.y, 2) +
                Math.pow(position.z - prevPoint.position.z, 2)
            );
            this.analytics.totalDistance += distance;
        }
    }
    
    getTrajectoryPrediction(steps = 60) {
        if (this.trajectory.length < 2) return [];
        
        const lastPoint = this.trajectory[this.trajectory.length - 1];
        const prediction = [];
        const gravity = -32.2; // ft/s²
        const deltaTime = 1/60; // 60 FPS
        
        let pos = { ...lastPoint.position };
        let vel = { ...lastPoint.velocity };
        
        for (let i = 0; i < steps; i++) {
            // Update velocity with gravity
            vel.y += gravity * deltaTime;
            
            // Update position
            pos.x += vel.x * deltaTime;
            pos.y += vel.y * deltaTime;
            pos.z += vel.z * deltaTime;
            
            prediction.push({
                position: { ...pos },
                velocity: { ...vel },
                confidence: Math.max(0, 1 - i / steps) // Confidence decreases over time
            });
            
            // Stop if ball hits ground
            if (pos.y <= 0) break;
        }
        
        return prediction;
    }
    
    getAnalytics() {
        return { ...this.analytics };
    }
    
    reset() {
        this.trajectory = [];
        this.analytics = {
            maxVelocity: 0,
            flightTime: 0,
            spinRate: 0,
            totalDistance: 0
        };
    }
}