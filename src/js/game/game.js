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
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.totalDistance = 0;
        this.raceFinished = false;
        this.hasCrossedFinishLine = false;
        this.speed = 0;
        
        this.maxSpeed = 0.5;
        this.accel = 0.002;
        this.decel = 0.001;
        this.brakeDecel = 0.003;
        
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
        
        // Apply any pending settings
        this.applyPendingSettings();
        
        this.startAnimation();
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

        // Update distance
        const distanceThisFrame = this.speed * 5;
        this.totalDistance += distanceThisFrame;

        // Update road and obstacles
        this.road.update(distanceThisFrame, this.totalDistance, this.curves);
        this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
        
        // Update finish line
        this.finishLine.update(distanceThisFrame);

        // Check collisions
        this.obstacles.checkCollisions(this.car, this.tumbleSystem);

        // Check finish line
        this.checkFinishLine();

        // Update camera
        this.updateCamera();
        
        // Update UI
        this.updateDistanceDisplay();
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
        this.car.mesh.material.color.set(0xff0000);
        this.car.mesh.rotation.z = 0;
        
        console.log("✅ Bounce back completed");
    }

    updateSpeed() {
        // Don't allow acceleration during bounce back
        if (this.isBouncingBack) return;
        
        if (this.controls.upPressed && !this.raceFinished) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.accel);
        }
        if (this.controls.downPressed) {
            this.speed = Math.max(0, this.speed - this.brakeDecel);
        }
        if (this.controls.braking) {
            this.speed = Math.max(0, this.speed - this.brakeDecel);
        }
        if (!this.controls.upPressed && !this.controls.downPressed && !this.controls.braking && !this.raceFinished) {
            this.speed = Math.max(0, this.speed - this.decel);
        }
    }

    handleLaneChanges() {
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

    checkFinishLine() {
        if (!this.hasCrossedFinishLine && this.totalDistance >= this.raceDistance) {
            this.hasCrossedFinishLine = true;
            this.raceFinished = true;
            console.log(`🏁 Finish line reached at ${(this.totalDistance / 1000).toFixed(2)} km`);
        }

        if (this.raceFinished) {
            this.speed = Math.max(0, this.speed - this.brakeDecel * 2);
            this.controls.currentLane = 1;
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
        this.controls.reset();
        this.tumbleSystem.reset();
        this.obstacles.reset();
        this.curves.reset();
        this.car.reset();
        
        // Reset camera position
        this.camera.position.set(0, 2, 5);
        
        console.log("🔄 Game reset");
    }
}

export default startGame;