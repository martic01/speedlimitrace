import whiteCar1 from "../../assets/images/game-car.png"
import whiteCar2 from "../../assets/images/game-car2.png"
import whiteCarFV from "../../assets/images/game-carFV.png"
import blackCar from "../../assets/images/game-carB3.png"
import blackCarFV from "../../assets/images/game-carBFV.png"
import chopper from "../../assets/images/chopper.png"
import weatherDay from "../../assets/images/weather-day.webp"
import weatherNight from "../../assets/images/weather-night.webp"
import rocks from "../../assets/images/stop-rock.png"
import dropRocks from "../../assets/images/fall-rock.png"
import missile1 from "../../assets/images/missilest.png"
import missile2 from "../../assets/images/missiles2.png"
import roadBomb1 from "../../assets/images/tickbomb.png"
import roadBomb2 from "../../assets/images/ballbomb.png"
import explodeEffect from "../../assets/images/explosion.webp"
import road from "../../assets/images/road-yellow-lane.png"
import driftWin from "../../assets/images/drift-win.webp"
import driftLose from "../../assets/images/drift-lose.webp"
import finish from "../../assets/images/finished.png"
import carBomb from "../../assets/images/carbomb.png"
import rightMountain from "../../assets/images/rightmountain.png"
import leftMountain from "../../assets/images/leftmountain.png"
import extraMountain from "../../assets/images/extramountain.png"
import garage1 from "../../assets/images/garage.jpg"
import garage2 from "../../assets/images/dgarage.png"

// 3D

import whiteFrontView from "../../assets/images/model3D/frontvieww.png"
import whiteBackView from "../../assets/images/model3D/backvieww.png"
import whiteSideView from "../../assets/images/model3D/sideviewlw.png"
import whiteTopView from "../../assets/images/model3D/topvieww.png"

import blackFrontView from "../../assets/images/model3D/frontviewb.png"
import blackBackView from "../../assets/images/model3D/backviewb.png"
import blackSideView from "../../assets/images/model3D/sideviewlb.png"
import blackTopView from "../../assets/images/model3D/topviewb.png"

import redFrontView from "../../assets/images/model3D/frontviewr.png"
import redBackView from "../../assets/images/model3D/backviewr.png"
import redSideView from "../../assets/images/model3D/sideviewlr.png"
import redTopView from "../../assets/images/model3D/topviewr.png"

// sounds

import accelerate1Sound from "../../assets/sounds/start1.mp3"
import accelerate2Sound from "../../assets/sounds/start2.mp3"
import drivingSound from "../../assets/sounds/driving.mp3"
import speedupSound from "../../assets/sounds/speedup.mp3"
import brakeSound from "../../assets/sounds/brake.mp3"
import honkSound from "../../assets/sounds/honk.mp3"
import explodeSound from "../../assets/sounds/explode.mp3"
import crashSound from "../../assets/sounds/crash.mp3"
import lunchSound from "../../assets/sounds/lunch.mp3"
import otherSound from "../../assets/sounds/wtrack.mp3"
import gameSound1 from "../../assets/sounds/gamesound1.mp3"
import gameSound2 from "../../assets/sounds/gamesound2.mp3"




const vechicles = {
    whiteCar1,
    whiteCar2,
    whiteCarFV,
    blackCar,
    blackCarFV,
    chopper
}
const weathers = {
    weatherDay,
    weatherNight
}
const obstacles = {
    rocks,
    dropRocks,
    missile1,
    missile2,
    roadBomb1,
    roadBomb2,
    carBomb,
    rightMountain,
    leftMountain,
    extraMountain,
    explodeEffect
}
const tracks = {
    road,
    driftWin,
    driftLose,
    finish,
}

const model3D = {
    whiteFrontView,
    whiteBackView,
    whiteSideView,
    whiteTopView,

    blackFrontView,
    blackBackView,
    blackSideView,
    blackTopView,

    redFrontView,
    redBackView,
    redSideView,
    redTopView,
}

const garages = {
    garage1,
    garage2
}
// sounds

const sounds = {
    accelerate1Sound,
    accelerate2Sound,
    drivingSound,
    speedupSound,
    brakeSound,
    honkSound,
    explodeSound,
    lunchSound,
    otherSound,
    gameSound1,
    gameSound2,
    crashSound,
}


export { vechicles, weathers, obstacles, tracks, model3D, sounds, garages }