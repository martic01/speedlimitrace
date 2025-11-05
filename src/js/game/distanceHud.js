// game/DistanceHUD.js
const $ = (sel, root = document) => root.querySelector(sel);

let hudWrap = null;
let hudValue = null;
let hudUnitEl = null;

let lastProgress = -1;
let lastText = '';

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function fmtKm(km) {
  const n = Number.isFinite(km) ? km : 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Initialize HUD by binding to existing HTML.
 * Expects something like:
 * <div class="distance-hud" style="--size:64px; --progress:0">
 *   <div class="distance-text"><span class="value">0.00</span><span class="unit">km</span></div>
 * </div>
 */
export function initDistanceHUD() {
  hudWrap   = $('#distanceHud') || $('.distance-hud');
  hudValue  = hudWrap ? ($('.value', hudWrap)) : null;
  hudUnitEl = hudWrap ? ($('.unit', hudWrap)) : null;

  if (!hudWrap) {
    console.warn('[DistanceHUD] No .distance-hud element found in DOM.');
    return;
  }

  // Ensure base state
  if (getComputedStyle(hudWrap).getPropertyValue('--progress') === '') {
    hudWrap.style.setProperty('--progress', '0');
  }
  if (hudValue && !hudValue.textContent) hudValue.textContent = '0.00';

  lastProgress = 0;
  lastText = '0.00';
}

/**
 * Update HUD with total and goal (in meters)
 */
export function updateDistanceHUD(totalMeters = 0, raceMeters = 1) {
  if (!hudWrap) return;

  const ratio = raceMeters > 0 ? clamp01(totalMeters / raceMeters) : 0;
  if (Math.abs(ratio - lastProgress) > 0.0001) {
    hudWrap.style.setProperty('--progress', ratio.toFixed(4));
    lastProgress = ratio;
  }

  if (hudValue) {
    const km = Math.min(totalMeters, raceMeters) / 1000;
    const txt = fmtKm(km);
    if (txt !== lastText) {
      hudValue.textContent = txt;
      lastText = txt;
    }
  }
}

export function resetDistanceHUD() {
  if (!hudWrap) return;
  hudWrap.style.setProperty('--progress', '0');
  if (hudValue) hudValue.textContent = '0.00';
  lastProgress = 0;
  lastText = '0.00';
}

export function destroyDistanceHUD() {
  hudWrap = null;
  hudValue = null;
  hudUnitEl = null;
  lastProgress = -1;
  lastText = '';
}