// --- Imports ---
// Core Three.js
import * as THREE from 'three';

// Loaders & Controls
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Your modules
import { garages, vechicles3D, vechicles } from "../constants/material.js";
import { stopMusic, startAcc } from "./sounds.js";
import cars from '../../assets/models/dodge.glb'

// --- UI References ---
const changeCar = document.querySelector('.change');
const carContainer = document.querySelector('.car');
const carInfo = document.querySelector('.carinfo');
const carName = document.querySelector('.name');
const speed = document.querySelector('.sp');
const acceleration = document.querySelector('.ac');
const handling = document.querySelector('.hn');
const selecttxt = document.querySelector('.selecttxt');
const garage = document.querySelector('.garage');
const Selectbtn = document.querySelector('.selectbtn');

// View presets configuration
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
        cameraPosition: { x: 0, y: -0.7, z: -5 },  // Fixed: Positive Z for front, negative Z for back
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    back: {
        cameraPosition: { x: 0, y: -0.7, z: -5 },  // Fixed: Positive Z for front, negative Z for back
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    top: {
        cameraPosition: { x: 0, y: 3, z: 0.1 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    under: {
        cameraPosition: { x: 0, y: 3, z: 0.1 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    },
    '3quarter': {
        cameraPosition: { x: 3, y: 1.5, z: 3 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        enabled: true
    }
};

// --- Car & Garage Data ---
const garageVechicles = [
    {
        id: '1ag',
        name: 'Fast time',
        Car3D: vechicles3D.car3d1,
        CarImage: vechicles.redFrontView,
        speed: '100km/h',
        acceleration: '10m/s²',
        handling: 'Medium',
        selected: true,

        // New configuration options
        modelPosition: { x: 0, y: -0.5, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '2bg',
        name: 'Red Horse',
        Car3D: vechicles3D.car3d2,
        CarImage: vechicles.redFrontView,
        speed: '120km/h',
        acceleration: '12m/s²',
        handling: 'Medium',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.5, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '3cg',
        name: 'Fist',
        Car3D: vechicles3D.car3d3,
        CarImage: vechicles.redFrontView,
        speed: '140km/h',
        acceleration: '14m/s²',
        handling: 'Good',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.5, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '4dg',
        name: 'New Dawn',
        Car3D: vechicles3D.car3d4,
        CarImage: vechicles.redFrontView,
        speed: '200km/h',
        acceleration: '18m/s²',
        handling: 'Good',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.388, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '5eg',
        name: 'Wizard',
        Car3D: vechicles3D.car3d5,
        CarImage: vechicles.redFrontView,
        speed: '270km/h',
        acceleration: '20m/s²',
        handling: 'Pro',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.5, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '6eg',
        name: '🔥 At Last 🔥',
        Car3D: vechicles3D.car3d6,
        CarImage: vechicles.redFrontView,
        speed: '340km/h',
        acceleration: '24m/s²',
        handling: 'LENGEND🔥',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.47, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '7eg',
        name: 'Fear 🤬',
        Car3D: vechicles3D.car3d7,
        CarImage: vechicles.redFrontView,
        speed: '370km/h',
        acceleration: '30m/s²',
        handling: 'STAR 🌟',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.47, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
        }
    },
    {
        id: '8fg',
        name: 'Storm-rider⚡',
        Car3D: vechicles3D.car3d8,
        CarImage: vechicles.redFrontView,
        speed: '400km/h',
        acceleration: '34m/s²',
        handling: 'Pro-Star🌟',
        selected: false,

        // New configuration options
        modelPosition: { x: 0, y: -0.47, z: 0 }, // Raised position
        initialView: 'front',
        scaleConfig: {
            minScale: 1,
            maxScale: 2,
            defaultScale: 2
        },
        // Disable specific views (user can't rotate to these)
        disabledViews: {
            under: true,     // User CAN view from under
            top: false,       // User CAN view from top
            back: false,       // User CANNOT view from back
            // front, side are always enabled by default
        },
        // Rotation limits (in radians)
        rotationLimits: {
            minPolarAngle: Math.PI / 2.4,      // 90° - fixed vertical angle
            maxPolarAngle: Math.PI / 2,      // 90° - same as min to lock vertical rotation
            minAzimuthAngle: -Infinity,      // Unlimited horizontal rotation
            maxAzimuthAngle: Infinity        // Unlimited horizontal rotation
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

// --- WebGL Detection ---
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// --- UI Fallbacks ---
function showImageFallback(imageUrl, carName) {
    carContainer.innerHTML = `
        <div class="image-fallback ">
            <img src="${imageUrl}" alt="${carName}" >
            <h3>${carName}</h3>
            <p>3D View Not Available</p>
        </div>
    `;
}

function showWebGLError() {
    carContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:#ff6b6b;color:#fff;border-radius:10px;padding:20px;">
            <h3>🚫 3D Not Supported</h3>
            <p>Your device doesn't support WebGL rendering.</p>
        </div>
    `;
}

// --- Create Test Cube ---
function createTestCube() {
    console.log('🎲 Creating test cube...');
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

// --- Renderer Factory ---
function createWebGLRenderer(container) {
    try {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        console.log('✅ Renderer created successfully');
        return renderer;
    } catch (e) {
        console.error("❌ Renderer creation failed:", e);
        return null;
    }
}

// --- Apply Car Configuration ---
function applyCarConfiguration(carConfig) {
    if (!controls || !carConfig) return;

    console.log('⚙️ Applying car configuration:', carConfig.name);

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

    console.log('📐 Applied limits:', {
        polarAngle: `[${controls.minPolarAngle.toFixed(2)}, ${controls.maxPolarAngle.toFixed(2)}]`,
        azimuthAngle: `[${controls.minAzimuthAngle}, ${controls.maxAzimuthAngle}]`,
        distance: `[${controls.minDistance}, ${controls.maxDistance}]`
    });
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
    camera.position.set(preset.cameraPosition.x, preset.cameraPosition.y, preset.cameraPosition.z);
    camera.lookAt(preset.cameraLookAt.x, preset.cameraLookAt.y, preset.cameraLookAt.z);

    console.log(`📷 Camera set to: ${viewName}`);
    return true;
}

// --- Init Scene ---
function init3DScene(container) {
    try {
        console.log('🚀 Initializing 3D scene...');

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

        // --- Better lighting setup ---
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Ambient light (soft overall fill)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        // Sunlight directional
        const sunLight = new THREE.DirectionalLight(0xffffff, 2);
        sunLight.position.set(5, 10, 7);
        sunLight.castShadow = true;
        scene.add(sunLight);

        // Hemisphere light for sky/ground contrast
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        // // --- Helpers (optional, for debugging) ---
        // const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        // gridHelper.position.y = -0.5;
        // scene.add(gridHelper);
        // console.log('📐 Grid helper added');

        // Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        using3D = true;
        console.log('✅ 3D scene initialized successfully');
        return true;

    } catch (e) {
        console.error("❌ 3D init failed:", e);
        using3D = false;
        return false;
    }
}


// --- Load Car Model ---
function loadCarModel(carData) {
    if (!using3D || !renderer) {
        console.log('❌ Using image fallback for:', carData.name);
        showImageFallback(carData.CarImage, carData.name);
        return;
    }

    console.log('🔄 Loading 3D model:', carData.name);
    currentCarConfig = carData;

    // Show loading animation
    showLoadingAnimation(carData.name);

    const loader = new GLTFLoader();
    loader.load(
        carData.Car3D,
        (gltf) => {
            console.log('✅ Model loaded successfully:', carData.name);

            // Clean up previous car
            if (currentCar) {
                scene.remove(currentCar);
                currentCar.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                });
            }

            // Remove any test cubes or helpers
            scene.children.forEach(child => {
                if (child instanceof THREE.BoxHelper ||
                    (child.isMesh && child.material && child.material.color && child.material.color.getHex() === 0x00ff00)) {
                    scene.remove(child);
                }
            });

            currentCar = gltf.scene;

            // Apply model position
            const position = carData.modelPosition || { x: 0, y: 0, z: 0 };
            currentCar.position.set(position.x, position.y, position.z);
            console.log('📍 Model position set to:', position);

            // Scale model
            const scaleConfig = carData.scaleConfig || {};
            const defaultScale = scaleConfig.defaultScale || 2;

            const box = new THREE.Box3().setFromObject(currentCar);
            const size = new THREE.Vector3();
            box.getSize(size);

            console.log('📏 Model size:', size);

            if (size.length() === 0) {
                console.warn('⚠️ Model has zero size, might be empty');
                const fallbackCube = createTestCube();
                scene.add(fallbackCube);
                currentCar = fallbackCube;
            } else {
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = defaultScale / maxDim;
                currentCar.scale.set(scale, scale, scale);
                console.log('📐 Model scaled to:', currentCar.scale);
            }

            scene.add(currentCar);

            // Apply car-specific configuration
            applyCarConfiguration(carData);

            // Set initial camera view
            const initialView = carData.initialView || 'front';
            setCameraView(initialView, carData);

            console.log('🎯 Car configuration applied successfully');

            // Wait for next frame to ensure model is rendered, then hide loading
            requestAnimationFrame(() => {
                setTimeout(() => {
                    hideLoadingAnimation();
                    animateCarIn();
                    updateCarInfo(carData)
                }, 500); // Small delay to ensure smooth transition
            });

        },
        // Progress callback
        (xhr) => {
            if (xhr.lengthComputable) {
                const percentLoaded = (xhr.loaded / xhr.total * 100);
                console.log(`📦 Loading: ${percentLoaded.toFixed(1)}%`);
                updateLoadingProgress(percentLoaded);
            }
        },
        (err) => {
            console.error("❌ Model load failed:", err);

            const fallbackCube = createTestCube();
            scene.add(fallbackCube);
            currentCar = fallbackCube;

            // Hide loading and show fallback
            hideLoadingAnimation();
            showImageFallback(carData.CarImage, carData.name);
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

    carContainer.insertAdjacentHTML('beforeend', loadingHTML);

    // Add CSS animation
    if (!document.querySelector('#loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            .loading-pulse {
                animation: pulse 1.5s ease-in-out infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

function updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loading-progress-bar');
    const percentageText = document.getElementById('loading-percentage');

    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    if (percentageText) {
        percentageText.textContent = Math.round(percent) + '%';

        // Add pulse animation when near completion
        if (percent >= 90) {
            percentageText.classList.add('loading-pulse');
        } else {
            percentageText.classList.remove('loading-pulse');
        }
    }
}

function hideLoadingAnimation() {
    const loadingElement = document.getElementById('model-loading');
    if (loadingElement) {
        // Add fade out animation
        loadingElement.style.opacity = '0';
        loadingElement.style.transition = 'opacity 0.3s ease';

        setTimeout(() => {
            loadingElement.remove();
        }, 300);
    }

    // Also remove any existing progress elements
    const progressBar = document.getElementById('loading-progress-bar');
    const percentageText = document.getElementById('loading-percentage');
    if (progressBar) progressBar.remove();
    if (percentageText) percentageText.remove();
}

// --- Enhanced Error Handling with Loading ---

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
    console.log('🏠 DOM loaded, initializing 3D viewer...');

    if (carContainer.clientWidth === 0 || carContainer.clientHeight === 0) {
        carContainer.style.width = '100%';
        carContainer.style.height = '500px';
        console.log('📐 Set container dimensions');
    }

    if (isWebGLAvailable()) {
        console.log('✅ WebGL is available');
        if (init3DScene(carContainer)) {
            const initialCar = garageVechicles.find(c => c.selected);
            if (initialCar) {
                console.log('🚗 Loading initial car:', initialCar.name);
                setTimeout(() => loadCarModel(initialCar), 500);
            }
        } else {
            console.log('❌ 3D initialization failed, using fallback');
            showWebGLError();
            const initialCar = garageVechicles.find(c => c.selected);
            if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
        }
    } else {
        console.log('❌ WebGL not available, using fallback');
        showWebGLError();
        const initialCar = garageVechicles.find(c => c.selected);
        if (initialCar) showImageFallback(initialCar.CarImage, initialCar.name);
    }
});

// --- UI Animations ---
let soundtime;
let switchsound;
function animateCarIn() {
    switchsound = startAcc();
    carInfo.style.animation = 'none';
    carContainer.style.animation = 'none';
    void carInfo.offsetWidth;
    void carContainer.offsetWidth;

    carInfo.style.animation = 'slideIn2 1s linear forwards';
    carContainer.style.animation = 'slideIn 1s linear forwards';


    changeCar.style.pointerEvents = 'none';
    soundtime = setTimeout(() => {
        stopMusic(switchsound);
        changeCar.style.pointerEvents = 'auto';
    }, 2800);
}


function updateCarInfo(infos) {
    carName.textContent = infos.name;
    speed.textContent = infos.speed;
    acceleration.textContent = infos.acceleration;
    handling.textContent = infos.handling;
    selecttxt.textContent = infos.selected ? 'Selected' : 'Select';
}
// --- Selection Logic ---
function garageSelect() {
    stopMusic(switchsound)
    clearTimeout(soundtime)

    const v = [...garageVechicles];

    v.forEach(c => {
        if (c.selected) {
            loadCarModel(c);
        }
    });

}

let count = 0;
function changeSelection() {
    stopMusic(switchsound)
    clearTimeout(soundtime)

    const v = garageVechicles;
    count = (count + 1) % v.length;

    loadCarModel(v[count]);

}

function selectGarage() {
    garageBackgrounds.forEach(g => g.selected = !g.selected);
    const bg = garageBackgrounds.find(g => g.selected);
    if (bg) garage.style.backgroundImage = `url(${bg.image})`;
    animateCarIn();
}

// Export public API for controlling views
export {
    garageSelect,
    changeSelection,
    garageVechicles,
    selectGarage,
    setCameraView,  // Allow external control of camera views
    VIEW_PRESETS    // Export view presets for external use
};