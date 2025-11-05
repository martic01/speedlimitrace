import { weathers, tracks, enviromental, vechicles3D } from "../../constants/material";
import { startNewGame, setRaceDistance } from ".";
import { selectedCar } from "../garage";

const x  = (sel) => document.querySelector(sel);
const x2 = (sel) => document.querySelectorAll(sel);

const mod            = x2('.mod');
const enviroDisplay  = x('.sky');
const weatherDisplay = x('.we');
const timestamp      = x('.timestamp');

let roadDisplay;

// -------------------- Preload helpers --------------------
const imageCache = new Map();

function preloadImage(url) {
  if (!url) return Promise.resolve();
  if (imageCache.has(url)) return imageCache.get(url);

  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = url;
    if (img.decode) img.decode().then(done).catch(done);
  });

  imageCache.set(url, p);
  return p;
}

function preloadModeAssets(mode) {
  if (!mode) return Promise.resolve();
  const urls = [ mode.enviro, mode.weather, mode.track ].filter(Boolean);
  return Promise.all(urls.map(preloadImage)).then(() => {});
}

// -------------------- Modes --------------------
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
    time: 23,     // seconds
    distance: 1,  // km
    carRequirement: 200, // km/h
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

// -------------------- UI helpers --------------------
function tieId() {
  mod.forEach((btn, idx) => {
    const mode = modes[idx];
    if (!mode) return;
    btn.id = mode.id;
    btn.dataset.modeIndex = String(idx);
  });
}

async function applyMode(mode) {
  if (!mode) return;
  await preloadModeAssets(mode);

  if (enviroDisplay && mode.enviro) {
    enviroDisplay.style.backgroundImage = `url(${mode.enviro})`;
    enviroDisplay.style.backgroundSize = 'cover';
    enviroDisplay.style.backgroundPosition = 'center';
    enviroDisplay.style.backgroundRepeat = 'no-repeat';
  }

  if (weatherDisplay && mode.weather) {
    weatherDisplay.style.backgroundImage = `url(${mode.weather})`;
    weatherDisplay.style.backgroundSize = 'cover';
    weatherDisplay.style.backgroundPosition = 'center';
    weatherDisplay.style.backgroundRepeat = 'no-repeat';
  }

  roadDisplay = mode.track;
  if (typeof setRaceDistance === 'function') {
    setRaceDistance(mode.distance ?? 1);
  }
}

function getModeById(id) {
  return modes.find(m => m.id === id) || null;
}

// -------------------- Timer controller (Boolean API) --------------------
const timer = {
  durationSec: 60,
  remainingSec: 60,
  running: false,
  endTs: 0,
  timeoutId: null,
  onEnd: null,
};

function setTimestampDisplay(sec) {
  if (!timestamp) return;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  timestamp.textContent = `${m}:${s.toString().padStart(2, '0')}s`;
  if (sec <= 20){ 
    timestamp.classList.add('warn');
  }else {
    timestamp.classList.remove('warn');
  }
}

function clearTimerTimeout() {
  if (timer.timeoutId) {
    clearTimeout(timer.timeoutId);
    timer.timeoutId = null;
  }
}

function scheduleTick() {
  const remainingMs = Math.max(0, timer.endTs - Date.now());
  const sec = Math.ceil(remainingMs / 1000);
  timer.remainingSec = sec;
  setTimestampDisplay(sec);

  if (remainingMs <= 0) {
    timer.running = false;
    clearTimerTimeout();
    document.dispatchEvent(new CustomEvent('mode:timeup'));
    try { timer.onEnd?.(); } catch {}
    return;
  }
  const nextIn = remainingMs % 1000 || 1000;
  timer.timeoutId = setTimeout(scheduleTick, nextIn);
}

/**
 * Configure timer once. Does not start unless startImmediately is true.
 * ex: configureTimer({ duration: 90, onEnd: ()=>resetGame(), startImmediately: false })
 */
function configureTimer({ duration, onEnd, startImmediately = false } = {}) {
  clearTimerTimeout();
  if (Number.isFinite(duration) && duration > 0) {
    timer.durationSec = Math.floor(duration);
  }
  timer.onEnd = onEnd ?? null;
  timer.running = false;
  timer.remainingSec = timer.durationSec;
  setTimestampDisplay(timer.remainingSec);
  if (startImmediately) setTimerRunning(true);
}

/**
 * Boolean API to start/pause the timer.
 * setTimerRunning(true)  -> starts/resumes with remainingSec
 * setTimerRunning(false) -> pauses and keeps remainingSec
 */
function setTimerRunning(run = false) {
  if (run) {
    if (timer.running) return;
    // If remainingSec is 0 (finished), reset to duration
    if (!Number.isFinite(timer.remainingSec) || timer.remainingSec <= 0) {
      timer.remainingSec = timer.durationSec;
    }
    timer.endTs = Date.now() + timer.remainingSec * 1000;
    timer.running = true;
    scheduleTick();
  } else {
    if (!timer.running) return;
    clearTimerTimeout();
    // snapshot remaining
    const remainingMs = Math.max(0, timer.endTs - Date.now());
    timer.remainingSec = Math.ceil(remainingMs / 1000);
    timer.running = false;
  }
}

/** Reset the timer to a (new) duration without starting. */
function resetTimer(duration) {
  configureTimer({ duration, onEnd: timer.onEnd, startImmediately: false });
}

/** Convenience getter */
function getRemainingTime() {
  return timer.remainingSec;
}

// Back-compat helpers
function startCountdown(seconds, onEnd) {
  configureTimer({ duration: seconds, onEnd, startImmediately: false });
}
function stopCountdown() {
  setTimerRunning(false);
}

// -------------------- Init / Bind --------------------
function initMode() {
  tieId();

  // Preload on hover/focus
  mod.forEach((btn, idx) => {
    const mode = modes[idx];
    if (!mode) return;
    const warm = () => preloadModeAssets(mode);
    btn.addEventListener('pointerenter', warm, { passive: true });
    btn.addEventListener('focus', warm, { passive: true });
    btn.addEventListener('mouseenter', warm, { passive: true });
  });

  // Click to start mode
  mod.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.modeIndex);
      const mode = Number.isFinite(idx) ? modes[idx] : getModeById(btn.id);
      if (!mode) return;

      // Validate car requirement
      const carSpeedKmH = Math.round((selectedCar?.maxSpeed ?? 0) * 1000);
      if (!selectedCar || carSpeedKmH < 100) {
        alert(`Car too slow for "${mode.name}". Required ≥ ${mode.carRequirement} km/h, you have ${carSpeedKmH} km/h`);
        return;
      }

      // Apply visuals and distance
      await applyMode(mode);

      // Set timer for the mode and start it via boolean API
      configureTimer({
        duration: mode.time,
        onEnd: () => {
          alert("Time's up!");
        },
        startImmediately: false,
      });


      // Start game after a small delay (countdown continues)
      setTimeout(() => {
        startNewGame?.();
      }, 1000);
    });
  });

  // Idle warmup of all assets
  const idle = window.requestIdleCallback || function (cb) { setTimeout(() => cb({ timeRemaining: () => 0 }), 300); };
  idle(() => {
    const urls = new Set();
    modes.forEach(m => {
      if (m.enviro) urls.add(m.enviro);
      if (m.weather) urls.add(m.weather);
      if (m.track)  urls.add(m.track);
    });
    [...urls].forEach(u => preloadImage(u));
  });
}

// Auto-init
initMode();

export {
  initMode,
  roadDisplay,
  // Timer API
  configureTimer,
  setTimerRunning,
  resetTimer,
  getRemainingTime,
  // Back-compat (optional)
  startCountdown,
  stopCountdown,
};