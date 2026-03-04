import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vechicles3D } from '../../constants/material';

const VIEW_PRESETS = {
    front: { cameraPosition: { x: 0, y: 1.2, z: 5 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
    side: { cameraPosition: { x: 5, y: 0.7, z: 0 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
    back: { cameraPosition: { x: 0, y: 1.4, z: -5 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
    top: { cameraPosition: { x: 0, y: 3.0, z: 0.1 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
    under: { cameraPosition: { x: 0, y: -3, z: 0.1 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
    '3quarter': { cameraPosition: { x: 3, y: 1.2, z: 3 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
};

const chopperData = [
    {
        id: '1ca',
        name: 'killer Drone',
        Chopper3D: vechicles3D.chopper3d,
        weapon: vechicles3D.missile3d,
        selected: false,
        modelPosition: { x: 0, y: -0.6, z: 0 },
        initialView: 'front',
        scaleConfig: { minScale: 0.4, maxScale: 1, defaultScale: 0.7 },
        disabledViews: { under: true, top: false, back: false },
        rotationLimits: {
            minPolarAngle: Math.PI / 2.1,
            maxPolarAngle: Math.PI / 2,
            minAzimuthAngle: -Infinity,
            maxAzimuthAngle: Infinity
        }
    }
];

export class ChopperRenderer {
    constructor(containerSelector = ".chopper", game = null) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) throw new Error("❌ Chopper container not found");

        this.game = game;
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.isFlyingIn = false;
        this.isFlyingOut = false;
        this.isHovering = false;

        // Enhanced missile system
        this.missiles = [];
        this.isMissileActive = false;
        this.missileShootingSpeed = 2000;
        this.lastMissileTime = 0;
        this.missileTargetLane = 1;
        this.missileTemplate = null;

        const chopper = chopperData[0];
        this.chopperConfig = chopper;

        // Camera setup
        const { cameraPosition, cameraLookAt } = VIEW_PRESETS[chopper.initialView];
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        this.camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(ambientLight, dirLight);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        const { rotationLimits } = chopper;
        this.controls.minPolarAngle = rotationLimits.minPolarAngle;
        this.controls.maxPolarAngle = rotationLimits.maxPolarAngle;

        // Load models
        this.loadChopper(chopper);

        // Event listeners
        window.addEventListener("resize", () => this.onResize());
        document.addEventListener('mode:timeup', () => this.onTimeEnd());

        this.animate();
    }

    // Missile control methods
    setMissileShooting(active, speed = 2000) {
        this.isMissileActive = active;
        this.missileShootingSpeed = speed;
        this.lastMissileTime = Date.now();
        console.log(`🚀 Missile shooting ${active ? 'ACTIVATED' : 'DEACTIVATED'} - Speed: ${speed}ms`);
    }

    setMissileSpeed(speed) {
        this.missileShootingSpeed = speed;
        console.log(`🎯 Missile shooting speed set to: ${speed}ms`);
    }

    onTimeEnd() {
        console.log("⏰ Time ended! Launching final missile attack!");
        this.setMissileShooting(true, 800);

        // Also trigger game over sequence
        if (this.game && this.game.onTimeEnd) {
            this.game.onTimeEnd();
        }
    }

    loadChopper(chopper) {
        const loader = new GLTFLoader();
        loader.load(
            chopper.Chopper3D,
            (gltf) => {
                this.chopperModel = gltf.scene;
                const model = this.chopperModel;

                model.position.set(0, 10, -15);
                model.scale.setScalar(0.1);
                this.scene.add(model);

                this.loadMissile(chopper);
                this.flyIn(model);
            },
            undefined,
            (error) => console.error("Error loading chopper:", error)
        );
    }

    loadMissile(chopper) {
        if (!chopper.weapon) return;
        const missileLoader = new GLTFLoader();

        missileLoader.load(
            chopper.weapon,
            (missileGltf) => {
                this.missileTemplate = missileGltf.scene;
                console.log("✅ Missile template loaded");
            },
            undefined,
            (error) => console.error("❌ Error loading missile:", error)
        );
    }

    createMissile(targetLane) {
        if (!this.missileTemplate || !this.chopperModel) return null;

        const missile = this.missileTemplate.clone();
        const lanePositions = [-1.5, 0, 1.5];
        const targetX = lanePositions[targetLane];

        // Position below chopper
        missile.position.copy(this.chopperModel.position);
        missile.position.y -= 0.8;

        missile.scale.setScalar(2.5);
        missile.rotation.set(Math.PI / 2, 0, 0); // Point downward

        // Missile properties
        missile.userData = {
            speed: 1,
            targetX: targetX,
            active: true,
            spawnTime: Date.now(),
            trailParticles: []
        };

        // Create trail effect
        this.createMissileTrail(missile);

        this.scene.add(missile);
        this.missiles.push(missile);

        console.log(`🚀 Missile launched at lane ${targetLane}`);
        return missile;
    }

    createMissileTrail(missile) {
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.PointsMaterial({
            color: 0xff4500,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const trail = new THREE.Points(trailGeometry, trailMaterial);
        missile.userData.trail = trail;
        this.scene.add(trail);
    }

    updateMissileTrail(missile) {
        if (!missile.userData.trail) return;

        const positions = [];
        const trailLength = 10;

        for (let i = 0; i < trailLength; i++) {
            const offset = i * 0.1;
            positions.push(
                missile.position.x,
                missile.position.y + offset,
                missile.position.z
            );
        }

        missile.userData.trail.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
    }

    updateMissiles(delta) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];

            if (!missile.userData.active) {
                this.scene.remove(missile);
                if (missile.userData.trail) {
                    this.scene.remove(missile.userData.trail);
                }
                this.missiles.splice(i, 1);
                continue;
            }

            // Move missile downward
            missile.position.y -= missile.userData.speed * delta * 60;

            // Move toward target lane
            missile.position.x += (missile.userData.targetX - missile.position.x) * 0.1;

            // Add rotation for visual effect
            missile.rotation.z += 0.2 * delta * 60;

            // Update trail
            this.updateMissileTrail(missile);

            // **FIX 1: Check collision BEFORE out-of-bounds**
            this.checkMissileCollision(missile);

            // **FIX 2: Adjust out-of-bounds to car level (y < -1.0)**
            if (missile.position.y < 4.0 || Date.now() - missile.userData.spawnTime > 8000) {
                missile.userData.active = false;
                this.createExplosion(missile.position.x, -4, missile.position.z);
            }
        }
    }

    checkMissileCollision(missile) {
        if (!this.game || !this.game.car || !this.game.car.mesh) return;

        const car = this.game.car.mesh;

        // **FIX 3: Use bounding sphere collision (more reliable)**
        const missileSphere = new THREE.Sphere(missile.position, 0.4);  // Missile radius 0.4
        const carSphere = new THREE.Sphere(car.position, 0.8);         // Car radius 0.8

        const distance = missileSphere.distanceToSphere(carSphere);

        // **FIX 4: Smaller threshold (0.1) for reliable hits**
        if (distance < 0.1) {
            console.log("💥 MISSILE HIT CAR!");
            missile.userData.active = false;

            // Handle missile hit
            if (this.game.car.handleMissileHit) {
                const result = this.game.car.handleMissileHit();
                if (result === 'destroyed') {
                    this.destroyCar();
                }
            } else {
                this.destroyCar();
            }
        }
    }

    createExplosion(x, y, z) {
        const explosionGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4500,
            transparent: true,
            opacity: 0.9
        });

        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        this.scene.add(explosion);

        const startTime = Date.now();
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 800;

            if (progress < 1) {
                explosion.scale.setScalar(1 + progress * 4);
                explosion.material.opacity = 0.9 * (1 - progress);
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };

        animateExplosion();
    }

    destroyCar() {
        if (!this.game) return;

        console.log("🔥 CAR DESTROYED BY MISSILE!");

        if (this.game.tumbleSystem) {
            this.game.tumbleSystem.triggerMissileDestruction(this.scene);
        }

        if (this.game.stopGame) {
            setTimeout(() => {
                this.game.stopGame("💥 CAR DESTROYED BY MISSILES!");
            }, 1500);
        }
    }

    getRandomLane() {
        return Math.floor(Math.random() * 3);
    }

    updateMissileShooting() {
        if (!this.isMissileActive || !this.chopperModel || !this.missileTemplate) return;

        const currentTime = Date.now();
        if (currentTime - this.lastMissileTime > this.missileShootingSpeed) {
            const targetLane = this.getRandomLane();
            this.createMissile(targetLane);
            this.lastMissileTime = currentTime;
        }
    }

    flyIn(model) {
        this.isFlyingIn = true;
        this.flyProgress = 0;
    }

    flyOut() {
        if (!this.chopperModel) return;
        this.isFlyingOut = true;
        this.isFlyingIn = false;
        this.isHovering = false;
        this.flyProgress = 0;
    }

    startHover() {
        this.isHovering = true;
        this.hoverTime = 0;
    }

    updateAnimation(delta) {
        if (!this.chopperModel) return;
        const model = this.chopperModel;
        const chopper = this.chopperConfig;
        const targetScale = chopper.scaleConfig.defaultScale;
        const speed = 0.8;

        // Fly In Animation
        if (this.isFlyingIn) {
            this.flyProgress += delta * speed;
            const t = Math.min(this.flyProgress, 1);
            model.position.lerp(new THREE.Vector3(0, chopper.modelPosition.y, 0), t);
            const newScale = THREE.MathUtils.lerp(0.4, targetScale, t);
            model.scale.setScalar(newScale);
            if (t >= 1) {
                this.isFlyingIn = false;
                this.startHover();
            }
        }

        // Hovering Animation
        if (this.isHovering) {
            this.hoverTime += delta;
            const xOffset = Math.sin(this.hoverTime * 0.5) * 0.4;
            const yOffset = Math.sin(this.hoverTime * 1.2) * 0.1;
            model.position.x = xOffset;
            model.position.y = chopper.modelPosition.y + yOffset;
        }

        // Fly Out Animation
        if (this.isFlyingOut) {
            this.flyProgress += delta * speed;
            const t = Math.min(this.flyProgress, 1);
            model.position.lerp(new THREE.Vector3(0, 15, 20), t);
            const newScale = THREE.MathUtils.lerp(targetScale, 0.01, t);
            model.scale.setScalar(newScale);
            model.rotation.y += 0.05;
            if (t >= 1) {
                this.isFlyingOut = false;
                this.scene.remove(model);
            }
        }

        // Update missile system
        this.updateMissileShooting();
        this.updateMissiles(delta);
    }

    onResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        this.updateAnimation(delta);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.setMissileShooting(false);

        // Clean up missiles
        this.missiles.forEach(missile => {
            this.scene.remove(missile);
            if (missile.userData.trail) {
                this.scene.remove(missile.userData.trail);
            }
        });
        this.missiles = [];

        if (this.renderer) {
            this.renderer.dispose();
        }

        window.removeEventListener("resize", () => this.onResize());
        document.removeEventListener('mode:timeup', () => this.onTimeEnd());
    }
}

export default ChopperRenderer;

