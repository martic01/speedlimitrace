import "../css/style.css";
import { load } from "./animate"
import { stopMusic, firstSound, gameMusic, stopSound, stopAll } from "./sounds";
import { garageInit } from "./garage"
import { startNewGame, setRaceDistance, resetGame } from './game/index.js';

let sound;

const loader = document.querySelector('.loaderpg');
const welcome = document.querySelector('.welcomepg');
const login = document.querySelector('.loginbtn');
const loginpg = document.querySelector('.login');
const startbtn = document.querySelectorAll('.startbtn');
const mutebtn = document.querySelector('.mutebtn');
const backbtn = document.querySelectorAll('.backbtn');
const garagebtn = document.querySelector('.garagebtn');
const screen = document.querySelectorAll('.screen');
const garagepg = document.querySelector('.garagepg');
const gamepg = document.querySelector('.gamepg');



function preLoadGarage() {
    garagepg.style.display = 'block';
    setTimeout(() => {
        garagepg.style.display = 'none';
    }, 10);
}

login.addEventListener('click', () => {
    loginpg.style.display = 'none';
    stopAll()
    if (!sound) {
        sound = firstSound(3000, 8400);
    }

    setTimeout(() => {
        const interval = setInterval(() => {
            const { loaded } = load();
            if (loaded) {
                clearInterval(interval);
                welcome.style.display = 'block';
                loader.style.display = 'none';
                stopMusic(sound);
                sound = gameMusic();
            }
        }, 100);
    }, 2990);
});

garagebtn.addEventListener('click', () => {
    screen.forEach(s => s.style.display = 'none');
    garagepg.style.display = 'block';
    garageInit();
});

// Start game buttons
startbtn.forEach((b) => {
    b.addEventListener('click', () => {
        setRaceDistance(2.0)
        startNewGame();
        stopAll()
    });
});

backbtn.forEach((b, index) => {
    b.addEventListener('click', () => {
        screen.forEach(s => s.style.display = 'none');
        welcome.style.display = 'block';
        console.log(index);

        if (index === 1) {
            stopAll()
            resetGame()
            sound = gameMusic()
        }

    });
});

mutebtn.addEventListener('click', stopSound);

// Initialize
stopAll()
preLoadGarage();
garageInit()
setRaceDistance(1.0)
startNewGame();


