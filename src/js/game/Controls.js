import { startAcc, driving, brake, raiseAcc, speedUp, stopAll, honk, stopMusic } from "../sounds";

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

        // Sound management
        this.currentEngineSound = null;
        this.lastSpeedState = 'stopped'; // 'stopped', 'low', 'medium', 'high'
        this.isHonking = false;
        this.honkTimeout = null;
        this.brakeSoundPlaying = false;
        this.brakeSoundInstance = null;

        this.setupEventListeners();
    }

    stopCurrentEngineSound() {
        if (this.currentEngineSound) {
            try {
                stopMusic(this.currentEngineSound);
            } catch (e) {
                console.warn("⚠️ stopMusic failed:", e);
            }
            this.currentEngineSound = null;
        }
    }

    updateSoundBasedOnSpeed() {
        if (!this.game || this.game.raceFinished || this.game.tumbleSystem.isActive()) return;

        const speed = this.game.speed;
        let newState = 'stopped';

        if (speed >= 0.1) newState = 'high';
        if (speed > 0.01 && speed < 0.1) newState = 'low';

        if (newState === this.lastSpeedState) return;

        console.log(`🎧 Speed=${speed.toFixed(2)} | State=${this.lastSpeedState} → ${newState}`);

        this.stopCurrentEngineSound();

        switch (newState) {
            case 'low': this.currentEngineSound = raiseAcc(); break;
            case 'high': this.currentEngineSound = speedUp(); break;
            case 'stopped': stopMusic(this.currentEngineSound); break;
        }

        this.lastSpeedState = newState;
    }

    playBrakeSoundUntilStop() {
        if (this.brakeSoundPlaying) return;

        this.brakeSoundPlaying = true;
        this.stopCurrentEngineSound();

        this.brakeSoundInstance = brake();

        const checkStop = () => {
            if (this.game.speed <= 0.01 || !this.brakeSoundPlaying || this.game.raceFinished) {
                this.brakeSoundPlaying = false;
                this.brakeSoundInstance = null;
                this.lastSpeedState = '';
                this.updateSoundBasedOnSpeed();
            } else {
                setTimeout(checkStop, 100);
            }
        };

        checkStop();
    }

    handleKeyDown(e) {
        const { tumbleSystem, raceFinished } = this.game;

        if (e.key === 'ArrowUp' && !raceFinished && !tumbleSystem.isActive()) {
            this.upPressed = true;
            stopMusic(this.brakeSoundInstance);
            if (this.game.speed <= 0.01 && !this.currentEngineSound && !this.brakeSoundPlaying) {
                this.stopCurrentEngineSound();
                this.currentEngineSound = startAcc();
                this.lastSpeedState = 'low';
            }
        }

        if (e.key === 'ArrowDown') {
            this.downPressed = true;

        }

        if (this.game.speed > 0.01 && !raceFinished && !tumbleSystem.isActive()) {
            if (e.key === 'ArrowLeft') this.leftPressed = true;
            if (e.key === 'ArrowRight') this.rightPressed = true;
        }

        if (e.key === 'b' && !this.braking && !tumbleSystem.isActive()) {
            this.braking = true;
            this.playBrakeSoundUntilStop();

            this.brakeTimeout = setTimeout(() => {
                if (this.game.speed > this.game.tumbleSystem.tumbleThreshold) {
                    this.game.tumbleSystem.startTumble();
                    this.stopCurrentEngineSound();
                    this.brakeSoundPlaying = false;
                } else {
                    this.game.speed = 0;
                    stopMusic(this.brakeSoundInstance);
                    this.brakeSoundPlaying = false;
                    this.lastSpeedState = '';
                    this.updateSoundBasedOnSpeed();
                }
            }, 700);
        }

        if (e.key === 'h' && !this.isHonking) {
            this.isHonking = true;
            this.stopCurrentEngineSound();

            honk();

            this.honkTimeout = setTimeout(() => {
                this.isHonking = false;
                this.lastSpeedState = '';
                this.updateSoundBasedOnSpeed();
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

    update() {
        this.updateSoundBasedOnSpeed();
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
        this.isHonking = false;
        this.brakeSoundPlaying = false;

        this.stopCurrentEngineSound();
        this.lastSpeedState = 'stopped';

        clearTimeout(this.brakeTimeout);
        clearTimeout(this.honkTimeout);
    }
}

export default Controls;
