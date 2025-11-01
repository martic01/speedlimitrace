import startGame from './game.js';          // your startGame class (has destroy())
import { reset as resetSpeedo } from './speedo.js';

// If you don't need these in here, you can remove them
// import { Curves } from './Curves.js';
// import { TumbleSystem } from './TumbleSystem.js';
const x = (sel) => document.querySelector(sel);
const x2 = (sel) => document.querySelectorAll(sel);


let game = null;                 // current game instance
let currentRaceDistance = 1.0;   // km

const screen = x2('.screen');
const gamepg = x('.gamepg');
const welcomepg = x('.welcomepg');

// Optional race distance buttons (exist only if you add them in HTML)
const shortRaceBtn = document.getElementById('short-race-btn');
const mediumRaceBtn = document.getElementById('medium-race-btn');
const longRaceBtn = document.getElementById('long-race-btn');
const customRaceBtn = document.getElementById('custom-race-btn');

const FINISH_LINE_TYPES = {
  CLASSIC: 'classic',
  MODERN: 'modern',
  RACING: 'racing',
  CHECKERED: 'checkered'
};

// Helpers



function waitForGameScreen() {
  screen.forEach(s => s && (s.style.display = 'none'));
  if (welcomepg) welcomepg.style.display = 'block';
}

function hideAllScreens() {
  screen.forEach(s => s && (s.style.display = 'none'));
  if (gamepg) gamepg.style.display = 'block';
}

function showGameScreen() {
  hideAllScreens() 
}

// Safely destroy a running game (used by resetGame and startNewGame)
function safeDestroyGame() {
  if (!game) return;
  try {
    // Prefer the destroy() we added to startGame (proper dispose + canvas removal)
    if (typeof game.destroy === 'function') {
      game.destroy();
    } else {
      // Fallback (older builds): best-effort cleanup
      try { game.renderer?.renderLists?.dispose?.(); } catch { }
      try { game.renderer?.dispose?.(); } catch { }
      try { game.renderer?.forceContextLoss?.(); } catch { }
      try {
        const canvas = game.renderer?.domElement;
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
      } catch { }
    }
  } catch (e) {
    console.warn('safeDestroyGame error:', e);
  } finally {
    game = null;
  }
}

// Public helpers callable from other modules
function setTumbleSettings(settings) {
  if (game && typeof game.setTumbleSettings === 'function') {
    game.setTumbleSettings(settings);
  }
}
function addCurve(start, end, intensity) {
  if (game && game.curves && typeof game.curves.addCurve === 'function') {
    game.curves.addCurve(start, end, intensity);
  }
}

// Cancels the current game and resets speedometer (use this on Back)
function resetGame() {
  safeDestroyGame();
  try { resetSpeedo(); } catch { }
}

// Sets the race distance (km). If a game is running, update it live.
function setRaceDistance(distanceKm) {
  currentRaceDistance = Number(distanceKm) || 1.0;
  console.log(`🏁 Race distance set to: ${currentRaceDistance} km`);

  if (game && typeof game.setRaceDistance === 'function') {
    game.setRaceDistance(currentRaceDistance);
  }
}

// Starts a new game; disposes any existing one first
function startNewGame(containerSelector = '.road') {
  // Kill previous game to avoid clashes
  safeDestroyGame();

  // Switch UI to the game screen
  showGameScreen();

  // Create new instance
  game = new startGame(containerSelector, currentRaceDistance);

  // Add some default curves/tuning if desired
  try {
    game.curves?.addCurve(100, 200, 0.02);
    game.curves?.addCurve(300, 400, -0.015);
    game.curves?.addCurve(500, 600, 0.025);
  } catch { }

  try {
    game.tumbleSystem?.setTumbleSettings?.({ duration: 1500 });
  } catch { }

  console.log(`🎮 Game started with ${currentRaceDistance} km`);
  return game;
}

// Optional: Race distance buttons wiring
function setupRaceDistanceButtons() {
  // Example mapping (change to what you want)
  // Short: 2.0 km, Medium: 3.0 km, Long: 4.0 km
  if (shortRaceBtn) {
    shortRaceBtn.addEventListener('click', () => {
      setRaceDistance(2.0);
      updateActiveRaceButton('short');
    });
  }
  if (mediumRaceBtn) {
    mediumRaceBtn.addEventListener('click', () => {
      setRaceDistance(3.0);
      updateActiveRaceButton('medium');
    });
  }
  if (longRaceBtn) {
    longRaceBtn.addEventListener('click', () => {
      setRaceDistance(4.0);
      updateActiveRaceButton('long');
    });
  }
  if (customRaceBtn) {
    customRaceBtn.addEventListener('click', () => {
      const input = prompt('Enter race distance in kilometers:', currentRaceDistance);
      const val = parseFloat(input);
      if (!Number.isNaN(val) && val > 0) {
        setRaceDistance(val);
        updateActiveRaceButton('custom');
      }
    });
  }
}

// Button state
function updateActiveRaceButton(activeType) {
  const raceButtons = [shortRaceBtn, mediumRaceBtn, longRaceBtn, customRaceBtn];
  raceButtons.forEach(btn => btn?.classList.remove('active-race'));

  switch (activeType) {
    case 'short': shortRaceBtn?.classList.add('active-race'); break;
    case 'medium': mediumRaceBtn?.classList.add('active-race'); break;
    case 'long': longRaceBtn?.classList.add('active-race'); break;
    case 'custom': customRaceBtn?.classList.add('active-race'); break;
  }
}

// If you want to auto-wire the distance buttons, call this once on boot
// setupRaceDistanceButtons();

export {
  startNewGame,
  setRaceDistance,
  resetGame,
  setTumbleSettings,
  addCurve,
  FINISH_LINE_TYPES,
};