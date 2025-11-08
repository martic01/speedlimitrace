import * as THREE from 'three';
import { Road } from './Road.js';
import { Car } from './Car.js';
import { FinishLine } from './FinishLine.js';
import { Controls } from './Controls.js';
import { Obstacles } from './Obstacles.js';
import { Curves } from './Curves.js';
import { TumbleSystem } from './TumbleSystem.js';
import { setHolding, setMeters, updateSpeed, speedo } from './speedo.js';
import { gameMusic, stopAll } from '../sounds.js';
import { initDistanceHUD, updateDistanceHUD, resetDistanceHUD, destroyDistanceHUD } from './distanceHud.js';
import { configureTimer, setTimerRunning, startCountdown, resetTimer, stopCountdown } from './Mode.js'

export class startGame {
  constructor(containerSelector = '.road', distanceKm = 1) {
    this.x = (sel) => document.querySelector(sel);
    this.x2 = (sel) => document.querySelectorAll(sel);
    this.containerSelector = containerSelector;
    this.raceDistance = distanceKm * 1000;
    this.controls = Controls;
    this.car = null;

    this.nowSound = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.totalDistance = 0;
    this.raceFinished = false;
    this.hasCrossedFinishLine = false;
    this.speed = 0;

    // Defaults
    this.maxSpeed = 0.2;
    this.accel = 0.02;
    this.decel = 0.01;
    this.brakeDecel = 0.03;
    this.minorTK = 1;
    this.majorTK = 10;

    // Countdown
    this.countdownActive = false;
    this.countdownValue = 5;
    this.countdownStartTime = 0;
    this.lastCountdownNumber = 5;
    this.carDriveInComplete = false;

    // Bounce
    this.isBouncingBack = false;
    this.bounceStartTime = 0;
    this.bounceDuration = 0;
    this.bounceForce = 0;
    this.originalSpeed = 0;

    // Explosion
    this.isExploding = false;
    this.explosionStartTime = 0;
    this.explosionDuration = 0;
    this.explosionEffects = null;
    this.flyingStartTime = 0;
    this.flyingDuration = 0;
    this.originalCarPosition = null;
    this.originalCarRotation = null;
    this.finalRotation = null;

    // RAF + lifecycle flags
    this._rafId = null;
    this._disposed = false;

    this.init();
    this.applyDefaultSettings();

    setTimeout(() => {
      this.startCountdown();
    }, 1000);
  }

  // Cleanly stop the game (called by resetGame() from index.js on Back)
  destroy() {
    if (this._disposed) return;
    this._disposed = true;

    // Stop loops and states
    try { cancelAnimationFrame(this._rafId); } catch { }
    this._rafId = null;
    this.countdownActive = false;
    this.isBouncingBack = false;
    this.isExploding = false;

    // Detach input listeners if your Controls class supports it
    try { this.controls?.dispose?.(); } catch { }

    // Dispose scene objects
    try { this.disposeSceneObjects(); } catch { }

    // Dispose renderer and canvas
    try {
      this.renderer?.renderLists?.dispose?.();
      this.renderer?.dispose?.();
      if (this.renderer?.forceContextLoss) this.renderer.forceContextLoss();
      if (this.renderer?.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    } catch { }

    // Reset speedometer
    try {
      setHolding(false);
      setMeters(0, 0, 0, 0, 0);
      updateSpeed(0);
    } catch { }

    // Remove countdown display if exists
    try {
      const countdownDisplay = document.getElementById('countdown-display');
      countdownDisplay?.remove?.();
    } catch { }

    // Null references for GC
    destroyDistanceHUD();
    this.car = null;
    this.road = null;
    this.finishLine = null;
    this.obstacles = null;
    this.curves = null;
    this.tumbleSystem = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  disposeSceneObjects() {
    if (!this.scene) return;
    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        try { obj.geometry?.dispose?.(); } catch { }
        try {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (!mat) return;
            for (const k in mat) {
              const v = mat[k];
              if (v && v.isTexture) v.dispose?.();
            }
            mat.dispose?.();
          });
        } catch { }
      }
    });
    // Remove all children from scene
    const children = [...this.scene.children];
    children.forEach(c => {
      try { this.scene.remove(c); } catch { }
    });
  }

  startCountdown() {
    this.countdownActive = true;
    this.countdownValue = 5;
    this.countdownStartTime = Date.now();
    this.lastCountdownNumber = 5;
    this.carDriveInComplete = false;

    if (this.car && this.car.mesh) {
      const startZ = 15;
      this.car.mesh.position.z = startZ;
      this.car.mesh.position.x = 0;
      this.car.mesh.position.y = 0.3;
      this.car.mesh.rotation.set(0, Math.PI, 0);
      this.car.startDriveInAnimation();
    } else {
      console.warn("⚠️ Car mesh not available for drive-in animation");
    }
    this.createCountdownDisplay();
  }

  createCountdownDisplay() {
    const existingDisplay = document.getElementById('countdown-display');
    existingDisplay?.remove?.();

    const gamepg = document.querySelector('.gamepg');
    const countdownDisplay = document.createElement('div');
    countdownDisplay.id = 'countdown-display';
    gamepg?.appendChild?.(countdownDisplay);
  }

  updateCountdown() {
    if (!this.countdownActive) return;
    const currentTime = Date.now();
    const elapsed = currentTime - this.countdownStartTime;
    const remainingSeconds = Math.ceil(this.countdownValue - (elapsed / 1000));
    const countdownDisplay = document.getElementById('countdown-display');

    if (remainingSeconds !== this.lastCountdownNumber && remainingSeconds > 0) {
      this.lastCountdownNumber = remainingSeconds;
      if (countdownDisplay) {
        countdownDisplay.textContent = remainingSeconds;
        countdownDisplay.style.opacity = '1';
        countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1)';
        setTimeout(() => {
          if (countdownDisplay) countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1.3)';
        }, 100);
        setTimeout(() => {
          if (countdownDisplay) countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 300);
      }
    }

    if (remainingSeconds === 0) {
      if (countdownDisplay) {
        countdownDisplay.textContent = 'DRIVE! 🤬 ';
        countdownDisplay.style.color = '#ff0000';
        countdownDisplay.style.transform = 'translate(-50%, -50%) scale(1)';
        countdownDisplay.style.opacity = '1';
      }
      setTimeout(() => {
        if (countdownDisplay) {
          countdownDisplay.style.opacity = '0';
          setTimeout(() => countdownDisplay?.remove?.(), 500);
        }
      }, 1000);

      this.countdownActive = false;
      this.carDriveInComplete = true;
    }
  }


  applyDefaultSettings() {
    this.setTumbleSettings({ speed: 0.1, threshold: 0.1, duration: 2000 });
    this.addCurve(200, 700, 0.01);
    this.addCurve(600, 900, -0.01);
    this.addCurve(1200, 2000, 0.02);
    this.addCurve(1800, 3000, -0.02);
  }

  setTumbleSettings(settings) {
    if (this.tumbleSystem) this.tumbleSystem.setTumbleSettings(settings);
    else this.pendingTumbleSettings = settings;
  }

  addCurve(start, end, intensity) {
    if (this.curves) this.curves.addCurve(start, end, intensity);
    else {
      if (!this.pendingCurves) this.pendingCurves = [];
      this.pendingCurves.push({ start, end, intensity });
    }
  }

  clearCurves() {
    if (this.curves) this.curves.clearCurves();
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
      this.scene.remove(this.finishLine.mesh);
      this.finishLine = new FinishLine(this.scene, -this.raceDistance)
    }
    resetDistanceHUD();
  }

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

    // Modules
    this.road = new Road(this.scene);
    this.car = new Car(this.scene, this);
    this.finishLine = new FinishLine(this.scene, -this.raceDistance);
    this.controls = new Controls(this);
    this.obstacles = new Obstacles(this.scene, this.car, this);
    this.curves = new Curves();
    this.tumbleSystem = new TumbleSystem(this.car, this.camera);

    // Car props
    this.maxSpeed = this.car.getMaxSpeed ? this.car.getMaxSpeed() : 0.2;
    this.accel = this.car.getAcceleration ? this.car.getAcceleration() : 0.02;
    this.decel = this.car.getDeceleration ? this.car.getDeceleration() : 0.01;
    this.brakeDecel = this.car.getBrakeDeceleration ? this.car.getBrakeDeceleration() : 0.03;

    speedo();
    initDistanceHUD();
    resetDistanceHUD();
    this.car.startAnyAnimation('idle');

    this.applyPendingSettings();
    this.startAnimation();
    this.car.activateProtection();
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 5);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.querySelector(this.containerSelector);
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.renderer.domElement);
    }
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
  }

  update(deltaTime) {
    if (this.countdownActive) {
      this.updateCountdown();

      if (this.car?.mesh) this.car.updateAnimation();

      const minimalRoadMovement = 0.1;
      this.road.update(minimalRoadMovement, this.totalDistance, this.curves);

      this.updateCountdownCamera();
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this.controls.update();

    if (this.isExploding) {
      this.obstacles.updateFlyingAnimation();
      const distanceThisFrame = this.speed * 2;
      this.road.update(distanceThisFrame, this.totalDistance, this.curves);
      this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
      this.finishLine.update(distanceThisFrame);
      this.updateDistanceDisplay();
      return;
    }

    if (this.isBouncingBack) {
      this.updateBounceBack();
      return;
    }

    if (this.tumbleSystem.isTumbling || this.tumbleSystem.isReturningToNormal) {
      this.tumbleSystem.update();
      const distanceThisFrame = this.speed * 5;
      this.road.update(distanceThisFrame, this.totalDistance, this.curves);
      this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
      this.finishLine.update(distanceThisFrame);
      this.updateCamera();
      this.updateDistanceDisplay();
      return;
    }

    this.updateSpeed();
    this.handleLaneChanges();
    this.curves.update(this.totalDistance);

    this.car.update(
      this.controls.currentLane,
      this.curves.currentIntensity,
      this.curves.getCurveOffset(),
      deltaTime
    );

    const distanceThisFrame = this.speed * 5;
    this.totalDistance += distanceThisFrame;

    this.road.update(distanceThisFrame, this.totalDistance, this.curves);

    if (!this.raceFinished || this.speed > 0.01) {
      this.obstacles.update(distanceThisFrame, this.totalDistance, this.raceDistance);
    }

    this.finishLine.update(distanceThisFrame);
    if (!this.raceFinished) this.obstacles.checkCollisions(this.car, this.tumbleSystem);
    this.checkFinishLine();
    this.updateCamera();
    this.updateDistanceDisplay();
  }

  updateCountdownCamera() {
    if (this.car?.mesh) {
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
    const easedProgress = 1 - Math.pow(1 - bounceProgress, 3);
    const bounceMovement = this.bounceForce * (1 - easedProgress);
    this.car.mesh.position.z += bounceMovement * 0.5;
    this.car.mesh.position.x += (Math.random() - 0.5) * bounceMovement * 0.1;
    this.car.mesh.rotation.z = Math.sin(bounceProgress * Math.PI * 4) * 0.3;

    const roadMovement = this.speed * -4;
    this.road.update(roadMovement, this.totalDistance, this.curves);
    this.obstacles.update(roadMovement, this.totalDistance, this.raceDistance);
    this.finishLine.update(roadMovement);

    this.updateBounceCamera(bounceProgress);

    if (bounceProgress >= 1) this.endBounceBack();
    this.updateDistanceDisplay();
  }

  updateBounceCamera(bounceProgress) {
    const shakeIntensity = (1 - bounceProgress) * 0.4;
    this.camera.position.x = this.car.mesh.position.x * 0.3 + (Math.random() - 0.5) * shakeIntensity;
    this.camera.position.y = 2 + (Math.random() - 0.5) * shakeIntensity * 0.5;
    this.camera.position.z = this.car.mesh.position.z + 5;
    this.camera.lookAt(this.car.mesh.position.x, this.car.mesh.position.y, this.car.mesh.position.z - 2);
  }

  endBounceBack() {
    this.isBouncingBack = false;
    this.car.mesh.rotation.z = 0;
  }

  updateSpeed(dt = 1 / 60) {
    if (this.isBouncingBack || this.countdownActive) return;

    const rateScale = this.speedRateScale ?? 0.3;
    const maxSpeedScale = this.maxSpeedScale ?? 1.0;
    const dtNorm = dt * 60;

    const baseMax = this.car.getMaxSpeed ? this.car.getMaxSpeed() : this.maxSpeed;
    const baseAccel = this.car.getAcceleration ? this.car.getAcceleration() : this.accel;
    const baseDecel = this.car.getDeceleration ? this.car.getDeceleration() : this.decel;
    const baseBrake = this.car.getBrakeDeceleration ? this.car.getBrakeDeceleration() : this.brakeDecel;
    const minorTK = this.car.getMinorTK ? this.car.getMinorTK() : this.minorTK;
    const majorTk = this.car.getMajorTk ? this.car.getMajorTk() : this.majorTK;

    setMeters(baseMax, baseAccel, baseDecel, minorTK, majorTk);

    const maxSpeed = baseMax * maxSpeedScale;
    const accel = baseAccel * dtNorm;
    const decel = baseDecel * dtNorm * rateScale;
    const brakeDecel = baseBrake * dtNorm * rateScale;
    const coastDecel = (this.coastDecel ?? 0.004) * dtNorm * rateScale;
    let timecount;
    if (this.controls.braking) {
      this.speed = Math.max(0, this.speed - brakeDecel);
      setHolding(false);
    } else if (this.controls.downPressed) {
      this.speed = Math.max(0, this.speed - decel);
      setHolding(false);
    } else if (this.controls.upPressed && !this.raceFinished) {
      setTimerRunning(true)
      this.speed = Math.min(maxSpeed, this.speed + accel);
      setHolding(true);
    } else if (!this.raceFinished) {
      this.speed = Math.max(0, this.speed - coastDecel);
      setHolding(false);
    }

    if (this.speed < 1e-6) this.speed = 0;

    if (typeof updateSpeed === 'function') {
      updateSpeed(this.speed);
    } else if (typeof this.onSpeedChange === 'function') {
      this.onSpeedChange(this.speed);
    }
  }

  handleLaneChanges() {
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
      this.camera.position.x = this.car.mesh.position.x * 0.3 + (Math.random() - 0.5) * 0.1;
      this.camera.position.y = 2 + (Math.random() - 0.5) * 0.2;
      this.camera.position.z = this.car.mesh.position.z + 5;
    } else {
      this.camera.position.x = this.car.mesh.position.x * 0.3;
      this.camera.position.z = this.car.mesh.position.z + 5;
    }
    this.camera.lookAt(this.car.mesh.position.x, this.car.mesh.position.y, this.car.mesh.position.z - 2);
  }

  driftAnimation() {
    const car = this.car.mesh || this.car;
    const start = performance.now();
    const duration = 2000;
    const driftAngle = Math.PI / 9;
    const slideDistance = 1.5;
    const tiltAngle = Math.PI / 2;
    const direction = Math.random() < 0.5 ? 1 : -1;

    const initialYRotation = 0.3;
    const initialXPosition = -0.7;
    const initialZRotation = -0.3;

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      car.rotation.y = initialYRotation + direction * driftAngle * Math.sin(progress * Math.PI);
      car.position.x = initialXPosition + direction * slideDistance * Math.sin(progress * Math.PI);
      car.rotation.z = initialZRotation + direction * tiltAngle * Math.sin(progress * Math.PI);

      this.speed = Math.max(0, this.speed - 0.01 * (1 + progress));

      if (progress < 0.8 && Math.random() < 0.2) this.createDriftSmoke(car);

      if (progress < 1) requestAnimationFrame(animate);
      else {
        car.rotation.y = initialYRotation;
        car.rotation.z = 0;
        car.position.x = 0;
        this.speed = 0;
      }
    };
    requestAnimationFrame(animate);
  }

  createDriftSmoke(car) {
    const smokeGeo = new THREE.CircleGeometry(0.5, 16);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    const smoke = new THREE.Mesh(smokeGeo, smokeMat);
    smoke.position.copy(car.position);
    smoke.position.y = 0.1;
    smoke.position.z -= 0.5 + Math.random() * 0.2;
    smoke.rotation.x = -Math.PI / 2;
    smoke.position.x += (Math.random() - 0.5) * 0.3;
    this.scene.add(smoke);

    const start = performance.now();
    const duration = 1000 + Math.random() * 500;

    const animate = (time) => {
      const t = (time - start) / duration;
      if (t < 1) {
        const ease = 1 - Math.pow(1 - t, 2);
        smoke.material.opacity = 0.5 * (1 - ease);
        smoke.scale.set(1 + ease * 2, 1 + ease * 2, 1);
        smoke.position.y += 0.01;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(smoke);
        smoke.geometry.dispose();
        smoke.material.dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  checkFinishLine() {
    if (!this.hasCrossedFinishLine && this.totalDistance >= this.raceDistance) {
      stopAll();
      this.nowSound = gameMusic();
      this.hasCrossedFinishLine = true;
      this.raceFinished = true;
      stopCountdown()
      if (this.speed > 0.4) this.driftAnimation();
    }

    if (this.raceFinished) {
      this.speed = Math.max(0, this.speed - this.brakeDecel * 1.5);
      this.controls.currentLane = 1;

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
    // Keep radar in sync every frame
    updateDistanceHUD(this.totalDistance, this.raceDistance);
  }

  startAnimation() {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);
      this.update(16);
      this.renderer.render(this.scene, this.camera);
    };
    this._rafId = requestAnimationFrame(loop);
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

    resetDistanceHUD();
    setMeters(0, 0, 0, 0, 0);
    this.camera.position.set(0, 2, 5);

    const countdownDisplay = document.getElementById('countdown-display');
    countdownDisplay?.remove?.();

    setTimeout(() => {
      this.startCountdown();
    }, 500);
  }
}

export default startGame;