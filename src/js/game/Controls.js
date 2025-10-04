export class Controls {
    constructor(game) {
        this.game = game;
        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.braking = false;
        this.brakeTimeout = null;
        this.currentLane = 1;
        
        this.setupEventListeners();
    }

    handleKeyDown(e) {
        const { tumbleSystem, raceFinished } = this.game;
        
        if (e.key === 'ArrowUp' && !raceFinished && !tumbleSystem.isActive()) {
            this.upPressed = true;
        }
        if (e.key === 'ArrowDown') {
            this.downPressed = true;
        }
        if (this.game.speed > 0.01 && !raceFinished && !tumbleSystem.isActive()) { // Use this.game.speed
            if (e.key === 'ArrowLeft') {
                this.leftPressed = true;
                console.log("Left arrow pressed - current lane:", this.currentLane);
            }
            if (e.key === 'ArrowRight') {
                this.rightPressed = true;
                console.log("Right arrow pressed - current lane:", this.currentLane);
            }
        }
        if (e.key === 'b' && !this.braking && !tumbleSystem.isActive()) {
            this.braking = true;
            this.brakeTimeout = setTimeout(() => {
                if (this.game.speed > this.game.tumbleSystem.tumbleThreshold) { // Use this.game.speed
                    this.game.tumbleSystem.startTumble();
                } else {
                    this.game.speed = 0;
                }
            }, 1000);
        }
    }

    handleKeyUp(e) {
        if (e.key === 'ArrowUp') this.upPressed = false;
        if (e.key === 'ArrowDown') this.downPressed = false;
        if (e.key === 'ArrowLeft') this.leftPressed = false;
        if (e.key === 'ArrowRight') this.rightPressed = false;
        if (e.key === 'b') {
            this.braking = false;
            clearTimeout(this.brakeTimeout);
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    reset() {
        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.braking = false;
        this.currentLane = 1;
        clearTimeout(this.brakeTimeout);
    }
}

export default Controls;