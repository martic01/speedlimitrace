// --- Imports ---
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { garages, vechicles3D, vechicles } from "../constants/material.js";
import { stopMusic, startAcc } from "./sounds.js";

// Debug Three version
try { console.log('THREE REV:', THREE.REVISION); } catch { }

// --- UI References ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const garagesw = $('.garagesw');
const forwardcar = $('.forw');
const reversecar = $('.rever');
const samebtn = $$('.same');
const carContainer = $('.car');
const carInfos = $$('.carinfo');
const carName = $('.name');
const speedEl = $('.sp');
const accelerationEl = $('.ac');
const handlingEl = $('.hn');
const protectEl = $('.pd');
const selecttxt = $('.selecttxt');
const garage = $('.garage');
const Selectbtn = $('.selectbtn');

// --- State ---
let scene, camera, renderer, currentCar, controls;
let using3D = false;
let currentBgIndex = 0;
let selectedCar = null;

let currentCarConfig = null;
let currentCarSize = new THREE.Vector3(1, 1, 1);
let currentCarTarget = new THREE.Vector3(0, 0.5, 0);

let soundtime;
let switchsound;

let count = 0;
let forwardMove = true;

// Auto-spin state (model spins until you disable it via setAutoSpin(false))
let autoSpinTarget = 0; // rad/s target angular velocity
let autoSpinVel = 0; // rad/s current angular velocity
let autoSpinAccel = THREE.MathUtils.degToRad(300); // rad/s^2 acceleration (ease in/out)

// --- View presets ---
const VIEW_PRESETS = {
  front: { cameraPosition: { x: 0, y: 1.4, z: 5 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
  side: { cameraPosition: { x: 5, y: 0.7, z: 0 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
  back: { cameraPosition: { x: 0, y: 1.4, z: -5 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
  top: { cameraPosition: { x: 0, y: 3.0, z: 0.1 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
  under: { cameraPosition: { x: 0, y: -3, z: 0.1 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
  '3quarter': { cameraPosition: { x: 3, y: 1.2, z: 3 }, cameraLookAt: { x: 0, y: 0, z: 0 }, enabled: true },
};

// --- Car data ---
const garageVechicles = [
  {
    id: '1ag',
    name: 'Fast time🕡',
    Car3D: vechicles3D.car3d1,
    CarImage: vechicles.redFrontView,
    speed: '150km/h',
    acceleration: '10m/s²',
    handling: 'Medium',
    selected: true,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.15,
    accel: 0.01,
    decel: 0.008,
    brakeDecel: 0.02,
    minorTK: 2,
    majorTK: 10,
    laneChangeSpeed: 0.1,

    protectionDistance: 300,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '2bg',
    name: 'Red Horse🐎',
    Car3D: vechicles3D.car3d2,
    CarImage: vechicles.redFrontView,
    speed: '200km/h',
    acceleration: '10m/s²',
    handling: 'Medium',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.2,
    accel: 0.01,
    decel: 0.008,
    brakeDecel: 0.03,
    minorTK: 2,
    majorTK: 20,
    laneChangeSpeed: 0.2,

    protectionDistance: 400,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '3cg',
    name: 'Fist GT👊',
    Car3D: vechicles3D.car3d3,
    CarImage: vechicles.redFrontView,
    speed: '200km/h',
    acceleration: '10m/s²',
    handling: 'Good',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.2,
    accel: 0.01,
    decel: 0.008,
    brakeDecel: 0.03,
    minorTK: 2,
    majorTK: 20,
    laneChangeSpeed: 0.2,

    protectionDistance: 500,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '4dg',
    name: 'New Dawn🔆',
    Car3D: vechicles3D.car3d4,
    CarImage: vechicles.redFrontView,
    speed: '300km/h',
    acceleration: '20m/s²',
    handling: 'Good',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.3,
    accel: 0.02,
    decel: 0.008,
    brakeDecel: 0.07,
    minorTK: 3,
    majorTK: 30,
    laneChangeSpeed: 0.2,

    protectionDistance: 500,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '5eg',
    name: 'Wizard 🪄',
    Car3D: vechicles3D.car3d5,
    CarImage: vechicles.redFrontView,
    speed: '400km/h',
    acceleration: '20m/s²',
    handling: 'Pro',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.4,
    accel: 0.02,
    decel: 0.008,
    brakeDecel: 0.07,
    minorTK: 3,
    majorTK: 40,
    laneChangeSpeed: 0.3,

    protectionDistance: 500,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '6eg',
    name: '🔥 At Last 🔥',
    Car3D: vechicles3D.car3d6,
    CarImage: vechicles.redFrontView,
    speed: '500km/h',
    acceleration: '30m/s²',
    handling: 'LENGEND 🔥',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.5,
    accel: 0.03,
    decel: 0.009,
    brakeDecel: 0.07,
    minorTK: 4,
    majorTK: 50,
    laneChangeSpeed: 0.3,

    protectionDistance: 700,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '7eg',
    name: 'Fear 🤬',
    Car3D: vechicles3D.car3d7,
    CarImage: vechicles.redFrontView,
    speed: '700km/h',
    acceleration: '30m/s²',
    handling: 'STAR 🌟',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 0.7,
    accel: 0.03,
    decel: 0.01,
    brakeDecel: 0.07,
    minorTK: 4,
    majorTK: 70,
    laneChangeSpeed: 0.4,

    protectionDistance: 1200,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
  {
    id: '8fg',
    name: 'Storm-rider ⚡',
    Car3D: vechicles3D.car3d8,
    CarImage: vechicles.redFrontView,
    speed: '1000km/h',
    acceleration: '40m/s²',
    handling: 'Pro-Star🌟',
    selected: false,
    unlocked: true,

    modelPosition: { x: 0, y: 1.4, z: 0 },
    initialView: 'front',
    scaleConfig: { minScale: 1, maxScale: 6, defaultScale: 6 },

    carPosition: { x: 0, y: 0.3, z: -6 },
    carScaleConfig: { defaultScale: 3.7 },
    driveInStartZ: 6,

    maxSpeed: 1,
    accel: 0.04,
    decel: 0.01,
    brakeDecel: 0.07,
    minorTK: 10,
    majorTK: 100,
    laneChangeSpeed: 0.6,

    protectionDistance: 3000,
    hasProtection: false,
    protectionRemaining: 3,
    protectionActive: false,

    disabledViews: { under: true, top: false, back: false },
    rotationLimits: {
      minPolarAngle: Math.PI / 2.1,
      maxPolarAngle: Math.PI / 2,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity
    }
  },
];
const garageBackgrounds = [
  { id: '1bg', name: 'Garage 1', image: garages.garage1, selected: true },
  { id: '2bg', name: 'Garage 2', image: garages.garage2, selected: false },
];

// --- Safe guards ---
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

function showImageFallback(imageUrl, carName) {
  if (!carContainer) return;
  carContainer.innerHTML = `
    <div class="image-fallback ">
      <img src="${imageUrl}" alt="${carName}">
      <h3>${carName}</h3>
      <p>3D View Not Available</p>
    </div>
  `;
}

function showWebGLError() {
  if (!carContainer) return;
  carContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:#ff6b6b;color:#fff;border-radius:10px;padding:20px;">
      <h3>🚫 3D Not Supported</h3>
      <p>Your device doesn't support WebGL rendering.</p>
    </div>
  `;
}

// --- Renderer ---
function createWebGLRenderer(container) {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (renderer.setPixelRatio) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.setClearColor) renderer.setClearColor(0x000000, 0);
    if ('outputEncoding' in renderer && 'sRGBEncoding' in THREE) renderer.outputEncoding = THREE.sRGBEncoding;
    else if ('gammaOutput' in renderer) { renderer.gammaOutput = true; renderer.gammaFactor = 2.2; }
    if ('toneMapping' in renderer && THREE.ACESFilmicToneMapping !== undefined) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    if ('physicallyCorrectLights' in renderer) renderer.physicallyCorrectLights = true;
    return renderer;
  } catch (e) {
    console.error("❌ Renderer creation failed:", e);
    return null;
  }
}

// --- Controls config ---
function applyCarConfiguration(carConfig) {
  if (!controls || !carConfig) return;
  const limits = carConfig.rotationLimits || {};
  controls.minPolarAngle = limits.minPolarAngle ?? 0;
  controls.maxPolarAngle = limits.maxPolarAngle ?? Math.PI;
  controls.minAzimuthAngle = limits.minAzimuthAngle ?? -Infinity;
  controls.maxAzimuthAngle = limits.maxAzimuthAngle ?? Infinity;

  const scaleConfig = carConfig.scaleConfig || {};
  controls.minDistance = scaleConfig.minScale ?? 1;
  controls.maxDistance = scaleConfig.maxScale ?? 10;
}

// --- Camera view ---
function setCameraView(viewName, carConfig) {
  if (!VIEW_PRESETS[viewName] || !VIEW_PRESETS[viewName].enabled) {
    console.warn(`View "${viewName}" is not available`);
    return false;
  }
  if (carConfig?.disabledViews?.[viewName]) {
    console.warn(`View "${viewName}" is disabled for this car`);
    return false;
  }
  const preset = VIEW_PRESETS[viewName];
  const lookAt = currentCarTarget || new THREE.Vector3(preset.cameraLookAt.x, preset.cameraLookAt.y, preset.cameraLookAt.z);
  camera.position.set(preset.cameraPosition.x, preset.cameraPosition.y, preset.cameraPosition.z);
  camera.lookAt(lookAt);
  if (controls?.target) {
    controls.target.copy(lookAt);
    controls.update();
  }
  return true;
}

// --- Scene init ---
function init3DScene(container) {
  try {
    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 6);

    renderer = createWebGLRenderer(container);
    if (!renderer) throw new Error("WebGL renderer creation failed");

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 10, 7);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation loop (dt-based) with auto-spin
    let lastTs = 0;
    function animate(ts = 0) {
      requestAnimationFrame(animate);
      const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 1 / 60);
      lastTs = ts;

      // Smoothly approach target angular velocity
      if (currentCar) {
        const diff = autoSpinTarget - autoSpinVel;
        const maxChange = autoSpinAccel * dt; // clamp by acceleration
        if (Math.abs(diff) > 1e-6) {
          autoSpinVel += THREE.MathUtils.clamp(diff, -maxChange, maxChange);
        }
        if (Math.abs(autoSpinVel) > 1e-6) {
          currentCar.rotation.y += autoSpinVel * dt;
        }
      }

      controls?.update?.();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.render(scene, camera);
    });

    using3D = true;
    return true;
  } catch (e) {
    console.error("❌ 3D init failed:", e);
    using3D = false;
    return false;
  }
}

// --- Helpers ---
function disposeObject3D(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.isMesh) {
      child.geometry?.dispose?.();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        for (const k in mat) {
          const v = mat[k];
          if (v?.isTexture) v.dispose?.();
        }
        mat.dispose?.();
      });
    }
  });
}

function centerAndGround(model) {
  model.position.set(0, 0, 0);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.x -= center.x;
  model.position.z -= center.z;
  const yOffset = -box.min.y;
  model.position.y += yOffset;
  const finalBox = new THREE.Box3().setFromObject(model);
  const finalSize = new THREE.Vector3();
  finalBox.getSize(finalSize);
  return finalSize;
}

// --- Loading UI ---
function showLoadingAnimation(carName = '') {
  hideLoadingAnimation();
  const html = `
    <div id="model-loading">
      <div style="text-align:center;">
        <div class="spinner"></div>
        <h3 class="Aname">Loading ${carName}</h3>
        <div class="spin-bar"><div id="loading-progress-bar"></div></div>
        <div id="loading-percentage">0%</div>
        <div class="tips">
          <div>💡 Tip: You can rotate the car by dragging</div>
          <div>💡 Tip: Scroll to zoom in/out</div>
        </div>
      </div>
    </div>
  `;
  carContainer?.insertAdjacentHTML('beforeend', html);
  if (!document.querySelector('#loading-animation-style')) {
    const style = document.createElement('style');
    style.id = 'loading-animation-style';
    style.textContent = `
      @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
      @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.7;} }
      .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
  }
}

function updateLoadingProgress(percent) {
  const bar = $('#loading-progress-bar');
  const label = $('#loading-percentage');
  if (!bar || !label) return;
  bar.style.width = `${percent}%`;
  label.textContent = `${Math.round(percent)}%`;
  if (percent >= 90) label.classList.add('loading-pulse');
  else label.classList.remove('loading-pulse');
}

function hideLoadingAnimation() {
  try { stopMusic?.(switchsound); } catch { }
  clearTimeout(soundtime);
  const el = $('#model-loading');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s ease';
    setTimeout(() => el.remove(), 300);
  }
}

// --- Load Car ---
function loadCarModel(carData) {
  if (!using3D || !renderer) {
    showImageFallback(carData.CarImage, carData.name);
    return;
  }

  currentCarConfig = carData;
  showLoadingAnimation(carData.name);

  const loader = new GLTFLoader();
  loader.load(
    carData.Car3D,
    (gltf) => {
      if (currentCar) {
        scene.remove(currentCar);
        disposeObject3D(currentCar);
        currentCar = null;
      }

      const model = gltf.scene || gltf.scenes?.[0] || createTestCube();

      // Pre-scale to a consistent visual size
      const preBox = new THREE.Box3().setFromObject(model);
      const preSize = new THREE.Vector3();
      preBox.getSize(preSize);

      if (preSize.length() === 0) {
        console.warn('⚠️ Model has zero size, fallback cube used');
        currentCar = new THREE.Group();
        currentCar.add(createTestCube());
        scene.add(currentCar);
      } else {
        const scaleConfig = carData.scaleConfig || {};
        const defaultScale = scaleConfig.defaultScale || 2;
        const maxDim = Math.max(preSize.x, preSize.y, preSize.z);
        const s = defaultScale / maxDim;
        model.scale.set(s, s, s);

        currentCar = new THREE.Group();
        currentCar.name = 'carRoot';
        currentCarSize = centerAndGround(model);
        currentCar.add(model);
        scene.add(currentCar);

        // Use only X/Z nudge to avoid breaking grounding
        const pos = carData.modelPosition || { x: 0, y: 0, z: 0 };
        currentCar.position.set(pos.x || 0, 0, pos.z || 0);
      }

      // Target mid-height for orbit
      currentCarTarget.set(0, Math.max(0.4, currentCarSize.y * 0.4), 0);
      if (controls) {
        controls.target.copy(currentCarTarget);
        controls.update();
      }

      applyCarConfiguration(carData);
      const initialView = carData.initialView || 'front';
      setCameraView(initialView, carData);

      requestAnimationFrame(() => {
        setTimeout(() => {
          hideLoadingAnimation();
          updateCarInfo(carData);
          animateCarIn();
        }, 300);
      });
    },
    (xhr) => {
      const percent = xhr.lengthComputable
        ? (xhr.loaded / xhr.total) * 100
        : Math.min((xhr.loaded / 1000000) * 100, 99);
      updateLoadingProgress(percent);
    },
    (err) => {
      console.error("❌ Model load failed:", err);
      if (currentCar) {
        scene.remove(currentCar);
        disposeObject3D(currentCar);
        currentCar = null;
      }
      currentCar = new THREE.Group();
      currentCar.add(createTestCube());
      scene.add(currentCar);

      currentCarSize.set(1, 1, 1);
      currentCarTarget.set(0, 0.5, 0);
      if (controls) {
        controls.target.copy(currentCarTarget);
        controls.update();
      }
      hideLoadingAnimation();
    }
  );
}

function createTestCube() {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const m = new THREE.MeshPhongMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
  const cube = new THREE.Mesh(g, m);
  cube.position.set(0, 0, 0);
  return cube;
}

// --- UI ---
let spintime;
function animateCarIn() {
  clearTimeout(spintime);
  try { setAutoSpin(false) } catch { }
  spintime = setTimeout(() => { try { setAutoSpin(true) } catch { } }, 2000);

  try { stopMusic?.(switchsound); } catch { }
  switchsound = startAcc?.();

  // Restart CSS animations on all .carinfo blocks and container
  carInfos.forEach((el, index) => {
    if (!el) return;
    // if you want to skip the first one, keep this condition
    if (index === 0) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'slideIn2 1s linear forwards';
  });
  if (carContainer) {
    carContainer.style.animation = 'none';
    void carContainer.offsetWidth;
    carContainer.style.animation = 'slideIn 1s linear forwards';
  }
}

function updateCarInfo(info) {
  const picked = info?.selected;
  if (carName) carName.textContent = info?.name ?? '';
  if (speedEl) speedEl.textContent = info?.speed ?? '';
  if (accelerationEl) accelerationEl.textContent = info?.acceleration ?? '';
  if (handlingEl) handlingEl.textContent = info?.handling ?? '';
  if (protectEl) protectEl.textContent = ((info?.protectionDistance ?? 0) + 'm');
  if (selecttxt) selecttxt.textContent = picked ? 'Selected' : 'Select';
  Selectbtn?.classList.toggle('selected', picked);
}

// --- Auto-spin public API ---
// Call setAutoSpin(true) to start spinning; setAutoSpin(false) to stop.
// Options:
//   speedDeg: spin speed in degrees per second (default 25)
//   direction: +1 (clockwise) or -1 (counter-clockwise), default +1
//   accelDegPerSec2: easing acceleration (deg/s^2), default 120
//   instant: if true, jump immediately to the new target speed
function setAutoSpin(enable = true, opts = {}) {
  const speedDeg = opts.speedDeg ?? 25;
  const dir = Math.sign(opts.direction ?? 1) || 1;

  if (opts.accelDegPerSec2 != null) {
    autoSpinAccel = THREE.MathUtils.degToRad(opts.accelDegPerSec2);
  }

  const target = enable ? THREE.MathUtils.degToRad(speedDeg) * dir : 0;
  if (opts.instant) {
    autoSpinVel = target; // jump current velocity
  }
  autoSpinTarget = target;
}

// --- Selection & nav ---
function changeSelection() {
  try { stopMusic?.(switchsound); } catch { }
  clearTimeout(soundtime);

  const v = garageVechicles;
  if (!v.length) return;

  if (forwardMove) count = (count + 1) % v.length;
  else count = (count - 1 + v.length) % v.length;

  const car = v[count];
  Selectbtn?.setAttribute('id', car.id);


  loadCarModel(car);
  updateCarInfo(car);
}

function selectGarage() {
  try { stopMusic?.(switchsound); } catch { }
  clearTimeout(soundtime);

  if (!garageBackgrounds.length || !garage) return;

  currentBgIndex = (currentBgIndex + 1) % garageBackgrounds.length;
  garageBackgrounds.forEach((g, i) => g.selected = (i === currentBgIndex));
  const bg = garageBackgrounds[currentBgIndex];
  const nextIndex = (currentBgIndex + 1) % garageBackgrounds.length;
  const nextBg = garageBackgrounds[nextIndex];

  garage.style.backgroundImage = `url(${bg.image})`;
  if (garagesw) {
    garagesw.style.backgroundImage = `url(${nextBg.image})`;
    garagesw.style.color = currentBgIndex === 0 ? '#fff' : '#000';
  }

  animateCarIn();

}

function selectCar(id) {
  const v = [...garageVechicles];
  let sel = null;
  v.forEach((c) => {
    if (c.id === id) { c.selected = true; sel = c; }
    else c.selected = false;
  });
  if (sel) {
    selectedCar = sel;
    selecttxt && (selecttxt.textContent = 'Selected');
    Selectbtn?.classList.add('selected');
    updateCarInfo(sel);
  }
}

function getSelectedName() { return selectedCar ? selectedCar.name.toUpperCase() : 'HYPER GT'; }
function getSelectedAccel() { return selectedCar ? selectedCar.acceleration : '4m/s²'; }
function getSelectedHandling() { return selectedCar ? selectedCar.handling : 'regular'; }

// --- Button group lock (for .same) ---
let lockTimer = null;
let buttonsLocked = false;

function setInteractable(el, enabled) {
  if (!el) return;
  if ('disabled' in el) el.disabled = !enabled;
  if (!enabled) {
    el.style.pointerEvents = 'none';
    el.setAttribute('aria-disabled', 'true');
  } else {
    el.style.removeProperty('pointer-events');
    el.removeAttribute('aria-disabled');
  }
}

function lockButtons(ms = 2800) {
  if (buttonsLocked) return;
  buttonsLocked = true;
  samebtn.forEach(el => setInteractable(el, false));
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => {
    buttonsLocked = false;
    samebtn.forEach(el => setInteractable(el, true));
    try { stopMusic?.(switchsound); } catch { }
  }, ms);
}

function onSameBtnClick(e) {
  if (buttonsLocked) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  lockButtons(2800);
}

// --- Garage init ---
function garageInit() {
  try { stopMusic?.(switchsound); } catch { }
  clearTimeout(soundtime);

  const firstSelected = garageVechicles.find(c => c.selected) || garageVechicles[0];
  if (firstSelected) {
    selectedCar = firstSelected;
    count = garageVechicles.findIndex(c => c.id === firstSelected.id);
    if (count < 0) count = 0;

    Selectbtn?.setAttribute('id', firstSelected.id);
    loadCarModel(firstSelected);
    Selectbtn?.classList.add('selected');
  }
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  if (carContainer && (carContainer.clientWidth === 0 || carContainer.clientHeight === 0)) {
    carContainer.style.width = '100%';
    carContainer.style.height = '700px';
  }

  // Init backgrounds
  currentBgIndex = Math.max(0, garageBackgrounds.findIndex(g => g.selected));
  if (garage) {
    const bg = garageBackgrounds[currentBgIndex] ?? garageBackgrounds[0];
    garageBackgrounds.forEach((g, i) => g.selected = (i === currentBgIndex));
    garage.style.backgroundImage = `url(${bg.image})`;
    if (garagesw) {
      const nextIndex = (currentBgIndex + 1) % garageBackgrounds.length;
      garagesw.style.backgroundImage = `url(${garageBackgrounds[nextIndex].image})`;
      garagesw.style.color = currentBgIndex === 0 ? '#fff' : '#000';
    }
  }

  // WebGL path or fallback
  if (isWebGLAvailable()) {
    if (carContainer && init3DScene(carContainer)) {
      garageInit();
    } else {
      showWebGLError();
      const initialCar = garageVechicles.find(c => c.selected) || garageVechicles[0];
      if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
    }
  } else {
    showWebGLError();
    const initialCar = garageVechicles.find(c => c.selected) || garageVechicles[0];
    if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
  }

  // Bind events safely
  Selectbtn?.addEventListener('click', () => {
    if (!Selectbtn) return;
    selectCar(Selectbtn.id);
  });

  samebtn.forEach(btn => {
    btn.removeEventListener('click', onSameBtnClick);
    btn.addEventListener('click', onSameBtnClick, { passive: true });
  });

  forwardcar?.addEventListener('click', () => {
    forwardMove = true;
    changeSelection();
  });
  reversecar?.addEventListener('click', () => {
    forwardMove = false;
    changeSelection();
  });
  garagesw?.addEventListener('click', selectGarage);
});

// --- Exports ---
export {
  garageInit,
  setCameraView,
  selectedCar,
  getSelectedName,
  getSelectedAccel,
  getSelectedHandling,
  setAutoSpin
};