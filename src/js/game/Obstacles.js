import * as THREE from 'three';
import { obstacles } from '../../constants/material.js';

export class Obstacles {
    constructor(scene, car, game) {
        this.scene = scene;
        this.car = car;
        this.game = game;
        this.obstacles = [];
        this.nextObstacleDistance = 100;
        this.activeObstacle = null;
        
        this.OBSTACLE_TYPES = {
            DROP_ROCK: 'dropRock',
            ROCK: 'rock',
            BOMB: 'bomb'
        };
    }

    spawnObstacle(totalDistance, raceDistance) {
        if (this.activeObstacle || totalDistance >= raceDistance - 100) return;

        const obstacleTypes = [
            { type: this.OBSTACLE_TYPES.ROCK, texture: obstacles.rocks },
            { type: this.OBSTACLE_TYPES.DROP_ROCK, texture: obstacles.dropRocks },
            { type: this.OBSTACLE_TYPES.BOMB, texture: obstacles.roadBomb1 },
            { type: this.OBSTACLE_TYPES.BOMB, texture: obstacles.roadBomb2 },
            { type: this.OBSTACLE_TYPES.BOMB, texture: obstacles.carBomb }
        ];

        const selectedObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const type = selectedObstacle.type;
        const texture = selectedObstacle.texture;

        const lane = Math.floor(Math.random() * 3);
        const laneX = [-1.5, 0, 1.5][lane];

        let mesh, outlineMesh;
        
        if (type === this.OBSTACLE_TYPES.DROP_ROCK) {
            const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
            const mat = new THREE.MeshStandardMaterial({ 
                map: new THREE.TextureLoader().load(texture),
                transparent: true,
                opacity: 0.9
            });
            mesh = new THREE.Mesh(geo, mat);
            
            const outlineGeo = new THREE.BoxGeometry(1, 1, 1);
            const outlineMat = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6,
                side: THREE.BackSide
            });
            outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
            
            mesh.position.set(laneX, 5, this.car.mesh.position.z - 50);
            outlineMesh.position.copy(mesh.position);
            mesh.userData.type = type;
            mesh.userData.outline = outlineMesh;
            
        } else {
            const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const mat = new THREE.MeshStandardMaterial({ 
                map: new THREE.TextureLoader().load(texture),
                transparent: true,
                opacity: 1
            });
            mesh = new THREE.Mesh(geo, mat);
            
            const outlineGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
            const outlineColor = type === this.OBSTACLE_TYPES.BOMB ? 0xff0000 : 0x00ff00;
            const outlineMat = new THREE.MeshBasicMaterial({
                color: outlineColor,
                transparent: true,
                opacity: 0.8,
                side: THREE.BackSide
            });
            outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
            
            mesh.position.set(laneX, 0.8, this.car.mesh.position.z - 50);
            outlineMesh.position.copy(mesh.position);
            mesh.userData.type = type;
            mesh.userData.outline = outlineMesh;
        }

        mesh.userData.floatOffset = Math.random() * Math.PI * 2;
        mesh.userData.floatSpeed = 2 + Math.random() * 2;

        this.scene.add(mesh);
        this.scene.add(outlineMesh);
        this.activeObstacle = mesh;
        
        console.log(`🆕 Spawned ${type} obstacle at lane ${lane}`);
    }

    update(distanceThisFrame, totalDistance, raceDistance) {
        // Spawn new obstacles
        if (totalDistance >= this.nextObstacleDistance) {
            this.spawnObstacle(totalDistance, raceDistance);
            this.nextObstacleDistance += 100 + Math.random() * 200;
        }

        // Update active obstacle
        if (this.activeObstacle) {
            // Handle falling rocks
            if (this.activeObstacle.userData.type === this.OBSTACLE_TYPES.DROP_ROCK && 
                this.activeObstacle.position.y > 0.8) {
                this.activeObstacle.position.y -= 0.3;
                if (this.activeObstacle.userData.outline) {
                    this.activeObstacle.userData.outline.position.y = this.activeObstacle.position.y;
                }
            }

            // Floating animation for all obstacles
            const floatHeight = Math.sin(Date.now() * 0.001 + this.activeObstacle.userData.floatOffset) * 0.2;
            this.activeObstacle.position.y = (this.activeObstacle.userData.type === this.OBSTACLE_TYPES.DROP_ROCK ? 
                Math.max(0.8, this.activeObstacle.position.y) : 0.8) + floatHeight;
            
            if (this.activeObstacle.userData.outline) {
                this.activeObstacle.userData.outline.position.y = this.activeObstacle.position.y;
            }

            // Rotate obstacles for better visibility
            this.activeObstacle.rotation.y += 0.02;
            if (this.activeObstacle.userData.outline) {
                this.activeObstacle.userData.outline.rotation.y = this.activeObstacle.rotation.y;
            }

            // Move obstacle towards car
            this.activeObstacle.position.z += distanceThisFrame;
            if (this.activeObstacle.userData.outline) {
                this.activeObstacle.userData.outline.position.z = this.activeObstacle.position.z;
            }

            // Remove if passed
            if (this.activeObstacle.position.z > this.car.mesh.position.z + 5) {
                console.log(`🗑️ Removed ${this.activeObstacle.userData.type} obstacle`);
                this.removeObstacle();
            }
        }
    }

   checkCollisions(car, tumbleSystem) {
        if (!this.activeObstacle) return;

        const carBox = new THREE.Box3().setFromObject(car.mesh);
        const obsBox = new THREE.Box3().setFromObject(this.activeObstacle);

        if (carBox.intersectsBox(obsBox)) {
            console.log(`💥 Collision with ${this.activeObstacle.userData.type}!`);
            
            // CHECK PROTECTION FIRST
            if (car.isProtected && car.isProtected()) {
                console.log("🛡️ Collision blocked by protection!");
                car.handleCollision(this.activeObstacle.userData.type);
                this.removeObstacle();
                return;
            }
            
            // Normal collision handling if not protected
            if (this.activeObstacle.userData.type === this.OBSTACLE_TYPES.ROCK || 
                this.activeObstacle.userData.type === this.OBSTACLE_TYPES.DROP_ROCK) {
                this.handleRockCollision();
            } else if (this.activeObstacle.userData.type === this.OBSTACLE_TYPES.BOMB) {
                this.handleBombCollision(tumbleSystem);
            }

            this.removeObstacle();
        }
    }

    handleRockCollision() {
        console.log("💥 Hit rock! Bouncing back...");
        
        // Calculate bounce force based on current speed
        const bounceForce = this.game.speed * 0.8;
        
        // Set bounce back state
        this.game.isBouncingBack = true;
        this.game.bounceStartTime = Date.now();
        this.game.bounceDuration = 800;
        this.game.bounceForce = bounceForce;
        this.game.originalSpeed = this.game.speed;
        
        // Dramatic speed reduction
        this.game.speed = Math.max(0, this.game.speed * 0.2);
        
        // Camera shake effect
        this.shakeCamera(600);
        
        console.log(`Bounce force: ${bounceForce.toFixed(3)}, New speed: ${this.game.speed.toFixed(3)}`);
    }

    handleBombCollision(tumbleSystem) {
        console.log("💣 Bomb hit! Explosive flying animation!");
        
        // Set explosive flying state
        this.game.isExploding = true;
        this.game.explosionStartTime = Date.now();
        this.game.explosionDuration = 3000;
        
        // Stop the car completely
        this.game.speed = 0;
        
        // Create multiple explosion effects
        this.createExplosionEffects();
        
        // Start the flying animation
        this.startFlyingAnimation();
        
        // Set up the reset after explosion
        setTimeout(() => {
            this.endExplosion(tumbleSystem);
        }, this.game.explosionDuration);
    }

    createExplosionEffects() {
        // Remove any existing explosions
        if (this.game.explosionEffects) {
            this.game.explosionEffects.forEach(explosion => {
                if (explosion && explosion.parent) {
                    this.scene.remove(explosion);
                }
            });
        }
        
        this.game.explosionEffects = [];
        
        // Create main explosion only if car exists
        if (this.car && this.car.mesh) {
            const mainExplosion = this.createExplosionSprite(
                this.car.mesh.position.x,
                this.car.mesh.position.y + 1,
                this.car.mesh.position.z,
                8,
                0xff4500
            );
            this.game.explosionEffects.push(mainExplosion);
            
            // Create secondary explosions around the car
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const distance = 1.5 + Math.random() * 1;
                const x = this.car.mesh.position.x + Math.cos(angle) * distance;
                const y = this.car.mesh.position.y + Math.random() * 2;
                const z = this.car.mesh.position.z + Math.sin(angle) * distance;
                
                const explosion = this.createExplosionSprite(
                    x, y, z,
                    3 + Math.random() * 3,
                    0xff0000
                );
                this.game.explosionEffects.push(explosion);
            }
            
            // Create smoke effects
            for (let i = 0; i < 4; i++) {
                const smoke = this.createSmokeSprite(
                    this.car.mesh.position.x + (Math.random() - 0.5) * 3,
                    this.car.mesh.position.y + Math.random() * 1,
                    this.car.mesh.position.z + (Math.random() - 0.5) * 3
                );
                this.game.explosionEffects.push(smoke);
            }
        }
    }

    createExplosionSprite(x, y, z, size, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, `rgba(255, 255, 200, 1)`);
        gradient.addColorStop(0.2, `rgba(${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}, 1)`);
        gradient.addColorStop(0.6, `rgba(139, 69, 19, 0.8)`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(size, size, 1);
        
        this.scene.add(sprite);
        return sprite;
    }

    createSmokeSprite(x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(80, 80, 80, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.6
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(4, 4, 1);
        
        this.scene.add(sprite);
        return sprite;
    }

    startFlyingAnimation() {
        console.log("🚀 Starting flying animation");
        
        // Check if car and mesh exist
        if (!this.car || !this.car.mesh) {
            console.error("❌ Cannot start flying animation: car or car.mesh is undefined");
            return;
        }
        
        // Turn car black using the proper method
        if (typeof this.car.setColor === 'function') {
            this.car.setColor(0x000000);
        } else if (this.car.mesh && this.car.mesh.material) {
            // Fallback for basic materials
            this.car.mesh.material.color.set(0x000000);
        }
        
        // Set flying animation properties
        this.game.flyingStartTime = Date.now();
        this.game.flyingDuration = 2000;
        
        // Store original position and rotation safely
        if (this.car.mesh.position) {
            this.game.originalCarPosition = this.car.mesh.position.clone();
        } else {
            this.game.originalCarPosition = new THREE.Vector3(0, 0.3, 2);
        }
        
        if (this.car.mesh.rotation) {
            this.game.originalCarRotation = this.car.mesh.rotation.clone();
        } else {
            this.game.originalCarRotation = new THREE.Euler(0, Math.PI, 0);
        }
        
        // Add some random rotation for chaotic effect
        this.game.finalRotation = new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
    }

    updateFlyingAnimation() {
        // Check if we should be updating
        if (!this.game.isExploding || !this.car || !this.car.mesh) {
            return;
        }
        
        const flyTime = Date.now() - this.game.flyingStartTime;
        const flyProgress = Math.min(flyTime / this.game.flyingDuration, 1);
        
        // Easing function for smooth flight
        const easedProgress = this.easeOutCubic(flyProgress);
        
        // Calculate flight path (up and slightly forward)
        const flightHeight = 8 * easedProgress;
        const flightForward = 2 * easedProgress;
        
        // Update car position safely
        if (this.game.originalCarPosition) {
            this.car.mesh.position.y = this.game.originalCarPosition.y + flightHeight;
            this.car.mesh.position.z = this.game.originalCarPosition.z - flightForward;
        }
        
        // Rotate car chaotically
        if (this.game.originalCarRotation && this.game.finalRotation) {
            this.car.mesh.rotation.x = this.game.originalCarRotation.x + this.game.finalRotation.x * easedProgress;
            this.car.mesh.rotation.y = this.game.originalCarRotation.y + this.game.finalRotation.y * easedProgress;
            this.car.mesh.rotation.z = this.game.originalCarRotation.z + this.game.finalRotation.z * easedProgress;
        }
        
        // Update explosion effects
        this.updateExplosionEffects(flyProgress);
        
        // Camera follows the flying car
        this.updateExplosionCamera();
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    updateExplosionEffects(progress) {
        if (!this.game.explosionEffects) return;
        
        this.game.explosionEffects.forEach((explosion, index) => {
            if (!explosion) return;
            
            // Main explosion grows then shrinks
            if (index === 0) {
                const scale = 8 + Math.sin(progress * Math.PI * 4) * 2;
                explosion.scale.set(scale, scale, 1);
            }
            
            // Explosions move upward and fade
            explosion.position.y += 0.05;
            if (explosion.material) {
                explosion.material.opacity = 1 - progress * 0.8;
            }
            
            // Smoke effects rise and expand
            if (explosion.material && explosion.material.map) {
                const isSmoke = explosion.scale.x === 4; // Check if it's smoke by scale
                if (isSmoke) {
                    explosion.position.y += 0.1;
                    explosion.scale.x += 0.02;
                    explosion.scale.y += 0.02;
                }
            }
        });
    }

    updateExplosionCamera() {
        if (!this.car || !this.car.mesh) return;
        
        // Camera follows the flying car with some shake
        const shakeIntensity = 0.5;
        this.game.camera.position.x = this.car.mesh.position.x + (Math.random() - 0.5) * shakeIntensity;
        this.game.camera.position.y = this.car.mesh.position.y + 3 + (Math.random() - 0.5) * shakeIntensity;
        this.game.camera.position.z = this.car.mesh.position.z + 8 + (Math.random() - 0.5) * shakeIntensity;
        this.game.camera.lookAt(this.car.mesh.position);
    }

    endExplosion(tumbleSystem) {
        console.log("💥 Explosion finished! Resetting car...");
        
        // Clean up explosion effects
        if (this.game.explosionEffects) {
            this.game.explosionEffects.forEach(explosion => {
                if (explosion && explosion.parent) {
                    this.scene.remove(explosion);
                }
            });
            this.game.explosionEffects = null;
        }
        
        // Reset explosion state
        this.game.isExploding = false;
        
        // Reset car color
        if (this.car) {
            if (typeof this.car.resetColor === 'function') {
                this.car.resetColor();
            } else if (this.car.mesh && this.car.mesh.material) {
                this.car.mesh.material.color.set(0xff00);
            }
        }
        
        // Start tumble system for landing effect
        if (tumbleSystem) {
            tumbleSystem.startTumble();
        }
        
        // Reset car position after a short delay for tumble
        setTimeout(() => {
            if (this.car && this.car.mesh && this.game.originalCarPosition && this.game.originalCarRotation) {
                this.car.mesh.position.copy(this.game.originalCarPosition);
                this.car.mesh.rotation.copy(this.game.originalCarRotation);
            }
        }, 500);
    }

    shakeCamera(duration) {
        if (!this.game.camera) return;
        
        const originalCameraX = this.game.camera.position.x;
        const originalCameraY = this.game.camera.position.y;
        const shakeIntensity = 0.3;
        
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
            shakeTime += 50;
            this.game.camera.position.x = originalCameraX + (Math.random() - 0.5) * shakeIntensity;
            this.game.camera.position.y = originalCameraY + (Math.random() - 0.5) * shakeIntensity;
            
            if (shakeTime >= duration) {
                clearInterval(shakeInterval);
                this.game.camera.position.x = originalCameraX;
                this.game.camera.position.y = originalCameraY;
            }
        }, 50);
    }

    removeObstacle() {
        if (this.activeObstacle) {
            if (this.activeObstacle.userData.outline) {
                this.scene.remove(this.activeObstacle.userData.outline);
            }
            this.scene.remove(this.activeObstacle);
            this.activeObstacle = null;
        }
    }

    reset() {
        if (this.activeObstacle) {
            this.removeObstacle();
        }
        
        // Clean up any explosion effects
        if (this.game.explosionEffects) {
            this.game.explosionEffects.forEach(explosion => {
                if (explosion && explosion.parent) {
                    this.scene.remove(explosion);
                }
            });
            this.game.explosionEffects = null;
        }
        
        this.nextObstacleDistance = 100;
    }
}

export default Obstacles;