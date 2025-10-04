export class Curves {
    constructor() {
        this.curves = [
            { start: 200, end: 700, intensity: 0.01 },
            { start: 600, end: 900, intensity: -0.01 },
            { start: 1200, end: 2000, intensity: 0.02 },
            { start: 1800, end: 3000, intensity: -0.02 }
        ];
        this.currentIntensity = 0;
        this.curveStartDistance = 0;
        this.curveEndDistance = 0;
        this.totalDistance = 0; // Add this line to store total distance
    }

    update(totalDistance) {
        this.totalDistance = totalDistance; // Store the total distance for use in getCurveOffset()
        
        const activeCurve = this.curves.find(curve =>
            totalDistance >= curve.start && totalDistance <= curve.end
        );

        if (activeCurve) {
            this.currentIntensity = activeCurve.intensity;
            this.curveStartDistance = activeCurve.start;
            this.curveEndDistance = activeCurve.end;
        } else {
            this.currentIntensity = 0;
            this.curveStartDistance = 0;
            this.curveEndDistance = 0;
        }
    }

    getCurveOffset() {
        if (this.currentIntensity === 0) return 0;

        // Make sure we have valid curve data
        if (this.curveEndDistance <= this.curveStartDistance) return 0;

        const curveProgress = (this.totalDistance - this.curveStartDistance) / 
                            (this.curveEndDistance - this.curveStartDistance);

        // Clamp progress between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, curveProgress));

        const easedProgress = clampedProgress < 0.5 ?
            2 * clampedProgress * clampedProgress :
            1 - Math.pow(-2 * clampedProgress + 2, 2) / 2;

        return this.currentIntensity * 10 * easedProgress;
    }

    getActiveCurve(segmentDistance) {
        return this.curves.find(curve =>
            segmentDistance >= curve.start && segmentDistance <= curve.end
        );
    }

    addCurve(startDistance, endDistance, intensity) {
        this.curves.push({ start: startDistance, end: endDistance, intensity });
        console.log(`🔄 Added curve: ${startDistance}-${endDistance}m, intensity: ${intensity}`);
    }

    clearCurves() {
        this.curves.length = 0;
        console.log("🔄 All curves cleared");
    }

    reset() {
        this.currentIntensity = 0;
        this.curveStartDistance = 0;
        this.curveEndDistance = 0;
        this.totalDistance = 0; // Also reset totalDistance
    }
}

export default Curves;