// --- Imports ---
// Core Three.js
import * as THREE from 'three';

// Loaders & Controls
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Your modules
import { garages, vechicles3D, vechicles } from "../constants/material.js";
import { stopMusic, startAcc } from "./sounds.js";

// Debug what Three version is actually loaded
try {
    console.log('THREE REV:', THREE.REVISION);
} catch {}

// --- UI References ---
const changeCar = document.querySelector('.change');
const garagesw = document.querySelector('.garagesw');
const carContainer = document.querySelector('.car');
const carInfo = document.querySelector('.carinfo');
const carName = document.querySelector('.name');
const speed = document.querySelector('.sp');
const acceleration = document.querySelector('.ac');
const handling = document.querySelector('.hn');
const protect = document.querySelector('.pd');
const selecttxt = document.querySelector('.selecttxt');
const garage = document.querySelector('.garage');
const Selectbtn = document.querySelector('.selectbtn');

// View presets configuration
let selectedCar = null;

const VIEW_PRESETS = {
    front: {
        cameraPosition: { x: 0, y: -0.8, z: 5 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    side: {
        cameraPosition: { x: 5, y: -0.7, z: 0 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    front2: {
        cameraPosition: { x: 0, y: -0.7, z: 5 },  // +Z for front
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    back: {
        cameraPosition: { x: 0, y: -0.7, z: -5 }, // -Z for back
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    top: {
        cameraPosition: { x: 0, y: 3, z: 0.1 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    under: {
        cameraPosition: { x: 0, y: -3, z: 0.1 }, // under = negative Y
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    '3quarter': {
        cameraPosition: { x: 3, y: 1.5, z: 3 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    }
};

let float = Math.PI / 2.1;

// --- Car & Garage Data ---
const garageVechicles = [
    {
        id: '1ag',
        name: 'Fast time',
        Car3D: vechicles3D.car3d1,
        CarImage: vechicles.redFrontView,
        speed: '150km/h',
        acceleration: '10m/s²',
        handling: 'Medium',
        selected: true,

        modelPosition: { x: 0, y: -0.5, z: 0 },
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
            maxPolarAngle: Math.PI / 2,
            minAzimuthAngle: -Infinity,
            maxAzimuthAngle: Infinity
        }
    },
    {
        id: '2bg',
        name: 'Red Horse',
        Car3D: vechicles3D.car3d2,
        CarImage: vechicles.redFrontView,
        speed: '200km/h',
        acceleration: '10m/s²',
        handling: 'Medium',
        selected: false,

        modelPosition: { x: 0, y: -0.5, z: 0 },
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
            maxPolarAngle: Math.PI / 2,
            minAzimuthAngle: -Infinity,
            maxAzimuthAngle: Infinity
        }
    },
    {
        id: '3cg',
        name: 'Fist GT',
        Car3D: vechicles3D.car3d3,
        CarImage: vechicles.redFrontView,
        speed: '200km/h',
        acceleration: '10m/s²',
        handling: 'Good',
        selected: false,

        modelPosition: { x: 0, y: -0.5, z: 0 },
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
            maxPolarAngle: Math.PI / 2,
            minAzimuthAngle: -Infinity,
            maxAzimuthAngle: Infinity
        }
    },
    {
        id: '4dg',
        name: 'New Dawn',
        Car3D: vechicles3D.car3d4,
        CarImage: vechicles.redFrontView,
        speed: '300km/h',
        acceleration: '20m/s²',
        handling: 'Good',
        selected: false,

        modelPosition: { x: 0, y: -0.388, z: 0 },
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
            maxPolarAngle: Math.PI / 2,
            minAzimuthAngle: -Infinity,
            maxAzimuthAngle: Infinity
        }
    },
    {
        id: '5eg',
        name: 'Wizard',
        Car3D: vechicles3D.car3d5,
        CarImage: vechicles.redFrontView,
        speed: '400km/h',
        acceleration: '20m/s²',
        handling: 'Pro',
        selected: false,

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

        modelPosition: { x: 0, y: -0.5, z: 0 },
        initialView: 'front',
        scaleConfig: { minScale: 1, maxScale: 2, defaultScale: 2 },

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
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

        modelPosition: { x: 0, y: -0.47, z: 0 },
        initialView: 'front',
        scaleConfig: { minScale: 1, maxScale: 2, defaultScale: 2 },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
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

        modelPosition: { x: 0, y: -0.47, z: 0 },
        initialView: 'front',
        scaleConfig: { minScale: 1, maxScale: 2, defaultScale: 2 },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
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

        modelPosition: { x: 0, y: -0.47, z: 0 },
        initialView: 'front',
        scaleConfig: { minScale: 1, maxScale: 2, defaultScale: 2 },

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

        disabledViews: {
            under: true,
            top: false,
            back: false
        },
        rotationLimits: {
            minPolarAngle: float,
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

// --- Globals ---
let scene, camera, renderer, currentCar, controls;
let using3D = false;
let currentCarConfig = null;
let currentBgIndex = Math.max(0, garageBackgrounds.findIndex(g => g.selected));

// --- WebGL Detection ---
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch {
        return false;
    }
}

// --- UI Fallbacks ---
function showImageFallback(imageUrl, carName) {
    if (!carContainer) return;
    carContainer.innerHTML = `
        <div class="image-fallback ">
            <img src="${imageUrl}" alt="${carName}" >
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

// --- Create Test Cube ---
function createTestCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0);
    return cube;
}

// --- Renderer Factory (back-compatible) ---
function createWebGLRenderer(container) {
    try {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setSize(container.clientWidth, container.clientHeight);
        if (renderer.setPixelRatio) {
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        }
        if (renderer.setClearColor) {
            renderer.setClearColor(0x000000, 0);
        }

        // Color management: prefer outputEncoding if it exists, else gammaOutput
        if ('outputEncoding' in renderer && 'sRGBEncoding' in THREE) {
            renderer.outputEncoding = THREE.sRGBEncoding;
        } else if ('gammaOutput' in renderer) {
            renderer.gammaOutput = true;
            renderer.gammaFactor = 2.2;
        }

        // Tone mapping if available
        if ('toneMapping' in renderer && typeof THREE.ACESFilmicToneMapping !== 'undefined') {
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
        }

        // Physically-correct lights if available
        if ('physicallyCorrectLights' in renderer) {
            renderer.physicallyCorrectLights = true;
        }

        return renderer;
    } catch (e) {
        console.error("❌ Renderer creation failed:", e);
        return null;
    }
}

// --- Apply Car Configuration ---
function applyCarConfiguration(carConfig) {
    if (!controls || !carConfig) return;

    // Apply rotation limits
    const limits = carConfig.rotationLimits || {};
    controls.minPolarAngle = limits.minPolarAngle !== undefined ? limits.minPolarAngle : 0;
    controls.maxPolarAngle = limits.maxPolarAngle !== undefined ? limits.maxPolarAngle : Math.PI;
    controls.minAzimuthAngle = limits.minAzimuthAngle !== undefined ? limits.minAzimuthAngle : -Infinity;
    controls.maxAzimuthAngle = limits.maxAzimuthAngle !== undefined ? limits.maxAzimuthAngle : Infinity;

    // Apply zoom limits based on scale config
    const scaleConfig = carConfig.scaleConfig || {};
    controls.minDistance = scaleConfig.minScale !== undefined ? scaleConfig.minScale : 2;
    controls.maxDistance = scaleConfig.maxScale !== undefined ? scaleConfig.maxScale : 10;
}

// --- Set Camera View ---
function setCameraView(viewName, carConfig) {
    if (!VIEW_PRESETS[viewName] || !VIEW_PRESETS[viewName].enabled) {
        console.warn(`View "${viewName}" is not available`);
        return false;
    }

    // Check if this view is disabled for current car
    if (carConfig && carConfig.disabledViews && carConfig.disabledViews[viewName]) {
        console.warn(`View "${viewName}" is disabled for this car`);
        return false;
    }

    const preset = VIEW_PRESETS[viewName];

    const lookAt = (currentCar?.position) || new THREE.Vector3(
        preset.cameraLookAt.x, preset.cameraLookAt.y, preset.cameraLookAt.z
    );

    camera.position.set(preset.cameraPosition.x, preset.cameraPosition.y, preset.cameraPosition.z);
    camera.lookAt(lookAt);

    if (controls && controls.target) {
        controls.target.copy(lookAt);
        controls.update();
    }

    return true;
}

// --- Init Scene ---
function init3DScene(container) {
    try {
        scene = new THREE.Scene();
        scene.background = null;

        camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 2, 6);

        renderer = createWebGLRenderer(container);
        if (!renderer) {
            throw new Error("WebGL renderer creation failed");
        }

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Force initial size and projection update
        if (renderer.setSize) renderer.setSize(container.clientWidth, container.clientHeight);
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

        // Animation loop
        function animate() {
            if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(animate);
            if (controls && controls.update) controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // First render
        renderer.render(scene, camera);

        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            if (renderer.setSize) renderer.setSize(container.clientWidth, container.clientHeight);
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

// --- Disposal helper (materials, textures, geometries) ---
function disposeObject3D(object) {
    if (!object) return;
    object.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
                if (!mat) return;
                // Dispose textures attached to the material
                for (const key in mat) {
                    const value = mat[key];
                    if (value && value.isTexture && value.dispose) value.dispose();
                }
                if (mat.dispose) mat.dispose();
            });
        }
    });
}

// --- Load Car Model ---
function loadCarModel(carData) {
    if (!using3D || !renderer) {
        showImageFallback(carData.CarImage, carData.name);
        return;
    }

    currentCarConfig = carData;

    // Show loading animation
    showLoadingAnimation(carData.name);

    const loader = new GLTFLoader();
    loader.load(
        carData.Car3D,
        (gltf) => {
            // Clean up previous car
            if (currentCar) {
                scene.remove(currentCar);
                disposeObject3D(currentCar);
                currentCar = null;
            }

            currentCar = gltf.scene || (gltf.scenes && gltf.scenes[0]) || createTestCube();

            // Apply model position
            const position = carData.modelPosition || { x: 0, y: 0, z: 0 };
            currentCar.position.set(position.x, position.y, position.z);

            // Scale model based on bounding box
            const box = new THREE.Box3().setFromObject(currentCar);
            const size = new THREE.Vector3();
            box.getSize(size);

            if (size.length() === 0) {
                console.warn('⚠️ Model has zero size, might be empty');
                const fallbackCube = createTestCube();
                scene.add(fallbackCube);
                currentCar = fallbackCube;
            } else {
                const scaleConfig = carData.scaleConfig || {};
                const defaultScale = scaleConfig.defaultScale || 2;
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = defaultScale / maxDim;
                currentCar.scale.set(scale, scale, scale);
            }

            scene.add(currentCar);

            // Keep orbit target centered on the car
            if (controls) {
                controls.target.copy(currentCar.position);
                controls.update();
            }

            // Apply car-specific configuration
            applyCarConfiguration(carData);

            // Set initial camera view
            const initialView = carData.initialView || 'front';
            setCameraView(initialView, carData);

            // Finalize UI
            requestAnimationFrame(() => {
                setTimeout(() => {
                    hideLoadingAnimation();
                    updateCarInfo(carData);
                    animateCarIn();
                }, 500);
            });

        },
        // Progress callback
        (xhr) => {
            let percentLoaded = 0;

            if (xhr.lengthComputable) {
                percentLoaded = (xhr.loaded / xhr.total * 100);
            } else {
                percentLoaded = Math.min((xhr.loaded / 1000000) * 100, 99);
            }

            updateLoadingProgress(percentLoaded);
        },
        (err) => {
            console.error("❌ Model load failed:", err);

            if (currentCar) {
                scene.remove(currentCar);
                disposeObject3D(currentCar);
                currentCar = null;
            }

            // Use a simple cube instead of removing the canvas
            currentCar = createTestCube();
            scene.add(currentCar);

            if (controls) {
                controls.target.copy(currentCar.position);
                controls.update();
            }

            hideLoadingAnimation();
        }
    );
}

// --- Loading Animation Functions ---
function showLoadingAnimation(carName = '') {
    // Remove any existing loading animation
    hideLoadingAnimation();

    const loadingHTML = `
        <div id="model-loading" >
            <div style="text-align: center;">
                <!-- Spinning loader -->
                <div class="spinner" ></div>
                
                <!-- Loading text -->
                <h3 class="Aname">Loading ${carName}</h3>
                
                <!-- Progress bar -->
                <div class="spin-bar" >
                    <div  id="loading-progress-bar" ></div>
                </div>
                
                <!-- Percentage -->
                <div id="loading-percentage">0%</div>
                
                <!-- Tips -->
                <div class="tips" >
                    <div>💡 Tip: You can rotate the car by dragging</div>
                    <div>💡 Tip: Scroll to zoom in/out</div>
                </div>
            </div>
        </div>
    `;

    carContainer?.insertAdjacentHTML('beforeend', loadingHTML);

    // Add CSS animation
    if (!document.querySelector('#loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
            .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    }
}

function updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loading-progress-bar');
    const percentageText = document.getElementById('loading-percentage');

    if (!progressBar || !percentageText) {
        console.warn('⚠️ Progress elements not found in DOM yet');
        return;
    }

    progressBar.style.width = percent + '%';
    percentageText.textContent = Math.round(percent) + '%';

    if (percent >= 90) {
        percentageText.classList.add('loading-pulse');
    } else {
        percentageText.classList.remove('loading-pulse');
    }
}

let soundtime;
let switchsound;
function hideLoadingAnimation() {
    try { stopMusic?.(switchsound); } catch {}
    clearTimeout(soundtime);
    const loadingElement = document.getElementById('model-loading');
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        loadingElement.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            loadingElement.remove();
        }, 300);
    }
}

// --- Garage Init ---
function garageInit() {
    try { stopMusic?.(switchsound); } catch {}
    clearTimeout(soundtime);

    const v = [...garageVechicles];

    const firstSelected = v.find(c => c.selected);
    if (firstSelected) {
        Selectbtn?.setAttribute('id', firstSelected.id);
        loadCarModel(firstSelected);
        selectedCar = firstSelected;
        Selectbtn?.classList.add('selected');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (carContainer && (carContainer.clientWidth === 0 || carContainer.clientHeight === 0)) {
        carContainer.style.width = '100%';
        carContainer.style.height = '700px';
    }

    if (isWebGLAvailable()) {
        if (init3DScene(carContainer)) {
            const initialCar = garageVechicles.find(c => c.selected);
            if (initialCar) {
                setTimeout(() => loadCarModel(initialCar), 500);
            }
        } else {
            showWebGLError();
            const initialCar = garageVechicles.find(c => c.selected);
            if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
        }
    } else {
        showWebGLError();
        const initialCar = garageVechicles.find(c => c.selected);
        if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
    }

    // Safe event bindings
    Selectbtn?.addEventListener('click', function () {
        selectCar(Selectbtn.id);
    });

    changeCar?.addEventListener('click', changeSelection);
    garagesw?.addEventListener('click', selectGarage);

    // Initialize background once
    if (garage) {
        const bg = garageBackgrounds[currentBgIndex] ?? garageBackgrounds[0];
        garageBackgrounds.forEach((g, i) => g.selected = (i === currentBgIndex));
        garage.style.backgroundImage = `url(${bg.image})`;
    }
});

// --- UI Animations ---
function animateCarIn() {
    switchsound = startAcc?.();
    if (carInfo) {
        carInfo.style.animation = 'none';
        void carInfo.offsetWidth;
        carInfo.style.animation = 'slideIn2 1s linear forwards';
    }
    if (carContainer) {
        carContainer.style.animation = 'none';
        void carContainer.offsetWidth;
        carContainer.style.animation = 'slideIn 1s linear forwards';
    }

    if (changeCar) changeCar.style.pointerEvents = 'none';
    soundtime = setTimeout(() => {
        try { stopMusic?.(switchsound); } catch {}
        if (changeCar) changeCar.style.pointerEvents = 'auto';
    }, 2800);
}

function updateCarInfo(infos) {
    const picked = !!infos?.selected;
    if (carName) carName.textContent = infos?.name ?? '';
    if (speed) speed.textContent = infos?.speed ?? '';
    if (acceleration) acceleration.textContent = infos?.acceleration ?? '';
    if (handling) handling.textContent = infos?.handling ?? '';
    if (protect) protect.textContent = ((infos?.protectionDistance ?? 0) + 'm');

    if (selecttxt) selecttxt.textContent = picked ? 'Selected' : 'Select';
    if (Selectbtn) {
        if (picked) Selectbtn.classList.add('selected');
        else Selectbtn.classList.remove('selected');
    }
}

// --- Selection Logic ---
let count = 0;
function changeSelection() {
    try { stopMusic?.(switchsound); } catch {}
    clearTimeout(soundtime);

    const v = garageVechicles;
    count = (count + 1) % v.length;
    Selectbtn?.setAttribute('id', v[count].id);
    v.forEach(c => (c.selected = false));
    loadCarModel(v[count]);
    updateCarInfo(v[count]);
}

function selectGarage() {
    try { stopMusic?.(switchsound); } catch {}
    clearTimeout(soundtime);

    if (!garageBackgrounds.length || !garage) return;

    currentBgIndex = (currentBgIndex + 1) % garageBackgrounds.length;
    garageBackgrounds.forEach((g, i) => g.selected = (i === currentBgIndex));
    const bg = garageBackgrounds[currentBgIndex];
    garage.style.backgroundImage = `url(${bg.image})`;
    animateCarIn();
}

function selectCar(id) {
    const v = [...garageVechicles];

    let selected = null;
    v.forEach((car) => {
        if (car.id === id) {
            car.selected = true;
            selected = car;
        } else {
            car.selected = false;
        }
    });

    if (selected) {
        selectedCar = selected;
        if (selecttxt) selecttxt.textContent = 'Selected';
        Selectbtn?.classList.add('selected');
        updateCarInfo(selected);
    }
}

function getSelectedName() {
    return selectedCar ? selectedCar.name.toUpperCase() : 'HYPER GT';
}
function getSelectedAccel() {
    return selectedCar ? selectedCar.acceleration : '4m/s²';   
}
function getSelectedHandling() {
    return selectedCar ? selectedCar.handling : 'regular';   
}
// Export public API for controlling views
export {
    garageInit,
    changeSelection,
    garageVechicles,
    selectGarage,
    setCameraView,  // Allow external control of camera views
    VIEW_PRESETS,
    selectedCar,
    getSelectedName,
    getSelectedAccel,
    getSelectedHandling    // Export view presets for external use
};