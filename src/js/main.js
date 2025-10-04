import "../css/style.css";
import { load } from "./animate"
import { stopMusic, firstSound, gameMusic, stopSound } from "./sounds";
import { garageSelect, changeSelection, selectGarage } from "./garage"
import { startGame } from './game/index.js';
// import { startCarGame, setRaceLength } from "./car.js";
// Start a longer race

const game = new startGame('.road', 1);



let sound;
const loader = document.querySelector('.loaderpg');
const welcome = document.querySelector('.welcomepg');
const login = document.querySelector('.loginbtn');
const loginpg = document.querySelector('.login');
const startbtn = document.querySelectorAll('.startbtn');
const mutebtn = document.querySelector('.mutebtn');
const backbtn = document.querySelectorAll('.backbtn');
const garagesw = document.querySelector('.garagesw')
const garagebtn = document.querySelector('.garagebtn');
const screen = document.querySelectorAll('.screen');
const garagepg = document.querySelector('.garagepg');
const gamepg = document.querySelector('.gamepg');
const changeCar = document.querySelector('.change');


// special

export { game };


// Export individual functions for external use
export function setTumbleSettings(settings) {
    game.setTumbleSettings(settings);
}

export function addCurve(start, end, intensity) {
    game.addCurve(start, end, intensity);
}

export function resetGame() {
    game.reset();
}

export const FINISH_LINE_TYPES = {
    CLASSIC: 'classic',
    MODERN: 'modern',
    RACING: 'racing',
    CHECKERED: 'checkered'
};



// just add


function intializeGarage() {
    garagepg.style.display = 'block';
    setTimeout(() => {
        garagepg.style.display = 'none';
    }, 10);
}



login.addEventListener('click', () => {
    loginpg.style.display = 'none';

    if (!sound) {
        sound = firstSound(3000);
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
    screen.forEach(s => s.style.display = 'none')
    garagepg.style.display = 'block';
    garageSelect();
});

// loop

startbtn.forEach((b) => {
    b.addEventListener('click', () => {
        screen.forEach(s => s.style.display = 'none')
        gamepg.style.display = 'block';
    });
});

backbtn.forEach((b) => {
    b.addEventListener('click', () => {
        screen.forEach(s => s.style.display = 'none')
        welcome.style.display = 'block';
    });
});

// simple

garagesw.addEventListener('click', selectGarage)
mutebtn.addEventListener('click', stopSound);
changeCar.addEventListener('click', changeSelection);

// initiallization
intializeGarage()
// setRaceLength(20); // 20 segments = longer race
// startCarGame();



// If you need to add curves
game.curves.addCurve(100, 200, 0.02);

// If you need to change tumble settings
game.tumbleSystem.setTumbleSettings({ duration: 1500 });










