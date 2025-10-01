
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

import accelerate1Sound from "../../assets/audio/start1.mp3"
import accelerate2Sound from "../../assets/audio/start2.mp3"
import drivingSound from "../../assets/audio/driving.mp3"
import speedupSound from "../../assets/audio/speedup.mp3"
import brakeSound from "../../assets/audio/brake.mp3"
import honkSound from "../../assets/audio/honk.mp3"
import explodeSound from "../../assets/audio/explode.mp3"
import crashSound from "../../assets/audio/crash.mp3"
import lunchSound from "../../assets/audio/lunch.mp3"
import otherSound from "../../assets/audio/wtrack.mp3"
import gameSound2 from "../../assets/audio/gamesound1.mp3"
import gameSound1 from "../../assets/audio/gamesound2.mp3"


// 3D Files
import car3d1 from "../../assets/models/dodge.glb"
import car3d2 from "../../assets/models/dodge2.glb"
import car3d3 from "../../assets/models/car3d8.glb"
import car3d4 from  "../../assets/models/ferrari.glb" 
import car3d5 from "../../assets/models/car3d11.glb"
import car3d6 from "../../assets/models/car3d6.glb"
import car3d7 from "../../assets/models/car3d7.glb"
import car3d8 from "../../assets/models/car3d10.glb"
import chopper3d from "../../assets/models/3Dhover_craft.glb"
import missile3d from "../../assets/models/3Dmissile.glb"


const vechicles3D = {
    car3d1,
    car3d2,
    car3d3,
    car3d4,
    car3d5,
    car3d6,
    car3d7,
    car3d8,
    chopper3d,
    missile3d
}

const vechicles = {
    chopper,
    redFrontView
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


export { vechicles,vechicles3D, weathers, obstacles, tracks, model3D, sounds, garages }