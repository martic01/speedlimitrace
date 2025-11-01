import { weathers, tracks, enviromental, vechicles3D } from "../../constants/material";
import { startNewGame, setRaceDistance } from ".";
import { selectedCar } from "../garage"; // if needed


const x = (sel) => document.querySelector(sel);
const x2 = (sel) => document.querySelectorAll(sel);

const mod = x2('.mod');
const enviroDisplay = x('.sky');
const weatherDisplay = x('.we');



let roadDisplay;

// Unique preload cache (URL -> Promise)
const imageCache = new Map();

function preloadImage(url) {
  if (!url) return Promise.resolve();
  if (imageCache.has(url)) return imageCache.get(url);

  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    // Use decode() when possible for faster paint
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = url;

    if (img.decode) {
      img.decode().then(done).catch(done);
    }
  });

  imageCache.set(url, p);
  return p;
}

// Preload all assets for a mode
function preloadModeAssets(mode) {
  if (!mode) return Promise.resolve();
  const urls = [
    mode.enviro,
    mode.weather,
    mode.track // warming the HTTP cache; TextureLoader will benefit later
  ].filter(Boolean);
  return Promise.all(urls.map(preloadImage)).then(() => { });
}

// All modes use the same key: "enviro"
const modes = [
  {
    id: "ma1",
    name: "Calm Drive",
    obstacles: false,
    obstaclesSpawnLev: 1,
    weather: weathers.weatherDay,
    chopper: null,
    track: tracks.road1,
    enviro: enviromental.enviroment1,
    minSpeed: 0,
    maxSpeed: 0,
    time: 80,
    distance: 1,
    carRequirement: 200,
    gems: 200,
    Exp: 20,
    rate: 0,
    lastMessage: "Enjoy the calm drive!",
  },
  {
    id: "mb2",
    name: "Move On",
    obstacles: false,
    obstaclesSpawnLev: 2,
    weather: weathers.weatherNight,
    track: tracks.road3,
    chopper: null,
    enviro: enviromental.enviroment5,
    minSpeed: 0,
    maxSpeed: 0,
    time: 80,
    distance: 3,
    carRequirement: 300,
    gems: 400,
    Exp: 40,
    rate: 0,
    lastMessage: "Enjoy the calm drive!",
  },
  {
    id: "mc3",
    name: "Scared Wave",
    obstacles: false,
    obstaclesSpawnLev: 1,
    weather: weathers.weatherLigth,
    track: tracks.road6,
    chopper: vechicles3D.chopper3d,
    enviro: enviromental.enviroment3,
    minSpeed: 400,
    maxSpeed: 500,
    time: 80,
    distance: 6,
    carRequirement: 400,
    gems: 700,
    Exp: 50,
    rate: 0,
    lastMessage: "Enjoy the calm drive!",
  },
  {
    id: "m4d",
    name: "Time Check",
    obstacles: false,
    obstaclesSpawnLev: 1,
    weather: weathers.weatherNight,
    track: tracks.road5,
    chopper: vechicles3D.chopper3d,
    enviro: enviromental.enviroment4,
    minSpeed: 600,
    maxSpeed: 700,
    time: 60,
    distance: 7,
    carRequirement: 700,
    gems: 1000,
    Exp: 100,
    rate: 0,
    lastMessage: "Enjoy the calm drive!",
  },
  {
    id: "m5e",
    name: "Scared Wave",
    obstacles: false,
    obstaclesSpawnLev: 1,
    weather: weathers.weatherLigth3,
    track: tracks.road6,
    chopper: vechicles3D.chopper3d,
    enviro: enviromental.enviroment5,
    minSpeed: 700,
    maxSpeed: 800,
    time: 60,
    distance: 6,
    carRequirement: 800,
    gems: 1000,
    Exp: 100,
    rate: 0,
    lastMessage: "Enjoy the calm drive!",
  },
];

// Attach mode ids and indices to buttons safely
function tieId() {
  mod.forEach((btn, idx) => {
    const mode = modes[idx];
    if (!mode) return;
    btn.id = mode.id;
    btn.dataset.modeIndex = String(idx);
  });
}

// Apply mode visuals + track before starting the game (waits for decode)
async function applyMode(mode) {
  if (!mode) return;

  // Warm assets for this mode first
  await preloadModeAssets(mode);

  // Update environment background
  if (enviroDisplay && mode.enviro) {
    enviroDisplay.style.backgroundImage = `url(${mode.enviro})`;
    enviroDisplay.style.backgroundSize = 'cover';
    enviroDisplay.style.backgroundPosition = 'center';
    enviroDisplay.style.backgroundRepeat = 'no-repeat';
  }

  // Update weather overlay/background
  if (weatherDisplay && mode.weather) {
    weatherDisplay.style.backgroundImage = `url(${mode.weather})`;
    weatherDisplay.style.backgroundSize = 'cover';
    weatherDisplay.style.backgroundPosition = 'center';
    weatherDisplay.style.backgroundRepeat = 'no-repeat';
  }

  // Track for the Road; export is a live binding
  roadDisplay = mode.track;

  // Distance for the race (if your start reads it later, set it now)
  if (typeof setRaceDistance === 'function') {
    setRaceDistance(mode.distance ?? 1);
  }
}

function getModeById(id) {
  return modes.find(m => m.id === id) || null;
}


function initMode() {
  tieId();

  // Preload on hover/focus (anticipatory)
  mod.forEach((btn, idx) => {
    const mode = modes[idx];
    if (!mode) return;

    const warm = () => preloadModeAssets(mode);
    btn.addEventListener('pointerenter', warm, { passive: true });
    btn.addEventListener('focus', warm, { passive: true });
    btn.addEventListener('mouseenter', warm, { passive: true }); // fallback
  });


  // Bind clicks once
  let timegame;
  mod.forEach((btn) => {
    clearInterval(timegame)
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.modeIndex);
      const mode = Number.isFinite(idx) ? modes[idx] : getModeById(btn.id);
      const needSpeed = selectedCar.maxSpeed * 1000
      const modeSpeed = mode.carRequirement
      if (!mode || needSpeed < modeSpeed) {
        alert('invadild speed ' + needSpeed + ' to ' + modeSpeed)
        return;
      }
      // 1) Apply mode first so backgrounds/track are decoded and ready
      await applyMode(mode);

      // 2) Swap to game screen



      // 3) Start game after mode is applied
      if (typeof startNewGame === 'function') {
        timegame = setTimeout(() => {
          startNewGame();
        }, 5000);

      }
    });
  });

  // Warm all assets during idle time (best-effort, non-blocking)
  const idle = window.requestIdleCallback || function (cb) { setTimeout(() => cb({ timeRemaining: () => 0 }), 300); };
  idle(() => {
    const urls = new Set();
    modes.forEach(m => {
      if (m.enviro) urls.add(m.enviro);
      if (m.weather) urls.add(m.weather);
      if (m.track) urls.add(m.track);
    });
    [...urls].forEach(u => preloadImage(u));
  });
}

// Auto-init or export and call later
initMode();

export { initMode, roadDisplay };