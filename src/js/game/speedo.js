import { getSelectedName, getSelectedAccel, getSelectedHandling } from '../garage.js';

const nowCarName = document.querySelector('.nmi');
const nowCarAcc = document.querySelector('.acceli');
const nowCarHan = document.querySelector('.hani');
let setHolding;
let setMeters;
let updateSpeed;
let reset;

const speedo = () => {

  let MAX_SPEED = 1000;
  let ACCEL_RATE = 20;      // units per second when holding
  let DECEL_RATE = 20;      // units per second when released
  let MINOR_TICK_EVERY = 10;
  let MAJOR_EVERY = 100;

  const canvas = document.getElementById('speedo');
  const ctx = canvas.getContext('2d');
  const valueEl = document.getElementById('value');

  // Geometry
  const START_ANGLE = deg2rad(135);
  const END_ANGLE = deg2rad(405);
  const SPAN = END_ANGLE - START_ANGLE;

  function deg2rad(d) { return (d * Math.PI) / 180; }
  function valueToAngle(v) { return START_ANGLE + (v / MAX_SPEED) * SPAN; }
  function clamp(n, a, b) { return Math.min(Math.max(n, a), b); }

  // Static layer
  let staticCanvas, sctx;
  let geom = null;

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    
    // Ensure minimum dimensions
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw in CSS pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawStatic();
  }

  function drawStatic() {
    if (!staticCanvas) {
      staticCanvas = document.createElement('canvas');
      sctx = staticCanvas.getContext('2d');
    }

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    // Skip if canvas has zero dimensions
    if (w === 0 || h === 0) {
      return;
    }
    
    staticCanvas.width = w;
    staticCanvas.height = h;

    const cx = w / 2;
    const cy = h / 2;

    const rOuter = Math.min(w, h) * 0.42;
    const ringWidth = 18;

    // Ensure positive dimensions for gradients
    if (rOuter <= 0) {
      return;
    }

    sctx.clearRect(0, 0, w, h);

    // Background ring
    sctx.lineCap = 'round';
    sctx.lineWidth = ringWidth;
    sctx.strokeStyle = '#1b2240';
    sctx.beginPath();
    sctx.arc(cx, cy, rOuter, START_ANGLE, END_ANGLE, false);
    sctx.stroke();

    // Color zones
    const zones = [
      { from: 0, to: 500, color: '#1ec86e' },
      { from: 500, to: 800, color: '#f7a73d' },
      { from: 800, to: 1000, color: '#ff4d4f' },
    ];
    for (const z of zones) {
      sctx.strokeStyle = z.color + '55';
      sctx.beginPath();
      sctx.arc(cx, cy, rOuter, valueToAngle(z.from), valueToAngle(z.to), false);
      sctx.stroke();
    }

    // Ticks
    const majorLen = 18;
    const minorLen = 8;
    const tickColorMajor = '#eaf0ff';
    const tickColorMinor = '#9aa3ba';
    const minorStep = Math.max(1, MINOR_TICK_EVERY);

    for (let v = 0; v <= MAX_SPEED; v += minorStep) {
      const angle = valueToAngle(v);
      const isMajor = (v % MAJOR_EVERY === 0);

      const len = isMajor ? majorLen : minorLen;
      const lw = isMajor ? 3 : 1.3;
      const color = isMajor ? tickColorMajor : tickColorMinor;

      const x1 = cx + Math.cos(angle) * (rOuter - ringWidth / 2 - len);
      const y1 = cy + Math.sin(angle) * (rOuter - ringWidth / 2 - len);
      const x2 = cx + Math.cos(angle) * (rOuter - ringWidth / 2 + (isMajor ? 4 : 0));
      const y2 = cy + Math.sin(angle) * (rOuter - ringWidth / 2 + (isMajor ? 4 : 0));

      sctx.strokeStyle = color;
      sctx.lineWidth = lw;
      sctx.beginPath();
      sctx.moveTo(x1, y1);
      sctx.lineTo(x2, y2);
      sctx.stroke();

      if (isMajor) {
        const labelR = rOuter - ringWidth - 26;
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;

        sctx.fillStyle = '#dce4ff';
        sctx.font = '600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText(String(v), lx, ly);
      }
    }

    // Inner face glow - FIXED: Ensure faceR is positive
    const faceR = Math.max(1, rOuter - ringWidth - 28);
    
    // Only create gradient if dimensions are valid
    if (faceR > 0) {
      const g = sctx.createRadialGradient(cx, cy, faceR * 0.2, cx, cy, faceR);
      g.addColorStop(0, 'rgba(106,162,255,0.06)');
      g.addColorStop(1, 'rgba(106,162,255,0.02)');
      sctx.fillStyle = g;
      sctx.beginPath();
      sctx.arc(cx, cy, faceR, 0, Math.PI * 2);
      sctx.fill();
    }

    // Center cap base
    sctx.fillStyle = '#0e1328';
    sctx.beginPath();
    sctx.arc(cx, cy, 18, 0, Math.PI * 2);
    sctx.fill();

    geom = { w, h, cx, cy, rOuter, ringWidth, faceR };
  }

  // Dynamic layer
  let speed = 0;
  let isHolding = false;
  let lastTime = performance.now();

  function drawDynamic() {
    if (!geom || !staticCanvas || staticCanvas.width === 0 || staticCanvas.height === 0) {
      return;
    }
    
    const { w, h, cx, cy, rOuter, ringWidth } = geom;

    ctx.clearRect(0, 0, w, h);
    
    // Only draw if static canvas is ready
    if (staticCanvas.width > 0 && staticCanvas.height > 0) {
      ctx.drawImage(staticCanvas, 0, 0);
    }

    // Progress arc
    const angleNow = valueToAngle(speed);
    ctx.lineWidth = ringWidth;
    const progGrad = ctx.createLinearGradient(cx - rOuter, cy, cx + rOuter, cy);
    progGrad.addColorStop(0.0, '#6aa2ff');
    progGrad.addColorStop(1.0, '#92c5ff');
    ctx.strokeStyle = progGrad;
    ctx.shadowColor = 'rgba(146,197,255,0.5)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, START_ANGLE, angleNow, false);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Needle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleNow);

    const needleLen = rOuter - 24;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(0, -3.8);
    ctx.lineTo(needleLen, 0);
    ctx.lineTo(0, 3.8);
    ctx.closePath();
    const needleGrad = ctx.createLinearGradient(-14, 0, needleLen, 0);
    needleGrad.addColorStop(0, '#ff6b6b');
    needleGrad.addColorStop(1, '#ff2d55');
    ctx.fillStyle = needleGrad;
    ctx.shadowColor = 'rgba(255,45,85,0.4)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center cap highlight
    ctx.beginPath();
    ctx.fillStyle = '#0b0f22';
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1f274a';
    ctx.stroke();

    ctx.restore();

    if (valueEl) valueEl.textContent = Math.round(speed);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (isHolding) {
      speed = clamp(speed + ACCEL_RATE * dt, 0, MAX_SPEED);
    } else {
      speed = clamp(speed - DECEL_RATE * dt, 0, MAX_SPEED);
    }

    drawDynamic();
    requestAnimationFrame(tick);
  }

  // Track last config to avoid rebuilding when unchanged
  let lastCfg = { ms: null, ar: null, dr: null, mt: null, me: null };

  const setInfo = () => {
    const shortenName = getSelectedName().slice(0, 4) + '...' + getSelectedName().slice(-2);
    const condition = getSelectedName().length > 12;
    nowCarName.textContent = !condition ? getSelectedName() : shortenName;
    nowCarAcc.textContent = getSelectedAccel();
    nowCarHan.textContent = getSelectedHandling();
  }

  setHolding = (state) => {
    isHolding = !!state;
  };

  // Game pushes normalized speed (0..1). Clamp and redraw instantly.
  updateSpeed = (normalized) => {
    speed = clamp((normalized || 0) * 1000, 0, MAX_SPEED);
    drawDynamic();
    setInfo();
  };

  // Update gauge config; rebuild static if anything changed.
  setMeters = (ms, ar, dr, mt, me) => {
    const newMAX = Math.max(1, Math.round((ms || 0) * 1000));
    const newAR = (ar || 0) * 1000;
    const newDR = (dr || 0) * 1000;
    const newMT = Math.max(1, Math.round(mt || 10));
    const newME = Math.max(newMT, Math.round(me || 100));

    if (lastCfg.ms === newMAX &&
      lastCfg.ar === newAR &&
      lastCfg.dr === newDR &&
      lastCfg.mt === newMT &&
      lastCfg.me === newME) {
      return; // no change, skip rebuild
    }

    MAX_SPEED = newMAX;
    ACCEL_RATE = newAR;
    DECEL_RATE = newDR;
    MINOR_TICK_EVERY = newMT;
    MAJOR_EVERY = newME;
    lastCfg = { ms: newMAX, ar: newAR, dr: newDR, mt: newMT, me: newME };

    // Only redraw if canvas is ready
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      drawStatic();
      // Clamp current speed to new max and redraw
      speed = clamp(speed, 0, MAX_SPEED);
      drawDynamic();
    }
  };

  reset = () => {
    isHolding = false;
    speed = 0;
    drawDynamic();
  };

  // Resize-aware
  const ro = new ResizeObserver(() => {
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      resizeCanvas();
    }
  });
  ro.observe(canvas);

  // Initial setup - wait for canvas to be visible
  const init = () => {
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      resizeCanvas();
      drawDynamic();
      requestAnimationFrame((t) => {
        lastTime = t;
        tick(t);
      });
    } else {
      // Retry after a short delay if canvas isn't ready
      setTimeout(init, 100);
    }
  };

  init();
};

export { speedo, setHolding, setMeters, updateSpeed, reset };