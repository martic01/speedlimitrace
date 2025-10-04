import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { vechicles3D } from '../../constants/material';

export class Car {
    constructor(scene, game = null) {
        this.scene = scene;
        this.game = game;
        this.LANE_POSITIONS = [-1.5, 0, 1.5];
        this.LANE_CHANGE_SPEED = 0.1;
        this.mesh = null;
        this.isLoaded = false;
        this.originalColors = new Map();
        this.positionOffsetZ = -2.0;

        // Create a simple placeholder while loading
        this.createPlaceholderCar();

        // Load the 3D car model
        this.loadCarModel();
    }

    createPlaceholderCar() {
        const carGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.5);
        const carMaterial = new THREE.MeshLambertMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        this.mesh = new THREE.Mesh(carGeometry, carMaterial);
        this.mesh.position.set(0, 0.7, 4 + this.positionOffsetZ);
        this.mesh.name = 'car-placeholder';
        this.scene.add(this.mesh);
    }

    storeOriginalColors(object) {
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                const colors = [];

                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.color) {
                            colors.push(mat.color.clone());
                        } else {
                            colors.push(new THREE.Color(0x888888)); // Neutral gray
                        }
                    });
                } else {
                    if (child.material.color) {
                        colors.push(child.material.color.clone());
                    } else {
                        colors.push(new THREE.Color(0x888888)); // Neutral gray
                    }
                }

                this.originalColors.set(child, colors);
            }
        });
        console.log("🎨 Original car colors stored");
    }

    // Set temporary color for effects (explosions, etc.)
    setColor(color) {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.color) {
                            mat.color.set(color);
                        }
                    });
                } else if (child.material.color) {
                    child.material.color.set(color);
                }
            }
        });
    }

    // SIMPLIFIED: Just remove any temporary colors and let the materials be as-is
    resetColor() {
        if (!this.mesh) return;

        let restored = false;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                // Method 1: Use stored original colors
                if (this.originalColors.has(child)) {
                    const originalColorArray = this.originalColors.get(child);

                    if (Array.isArray(child.material) && Array.isArray(originalColorArray)) {
                        child.material.forEach((mat, index) => {
                            if (mat.color && originalColorArray[index]) {
                                mat.color.copy(originalColorArray[index]);
                                restored = true;
                            }
                        });
                    } else if (!Array.isArray(child.material) && originalColorArray.length > 0) {
                        if (child.material.color && originalColorArray[0]) {
                            child.material.color.copy(originalColorArray[0]);
                            restored = true;
                        }
                    }
                }
                // Method 2: If no stored colors, just don't change anything - let materials be as-is
                // This way we don't force any color
            }
        });

        if (restored) {
            console.log("🎨 Car colors restored from stored originals");
        } else {
            console.log("🎨 Car materials left as-is (no forced color change)");
        }
    }

    // Alternative: Simply do nothing to let materials keep their original state
    restoreToOriginal() {
        this.resetColor();
        this.mesh.rotation.set(0, Math.PI, 0);
        this.mesh.position.set(0, 0.3, 4 + this.positionOffsetZ);
    }


    // Set temporary color for effects
    setTemporaryColor(color) {
        if (!this.mesh) return;

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.color) {
                            mat.color.set(color);
                        }
                    });
                } else if (child.material.color) {
                    child.material.color.set(color);
                }
            }
        });
    }

    loadCarModel() {
        const loader = new GLTFLoader();

        loader.load(
            vechicles3D.car3d1,
            (gltf) => {
                console.log('🚗 3D Car model loaded successfully!');

                // Remove the placeholder
                this.scene.remove(this.mesh);

                // Get the car model from the GLTF scene
                this.mesh = gltf.scene;
                this.mesh.name = 'car-3d-model';

                // Scale and position the car appropriately
                this.mesh.scale.set(0.34, 0.34, 0.34);
                this.mesh.position.set(0, 0.3, 4 + this.positionOffsetZ);

                // Make sure the car faces the correct direction
                this.mesh.rotation.y = Math.PI; // Rotate 180 degrees to face forward

                // Optimize THEN store colors
                this.optimizeMaterials(this.mesh);
                this.storeOriginalColors(this.mesh);


                // Add the car to the scene
                this.scene.add(this.mesh);
                this.isLoaded = true;

                console.log('✅ 3D Car model ready!');
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100);
                console.log(`🔄 Loading car model: ${percent.toFixed(2)}%`);
            },
            (error) => {
                console.error('❌ Error loading 3D car model:', error);
                console.log('⚠️ Using placeholder car instead');
                this.mesh.material.opacity = 1.0;
                this.mesh.material.color.set(0xff0000);
            }
        );
    }

    optimizeMaterials(object) {
        object.traverse((child) => {
            if (child.isMesh) {
                // Convert materials to WebGL 1 compatible versions
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => this.simplifyMaterial(mat));
                    } else {
                        this.simplifyMaterial(child.material);
                    }

                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });
    }

    simplifyMaterial(material) {
        // Convert to basic material types for WebGL 1 compatibility
        if (material.isMeshStandardMaterial) {
            const basicMaterial = new THREE.MeshLambertMaterial({
                color: material.color ? material.color.clone() : 0x888888, // Preserve original color
                map: material.map,
                transparent: material.transparent || false,
                opacity: material.opacity || 1.0
            });

            material.dispose();
            return basicMaterial;
        }

        return material;
    }

    update(currentLane, curveIntensity, curveOffset, deltaTime) {
        if (!this.mesh) return;

        const targetX = this.LANE_POSITIONS[currentLane] + curveOffset;
        this.mesh.position.x += (targetX - this.mesh.position.x) * this.LANE_CHANGE_SPEED;

        if (curveIntensity !== 0) {
            this.mesh.rotation.y = Math.PI + (curveIntensity * 0.3);
            this.mesh.rotation.z = -curveIntensity * 0.2;
        } else {
            this.mesh.rotation.y = Math.PI;
            this.mesh.rotation.z += (0 - this.mesh.rotation.z) * 0.1;
        }

        if (this.isLoaded) {
            const bounce = Math.sin(Date.now() * 0.005) * 0.02;
            this.mesh.position.y = 0.3 + bounce;
        }
    }

    reset() {
        if (this.mesh) {
            this.mesh.position.set(0, 0.3, 4 + this.positionOffsetZ);
            this.mesh.rotation.set(0, Math.PI, 0);
            this.restoreToOriginal(); // This just lets materials be as-is
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
            this.scene.remove(this.mesh);
        }
    }
}

export default Car;