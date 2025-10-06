import * as THREE from 'three';
import { Road } from './Road.js';
import { Car } from './Car.js';
import { FinishLine } from './FinishLine.js';
import { Controls } from './Controls.js';
import { Obstacles } from './Obstacles.js';
import { Curves } from './Curves.js';
import { TumbleSystem } from './TumbleSystem.js';

export class startGame {
    constructor(containerSelector = '.road', distanceKm = 1) {
        this.containerSelector = containerSelector;
        this.raceDistance = distanceKm * 1000;

        this.car = null; // Initialize as null, will be set in init()

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.totalDistance = 0;
        this.raceFinished = false;
        this.hasCrossedFinishLine = false;
        this.speed = 0;

        // Use default values initially
        this.maxSpeed = 0.2;
        this.accel = 0.002;
        this.decel = 0.001;
        this.brakeDecel = 0.003;

        // Countdown system
        this.countdownActive = false;
        this.countdownValue = 5;
        this.countdownStartTime = 0;
        this.lastCountdownNumber = 5;
        this.carDriveInComplete = false;

        // Bounce back system
        this.isBouncingBack = false;
        this.bounceStartTime = 0;
        this.bounceDuration = 0;
        this.bounceForce = 0;
        this.originalSpeed = 0;

        // Explosion system
        this.isExploding = false;
        this.explosionStartTime = 0;
        this.explosionDuration = 0;
        this.explosionEffects = null;
        this.flyingStartTime = 0;
        this.flyingDuration = 0;
        this.originalCarPosition = null;
        this.originalCarRotation = null;
        this.finalRotation = null;

        this.init();

        // Apply default settings
        this.applyDefaultSettings();

        // Start countdown after a short delay to ensure everything is loaded
        setTimeout(() => {
            this.startCountdown();
        }, 1000);
    }

    startCountdown() {
        this.countdownActive = true;
        this.countdownValue = 5;
        this.countdownStartTime = Date.now();
        this.lastCountdownNumber = 5;
        this.carDriveInComplete = false;

        console.log("🔴 Countdown started: 5");

        // Set car to starting position and start animation
        if (this.car && this.car.mesh) {
            // Set car to starting position behind camera
            const startZ = 15; // Start behind camera
            this.car.mesh.position.z = startZ;
            this.car.mesh.position.x = 0;
            this.car.mesh.position.y = 0.3;
            this.car.mesh.rotation.set(0, Math.PI, 0);

            // Start the drive-in animation
            this.car.startDriveInAnimation();
            console.log("🚗 Starting drive-in animation from z=" + startZ);
        } else {
            console.warn("⚠️ Car mesh not available for drive-in animation");
        }

        this.createCountdownDisplay();
    }

    createCountdownDisplay() {
        // Remove existing countdown display
        const existingDisplay = document.getElementById('countdown-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }

        // Create countdown display
        const gamepg = document.querySelector('.gamepg')
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'countdown-display';

        gamepg.appendChild(countdownDisplay);
    }

    updateCountdown() {
        if (!this.countdownActive) return;

        const currentTime = Date.now();
        const elapsed = currentTime - this.countdownStartTime;
        const remainingSeconds = Math.ceil(this.countdownValue - (elapsed / 1000));

        const countdownDisplay = document.getElementById('countdown-display');

        // Update countdown number when it changes
        if (remainingSeconds !== this.lastCountdownNumber && remainingSeconds > 0) {
            this.lastCountdownNumber = remainingSeconds;

            if (countdownDisplay) {
                countdownDisplay.textContent = remainingSeconds;
                countdownDisplay.style.opacity = '1';
                countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1)';

                // Pulse animation
                setTimeout(() => {
                    if (countdownDisplay) {
                        countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1.3)';
                    }
                }, 100);

                setTimeout(() => {
                    if (countdownDisplay) {
                        countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1)';
                    }
                }, 300);

                console.log(`🔴 Countdown: ${remainingSeconds}`);
            }
        }

        // Show "GO!" when countdown finishes
        if (remainingSeconds === 0) {
            if (countdownDisplay) {
                countdownDisplay.textContent = 'DRIVE! 🤬 ';
                countdownDisplay.style.color = '#ff0000';
                countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1.5)';
                countdownDisplay.style.opacity = '1';
            }

            console.log("🟢 GO! Race started!");

            // Hide GO after 1 second
            setTimeout(() => {
                if (countdownDisplay) {
                    countdownDisplay.style.opacity = '0';
                    setTimeout(() => {
                        if (countdownDisplay && countdownDisplay.parentNode) {
                            countdownDisplay.remove();
                        }
                    }, 500);
                }
            }, 1000);

            this.countdownActive = false;
            this.carDriveInComplete = true;
        }
    }

    applyDefaultSettings() {
        // Set default tumble settings
        this.setTumbleSettings({
            speed: 0.1,
            threshold: 0.1,
            duration: 2000
        });

        // Add default curves
        this.addCurve(200, 700, 0.01);
        this.addCurve(600, 900, -0.01);
        this.addCurve(1200, 2000, 0.02);
        this.addCurve(1800, 3000, -0.02);

        console.log("🎮 Game started with default settings");
    }

    // Configuration methods
    setTumbleSettings(settings) {
        if (this.tumbleSystem) {
            this.tumbleSystem.setTumbleSettings(settings);
        } else {
            // Store settings to apply after initialization
            this.pendingTumbleSettings = settings;
        }
    }

    addCurve(start, end, intensity) {
        if (this.curves) {
            this.curves.addCurve(start, end, intensity);
        } else {
            // Store curves to add after initialization
            if (!this.pendingCurves) this.pendingCurves = [];
            this.pendingCurves.push({ start, end, intensity });
        }
    }

    clearCurves() {
        if (this.curves) {
            this.curves.clearCurves();
        }
    }

    setSpeedSettings({ maxSpeed, accel, decel, brakeDecel } = {}) {
        if (maxSpeed !== undefined) this.maxSpeed = maxSpeed;
        if (accel !== undefined) this.accel = accel;
        if (decel !== undefined) this.decel = decel;
        if (brakeDecel !== undefined) this.brakeDecel = brakeDecel;
    }

    setRaceDistance(distanceKm) {
        this.raceDistance = distanceKm * 1000;
        if (this.finishLine) {
            // Recreate finish line at new position
            this.scene.remove(this.finishLine.mesh);
            this.finishLine = new FinishLine(this.scene, -this.raceDistance);
        }
    }

    // Apply any pending settings after initialization
    applyPendingSettings() {
        if (this.pendingTumbleSettings) {
            this.tumbleSystem.setTumbleSettings(this.pendingTumbleSettings);
            this.pendingTumbleSettings = null;
        }

        if (this.pendingCurves) {
            this.pendingCurves.forEach(curve => {
                this.curves.addCurve(curve.start, curve.end, curve.intensity);
            });
            this.pendingCurves = null;
        }
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();

        // Initialize modules
        this.road = new Road(this.scene);
        this.car = new Car(this.scene, this);
        this.finishLine = new FinishLine(this.scene, -this.raceDistance);
        this.controls = new Controls(this);
        this.obstacles = new Obstacles(this.scene, this.car, this);
        this.curves = new Curves();
        this.tumbleSystem = new TumbleSystem(this.car, this.camera);

        // FIXED: Add parentheses to method calls
        this.maxSpeed = this.car.getMaxSpeed ? this.car.getMaxSpeed() : 0.2;
        this.accel = this.car.getAcceleration ? this.car.getAcceleration() : 0.002;
        this.decel = this.car.getDeceleration ? this.car.getDeceleration() : 0.001;
        this.brakeDecel = this.car.getBrakeDeceleration ? this.car.getBrakeDeceleration() : 0.003;

        console.log("🚗 Car properties loaded:", {
            maxSpeed: this.maxSpeed,
            accel: this.accel,
            decel: this.decel,
            brakeDecel: this.brakeDecel
        });

        this.car.startAnyAnimation('idle');
        
        // Apply any pending settings
        this.applyPendingSettings();

        this.startAnimation();
        this.car.activateProtection();
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 5);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const container = document.querySelector(this.containerSelector);
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);
    }

    update(deltaTime) {
        // Handle countdown first (if active)
        if (this.countdownActive) {
            this.updateCountdown();

            // During countdown, manually update car animation and minimal scene
            if (this.car && this.car.mesh) {
                this.car.updateAnimation();
            }

            // Update minimal road movement during countdown for visual effect
            const minimalRoadMovement = 0.1;
            this.road.update(minimalRoadMovement, this.totalDistance, this.curves);

            // Update camera and render
            this.updateCountdownCamera();
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // Handle explosion animation first
        if (this.isExploding) {
            this.obstacles.updateFlyingAnimation();

            // Still move roads during explosion (but slower)
            const distanceThisFrame = this.speed * 2;
            this.road.update(distanceThisFrame, this.totalDistance, this.curves);
            this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
            this.finishLine.update(distanceThisFrame);

            this.updateDistanceDisplay();
            return;
        }

        // Handle bounce back animation
        if (this.isBouncingBack) {
            this.updateBounceBack();
            return;
        }

        if (this.tumbleSystem.isTumbling || this.tumbleSystem.isReturningToNormal) {
            this.tumbleSystem.update();

            // Still move roads and obstacles during tumble/return
            const distanceThisFrame = this.speed * 5;
            this.road.update(distanceThisFrame, this.totalDistance, this.curves);
            this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
            this.finishLine.update(distanceThisFrame);

            this.updateCamera();
            this.updateDistanceDisplay();
            return;
        }

        // Update speed based on controls (only if not bouncing back)
        this.updateSpeed();

        // Handle lane changes
        this.handleLaneChanges();

        // Update curves
        this.curves.update(this.totalDistance);

        // Update car position and rotation
        this.car.update(
            this.controls.currentLane,
            this.curves.currentIntensity,
            this.curves.getCurveOffset(),
            deltaTime
        );

        // Update distance - ALWAYS UPDATE DISTANCE EVEN AFTER FINISH
        const distanceThisFrame = this.speed * 5;
        this.totalDistance += distanceThisFrame;

        // ALWAYS UPDATE ROAD - EVEN AFTER FINISH LINE
        this.road.update(distanceThisFrame, this.totalDistance, this.curves);
        
        // Only update obstacles if race not finished
        if (!this.raceFinished || this.speed > 0.01) {
            this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
        }
        
        // Always update finish line position
        this.finishLine.update(distanceThisFrame);

        // Check collisions (only if race not finished)
        if (!this.raceFinished) {
            this.obstacles.checkCollisions(this.car, this.tumbleSystem);
        }

        // Check finish line
        this.checkFinishLine();

        // Update camera
        this.updateCamera();

        // Update UI
        this.updateDistanceDisplay();
    }

    updateCountdownCamera() {
        // Camera that follows the car during drive-in animation
        if (this.car && this.car.mesh) {
            // Camera stays in fixed position but looks at the moving car
            this.camera.position.set(0, 2, 8);
            this.camera.lookAt(this.car.mesh.position.x, this.car.mesh.position.y + 0.5, this.car.mesh.position.z);
        } else {
            this.camera.position.set(0, 2, 8);
            this.camera.lookAt(0, 0.5, 0);
        }
    }

    updateBounceBack() {
        const bounceTime = Date.now() - this.bounceStartTime;
        const bounceProgress = Math.min(bounceTime / this.bounceDuration, 1);

        // Calculate bounce easing (ease out)
        const easedProgress = 1 - Math.pow(1 - bounceProgress, 3);

        // Apply bounce back movement (move car backwards)
        const bounceMovement = this.bounceForce * (1 - easedProgress);
        this.car.mesh.position.z += bounceMovement * 0.5;

        // Add some side movement for more realistic bounce
        this.car.mesh.position.x += (Math.random() - 0.5) * bounceMovement * 0.1;

        // Car rotation during bounce
        this.car.mesh.rotation.z = Math.sin(bounceProgress * Math.PI * 4) * 0.3;

        // Move roads forward (creating illusion of car moving backward)
        const roadMovement = this.speed * 5;
        this.road.update(roadMovement, this.totalDistance, this.curves);
        this.obstacles.update(roadMovement, this.totalDistance, this.raceDistance);
        this.finishLine.update(roadMovement);

        // Update camera with shake effect
        this.updateBounceCamera(bounceProgress);

        // Check if bounce animation is complete
        if (bounceProgress >= 1) {
            this.endBounceBack();
        }

        this.updateDistanceDisplay();
    }

    updateBounceCamera(bounceProgress) {
        // Camera shake during bounce
        const shakeIntensity = (1 - bounceProgress) * 0.4;
        this.camera.position.x = this.car.mesh.position.x * 0.3 + (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.y = 2 + (Math.random() - 0.5) * shakeIntensity * 0.5;
        this.camera.position.z = this.car.mesh.position.z + 5;
        this.camera.lookAt(this.car.mesh.position.x, this.car.mesh.position.y, this.car.mesh.position.z - 2);
    }

    endBounceBack() {
        this.isBouncingBack = false;
        this.car.mesh.rotation.z = 0;
        console.log("✅ Bounce back completed");
    }

    updateSpeed() {
        // Don't allow acceleration during bounce back or countdown
        if (this.isBouncingBack || this.countdownActive) return;

        // Use car properties instead of hardcoded values
        const maxSpeed = this.car.getMaxSpeed ? this.car.getMaxSpeed() : this.maxSpeed;
        const accel = this.car.getAcceleration ? this.car.getAcceleration() : this.accel;
        const brakeDecel = this.car.getBrakeDeceleration ? this.car.getBrakeDeceleration() : this.brakeDecel;
        const decel = this.car.getDeceleration ? this.car.getDeceleration() : this.decel;

        if (this.controls.upPressed && !this.raceFinished) {
            this.speed = Math.min(maxSpeed, this.speed + accel);
        }
        if (this.controls.downPressed) {
            this.speed = Math.max(0, this.speed - brakeDecel);
        }
        if (this.controls.braking) {
            this.speed = Math.max(0, this.speed - brakeDecel);
        }
        if (!this.controls.upPressed && !this.controls.downPressed && !this.controls.braking && !this.raceFinished) {
            this.speed = Math.max(0, this.speed - decel);
        }
    }

    handleLaneChanges() {
        // Don't allow lane changes during countdown
        if (this.countdownActive) return;

        if (this.speed > 0.01 && !this.raceFinished && !this.hasCrossedFinishLine) {
            if (this.controls.leftPressed && this.controls.currentLane > 0) {
                this.controls.currentLane--;
                this.controls.leftPressed = false;
            }
            if (this.controls.rightPressed && this.controls.currentLane < 2) {
                this.controls.currentLane++;
                this.controls.rightPressed = false;
            }
        }
    }

    updateCamera() {
        if (this.tumbleSystem.isTumbling) {
            // Camera shake during tumble
            this.camera.position.x = this.car.mesh.position.x * 0.3 + (Math.random() - 0.5) * 0.1;
            this.camera.position.y = 2 + (Math.random() - 0.5) * 0.2;
            this.camera.position.z = this.car.mesh.position.z + 5;
        } else {
            // Normal camera follow
            this.camera.position.x = this.car.mesh.position.x * 0.3;
            this.camera.position.z = this.car.mesh.position.z + 5;
        }
        this.camera.lookAt(this.car.mesh.position.x, this.car.mesh.position.y, this.car.mesh.position.z - 2);
    }

    driftAnimation() {
        const car = this.car.mesh || this.car;
        const start = performance.now();
        const duration = 2000; // drift lasts 2 seconds
        const driftAngle = Math.PI / 9; // ~30 degrees
        const slideDistance = 1.5; // how far it slides sideways
        const tiltAngle = Math.PI / 2; // small tilt on X-axis
        const direction = Math.random() < 0.5 ? 1 : -1; // random left/right drift

        const initialYRotation = 0.3;
        const initialXPosition = -0.7;
        const initialZRotation = -0.3;

        const animate = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing in/out
            const ease = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // --- Drift motion ---
            car.rotation.y = initialYRotation + direction * driftAngle * Math.sin(progress * Math.PI);
            car.position.x = initialXPosition + direction * slideDistance * Math.sin(progress * Math.PI);
            car.rotation.z = initialZRotation + direction * tiltAngle * Math.sin(progress * Math.PI);

            // --- Speed reduction ---
            this.speed = Math.max(0, this.speed - 0.01 * (1 + progress));

            // --- Optional smoke particles ---
            if (progress < 0.8 && Math.random() < 0.2) {
                this.createDriftSmoke(car);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Reset car orientation and position
                car.rotation.y = initialYRotation;
                car.rotation.z = 0;
                car.position.x = 0;
                this.speed = 0;
                console.log("🔥 Drift completed!");
            }
        };

        requestAnimationFrame(animate);
    }

    createDriftSmoke(car) {
        // Create circular "puff" geometry
        const smokeGeo = new THREE.CircleGeometry(0.5, 16);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const smoke = new THREE.Mesh(smokeGeo, smokeMat);

        // Position slightly behind and below the car
        smoke.position.copy(car.position);
        smoke.position.y = 0.1; // near the ground
        smoke.position.z -= 0.5 + Math.random() * 0.2;
        smoke.rotation.x = -Math.PI / 2; // face upward

        // Slight random offset for variety
        smoke.position.x += (Math.random() - 0.5) * 0.3;

        // Add to the scene
        this.scene.add(smoke);

        // Animate the smoke expanding and fading
        const start = performance.now();
        const duration = 1000 + Math.random() * 500; // 1–1.5s lifespan

        const animate = (time) => {
            const t = (time - start) / duration;
            if (t < 1) {
                const ease = 1 - Math.pow(1 - t, 2);
                smoke.material.opacity = 0.5 * (1 - ease);
                smoke.scale.set(1 + ease * 2, 1 + ease * 2, 1);
                smoke.position.y += 0.01;
                requestAnimationFrame(animate);
            } else {
                // Clean up
                this.scene.remove(smoke);
                smoke.geometry.dispose();
                smoke.material.dispose();
            }
        };
        requestAnimationFrame(animate);
    }

    checkFinishLine() {
        if (!this.hasCrossedFinishLine && this.totalDistance >= this.raceDistance) {
            this.hasCrossedFinishLine = true;
            this.raceFinished = true;
            console.log(`🏁 Finish line reached at ${(this.totalDistance / 1000).toFixed(2)} km`);

            // ✅ Trigger drift if at high speed
            if (this.speed > 0.4) {
                this.driftAnimation();
            }
        }

        // KEEP UPDATING ROAD EVEN AFTER FINISH LINE
        if (this.raceFinished) {
            // Smooth deceleration
            this.speed = Math.max(0, this.speed - this.brakeDecel * 1.5);
            this.controls.currentLane = 1;

            // Continue road movement until car completely stops
            if (this.speed > 0.01) {
                const distanceThisFrame = this.speed * 5;
                this.totalDistance += distanceThisFrame;
                this.road.update(distanceThisFrame, this.totalDistance, this.curves);
                this.finishLine.update(distanceThisFrame);
            }
        }
    }

    updateDistanceDisplay() {
        const distanceElement = document.getElementById('distance-display');
        if (distanceElement) {
            distanceElement.textContent =
                `Distance: ${(this.totalDistance / 1000).toFixed(2)}km / ${(this.raceDistance / 1000).toFixed(1)}km`;
        }
    }

    startAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.update(16);
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    reset() {
        this.totalDistance = 0;
        this.raceFinished = false;
        this.hasCrossedFinishLine = false;
        this.speed = 0;
        this.isBouncingBack = false;
        this.isExploding = false;
        this.countdownActive = false;
        this.carDriveInComplete = false;
        this.controls.reset();
        this.tumbleSystem.reset();
        this.obstacles.reset();
        this.curves.reset();
        this.car.reset();

        // Reset camera position
        this.camera.position.set(0, 2, 5);

        // Remove countdown display if it exists
        const countdownDisplay = document.getElementById('countdown-display');
        if (countdownDisplay) {
            countdownDisplay.remove();
        }

        console.log("🔄 Game reset");

        // Restart countdown after reset
        setTimeout(() => {
            this.startCountdown();
        }, 500);
    }
}

export default startGame;