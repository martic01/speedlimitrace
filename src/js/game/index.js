
import startGame from './game.js';
import { Curves } from './Curves.js';
import { TumbleSystem } from './TumbleSystem.js';

let game = null; // Game instance
let currentRaceDistance = 1.0; // Default race distance in km

const screen = document.querySelectorAll('.screen');
const gamepg = document.querySelector('.gamepg');

// Race distance buttons (you'll need to add these to your HTML)
const shortRaceBtn = document.getElementById('short-race-btn'); // Add this to HTML
const mediumRaceBtn = document.getElementById('medium-race-btn'); // Add this to HTML
const longRaceBtn = document.getElementById('long-race-btn'); // Add this to HTML
const customRaceBtn = document.getElementById('custom-race-btn'); // Add this to HTML

const FINISH_LINE_TYPES = {
    CLASSIC: 'classic',
    MODERN: 'modern',
    RACING: 'racing',
    CHECKERED: 'checkered'
};
// Export individual functions for external use
function setTumbleSettings(settings) {
    if (game) {
        game.setTumbleSettings(settings);
    }
}

function addCurve(start, end, intensity) {
    if (game) {
        game.addCurve(start, end, intensity);
    }
}


function resetGame() {
    if (game) {
        game.reset();
    }
}
// Function to set race distance
function setRaceDistance(distanceKm) {
    currentRaceDistance = distanceKm;
    console.log(`🏁 Race distance set to: ${distanceKm}km`);

    // If game is already running, update the race distance
    if (game) {
        game.setRaceDistance(distanceKm);
    }
}

// Function to start the game with current distance
function startNewGame() {
    // Clean up existing game
    if (game) {
        // Dispose of previous game resources
        game.renderer.dispose();
        game.scene.dispose();
        game = null;
    }

    // Hide all screens and show game
    screen.forEach(s => s.style.display = 'none');
    gamepg.style.display = 'block';

    // Start new game with current distance
    game = new startGame('.road', currentRaceDistance);

    // Add some curves for variety
    game.curves.addCurve(100, 200, 0.02);
    game.curves.addCurve(300, 400, -0.015);
    game.curves.addCurve(500, 600, 0.025);

    // Set tumble settings
    game.tumbleSystem.setTumbleSettings({ duration: 1500 });

    console.log(`🎮 Game started with ${currentRaceDistance}km race`);
}



// Race distance button handlers
function setupRaceDistanceButtons() {
    // Short race - 0.5km
    if (shortRaceBtn) {
        shortRaceBtn.addEventListener('click', () => {
            setRaceDistance(2.0);
            updateActiveRaceButton('short');
        });
    }

    // Medium race - 1.0km (default)
    if (mediumRaceBtn) {
        mediumRaceBtn.addEventListener('click', () => {
            setRaceDistance(3.0);
            updateActiveRaceButton('medium');
        });
    }

    // Long race - 2.0km
    if (longRaceBtn) {
        longRaceBtn.addEventListener('click', () => {
            setRaceDistance(4.0);
            updateActiveRaceButton('long');
        });
    }

    // Custom race - prompt for distance
    if (customRaceBtn) {
        customRaceBtn.addEventListener('click', () => {
            const customDistance = prompt('Enter race distance in kilometers:', currentRaceDistance);
            if (customDistance && !isNaN(customDistance) && customDistance > 0) {
                setRaceDistance(parseFloat(customDistance));
                updateActiveRaceButton('custom');
            }
        });
    }
}

// Update active race button styling
function updateActiveRaceButton(activeType) {
    // Remove active class from all buttons
    const raceButtons = [shortRaceBtn, mediumRaceBtn, longRaceBtn, customRaceBtn];
    raceButtons.forEach(btn => {
        if (btn) {
            btn.classList.remove('active-race');
        }
    });

    // Add active class to selected button
    switch (activeType) {
        case 'short':
            if (shortRaceBtn) shortRaceBtn.classList.add('active-race');
            break;
        case 'medium':
            if (mediumRaceBtn) mediumRaceBtn.classList.add('active-race');
            break;
        case 'long':
            if (longRaceBtn) longRaceBtn.classList.add('active-race');
            break;
        case 'custom':
            if (customRaceBtn) customRaceBtn.classList.add('active-race');
            break;
    }
}


 export {
    startNewGame,
    setRaceDistance,
    resetGame,
    setTumbleSettings,
    addCurve,
    FINISH_LINE_TYPES,
};