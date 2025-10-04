import * as THREE from 'three';
import { obstacles } from '../../constants/material.js';

export class TumbleSystem {
    constructor(car, camera) {
        this.car = car;
        this.camera = camera;
        
        this.isTumbling = false;
        this.isReturningToNormal = false;
        this.tumbleSpeed = 0.15;
        this.tumbleThreshold = 0.1;
        this.tumbleDuration = 3000;
        this.tumbleStartTime = 0;
        
        this.explosionEffect = obstacles.explodeEffect;
        this.explosion = null;
    }

    setTumbleSettings({ speed = 0.15, threshold = 0.1, duration = 3000 } = {}) {
        this.tumbleSpeed = speed;
        this.tumbleThreshold = threshold;
        this.tumbleDuration = duration;
        console.log(`🎭 Tumble settings updated: speed=${this.tumbleSpeed}, threshold=${this.tumbleThreshold}, duration=${this.tumbleDuration}ms`);
    }

    // Method to set temporary car color for effects
    setCarColor(color) {
        if (this.car && typeof this.car.setColor === 'function') {
            this.car.setColor(color);
        } else if (this.car && typeof this.car.setTemporaryColor === 'function') {
            this.car.setTemporaryColor(color);
        } else if (this.car && this.car.mesh) {
            // Fallback for basic materials and 3D models
            this.car.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.isMaterial && mat.color) {
                                mat.color.set(color);
                            }
                        });
                    } else if (child.material.isMaterial && child.material.color) {
                        child.material.color.set(color);
                    }
                }
            });
        }
    }

    // Method to reset car to original colors
   resetCarColor() {
    if (this.car) {
        this.car.resetColor();
    }
}


    startTumble() {
        this.isTumbling = true;
        this.tumbleStartTime = Date.now();
        
        // Change car color to black for tumble effect
        this.setCarColor(0x000000);
        console.log("🚨 TUMBLE TRIGGERED! Car turned black");
    }

    triggerBombExplosion(scene) {
        console.log("💣 Bomb hit! Triggering explosion and tumble");

        // Change car color to black immediately
        this.setCarColor(0x000000);

        // Create explosion effect
        const texture = new THREE.TextureLoader().load(this.explosionEffect);
        const mat = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            opacity: 1.0
        });
        this.explosion = new THREE.Sprite(mat);
        this.explosion.scale.set(5, 5, 1);
        this.explosion.position.copy(this.car.mesh.position);
        this.explosion.position.y += 1;
        scene.add(this.explosion);

        // Start tumble
        this.startTumble();
    }

    update() {
        if (this.isTumbling) {
            this.updateTumble();
        } else if (this.isReturningToNormal) {
            this.updateReturnToNormal();
        }
    }

    updateTumble() {
        const tumbleTime = Date.now() - this.tumbleStartTime;

        // Dramatic tumble rotation - more realistic for 3D car
        this.car.mesh.rotation.x += this.tumbleSpeed * 1.5;
        this.car.mesh.rotation.y += this.tumbleSpeed * 0.8;
        this.car.mesh.rotation.z += this.tumbleSpeed * 1.2;

        // More dramatic movement for crash effect
        this.car.mesh.position.x += (Math.random() - 0.5) * 0.4;
        this.car.mesh.position.y = 0.3 + Math.sin(Date.now() * 0.02) * 0.8; // Adjusted for 3D car height

        // Move explosion with car
        if (this.explosion) {
            this.explosion.position.copy(this.car.mesh.position);
            this.explosion.position.y += 1.5; // Higher for 3D car
            
            // Make explosion pulse and grow
            const pulse = 1 + Math.sin(Date.now() * 0.015) * 0.3;
            const growth = 1 + (tumbleTime / this.tumbleDuration) * 0.5;
            this.explosion.scale.set(5 * pulse * growth, 5 * pulse * growth, 1);
            
            // Fade explosion over time
            this.explosion.material.opacity = 1 - (tumbleTime / this.tumbleDuration) * 0.7;
        }

        // Rapid deceleration during tumble
        if (this.car.game && this.car.game.speed !== undefined) {
            this.car.game.speed = Math.max(0, this.car.game.speed - (this.car.game.brakeDecel || 0.003) * 12);
        }

        // Intense camera shake during tumble
        const shakeIntensity = 0.4 * (1 - tumbleTime / this.tumbleDuration);
        this.camera.position.x = this.car.mesh.position.x * 0.3 + (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.y = 2 + (Math.random() - 0.5) * shakeIntensity * 0.6;
        this.camera.position.z = this.car.mesh.position.z + 5 + (Math.random() - 0.5) * shakeIntensity * 0.3;
        this.camera.lookAt(this.car.mesh.position);

        // Check if tumble duration is over
        if (tumbleTime >= this.tumbleDuration) {
            this.endTumble();
        }
    }

    endTumble() {
        this.isTumbling = false;
        this.isReturningToNormal = true;
        
        // Remove explosion
        if (this.explosion) {
            this.explosion.parent.remove(this.explosion);
            this.explosion = null;
        }
        
        console.log("💥 Tumble finished - returning to normal position");
        this.car.restoreToOriginal();

    }

    updateReturnToNormal() {
        // Smoothly interpolate back to normal position and rotation
        const returnSpeed = 0.1;
        
        // Return to lane center
        this.car.mesh.position.x += (0 - this.car.mesh.position.x) * returnSpeed;
        
        // Return to normal height (adjusted for 3D car)
        this.car.mesh.position.y += (0.3 - this.car.mesh.position.y) * returnSpeed;
        
        // Reset rotation
        this.car.mesh.rotation.x += (0 - this.car.mesh.rotation.x) * returnSpeed;
        this.car.mesh.rotation.y += (Math.PI - this.car.mesh.rotation.y) * returnSpeed; // Face forward for 3D car
        this.car.mesh.rotation.z += (0 - this.car.mesh.rotation.z) * returnSpeed;

        // Check if we're close enough to normal position
        const positionDiff = Math.abs(this.car.mesh.position.x) + Math.abs(this.car.mesh.position.y - 0.3);
        const rotationDiff = Math.abs(this.car.mesh.rotation.x) + Math.abs(this.car.mesh.rotation.y - Math.PI) + Math.abs(this.car.mesh.rotation.z);

        if (positionDiff < 0.01 && rotationDiff < 0.01) {
            this.isReturningToNormal = false;
            
            // Set exact values to avoid floating point errors
            this.car.mesh.position.set(0, 0.3, this.car.mesh.position.z);
            this.car.mesh.rotation.set(0, Math.PI, 0); // Proper rotation for 3D car
            
            // RESTORE CAR TO ORIGINAL FORM - This is the key fix!
            this.resetCarColor();
            
            console.log("✅ Car returned to normal position and ORIGINAL COLORS");
        }
    }

    // Enhanced explosion effect for bomb collisions
    triggerEnhancedExplosion(scene) {
        console.log("💥 Enhanced explosion triggered!");
        
        // Change car color to black
        this.setCarColor(0x222222); // Dark gray for burnt effect
        
        // Create multiple explosion effects
        this.createMultiExplosion(scene);
        
        // Start enhanced tumble
        this.startTumble();
        
        // Make tumble more dramatic for explosions
        this.tumbleSpeed = 0.2;
        this.tumbleDuration = 4000;
    }

    createMultiExplosion(scene) {
        // Remove existing explosion if any
        if (this.explosion) {
            scene.remove(this.explosion);
        }
        
        // Create explosion group
        const explosionGroup = new THREE.Group();
        
        // Main explosion
        const mainTexture = new THREE.TextureLoader().load(this.explosionEffect);
        const mainMat = new THREE.SpriteMaterial({ 
            map: mainTexture, 
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 1.0
        });
        this.explosion = new THREE.Sprite(mainMat);
        this.explosion.scale.set(8, 8, 1);
        this.explosion.position.copy(this.car.mesh.position);
        this.explosion.position.y += 2;
        explosionGroup.add(this.explosion);
        
        // Secondary explosions
        for (let i = 0; i < 3; i++) {
            const secondaryTexture = new THREE.TextureLoader().load(this.explosionEffect);
            const secondaryMat = new THREE.SpriteMaterial({ 
                map: secondaryTexture, 
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.7
            });
            const secondaryExplosion = new THREE.Sprite(secondaryMat);
            secondaryExplosion.scale.set(4, 4, 1);
            secondaryExplosion.position.set(
                this.car.mesh.position.x + (Math.random() - 0.5) * 3,
                this.car.mesh.position.y + Math.random() * 2,
                this.car.mesh.position.z + (Math.random() - 0.5) * 3
            );
            explosionGroup.add(secondaryExplosion);
        }
        
        scene.add(explosionGroup);
        this.explosion = explosionGroup; // Store the group instead of single explosion
    }

    isActive() {
        return this.isTumbling || this.isReturningToNormal;
    }

    reset() {
        this.isTumbling = false;
        this.isReturningToNormal = false;
        
        // Remove explosion if exists
        if (this.explosion) {
            if (this.explosion.parent) {
                this.explosion.parent.remove(this.explosion);
            }
            this.explosion = null;
        }
        
        // Reset car to original form
        this.resetCarColor();
        
        // Reset tumble settings to default
        this.tumbleSpeed = 0.15;
        this.tumbleDuration = 3000;
        
        console.log("🔄 Tumble system reset - car restored to original form");
    }
}

export default TumbleSystem;