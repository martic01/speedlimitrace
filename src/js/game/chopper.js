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

// Lane X positions in your game
const LANE_X = [-1.5, 0, 1.5];

// Y (viewer) threshold where we consider missile reached the road
const GROUND_Y = -2.0;

// Speed the missile falls in the viewer scene (units per second)
const MISSILE_FALL_SPEED = 12; // tune as needed

export class ChopperRenderer {
  constructor(containerSelector = ".chopper", game = null) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) throw new Error("❌ Chopper container not found");

    this.game = game; // used to call tumbleSystem methods, stopGame, read car lane
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.isFlyingIn = false;
    this.isFlyingOut = false;
    this.isHovering = false;

    // Missile system
    this.missiles = [];
    this.isMissileActive = false;
    this.shotIntervalMs = 2000; // spawn interval in ms
    this.lastMissileTime = 0;
    this.missileTemplate = null;

    const chopper = chopperData[0];
    this.chopperConfig = chopper;

    // Camera setup
    const { cameraPosition, cameraLookAt } = VIEW_PRESETS[chopper.initialView];
    this.camera = new THREE.PerspectiveCamera(
      60,
      Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight),
      0.1,
      1000
    );
    this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    this.camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(Math.max(1, this.container.clientWidth), Math.max(1, this.container.clientHeight));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(5, 10, 7.5);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.scene.add(ambientLight, dirLight, hemi);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    const { rotationLimits } = chopper;
    this.controls.minPolarAngle = rotationLimits.minPolarAngle;
    this.controls.maxPolarAngle = rotationLimits.maxPolarAngle;

    // Bind handlers so we can remove them later
    this._onResize = this.onResize.bind(this);
    this._onTimeup = this.onTimeEnd.bind(this);

    // Listeners
    window.addEventListener("resize", this._onResize);
    document.addEventListener('mode:timeup', this._onTimeup);

    // Load models
    this.loadChopper(chopper);

    // Start RAF
    this.animate();
  }

  // Public control: start/stop continuous shooting
  setMissileShooting(active, intervalMs = 2000) {
    this.isMissileActive = !!active;
    this.shotIntervalMs = Math.max(100, intervalMs);
    this.lastMissileTime = performance.now();
    console.log(`🚀 Missile shooting ${active ? 'ON' : 'OFF'} | interval ${this.shotIntervalMs}ms`);
  }

  // For time end: launch a guaranteed killshot
  onTimeEnd() {
    console.log("⏰ Time ended! Killshot missile fired!");
    this.fireKillshot();
    // Optionally speed up the continuous barrage
    if (this.isMissileActive) {
      this.setMissileShooting(true, 800);
    }
  }

  // Launch a missile at the car's current lane; guaranteed to hit
  fireKillshot() {
    const lane = this._currentCarLaneIndex();
    if (lane == null) return;
    const m = this.createMissile(lane);
    if (m) m.userData.killshot = true;
  }

  loadChopper(chopper) {
    const loader = new GLTFLoader();
    loader.load(
      chopper.Chopper3D,
      (gltf) => {
        this.chopperModel = gltf.scene || gltf.scenes?.[0];
        if (!this.chopperModel) return;
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

  // Create missile aimed at a lane index
  createMissile(targetLaneIdx = 1) {
    if (!this.missileTemplate || !this.chopperModel) return null;

    const missile = this.missileTemplate.clone(true);
    missile.userData = missile.userData || {};
    missile.userData.active = true;
    missile.userData.spawnTime = performance.now();
    missile.userData.targetLaneIdx = Math.max(0, Math.min(2, targetLaneIdx));
    missile.userData.fallSpeed = MISSILE_FALL_SPEED; // units/sec in viewer space
    missile.userData.killshot = false;

    // Start below chopper
    missile.position.copy(this.chopperModel.position);
    missile.position.y -= 0.8;

    // Orient visually (if needed)
    missile.scale.setScalar(2.5);
    missile.rotation.set(Math.PI / 2, 0, 0);

    // Create simple trail
    this.createMissileTrail(missile);

    this.scene.add(missile);
    this.missiles.push(missile);
    console.log(`🚀 Missile launched toward lane ${targetLaneIdx}`);
    return missile;
  }

  createMissileTrail(missile) {
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.PointsMaterial({
      color: 0xff4500,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Points(trailGeo, trailMat);
    missile.userData.trail = trail;
    this.scene.add(trail);
  }

  updateMissileTrail(missile) {
    if (!missile.userData.trail) return;
    const positions = [];
    const trailLen = 10;
    for (let i = 0; i < trailLen; i++) {
      positions.push(
        missile.position.x,
        missile.position.y + i * 0.06, // behind the missile
        missile.position.z
      );
    }
    missile.userData.trail.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
  }

  updateMissiles(delta) {
    const now = performance.now();

    // Auto-fire if enabled
    if (this.isMissileActive && this.missileTemplate && this.chopperModel) {
      if (!this.lastMissileTime || (now - this.lastMissileTime) >= this.shotIntervalMs) {
        const targetLane = Math.floor(Math.random() * 3);
        this.createMissile(targetLane);
        this.lastMissileTime = now;
      }
    }

    // Move missiles and handle impact
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      if (!m?.userData?.active) {
        this._removeMissileAt(i);
        continue;
      }

      // Fall in viewer space
      m.position.y -= m.userData.fallSpeed * delta;
      // Drift toward the target lane X (viewer & game share same lane X)
      const targetX = LANE_X[m.userData.targetLaneIdx];
      m.position.x += (targetX - m.position.x) * 0.15;

      // Spin/visuals
      m.rotation.z += 0.12;
      this.updateMissileTrail(m);

      // Impact check: when reaching "ground"
      if (m.position.y <= GROUND_Y) {
        // Decide hit by lane matching (shared lane X), not by world distance
        const carLane = this._currentCarLaneIndex();
        const hit = m.userData.killshot || (carLane != null && carLane === m.userData.targetLaneIdx);

        if (hit) {
          console.log('💥 Missile hit (lane-based)!');
          // Trigger your existing tumble/explosion flow
          try {
            this.game?.tumbleSystem?.triggerMissileDestruction?.(this.game.scene);
          } catch (e) {
            console.warn('[ChopperRenderer] missile destruction call failed:', e);
          }
        } else {
          // missed; small ground explosion for feedback
          this.createExplosion(m.position.x, GROUND_Y, m.position.z);
        }

        m.userData.active = false;
        this._removeMissileAt(i);
      }

      // Safety timeout
      if (now - m.userData.spawnTime > 10000) {
        m.userData.active = false;
        this._removeMissileAt(i);
      }
    }
  }

  _currentCarLaneIndex() {
    const x = this.game?.car?.mesh?.position?.x;
    if (typeof x !== 'number') return null;
    let bestIdx = 0, bestD = Infinity;
    for (let i = 0; i < LANE_X.length; i++) {
      const d = Math.abs(LANE_X[i] - x);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    // Tolerance so we don’t misclassify
    if (bestD > 0.9) return null; // far from any lane center
    return bestIdx;
  }

  _removeMissileAt(i) {
    const m = this.missiles[i];
    if (!m) return;
    if (m.userData.trail) this.scene.remove(m.userData.trail);
    this.scene.remove(m);
    this.missiles.splice(i, 1);
  }

  createExplosion(x, y, z) {
    const geo = new THREE.SphereGeometry(0.9, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const start = performance.now();
    const dur = 800;
    const animate = () => {
      const t = (performance.now() - start) / dur;
      if (t < 1) {
        mesh.scale.setScalar(1 + t * 4);
        mat.opacity = 0.9 * (1 - t);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(mesh);
        geo.dispose();
        mat.dispose();
      }
    };
    animate();
  }

  // View / animation
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

    if (this.isFlyingIn) {
      this.flyProgress += delta * speed;
      const t = Math.min(this.flyProgress, 1);
      model.position.lerp(new THREE.Vector3(0, chopper.modelPosition.y, 0), t);
      const newScale = THREE.MathUtils.lerp(0.4, targetScale, t);
      model.scale.setScalar(newScale);
      if (t >= 1) { this.isFlyingIn = false; this.startHover(); }
    }

    if (this.isHovering) {
      this.hoverTime += delta;
      const xOffset = Math.sin(this.hoverTime * 0.5) * 0.4;
      const yOffset = Math.sin(this.hoverTime * 1.2) * 0.1;
      model.position.x = xOffset;
      model.position.y = chopper.modelPosition.y + yOffset;
    }

    if (this.isFlyingOut) {
      this.flyProgress += delta * speed;
      const t = Math.min(this.flyProgress, 1);
      model.position.lerp(new THREE.Vector3(0, 15, 20), t);
      const newScale = THREE.MathUtils.lerp(targetScale, 0.01, t);
      model.scale.setScalar(newScale);
      model.rotation.y += 0.05;
      if (t >= 1) { this.isFlyingOut = false; this.scene.remove(model); }
    }

    // Missiles system every frame
    this.updateMissiles(delta);
  }

  onResize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
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

    // Remove missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      this._removeMissileAt(i);
    }
    this.missiles.length = 0;

    // Remove listeners using stored refs
    window.removeEventListener("resize", this._onResize);
    document.removeEventListener('mode:timeup', this._onTimeup);

    // Dispose renderer
    try {
      this.renderer?.renderLists?.dispose?.();
      this.renderer?.dispose?.();
      if (this.renderer?.forceContextLoss) this.renderer.forceContextLoss();
      const canvas = this.renderer?.domElement;
      if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
    } catch {}

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.container = null;
    this.chopperModel = null;
    this.missileTemplate = null;
  }
}

export default ChopperRenderer;