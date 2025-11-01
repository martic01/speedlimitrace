import * as THREE from 'three';
import { roadDisplay } from './Mode';

// Internal curve scheduler to place turns in meters/km
class RoadCurvesManager {
    constructor(options = {}) {
        this.lookahead = options.lookahead ?? 2000;
        this.minGap = options.minGap ?? 300;
        this.maxGap = options.maxGap ?? 800;
        this.minLen = options.minLen ?? 400;
        this.maxLen = options.maxLen ?? 1000;
        this.maxAngleDeg = options.maxAngleDeg ?? 14;

        this.turns = [];
        this.lastPlanned = 0;
        this._lastAngleSign = 0;
    }

    m(n) { return n; }
    km(n) { return n * 1000; }

    addTurn({ start, length, angle, angleDeg }) {
        const A = angle != null ? angle : (angleDeg ?? 0) * Math.PI / 180;
        const L = length;
        const end = start + L;
        this.turns.push({ start, end, length: L, angle: A });
        this.turns.sort((a, b) => a.start - b.start);
        this.lastPlanned = Math.max(this.lastPlanned, end);
        this._lastAngleSign = Math.sign(A) || this._lastAngleSign;
        return this;
    }

    ensureAhead(totalDistance, lookahead = this.lookahead) {
        const target = totalDistance + lookahead;
        while (this.lastPlanned < target) {
            const gap = this._rand(this.minGap, this.maxGap);
            const length = this._rand(this.minLen, this.maxLen);

            // Alternate left/right bias
            const preferOpposite = Math.random() < 0.8;
            let sign = this._lastAngleSign ? -this._lastAngleSign : (Math.random() < 0.5 ? -1 : 1);
            if (!preferOpposite) sign *= -1;

            const angleDeg = this._rand(4, this.maxAngleDeg);
            const angle = sign * angleDeg * Math.PI / 180;

            const start = this.lastPlanned + gap;
            this.addTurn({ start, length, angle });
        }
    }

    pruneBefore(distance) {
        const keepFrom = Math.max(0, distance - 50);
        this.turns = this.turns.filter(t => t.end > keepFrom);
    }

    // Heading theta(s) = sum over turns of A * smoothstep(u) in segment
    getHeadingAt(s) {
        let theta = 0;
        for (const t of this.turns) {
            const ds = s - t.start;
            if (ds <= 0) continue;
            if (ds >= t.length) {
                theta += t.angle;
            } else {
                const u = ds / t.length;
                const smooth = u * u * (3 - 2 * u); // smoothstep
                theta += t.angle * smooth;
            }
        }
        return theta;
    }

    // Lateral offset x(s) ≈ ∫ theta(s) ds (small-angle approx)
    getOffsetAt(s) {
        let x = 0;
        for (const t of this.turns) {
            const ds = s - t.start;
            if (ds <= 0) continue;

            const L = t.length;
            if (ds < L) {
                const ds2 = ds * ds;
                const ds3 = ds2 * ds;
                const ds4 = ds3 * ds;
                x += t.angle * (ds3 / (L * L) - 0.5 * ds4 / (L * L * L));
            } else {
                x += t.angle * (ds - 0.5 * L);
            }
        }
        return x;
    }

    _rand(a, b) { return a + (b - a) * Math.random(); }
}

export class Road {
    constructor(scene) {
        this.scene = scene;
        this.roads = [];

        // Smaller length + more pieces = smoother curves
        this.roadLength = 10;
        this.roadWidth = 6.4;
        this.pieceCount = 12;
        this.widthSegments = 6;   // across width
        this.lengthSegments = 20; // along length

        // Curve/banking settings
        this.maxOffsetScale = 8;
        this.bankStrength = 0.6;
        this.maxBank = 0.35;

        // Built-in curves so you get turns by meters/km right away
        this.curves = new RoadCurvesManager();
        this.curves
            .addTurn({ start: this.curves.m(200),  length: this.curves.m(400), angleDeg:40 })   // gentle right after 300 m
            .addTurn({ start: this.curves.km(800), length: this.curves.m(900), angleDeg: -40 }); // gentle left after 1.2 km

        // Set true for endless random curves ahead
        this.autoPlanCurves = true;

        this.createRoads();
    }

    createRoads() {
        const roadTexture = new THREE.TextureLoader().load(roadDisplay);
        roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(10, 1);

        const roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.8,
            metalness: 0.2,
        });

        // Create multiple pieces we can bend per-vertex
        for (let i = 0; i < this.pieceCount; i++) {
            const geometry = new THREE.PlaneGeometry(
                this.roadWidth,
                this.roadLength,
                this.widthSegments,
                this.lengthSegments
            );

            // Store a copy of the base positions for deformation
            geometry.userData.basePositions = geometry.attributes.position.array.slice();

            const road = new THREE.Mesh(geometry, roadMaterial);
            road.rotation.x = -Math.PI / 2; // lay flat on XZ plane
            road.position.z = -i * this.roadLength;
            road.position.y = 0.01;         // avoid z-fighting
            road.frustumCulled = false;     // keep rendered when deformed

            this.scene.add(road);
            this.roads.push(road);
        }
    }

    // Easing used for legacy/fallback single-curve mode
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Lateral offset at a given absolute track distance
    getOffsetAt(distance, curves) {
        // Prefer curves manager API if available
        if (curves && typeof curves.getOffsetAt === 'function') {
            return curves.getOffsetAt(distance);
        }

        // Fallback to single active curve style (compat with your old curves object)
        const active = curves?.getActiveCurve?.(distance);
        if (!active) return 0;

        const t = THREE.MathUtils.clamp(
            (distance - active.start) / (active.end - active.start),
            0, 1
        );
        const eased = this.easeInOutQuad(t);
        return (active.intensity ?? 1) * this.maxOffsetScale * eased;
    }

    // Heading (tangent angle) at a given distance
    getHeadingAt(distance, curves) {
        if (curves && typeof curves.getHeadingAt === 'function') {
            return curves.getHeadingAt(distance);
        }
        // Fallback: finite difference on offset
        const step = this.roadLength * 0.5;
        const back = this.getOffsetAt(distance - step, curves);
        const front = this.getOffsetAt(distance + step, curves);
        return Math.atan2(front - back, 2 * step);
    }

    // Optional bank/tilt derived from heading
    getBankAt(distance, curves) {
        const heading = this.getHeadingAt(distance, curves);
        return THREE.MathUtils.clamp(heading * this.bankStrength, -this.maxBank, this.maxBank);
    }

    update(distanceThisFrame, totalDistance, curves = this.curves) {
        // Optional: auto-plan infinite road
        if (this.autoPlanCurves && curves && typeof curves.ensureAhead === 'function') {
            curves.ensureAhead(totalDistance, 2000);
            curves.pruneBefore?.(totalDistance - 50);
        }

        for (let i = 0; i < this.roads.length; i++) {
            const road = this.roads[i];

            // Scroll the strip forward
            road.position.z += distanceThisFrame;

            // Wrap when out of view
            if (road.position.z > this.roadLength) {
                road.position.z -= this.roadLength * this.roads.length;
            }

            // Center distance for this piece relative to the player
            const Dcenter = totalDistance + (-road.position.z);

            // Bend geometry per-vertex so strips connect smoothly
            const pos = road.geometry.attributes.position;
            const base = road.geometry.userData.basePositions;
            const count = pos.count;

            // For PlaneGeometry, local Y is along the "length" before rotation
            for (let v = 0; v < count; v++) {
                const idx = v * 3;
                const baseX = base[idx + 0];
                const baseY = base[idx + 1];
                const baseZ = base[idx + 2];

                // Distance along track for this vertex
                const Dv = Dcenter + baseY;

                // Lateral curve at this vertex
                const offsetX = this.getOffsetAt(Dv, curves);

                // Push vertex in X by the curve amount
                pos.array[idx + 0] = baseX + offsetX;
                pos.array[idx + 1] = baseY;
                pos.array[idx + 2] = baseZ;
            }

            pos.needsUpdate = true;
            road.geometry.computeVertexNormals();

            // Optional: add banking (tilt around forward axis)
            road.rotation.z = this.getBankAt(Dcenter, curves);
        }
    }
}