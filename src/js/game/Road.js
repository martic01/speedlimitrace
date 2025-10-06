import * as THREE from 'three';
import { tracks } from '../../constants/material.js';

export class Road {
    constructor(scene) {
        this.scene = scene;
        this.roads = [];
        this.roadLength = 14;
        this.roadWidth = 6.4;
        
        this.createRoads();
    }

    createRoads() {
        const roadTexture = new THREE.TextureLoader().load(tracks.road);
        roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(1, 5);

        const roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture });

        for (let i = 0; i < 4; i++) {
            const road = new THREE.Mesh(
                new THREE.PlaneGeometry(this.roadWidth, this.roadLength), 
                roadMaterial
            );
            road.rotation.x = -Math.PI / 2;
            road.position.z = -i * this.roadLength;
            this.scene.add(road);
            this.roads.push(road);
        }
    }

    update(distanceThisFrame, totalDistance, curves) {
        this.roads.forEach(road => {
            road.position.z += distanceThisFrame;
            if (road.position.z > this.roadLength) {
                road.position.z -= this.roadLength * 4;
            }
            this.applyCurveToRoad(road, totalDistance, curves);
        });
    }

    applyCurveToRoad(road, totalDistance, curves) {
        const segmentDistance = totalDistance - Math.abs(road.position.z);
        const activeCurve = curves.getActiveCurve(segmentDistance);

        if (activeCurve) {
            const curveProgress = (segmentDistance - activeCurve.start) / (activeCurve.end - activeCurve.start);
            const easedProgress = curveProgress < 0.5 ?
                2 * curveProgress * curveProgress :
                1 - Math.pow(-2 * curveProgress + 2, 2) / 2;
            road.position.x = activeCurve.intensity * 50 * easedProgress;
        } else {
            road.position.x = 0;
        }
    }
}