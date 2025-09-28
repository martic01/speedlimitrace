import { sounds } from "../constants/material";


const mutebtn = document.querySelector('.mutebtn');
let muted = false;
let sound;
let Rtime;


let activeSounds = [];


function register(audio) {
    activeSounds.push(audio);
    return audio;
}



const stopMusic = (s) => {
    if (!s) return;
    if (Array.isArray(s)) {
        s.forEach(x => {
            x.pause();
            x.currentTime = 0;
        });
    } else {
        s.pause();
        s.currentTime = 0;
    }
};

const stopAll = () => {
    activeSounds.forEach(a => stopMusic(a));
    activeSounds = [];
};

const gameMusic = () => {
    const music1 = register(new Audio(sounds.gameSound1));
    const music2 = register(new Audio(sounds.gameSound2));

    music1.play().catch(err => console.error("gamemusic", err));

    music1.addEventListener("ended", () => {
        music2.play().catch(err => console.error("gamemusic", err));
    });

    music2.addEventListener("ended", () => {
        music1.play().catch(err => console.error("gamemusic", err));
    });

    return [music1, music2];
};

const startAcc = () => {
    const start = register(new Audio(sounds.accelerate1Sound));
    start.loop = true;
    start.play().catch(err => console.log("Playback prevented:", err));
    return start;
};

const driving = () => {
    const drive = register(new Audio(sounds.drivingSound));
    drive.loop = true;
    drive.play().catch(err => console.log("Playback prevented:", err));
    return drive;
};
const speedUp = () => {
    const speed = register(new Audio(sounds.speedupSound));
    speed.play().catch(err => console.error("Playback prevented:", err));
    return speed;
}
const honk = () => {
    const horn = register(new Audio(sounds.honkSound));
    horn.play().catch(err => console.error("Playback prevented:", err));
    return horn;
}
const brake = () => {
    const stop = register(new Audio(sounds.brakeSound));
    stop.play().catch(err => console.error("Playback prevented:", err));
    return stop;
}

const blasted = (time) => {
    const lunch = register(new Audio(sounds.lunchSound));
    const exploded = register(new Audio(sounds.explodeSound));

    clearTimeout(Rtime);

    lunch.play().catch(err => console.error("Playback prevented:", err));

    Rtime = setTimeout(() => {
        stopMusic(lunch)
        exploded.play().catch(err => console.error("check", err));
    }, time);

    return [lunch, exploded];
};

const crash = () => {
    const crashSound = register(new Audio(sounds.crashSound));
    crashSound.play().catch(err => console.error("Playback prevented:", err));
    return crashSound;
}


const firstSound = (time) => {
    const start = register(new Audio(sounds.accelerate2Sound));
    const speed = register(new Audio(sounds.speedupSound));

    clearTimeout(Rtime);

    start.play().catch(err => console.error("Playback prevented:", err));

    Rtime = setTimeout(() => {
        stopMusic(start)
        speed.loop = true;
        speed.play().catch(err => console.error("check", err));
    }, time);

    return [start, speed];
};



function stopSound() {
    if (!muted) {
        muted = true;
        mutebtn.textContent = "Unmute sound";
        stopAll(); // stop everything
    } else {
        muted = false;
        mutebtn.textContent = "Mute sound";
        sound = gameMusic(); // resume background music
    }
}



export { stopMusic, stopAll, firstSound, startAcc, driving, gameMusic, blasted, crash, honk, brake, speedUp, stopSound };
