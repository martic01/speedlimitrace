import chopper from "../../assets/images/chopper.png"
import rocks from "../../assets/images/stop-rock.png"
import dropRocks from "../../assets/images/fall-rock.png"
import missile1 from "../../assets/images/missilest.png"
import missile2 from "../../assets/images/missiles2.png"
import roadBomb1 from "../../assets/images/tickbomb.png"
import roadBomb2 from "../../assets/images/ballbomb.png"
import explodeEffect from "../../assets/images/explosion.webp"
import weatherDay from "../../assets/images/weather/weather-day.webp"
import weatherNight from "../../assets/images/weather/weather-night.webp"
import weatherWind from "../../assets/images/weather/weather-wind.webp"
import weatherBright from "../../assets/images/weather/weather-bright.gif"
import weatherLigth from "../../assets/images/weather/weather-light.webp"
import weatherLigth2 from "../../assets/images/weather/weather-light2.webp"
import weatherLigth3 from "../../assets/images/weather/weather-light3.webp"
import weatherLigth4 from "../../assets/images/weather/weather-light4.webp"
import enviroment1 from "../../assets/images/enviroment/envirod1.jpg"
import enviroment2 from "../../assets/images/enviroment/envirod2.jpg"
import enviroment3 from "../../assets/images/enviroment/envirod3.jpg"
import enviroment4 from "../../assets/images/enviroment/envirod4.jpg"
import enviroment5 from "../../assets/images/enviroment/envirod5.jpg"
import enviroment6 from "../../assets/images/enviroment/envirod6.jpg"
import road1 from "../../assets/images/roads/road1.jpg"
import road2 from "../../assets/images/roads/road3.jpg"
import road3 from "../../assets/images/roads/road4.jpg"
import road4 from "../../assets/images/explosion.webp"
import road5 from "../../assets/images/animated-fire.gif"
import road6 from "../../assets/images/weather/weather-night.webp"
import driftWin from "../../assets/images/drift-win.webp"
import driftLose from "../../assets/images/drift-lose.webp"
import finish from "../../assets/images/finished.png"
import carBomb from "../../assets/images/carbomb.png"
import garage1 from "../../assets/images/garage.jpg"
import garage2 from "../../assets/images/dgarage.png"

// 3D
import redFrontView from "../../assets/images/model3D/frontviewr.png"
// sounds

import accelerate1Sound from "../../assets/audio/start1.mp3"
import accelerate2Sound from "../../assets/audio/start2.mp3"
import accelerate3Sound from "../../assets/audio/acce1.mp3"
import drivingSound from "../../assets/audio/driving.mp3"
import speedupSound from "../../assets/audio/speedup.mp3"
import brakeSound from "../../assets/audio/brake.mp3"
import honkSound from "../../assets/audio/honk.mp3"
import explodeSound from "../../assets/audio/explode.mp3"
import crashSound from "../../assets/audio/crash.mp3"
import lunchSound from "../../assets/audio/lunch.mp3"
import otherSound from "../../assets/audio/wtrack.mp3"
import gameSound1 from "../../assets/audio/gamesound1.mp3"
import gameSound2 from "../../assets/audio/gamesound2.mp3"


// 3D Files
import car3d1 from "../../assets/models/dodge.glb"
import car3d2 from "../../assets/models/dodge2.glb"
import car3d3 from "../../assets/models/car3d8.glb"
import car3d4 from "../../assets/models/car3d10.glb"
import car3d5 from "../../assets/models/car3d11.glb"
import car3d6 from "../../assets/models/car3d6.glb"
import car3d7 from "../../assets/models/car3d7.glb"
import car3d8 from "../../assets/models/lasttry2.glb"
import chopper3d from "../../assets/models/3Dhover_craft.glb"
import missile3d from "../../assets/models/3Dmissile.glb"
import building from "../../assets/models/city.glb"


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
    missile3d,
    building
}

const vechicles = {
    chopper,
    redFrontView
}

const enviromental = {
    enviroment1,
    enviroment2,
    enviroment3,
    enviroment4,
    enviroment5,
    enviroment6
}

const weathers = {
    weatherDay,
    weatherNight,
    weatherWind,
    weatherBright,
    weatherLigth,
    weatherLigth2,
    weatherLigth3,
    weatherLigth4,
}

const obstacles = {
    rocks,
    dropRocks,
    missile1,
    missile2,
    roadBomb1,
    roadBomb2,
    carBomb,
    explodeEffect
}

const tracks = {
    road1,
    road2,
    road3,
    road4,
    road5,
    road6,
}

const model3D = {
    redFrontView,
}

const garages = {
    garage1,
    garage2
}

const final = {
    driftWin,
    driftLose,
    finish,
}
// sounds

const sounds = {
    accelerate1Sound,
    accelerate2Sound,
    accelerate3Sound,
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


export {
    vechicles,
    vechicles3D,
    weathers,
    enviromental,
    final,
    obstacles,
    tracks,
    model3D,
    sounds,
    garages
}