import { model3D, garages } from "../constants/material"
import { stopMusic, startAcc } from "./sounds";


const changeCar = document.querySelector('.change');
const car = document.querySelector('.car');
const carInfo = document.querySelector('.carinfo');
const carName = document.querySelector('.name');
const speed = document.querySelector('.sp');
const acceleration = document.querySelector('.ac');
const handling = document.querySelector('.hn');
const selecttxt = document.querySelector('.selecttxt');
const garage = document.querySelector('.garage');
const Selectbtn = document.querySelector('.selectbtn');



const garageVechicles = [
    {
        id: '1ag',
        name: 'Fast time',
        frontView: model3D.whiteFrontView,
        backView: model3D.whiteBackView,
        speed: '100km/h',
        acceleration: '8m/s²',
        handling: 'Meduim',
        selected: true,
    },
    {
        id: '2bg',
        name: 'Blaze strike',
        frontView: model3D.redFrontView,
        backView: model3D.redBackView,
        speed: '120km/h',
        acceleration: '10m/s²',
        handling: 'Good',
        selected: false,
    },
    {
        id: '3cg',
        name: 'Flame runner',
        frontView: model3D.blackFrontView,
        backView: model3D.blackBackView,
        speed: '120km/h',
        acceleration: '10m/s²',
        handling: 'pro',
        selected: false,
    },
]

const garageBackgrounds = [
    {
        id: '1bg',
        name: 'Garage 1',
        image: garages.garage1,
        selected: true,
    },
    {
        id: '2bg',
        name: 'Garage 2',
        image: garages.garage2,
        selected: false,
    },
]

function selectGarage() {
    const g = [...garageBackgrounds]
    g.forEach(s => {
        s.selected ? s.selected = false : s.selected = true;
    })
    g.forEach(gb => {
        if (gb.selected) {
            garage.style.backgroundImage = `url(${gb.image})`
        }
    });

    
    carInfo.style.animation = 'none';
    car.style.animation = 'none';
    void carInfo.offsetWidth;
    void car.offsetWidth;

    carInfo.style.animation = 'slideIn2 1s linear forwards'
    car.style.animation = 'slideIn 1s linear forwards'
}

function garageSelect() {
    const v = [...garageVechicles]
    const switchsound = startAcc();
    v.forEach(c => {
        if (c.selected) {
            carInfo.style.animation = 'slideIn2 1s linear forwards'
            car.style.animation = 'slideIn 1s linear forwards'
            car.style.backgroundImage = `url(${c.frontView})`
            carName.textContent = c.name
            speed.textContent = c.speed
            acceleration.textContent = c.acceleration
            handling.textContent = c.handling
            selecttxt.textContent = 'Selected'
        }
    })

    changeCar.style.pointerEvents = 'none'
    setTimeout(() => {
        stopMusic(switchsound)
        changeCar.style.pointerEvents = 'auto'
    }, 2800);
}


let count = 0;
function changeSelection() {
    const switchsound = startAcc();
    const v = garageVechicles;
    const line = v.length;

    count = (count + 1) % line;
    const choose = count;

    carInfo.style.animation = 'none';
    car.style.animation = 'none';
    void carInfo.offsetWidth;
    void car.offsetWidth;

    carInfo.style.animation = 'slideIn2 1s linear forwards';
    car.style.animation = 'slideIn 1s linear forwards';
    changeCar.style.pointerEvents = 'none'
    setTimeout(() => {
        stopMusic(switchsound)
        changeCar.style.pointerEvents = 'auto'
    }, 2800);

    car.style.backgroundImage = `url(${v[choose].frontView})`;
    carName.textContent = v[choose].name;
    speed.textContent = v[choose].speed;
    acceleration.textContent = v[choose].acceleration;
    handling.textContent = v[choose].handling;
    selecttxt.textContent = v[choose].selected ? 'Selected' : 'Select';
}

export { garageSelect, changeSelection, selectGarage, garageVechicles };