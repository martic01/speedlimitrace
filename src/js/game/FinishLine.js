import * as THREE from 'three';

export class FinishLine {
    constructor(scene, finishLinePosition) {
        this.scene = scene;
        this.mesh = null;
        
        this.createFinishLine(finishLinePosition);
    }

    createFinishLine(finishZ) {
        this.mesh = new THREE.Group();

        // Create poles with better design
        const poleGeometry = new THREE.CylinderGeometry(0.15, 0.2, 4, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F4F4F, // Dark slate gray
            roughness: 0.7,
            metalness: 0.3
        });

        const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
        leftPole.position.set(-3, 2, finishZ);
        this.mesh.add(leftPole);

        const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
        rightPole.position.set(3, 2, finishZ);
        this.mesh.add(rightPole);

        // Create crossbar with checkered pattern
        const barGeometry = new THREE.BoxGeometry(6.5, 0.2, 0.3);
        const barMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.8
        });
        const topBar = new THREE.Mesh(barGeometry, barMaterial);
        topBar.position.set(0, 4, finishZ);
        this.mesh.add(topBar);

        // Create checkered flag banner
        this.createCheckeredBanner(0, 3.2, finishZ + 0.16);

        // Add decorative elements
        this.addDecorativeElements(finishZ);

        // Add finish line text
        this.createFinishText(0, 2.8, finishZ + 0.18);

        this.scene.add(this.mesh);
        console.log(`🎯 Enhanced finish line created at z = ${finishZ}`);
    }

    createCheckeredBanner(x, y, z) {
        const bannerGroup = new THREE.Group();

        // Banner base
        const bannerGeometry = new THREE.PlaneGeometry(5, 2);
        const bannerMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            side: THREE.DoubleSide,
            roughness: 0.6
        });
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.set(0, 0, 0);
        bannerGroup.add(banner);

        // Create checkered pattern
        this.createCheckerPattern(bannerGroup);

        bannerGroup.position.set(x, y, z);
        bannerGroup.rotation.y = Math.PI; // Face the approaching car
        this.mesh.add(bannerGroup);
    }

    createCheckerPattern(bannerGroup) {
        const checkerSize = 0.4;
        const rows = 4;
        const cols = 6;
        
        const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const checkerGeometry = new THREE.PlaneGeometry(checkerSize, checkerSize);
                const material = (row + col) % 2 === 0 ? blackMaterial : whiteMaterial;
                const checker = new THREE.Mesh(checkerGeometry, material);
                
                checker.position.set(
                    (col - cols/2 + 0.5) * checkerSize,
                    (row - rows/2 + 0.5) * checkerSize,
                    0.01
                );
                
                bannerGroup.add(checker);
            }
        }
    }

    createFinishText(x, y, z) {
        // Create a simple "FINISH" text using geometry
        const textGroup = new THREE.Group();

        // F
        this.createLetter(textGroup, -2.0, 0.3, 'F');
        // I
        this.createLetter(textGroup, -1.2, 0.3, 'I');
        // N
        this.createLetter(textGroup, -0.4, 0.3, 'N');
        // I
        this.createLetter(textGroup, 0.4, 0.3, 'I');
        // S
        this.createLetter(textGroup, 1.2, 0.3, 'S');
        // H
        this.createLetter(textGroup, 2.0, 0.3, 'H');

        textGroup.position.set(x, y, z);
        textGroup.rotation.y = Math.PI; // Face the approaching car
        this.mesh.add(textGroup);
    }

    createLetter(parent, x, y, letter) {
        const letterMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffd700, // Gold color
            transparent: true,
            opacity: 0.9
        });

        let geometry;
        
        switch(letter) {
            case 'F':
                geometry = this.createFGeometry();
                break;
            case 'I':
                geometry = this.createIGeometry();
                break;
            case 'N':
                geometry = this.createNGeometry();
                break;
            case 'S':
                geometry = this.createSGeometry();
                break;
            case 'H':
                geometry = this.createHGeometry();
                break;
            default:
                geometry = new THREE.BoxGeometry(0.2, 0.5, 0.05);
        }

        const mesh = new THREE.Mesh(geometry, letterMaterial);
        mesh.position.set(x, y, 0.02);
        parent.add(mesh);
    }

    createFGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.3, 0);
        shape.lineTo(0.3, 0.1);
        shape.lineTo(0.1, 0.1);
        shape.lineTo(0.1, 0.2);
        shape.lineTo(0.25, 0.2);
        shape.lineTo(0.25, 0.3);
        shape.lineTo(0.1, 0.3);
        shape.lineTo(0.1, 0.5);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, 0);
        return new THREE.ShapeGeometry(shape);
    }

    createIGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0.1, 0);
        shape.lineTo(0.2, 0);
        shape.lineTo(0.2, 0.5);
        shape.lineTo(0.1, 0.5);
        shape.lineTo(0.1, 0);
        return new THREE.ShapeGeometry(shape);
    }

    createNGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.1, 0);
        shape.lineTo(0.1, 0.4);
        shape.lineTo(0.2, 0);
        shape.lineTo(0.3, 0);
        shape.lineTo(0.3, 0.5);
        shape.lineTo(0.2, 0.5);
        shape.lineTo(0.2, 0.1);
        shape.lineTo(0.1, 0.5);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, 0);
        return new THREE.ShapeGeometry(shape);
    }

    createSGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0.25, 0);
        shape.lineTo(0.1, 0);
        shape.lineTo(0, 0.1);
        shape.lineTo(0, 0.2);
        shape.lineTo(0.1, 0.3);
        shape.lineTo(0.25, 0.3);
        shape.lineTo(0.3, 0.35);
        shape.lineTo(0.3, 0.45);
        shape.lineTo(0.2, 0.5);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, 0.4);
        shape.lineTo(0.15, 0.4);
        shape.lineTo(0.2, 0.35);
        shape.lineTo(0.2, 0.3);
        shape.lineTo(0.05, 0.3);
        shape.lineTo(0, 0.25);
        shape.lineTo(0, 0.15);
        shape.lineTo(0.1, 0.05);
        shape.lineTo(0.25, 0.05);
        shape.lineTo(0.25, 0);
        return new THREE.ShapeGeometry(shape);
    }

    createHGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(0.1, 0);
        shape.lineTo(0.1, 0.2);
        shape.lineTo(0.2, 0.2);
        shape.lineTo(0.2, 0);
        shape.lineTo(0.3, 0);
        shape.lineTo(0.3, 0.5);
        shape.lineTo(0.2, 0.5);
        shape.lineTo(0.2, 0.3);
        shape.lineTo(0.1, 0.3);
        shape.lineTo(0.1, 0.5);
        shape.lineTo(0, 0.5);
        shape.lineTo(0, 0);
        return new THREE.ShapeGeometry(shape);
    }

    addDecorativeElements(finishZ) {
        // Add base platforms for poles
        const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x404040,
            roughness: 0.9
        });

        const leftBase = new THREE.Mesh(baseGeometry, baseMaterial);
        leftBase.position.set(-3, 0.15, finishZ);
        this.mesh.add(leftBase);

        const rightBase = new THREE.Mesh(baseGeometry, baseMaterial);
        rightBase.position.set(3, 0.15, finishZ);
        this.mesh.add(rightBase);

        // Add some flags on top
        this.createFlag(-3, 4.2, finishZ, 0xff0000); // Red flag
        this.createFlag(3, 4.2, finishZ, 0x0000ff); // Blue flag

        // Add some spotlights
        this.createSpotlight(-2.5, 3.5, finishZ - 2, 0xffff00);
        this.createSpotlight(2.5, 3.5, finishZ - 2, 0xffff00);
    }

    createFlag(x, y, z, color) {
        const flagGroup = new THREE.Group();

        // Flag pole
        const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
        const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.rotation.z = Math.PI / 2;
        flagGroup.add(pole);

        // Flag cloth
        const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const flagMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.2, 0, 0);
        flag.rotation.y = Math.PI / 2;
        flagGroup.add(flag);

        flagGroup.position.set(x, y, z);
        this.mesh.add(flagGroup);
    }

    createSpotlight(x, y, z, color) {
        const light = new THREE.PointLight(color, 1, 10);
        light.position.set(x, y, z);
        this.mesh.add(light);

        // Add light glow effect
        const lightGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const lightGlow = new THREE.Mesh(lightGeometry, lightMaterial);
        lightGlow.position.set(x, y, z);
        this.mesh.add(lightGlow);
    }

    update(distanceThisFrame) {
        this.mesh.position.z += distanceThisFrame;
    }
}

export default FinishLine;