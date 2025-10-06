import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { vechicles3D } from '../../constants/material';
import { selectedCar } from '../garage';

export class Car {
    constructor(scene, game = null, carData = null) {
        this.scene = scene;
        this.game = game;
        
        // Car configuration with better defaults
        this.carData = selectedCar || {
            name: 'Default Car',
            Car3D: vechicles3D.car3d1,
            carPosition: { x: 0, y: 0.3, z: -6 },
            carScaleConfig: { defaultScale: 3.7 },
            driveInStartZ: 6,
            
            // Car properties that come from the car itself
            maxSpeed: 0.13,
            accel: 0.0006,
            decel: 0.0001,
            brakeDecel: 0.0002,
            laneChangeSpeed: 0.1,
            
            // Protective system properties
            protectionDistance: 300, // meters of protection
            hasProtection: false,
            protectionRemaining: 3,
            protectionActive: false
        };

        // Initialize car properties from carData
        this.LANE_POSITIONS = [-1.5, 0, 1.5];
        this.LANE_CHANGE_SPEED = this.carData.laneChangeSpeed || 0.2;
        this.mesh = null;
        this.isLoaded = false;
        this.originalColors = new Map();
        this.positionOffsetZ = -4.0;

        // Enhanced animation system
        this.animationState = 'idle'; // 'idle', 'falling', 'returning', 'driveIn'
        this.animationStartTime = 0;
        this.animationDuration = 2500;
        this.driveInComplete = false;

        // Protective system visual effects
        this.protectionShield = null;
        this.protectionParticles = [];

        // Create a simple placeholder while loading
        this.createPlaceholderCar();

        // Load the 3D car model
        this.loadCarModel();
    }

    // Method to change car model dynamically
    setCarModel(carData) {
        this.carData = carData;
        this.isLoaded = false;
        this.driveInComplete = false;

        // Update car properties from new carData
        this.LANE_CHANGE_SPEED = this.carData.laneChangeSpeed || 0.4;

        // Remove current car
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.disposeMesh(this.mesh);
        }

        // Remove protection effects
        this.removeProtectionEffects();

        // Create new placeholder and load new model
        this.createPlaceholderCar();
        this.loadCarModel();
    }

    // PROTECTIVE SYSTEM METHODS
    activateProtection(distance = null) {
        const protectionDistance = distance || this.carData.protectionDistance;
        
        this.carData.hasProtection = true;
        this.carData.protectionActive = true;
        this.carData.protectionRemaining = protectionDistance;
        
        console.log(`🛡️ Protection activated! ${protectionDistance}m of immunity`);
        
        // Create visual shield effect
        this.createProtectionShield();
        
        // Start protection particles
        this.startProtectionParticles();
    }

    deactivateProtection() {
        this.carData.hasProtection = false;
        this.carData.protectionActive = false;
        this.carData.protectionRemaining = 0;
        
        console.log("🛡️ Protection deactivated");
        
        // Remove visual effects
        this.removeProtectionEffects();
    }

    updateProtection(distanceTraveled) {
        if (this.carData.protectionActive && this.carData.protectionRemaining > 0) {
            this.carData.protectionRemaining -= distanceTraveled;
            
            if (this.carData.protectionRemaining <= 0) {
                this.deactivateProtection();
            } else {
                // Update shield intensity based on remaining protection
                this.updateShieldIntensity();
            }
        }
    }

    createProtectionShield() {
        // Remove existing shield
        if (this.protectionShield) {
            this.scene.remove(this.protectionShield);
        }

        // Create a spherical shield around the car
        const shieldGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            wireframe: true,
            side: THREE.DoubleSide
        });

        this.protectionShield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.protectionShield.position.copy(this.mesh.position);
        this.scene.add(this.protectionShield);
    }

    startProtectionParticles() {
        // Clear existing particles
        this.protectionParticles.forEach(particle => {
            if (particle.parent) {
                this.scene.remove(particle);
            }
        });
        this.protectionParticles = [];

        // Create floating particles around the car
        for (let i = 0; i < 12; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7
            });

            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particles in a sphere around the car
            const angle = (i / 12) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.5;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.5,
                Math.sin(angle) * radius
            );
            
            particle.userData.originalAngle = angle;
            particle.userData.speed = 2 + Math.random() * 2;
            
            this.protectionShield.add(particle);
            this.protectionParticles.push(particle);
        }
    }

    updateShieldIntensity() {
        if (!this.protectionShield) return;

        const intensity = this.carData.protectionRemaining / this.carData.protectionDistance;
        
        // Pulsing effect based on remaining protection
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        this.protectionShield.material.opacity = 0.2 * intensity * pulse;
        
        // Change color when protection is low (red when almost gone)
        if (intensity < 0.3) {
            this.protectionShield.material.color.setHex(0xff4444);
        } else {
            this.protectionShield.material.color.setHex(0x00ffff);
        }

        // Update particles
        this.updateProtectionParticles();
    }

    updateProtectionParticles() {
        const currentTime = Date.now();
        
        this.protectionParticles.forEach((particle, index) => {
            if (!particle.parent) return;
            
            const angle = particle.userData.originalAngle + (currentTime * 0.001 * particle.userData.speed);
            const radius = 1.5 + Math.random() * 0.5;
            
            particle.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.5 + Math.sin(currentTime * 0.002 + index) * 0.3,
                Math.sin(angle) * radius
            );
            
            // Pulsing opacity
            particle.material.opacity = 0.5 + Math.sin(currentTime * 0.005 + index) * 0.3;
        });
    }

    removeProtectionEffects() {
        // Remove shield
        if (this.protectionShield) {
            this.scene.remove(this.protectionShield);
            this.protectionShield = null;
        }
        
        // Remove particles
        this.protectionParticles.forEach(particle => {
            if (particle.parent) {
                particle.parent.remove(particle);
            }
        });
        this.protectionParticles = [];
    }

    // Check if car is protected from collisions
    isProtected() {
        return this.carData.protectionActive && this.carData.protectionRemaining > 0;
    }

    // Get car properties for game system
    getMaxSpeed() {
        return this.carData.maxSpeed || 0.2;
    }

    getAcceleration() {
        return this.carData.accel || 0.002;
    }

    getDeceleration() {
        return this.carData.decel || 0.001;
    }

    getBrakeDeceleration() {
        return this.carData.brakeDecel || 0.003;
    }

    // Method to handle collision with protection
    handleCollision(obstacleType) {
        if (this.isProtected()) {
            console.log(`🛡️ Protected from ${obstacleType} collision!`);
            
            // Visual feedback for protected collision
            this.showProtectionHitEffect();
            
            // Small speed penalty even when protected
            if (this.game && this.game.speed !== undefined) {
                this.game.speed = Math.max(0, this.game.speed * 0.95);
            }
            
            return false; // Collision was protected
        }
        
        return true; // Collision should proceed normally
    }

    showProtectionHitEffect() {
        // Create a bright flash when protection absorbs a hit
        const flashGeometry = new THREE.SphereGeometry(2, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(this.mesh.position);
        this.scene.add(flash);
        
        // Animate flash
        const startTime = Date.now();
        const animateFlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 500; // 0.5 second animation
            
            if (progress < 1) {
                flash.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
                flash.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animateFlash);
            } else {
                this.scene.remove(flash);
            }
        };
        
        animateFlash();
    }

    // Update method now includes protection updates
    update(currentLane, curveIntensity, curveOffset, deltaTime) {
        if (!this.mesh) return;

        // Update protection system
        if (this.game && this.game.speed !== undefined) {
            const distanceTraveled = this.game.speed * 5 * (deltaTime / 16);
            this.updateProtection(distanceTraveled);
        }

        // Update shield position to follow car
        if (this.protectionShield) {
            this.protectionShield.position.copy(this.mesh.position);
        }

        // Only update lane position if not in special animation
        if (this.animationState === 'idle' || this.animationState === 'driveIn') {
            const targetX = this.LANE_POSITIONS[currentLane] + curveOffset;
            this.mesh.position.x += (targetX - this.mesh.position.x) * this.LANE_CHANGE_SPEED;
        }

        // Handle curve rotations
        if (curveIntensity !== 0) {
            this.mesh.rotation.y = Math.PI + (curveIntensity * 0.3);
            this.mesh.rotation.z = -curveIntensity * 0.2;
        } else {
            this.mesh.rotation.y = Math.PI;
            this.mesh.rotation.z += (0 - this.mesh.rotation.z) * 0.1;
        }

        if (this.isLoaded) {
            this.updateAnimation();
        }
    }

    // ... rest of your existing methods (createPlaceholderCar, loadCarModel, etc.) remain the same
    createPlaceholderCar() {
        const carGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
        const carMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        this.mesh = new THREE.Mesh(carGeometry, carMaterial);
        this.mesh.position.set(0, 0.7, 4 + this.positionOffsetZ);
        this.mesh.name = 'car-placeholder';
        this.scene.add(this.mesh);
    }

    loadCarModel() {
        const loader = new GLTFLoader();

        console.log('🔄 Loading 3D model:', this.carData.name);

        loader.load(
            this.carData.Car3D,
            (gltf) => {
                console.log('✅ 3D Car model loaded successfully!');

                // Remove the placeholder
                this.scene.remove(this.mesh);

                // Get the car model from the GLTF scene
                this.mesh = gltf.scene;
                this.mesh.name = 'car-3d-model';

                // Apply model position
                const position = this.carData.modelPosition || { x: 0, y: 0.3, z: -6 };
                this.mesh.position.set(position.x, position.y, position.z + this.positionOffsetZ);
                console.log('📍 Model position set to:', this.mesh.position);

                // Scale model properly
                this.applyProperScaling();

                // Make sure the car faces the correct direction
                this.mesh.rotation.y = Math.PI;

                // Store original colors BEFORE optimizing
                this.storeOriginalColors(this.mesh);

                // Optimize materials for WebGL 1
                this.optimizeMaterials(this.mesh);

                // Add the car to the scene
                this.scene.add(this.mesh);
                this.isLoaded = true;

                console.log('✅ 3D Car model ready!');
            },
            (progress) => {
                let percentLoaded = 0;
                if (progress.lengthComputable) {
                    percentLoaded = (progress.loaded / progress.total * 100);
                } else {
                    percentLoaded = Math.min((progress.loaded / 1000000) * 100, 99);
                }
                console.log(`📦 Loading ${this.carData.name}: ${percentLoaded.toFixed(1)}%`);
            },
            (error) => {
                console.error('❌ Error loading 3D car model:', error);
                console.log('⚠️ Using placeholder car instead');
                this.mesh.material.opacity = 1.0;
                this.mesh.material.color.set(0xff0000);
            }
        );
    }

    applyProperScaling() {
        const carScaleConfig = this.carData.carScaleConfig || {};
        const defaultScale = carScaleConfig.defaultScale || 3.4;

        // Calculate proper scale based on model bounds
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        console.log('📏 Model size:', size);

        if (size.length() === 0) {
            console.warn('⚠️ Model has zero size, using default scale');
            this.mesh.scale.set(defaultScale, defaultScale, defaultScale);
        } else {
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = defaultScale / maxDim;
            this.mesh.scale.set(scale, scale, scale);
            console.log('📐 Model scaled to:', this.mesh.scale);
        }
    }

    storeOriginalColors(object) {
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                const colors = [];

                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.color) {
                            colors.push(mat.color.clone());
                        } else {
                            colors.push(new THREE.Color(0x888888));
                        }
                    });
                } else {
                    if (child.material.color) {
                        colors.push(child.material.color.clone());
                    } else {
                        colors.push(new THREE.Color(0x888888));
                    }
                }

                this.originalColors.set(child, colors);
            }
        });
        console.log("🎨 Original car colors stored");
    }

    optimizeMaterials(object) {
        object.traverse((child) => {
            if (child.isMesh) {
                // Store reference to original material
                if (!child.userData) child.userData = {};
                child.userData.originalMaterial = child.material;

                // Convert materials to WebGL 1 compatible versions
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => this.simplifyMaterial(mat));
                    } else {
                        child.material = this.simplifyMaterial(child.material);
                    }
                }

                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    simplifyMaterial(material) {
        // If already compatible, return as-is
        if (material.isMeshLambertMaterial || material.isMeshBasicMaterial || material.isMeshPhongMaterial) {
            return material;
        }

        // Convert to WebGL 1 compatible material
        if (material.isMeshStandardMaterial) {
            const basicMaterial = new THREE.MeshLambertMaterial({
                color: material.color ? material.color.clone() : 0x888888,
                map: material.map,
                transparent: material.transparent || false,
                opacity: material.opacity || 1.0,
                emissive: material.emissive ? material.emissive.clone() : 0x000000,
                emissiveMap: material.emissiveMap,
                emissiveIntensity: material.emissiveIntensity || 0
            });

            // Delay disposal to avoid issues
            setTimeout(() => {
                if (material !== basicMaterial) {
                    material.dispose();
                }
            }, 100);

            return basicMaterial;
        }

        return material;
    }

    // Set temporary color for effects (explosions, etc.)
    setColor(color) {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.color) {
                            mat.color.set(color);
                        }
                    });
                } else if (child.material.color) {
                    child.material.color.set(color);
                }
            }
        });
    }

    resetColor() {
        if (!this.mesh) return;

        let restored = false;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (this.originalColors.has(child)) {
                    const originalColorArray = this.originalColors.get(child);

                    if (Array.isArray(child.material) && Array.isArray(originalColorArray)) {
                        child.material.forEach((mat, index) => {
                            if (mat.color && originalColorArray[index]) {
                                mat.color.copy(originalColorArray[index]);
                                restored = true;
                            }
                        });
                    } else if (!Array.isArray(child.material) && originalColorArray.length > 0) {
                        if (child.material.color && originalColorArray[0]) {
                            child.material.color.copy(originalColorArray[0]);
                            restored = true;
                        }
                    }
                }
            }
        });

        if (restored) {
            console.log("🎨 Car colors restored from stored originals");
        }
    }

    restoreToOriginal() {
        this.resetColor();
        this.mesh.rotation.set(0, Math.PI, 0);
        const position = this.carData.modelPosition || { x: 0, y: 0.3, z: -6 };
        this.mesh.position.set(position.x, position.y, position.z + this.positionOffsetZ);
    }

    setTemporaryColor(color) {
        this.setColor(color);
    }

    updateAnimation() {
        const currentTime = Date.now();
        const elapsed = currentTime - this.animationStartTime;

        switch (this.animationState) {
            case 'idle':
                // Gentle idle bounce - subtle and smooth
                const bounce = Math.sin(currentTime * 0.002) * 0.004;
                this.mesh.position.y = (0.3 - this.mesh.position.y) * 0.1 + bounce;
                break;

            case 'falling':
                this.updateFallingAnimation(elapsed);
                break;

            case 'returning':
                this.updateReturningAnimation(elapsed);
                break;

            case 'driveIn':
                this.updateDriveInAnimation(elapsed);
                break;
        }
    }

    updateFallingAnimation(elapsed) {
        const progress = Math.min(elapsed / this.animationDuration, 1);

        if (progress < 1) {
            // Smooth falling animation with easing
            const easedProgress = this.easeOutCubic(progress);

            // Move right and down with rotation
            this.mesh.position.x = 5 * easedProgress;
            this.mesh.rotation.z = 3 * easedProgress;
            this.mesh.position.y = -0.8 - (0.6 * easedProgress);
            this.setColor(0x000); // Darken color during fall
        } else {
            // Transition to returning state
            this.animationState = 'returning';
            this.animationStartTime = Date.now();
            this.resetColor();

        }
    }

    updateReturningAnimation(elapsed) {
        const progress = Math.min(elapsed / 800, 1); // Faster return

        if (progress < 1) {
            const easedProgress = this.easeOutBack(progress);

            // Smooth return to original position
            this.mesh.position.x = 8 * (1 - easedProgress);
            this.mesh.position.y = -0.4 + (0.7 * easedProgress);
            this.mesh.rotation.z = 3 * (1 - easedProgress);
        } else {
            // Return to idle state
            this.animationState = 'idle';
            this.mesh.position.set(0, 0.3, this.mesh.position.z);
            this.mesh.rotation.z = 0;
        }
    }

    updateDriveInAnimation(elapsed) {
        const totalDriveTime = 5000; // 5 second drive-in
        const progress = Math.min(elapsed / totalDriveTime, 1);

        if (progress < 1) {
            const easedProgress = this.easeOutCubic(progress);
            const startZ = this.carData.driveInStartZ || 7;
            const targetZ = (this.carData.modelPosition?.z || -6) + this.positionOffsetZ;

            // Drive from behind camera to target position
            this.mesh.position.z = startZ + (targetZ - startZ) * easedProgress;

            // Add slight engine vibration
            const vibration = Math.sin(elapsed * 0.03) * 0.01;
            this.mesh.position.y = 0.3 + vibration;

            // Final settle effect
            if (progress > 0.9) {
                const settleProgress = (progress - 0.9) / 0.1;
                const bounce = Math.sin(settleProgress * Math.PI * 2) * 0.03 * (1 - settleProgress);
                this.mesh.position.y = 0.3 + bounce;
            }
        } else {
            // Drive-in complete
            this.driveInComplete = true;
            this.animationState = 'idle';
            const targetZ = (this.carData.modelPosition?.z || -6) + this.positionOffsetZ;
            this.mesh.position.z = targetZ;
            this.mesh.position.y = 0.3;
        }
    }

    // Easing functions for smooth animations
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // Method to trigger animations
    startAnyAnimation(cases) {
        this.animationState = cases;
        this.animationStartTime = Date.now();
    }

    startDriveInAnimation() {
        this.animationState = 'driveIn';
        this.animationStartTime = Date.now();
        this.driveInComplete = false;

        // Set starting position behind camera
        const startZ = this.carData.driveInStartZ || 15;
        this.mesh.position.z = startZ;
    }

    // Check if drive-in animation is complete
    isDriveInComplete() {
        return this.driveInComplete;
    }

    reset() {
        if (this.mesh) {
            const position = this.carData.modelPosition || { x: 0, y: 0.3, z: -6 };
            this.mesh.position.set(position.x, position.y, position.z + this.positionOffsetZ);
            this.mesh.rotation.set(0, Math.PI, 0);
            this.animationState = 'idle';
            this.driveInComplete = false;
            this.restoreToOriginal();
        }
        
        // Reset protection system
        this.deactivateProtection();
    }

    disposeMesh(mesh) {
        if (mesh) {
            mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    }

    dispose() {
        if (this.mesh) {
            this.disposeMesh(this.mesh);
            this.scene.remove(this.mesh);
        }
        
        // Clean up protection effects
        this.removeProtectionEffects();
    }

    // Debug method to check model status
    debugModel() {
        if (!this.mesh) {
            console.log('❌ No mesh loaded');
            return;
        }

        console.log('🔍 Car Model Debug:');
        console.log('- Name:', this.carData.name);
        console.log('- Position:', this.mesh.position);
        console.log('- Scale:', this.mesh.scale);
        console.log('- Rotation:', this.mesh.rotation);
        console.log('- Animation State:', this.animationState);
        console.log('- Drive In Complete:', this.driveInComplete);
        console.log('- Protection Active:', this.carData.protectionActive);
        console.log('- Protection Remaining:', this.carData.protectionRemaining + 'm');
        console.log('- Visible:', this.mesh.visible);

        let meshCount = 0;
        this.mesh.traverse((child) => {
            if (child.isMesh) meshCount++;
        });

        console.log(`📊 Total meshes: ${meshCount}`);
    }
}

export default Car;