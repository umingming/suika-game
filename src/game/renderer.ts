import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, PLAY_AREA_HEIGHT, DANGER_LINE_Y, COLORS } from './constants';
import { FRUITS } from './fruits';
import type { FruitBody, MergeEffect, DecoType } from '@/types/game';

const FONT = "'Jua', sans-serif";

// ── Helper: darken a hex color ──
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// ── Helper: hex to rgba ──
function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Helper: draw a small star ──
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points = 4): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const dist = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// ── Helper: draw a small heart ──
function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
  ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Decoration drawing functions ──

function drawStem(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  const stemH = r * 0.3;
  const stemW = Math.max(2, r * 0.08);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = stemW;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.05, -r - stemH * 0.6, r * 0.02, -r - stemH);
  ctx.stroke();
  ctx.restore();
}

function drawLeaf(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  const leafW = r * 0.28;
  const leafH = r * 0.18;
  ctx.save();
  ctx.translate(r * 0.06, -r - r * 0.12);
  ctx.rotate(0.3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(leafW * 0.5, 0, leafW * 0.5, leafH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leaf vein
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = Math.max(0.5, r * 0.02);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(leafW * 0.8, 0);
  ctx.stroke();
  ctx.restore();
}

function drawSeeds(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.fillStyle = '#F7DC6F';
  const seedR = Math.max(1, r * 0.06);
  const positions = [
    [-0.3, -0.15], [0.3, -0.15],
    [-0.15, 0.2], [0.15, 0.2],
    [-0.35, 0.15], [0.35, 0.15],
    [0, -0.35], [0, 0.05],
  ];
  for (const [px, py] of positions) {
    ctx.beginPath();
    ctx.ellipse(r * px, r * py, seedR, seedR * 1.4, Math.atan2(py, px) + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Strawberry green cap
  ctx.fillStyle = '#4A9E3F';
  const capR = r * 0.35;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(Math.cos(angle) * r * 0.15, -r * 0.75 + Math.sin(angle) * r * 0.1);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, capR * 0.3, capR * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawGrapeTexture(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#6B3FA0';
  ctx.lineWidth = Math.max(0.5, r * 0.03);
  const blobR = r * 0.35;
  const positions = [
    [0, -0.3], [-0.35, 0], [0.35, 0],
    [-0.18, 0.32], [0.18, 0.32], [0, 0.05],
  ];
  for (const [px, py] of positions) {
    ctx.beginPath();
    ctx.arc(r * px, r * py, blobR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBumpy(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#E08A00';
  const dotCount = 12;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const dist = r * 0.65 + (i % 3) * r * 0.1;
    const dotR = Math.max(1, r * 0.06);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDivisions(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.05, 0, 0, r * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.quadraticCurveTo(0, r * 0.05, r * 0.7, 0);
  ctx.stroke();
  ctx.restore();
}

function drawHeartCrease(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(200,80,100,0.2)';
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.08, -r * 0.2, r * 0.03, r * 0.8);
  ctx.stroke();
  ctx.restore();
}

function drawCrownLeaves(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  const leafCount = 5;
  for (let i = 0; i < leafCount; i++) {
    const spread = (i - (leafCount - 1) / 2) * 0.35;
    ctx.save();
    ctx.translate(r * spread * 0.3, -r - r * 0.1);
    ctx.rotate(spread * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.2, r * 0.08, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawNetPattern(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = Math.max(0.5, r * 0.015);
  for (let i = -2; i <= 2; i++) {
    const y = i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, y);
    ctx.quadraticCurveTo(0, y + r * 0.08, r * 0.8, y);
    ctx.stroke();
  }
  for (let i = -2; i <= 2; i++) {
    const x = i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, -r * 0.8);
    ctx.quadraticCurveTo(x + r * 0.08, 0, x, r * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStripes(ctx: CanvasRenderingContext2D, r: number, color: string): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  const stripeCount = 8;
  for (let i = 0; i < stripeCount; i++) {
    const angle = (i / stripeCount) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.08, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  r: number,
  decorations: DecoType[],
  decoColor: string,
): void {
  for (const deco of decorations) {
    switch (deco) {
      case 'stem': drawStem(ctx, r, decoColor); break;
      case 'leaf': drawLeaf(ctx, r, decoColor); break;
      case 'seeds': drawSeeds(ctx, r); break;
      case 'grapeTexture': drawGrapeTexture(ctx, r); break;
      case 'bumpy': drawBumpy(ctx, r); break;
      case 'divisions': drawDivisions(ctx, r); break;
      case 'heartCrease': drawHeartCrease(ctx, r); break;
      case 'crownLeaves': drawCrownLeaves(ctx, r, decoColor); break;
      case 'netPattern': drawNetPattern(ctx, r, decoColor); break;
      case 'stripes': drawStripes(ctx, r, decoColor); break;
    }
  }
}

// ── Cute face drawing (v2 — per-fruit unique expressions) ──

const CHEEK_COLORS: Record<number, string> = {
  0: '#FF8FAA', 1: '#FF8FAA', 2: '#D4A0E8', 3: '#FFD0A0',
  4: '#FFBB88', 5: '#FF8FAA', 6: '#C5E8A0', 7: '#FFB8CC',
  8: '#FFE88A', 9: '#A0E8B8', 10: '#A0E8B8',
};

// ── Eye drawing helpers ──

function drawRoundEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
): void {
  // Simple kawaii eye: solid dark circle + big highlights
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.arc(cx, cy, er, 0, Math.PI * 2);
  ctx.fill();
  // Big highlight (top-left)
  const hlR = Math.max(1.5, er * 0.42);
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx - er * 0.22, cy - er * 0.25, hlR, 0, Math.PI * 2);
  ctx.fill();
  // Small highlight (bottom-right)
  ctx.beginPath();
  ctx.arc(cx + er * 0.25, cy + er * 0.2, Math.max(0.7, hlR * 0.3), 0, Math.PI * 2);
  ctx.fill();
}

function drawHappyEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  ctx.save();
  ctx.strokeStyle = '#4A4040';
  ctx.lineWidth = Math.max(2, er * 0.25);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, er * 0.65, Math.PI + 0.3, -0.3);
  ctx.stroke();
  ctx.restore();
}

function drawStarEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  // Soft dark circle
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.arc(cx, cy, er, 0, Math.PI * 2);
  ctx.fill();
  // Star sparkle
  ctx.fillStyle = '#FFE040';
  drawStar(ctx, cx, cy, er * 0.6, 5);
  // Highlight
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(cx - er * 0.15, cy - er * 0.2, Math.max(1, er * 0.18), 0, Math.PI * 2);
  ctx.fill();
}

function drawHeartEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  // Simple heart — no dark outline ring
  ctx.fillStyle = '#FF4070';
  drawHeart(ctx, cx, cy - er * 0.1, er * 0.9);
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx - er * 0.2, cy - er * 0.2, Math.max(0.8, er * 0.15), 0, Math.PI * 2);
  ctx.fill();
}

function drawSleepyEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  ctx.save();
  ctx.strokeStyle = '#4A4040';
  ctx.lineWidth = Math.max(1.5, er * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.6, cy);
  ctx.quadraticCurveTo(cx, cy + er * 0.25, cx + er * 0.6, cy);
  ctx.stroke();
  ctx.restore();
}

function drawWinkEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  ctx.save();
  ctx.strokeStyle = '#4A4040';
  ctx.lineWidth = Math.max(1.5, er * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.4, cy - er * 0.3);
  ctx.lineTo(cx + er * 0.05, cy + er * 0.05);
  ctx.lineTo(cx - er * 0.4, cy + er * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawLineEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  ctx.save();
  ctx.strokeStyle = '#4A4040';
  ctx.lineWidth = Math.max(2, er * 0.25);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.5, cy);
  ctx.lineTo(cx + er * 0.5, cy);
  ctx.stroke();
  ctx.restore();
}

function drawSunglassesEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  // Rounded lens
  ctx.fillStyle = '#2A2A3E';
  ctx.beginPath();
  ctx.roundRect(cx - er * 0.95, cy - er * 0.6, er * 1.9, er * 1.2, er * 0.35);
  ctx.fill();
  // Lens shine
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx - er * 0.2, cy - er * 0.15, er * 0.4, er * 0.2, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

// ── Cheek drawing helper ──

function drawCheeks(
  ctx: CanvasRenderingContext2D, r: number, level: number, hasHeartCheek = false
): void {
  const cheekColor = CHEEK_COLORS[level] ?? '#FF8FAA';
  const cheekR = Math.max(5, r * 0.22);
  const cheekY = r * 0.18;

  ctx.save();
  ctx.globalAlpha = 0.5;

  for (const side of [-1, 1]) {
    const cx = side * r * 0.38;
    const grad = ctx.createRadialGradient(cx, cheekY, 0, cx, cheekY, cheekR);
    grad.addColorStop(0, cheekColor);
    grad.addColorStop(1, hexToRgba(cheekColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cheekY, cheekR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cheek highlights
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#FFF';
  const chHL = Math.max(1.2, cheekR * 0.22);
  ctx.beginPath();
  ctx.arc(-r * 0.4, cheekY - cheekR * 0.25, chHL, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.36, cheekY - cheekR * 0.25, chHL, 0, Math.PI * 2);
  ctx.fill();

  // Heart on cheeks (for peach)
  if (hasHeartCheek) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FF6088';
    drawHeart(ctx, -r * 0.38, cheekY, cheekR * 0.5);
    drawHeart(ctx, r * 0.38, cheekY, cheekR * 0.5);
  }

  ctx.restore();
}

// ── Eyebrow helper ──

function drawEyebrows(
  ctx: CanvasRenderingContext2D, r: number, exX: number, eyY: number,
  style: 'worried' | 'confident' | 'none'
): void {
  if (style === 'none') return;
  ctx.save();
  ctx.strokeStyle = '#4A4040';
  ctx.lineWidth = Math.max(1.5, r * 0.035);
  ctx.lineCap = 'round';

  if (style === 'worried') {
    // Cute worried: angled inward-up
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * (exX - r * 0.08), eyY - r * 0.18);
      ctx.quadraticCurveTo(
        side * exX, eyY - r * 0.22,
        side * (exX + r * 0.08), eyY - r * 0.16
      );
      ctx.stroke();
    }
  } else {
    // Confident: short thick dashes
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * (exX - r * 0.07), eyY - r * 0.17);
      ctx.lineTo(side * (exX + r * 0.07), eyY - r * 0.17);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Main face function: per-fruit unique expressions ──

function drawCuteFace(ctx: CanvasRenderingContext2D, r: number, level: number): void {
  ctx.save();
  const exX = r * 0.25;  // eye X offset (wider)
  const eyY = -r * 0.05; // eye Y offset
  const er = Math.max(3.5, r * 0.14); // eye radius — balanced size
  const mouthY = r * 0.25;
  ctx.lineCap = 'round';

  switch (level) {
    case 0: {
      // Cherry: surprised — big round eyes + small 'o' mouth
      drawRoundEye(ctx, -exX, eyY, er);
      drawRoundEye(ctx, exX, eyY, er);
      // 'o' mouth
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.05);
      ctx.beginPath();
      ctx.arc(0, mouthY, r * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 1: {
      // Strawberry: sparkly star eyes + ω mouth
      drawStarEye(ctx, -exX, eyY, er);
      drawStarEye(ctx, exX, eyY, er);
      // ω cat mouth
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.045);
      const mw = r * 0.22;
      ctx.beginPath();
      ctx.moveTo(-mw, mouthY);
      ctx.quadraticCurveTo(-mw * 0.5, mouthY + r * 0.12, 0, mouthY);
      ctx.quadraticCurveTo(mw * 0.5, mouthY + r * 0.12, mw, mouthY);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 2: {
      // Grape: sleepy — half-closed eyes + small smile
      drawSleepyEye(ctx, -exX, eyY, er);
      drawSleepyEye(ctx, exX, eyY, er);
      // Tiny relaxed smile
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.04);
      ctx.beginPath();
      ctx.arc(0, mouthY - r * 0.02, r * 0.1, 0.15, Math.PI - 0.15);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 3: {
      // Tangerine: wink + tongue out
      drawRoundEye(ctx, -exX, eyY, er);
      drawWinkEye(ctx, exX, eyY, er);
      // Tongue out mouth
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.04);
      const mw = r * 0.15;
      ctx.beginPath();
      ctx.arc(0, mouthY - r * 0.01, mw, 0.05, Math.PI - 0.05);
      ctx.stroke();
      // Tongue
      ctx.fillStyle = '#FF8A94';
      ctx.beginPath();
      ctx.ellipse(r * 0.02, mouthY + r * 0.06, r * 0.07, r * 0.05, 0, 0, Math.PI);
      ctx.fill();
      drawCheeks(ctx, r, level);
      break;
    }
    case 4: {
      // Persimmon: content — line eyes + satisfied ω smile
      drawLineEye(ctx, -exX, eyY, er);
      drawLineEye(ctx, exX, eyY, er);
      // Satisfied ω
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.8, r * 0.04);
      const mw = r * 0.2;
      ctx.beginPath();
      ctx.moveTo(-mw, mouthY);
      ctx.quadraticCurveTo(-mw * 0.5, mouthY + r * 0.1, 0, mouthY);
      ctx.quadraticCurveTo(mw * 0.5, mouthY + r * 0.1, mw, mouthY);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 5: {
      // Apple: excited — big sparkly eyes + wide open smile
      drawRoundEye(ctx, -exX, eyY, er);
      drawRoundEye(ctx, exX, eyY, er);
      // Big smile with teeth
      const mw = r * 0.2;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.035);
      ctx.stroke();
      // Teeth
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.roundRect(-r * 0.06, mouthY - r * 0.01, r * 0.055, r * 0.06, 1.5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(r * 0.005, mouthY - r * 0.01, r * 0.055, r * 0.06, 1.5);
      ctx.fill();
      drawCheeks(ctx, r, level);
      break;
    }
    case 6: {
      // Pear: heart eyes + wide smile
      drawHeartEye(ctx, -exX, eyY, er);
      drawHeartEye(ctx, exX, eyY, er);
      // Wide happy smile
      const mw = r * 0.18;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.03);
      ctx.stroke();
      // Tongue
      ctx.fillStyle = '#FF8A94';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mw * 0.35, mw * 0.4, mw * 0.3, 0, 0, Math.PI);
      ctx.fill();
      drawCheeks(ctx, r, level);
      break;
    }
    case 7: {
      // Peach: happy squint + heart cheeks
      drawHappyEye(ctx, -exX, eyY, er);
      drawHappyEye(ctx, exX, eyY, er);
      // Wide grin
      const mw = r * 0.2;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#E05070';
      ctx.fill();
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.03);
      ctx.stroke();
      ctx.fillStyle = '#FF8A94';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mw * 0.35, mw * 0.45, mw * 0.3, 0, 0, Math.PI);
      ctx.fill();
      drawCheeks(ctx, r, level, true);
      break;
    }
    case 8: {
      // Pineapple: sunglasses + cool smirk
      // Bridge between glasses
      ctx.strokeStyle = '#2A2A3E';
      ctx.lineWidth = Math.max(2, r * 0.03);
      ctx.beginPath();
      ctx.moveTo(-exX + er * 1.1, eyY);
      ctx.lineTo(exX - er * 1.1, eyY);
      ctx.stroke();
      drawSunglassesEye(ctx, -exX, eyY, er);
      drawSunglassesEye(ctx, exX, eyY, er);
      // Cool smirk
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(2, r * 0.04);
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, mouthY);
      ctx.quadraticCurveTo(r * 0.05, mouthY + r * 0.08, r * 0.15, mouthY - r * 0.02);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 9: {
      // Melon: star eyes + wide laugh
      drawStarEye(ctx, -exX, eyY, er);
      drawStarEye(ctx, exX, eyY, er);
      // Big laugh
      const mw = r * 0.22;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(1.5, r * 0.03);
      ctx.stroke();
      // Teeth row
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.roundRect(-mw * 0.7, mouthY - 1, mw * 1.4, r * 0.05, 1);
      ctx.fill();
      // Tongue
      ctx.fillStyle = '#FF8A94';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mw * 0.4, mw * 0.45, mw * 0.3, 0, 0, Math.PI);
      ctx.fill();
      drawCheeks(ctx, r, level);
      break;
    }
    case 10: {
      // Watermelon: king — happy squint + biggest grin
      drawHappyEye(ctx, -exX, eyY, er);
      drawHappyEye(ctx, exX, eyY, er);
      // Crown above
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = Math.max(1.5, r * 0.02);
      const crownW = r * 0.5;
      const crownH = r * 0.2;
      const crownY = eyY - er * 1.5;
      ctx.beginPath();
      ctx.moveTo(-crownW, crownY);
      ctx.lineTo(-crownW * 0.6, crownY - crownH * 0.6);
      ctx.lineTo(-crownW * 0.2, crownY);
      ctx.lineTo(0, crownY - crownH);
      ctx.lineTo(crownW * 0.2, crownY);
      ctx.lineTo(crownW * 0.6, crownY - crownH * 0.6);
      ctx.lineTo(crownW, crownY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Mega grin
      const mw = r * 0.24;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#E05070';
      ctx.fill();
      ctx.strokeStyle = '#4A4040';
      ctx.lineWidth = Math.max(2, r * 0.03);
      ctx.stroke();
      ctx.fillStyle = '#FF8A94';
      ctx.beginPath();
      ctx.ellipse(0, mouthY + mw * 0.35, mw * 0.5, mw * 0.35, 0, 0, Math.PI);
      ctx.fill();
      drawCheeks(ctx, r, level);
      break;
    }
  }

  ctx.restore();
}

// ── Background pattern (pre-computed positions) ──

interface BgPattern { x: number; y: number; type: 'heart' | 'star' | 'dot'; size: number; rotation: number; }
let bgPatterns: BgPattern[] | null = null;

function getBgPatterns(): BgPattern[] {
  if (bgPatterns) return bgPatterns;
  bgPatterns = [];
  // Deterministic pattern using simple hash
  const types: BgPattern['type'][] = ['heart', 'star', 'dot'];
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 8; col++) {
      const idx = row * 8 + col;
      const offsetX = (row % 2) * 40;
      bgPatterns.push({
        x: col * 85 + offsetX + 20,
        y: row * 85 + 30,
        type: types[idx % 3],
        size: 4 + (idx % 3) * 1.5,
        rotation: (idx * 37) % 360 * (Math.PI / 180),
      });
    }
  }
  return bgPatterns;
}

// ── Background ──

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Container background
  ctx.fillStyle = COLORS.containerBg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Cute background patterns
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#E8A0B0';
  for (const p of getBgPatterns()) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    if (p.type === 'heart') {
      drawHeart(ctx, 0, 0, p.size);
    } else if (p.type === 'star') {
      drawStar(ctx, 0, 0, p.size, 4);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // Side walls with soft gradient feel
  const wallW = 8;
  ctx.fillStyle = COLORS.wallColor;
  ctx.fillRect(0, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Wall highlight stripe
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(2, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW + 4, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Floor
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, wallW);
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, 2);

  // Rounded corners
  ctx.fillStyle = COLORS.containerBg;
  const cornerR = 6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(wallW, PLAY_AREA_HEIGHT - wallW - cornerR, cornerR, cornerR);
  ctx.clip();
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(wallW, PLAY_AREA_HEIGHT - wallW - cornerR, cornerR, cornerR);
  ctx.fillStyle = COLORS.containerBg;
  ctx.beginPath();
  ctx.arc(wallW + cornerR, PLAY_AREA_HEIGHT - wallW, cornerR, Math.PI, Math.PI * 1.5);
  ctx.lineTo(wallW, PLAY_AREA_HEIGHT - wallW);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Danger line — cute heart pattern
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.dangerLine;
  const heartSpacing = 24;
  const heartCount = Math.floor((GAME_WIDTH - wallW * 2) / heartSpacing);
  for (let i = 0; i < heartCount; i++) {
    drawHeart(ctx, wallW + i * heartSpacing + heartSpacing / 2, DANGER_LINE_Y, 4);
  }
  ctx.restore();
}

// ── Main fruit drawing ──

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  angle: number,
  alpha = 1.0
): void {
  const config = FRUITS[level];
  if (!config) return;
  const r = config.radius;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Colored soft shadow (fruit-tinted)
  ctx.beginPath();
  ctx.arc(2, 4, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(config.color, 0.18);
  ctx.fill();

  // Outer outline (dark, thick — cartoon style)
  ctx.beginPath();
  ctx.arc(0, 0, r + Math.max(1.5, r * 0.03), 0, Math.PI * 2);
  ctx.fillStyle = darkenColor(config.color, 60);
  ctx.fill();

  // Body with gradient
  const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
  bodyGrad.addColorStop(0, config.highlight);
  bodyGrad.addColorStop(0.5, config.color);
  bodyGrad.addColorStop(1, darkenColor(config.color, 15));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Inner rim light (bright edge on top-left)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = hexToRgba(config.highlight, 0.5);
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.1, r * 0.95, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
  ctx.restore();

  // Decorations
  drawDecorations(ctx, r, config.decorations, config.decoColor ?? '#4A9E3F');

  // Enhanced gloss highlight
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.25, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fill();

  // Extra small gloss
  ctx.beginPath();
  ctx.arc(-r * 0.33, -r * 0.38, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  // Face
  drawCuteFace(ctx, r, level);

  ctx.restore();
}

// ── Drop preview ──

export function drawDropPreview(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number
): void {
  const config = FRUITS[level];
  if (!config) return;

  // Soft guideline
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = hexToRgba(config.color, 0.2);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + config.radius);
  ctx.lineTo(x, PLAY_AREA_HEIGHT - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Preview fruit
  drawFruit(ctx, x, y, level, 0, 0.5);
}

// ── Merge effects (with sparkle particles) ──

export function drawMergeEffects(
  ctx: CanvasRenderingContext2D,
  effects: MergeEffect[]
): void {
  for (const effect of effects) {
    ctx.save();
    ctx.globalAlpha = effect.alpha;

    // Outer ring (thicker, softer)
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner glow
    ctx.globalAlpha = effect.alpha * 0.25;
    const glowGrad = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, effect.radius * 0.7
    );
    glowGrad.addColorStop(0, effect.color);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle particles (stars & hearts around the ring)
    ctx.globalAlpha = effect.alpha * 0.8;
    ctx.fillStyle = effect.color;
    const particleCount = 6;
    const progress = 1 - effect.alpha; // 0→1 as effect fades
    for (let i = 0; i < particleCount; i++) {
      const baseAngle = (i / particleCount) * Math.PI * 2;
      const angle = baseAngle + progress * 1.5; // rotate as they fly out
      const dist = effect.radius * (0.8 + progress * 0.5);
      const px = effect.x + Math.cos(angle) * dist;
      const py = effect.y + Math.sin(angle) * dist;
      const pSize = Math.max(2, 5 * effect.alpha);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      if (i % 2 === 0) {
        drawStar(ctx, 0, 0, pSize, 4);
      } else {
        drawHeart(ctx, 0, -pSize * 0.3, pSize);
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

// ── Cute UI box helper ──

function drawCuteBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius = 14
): void {
  // Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(200, 150, 130, 0.15)';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w, h, radius);
  ctx.fill();
  ctx.restore();

  // Background gradient
  const boxGrad = ctx.createLinearGradient(x, y, x, y + h);
  boxGrad.addColorStop(0, 'rgba(255, 240, 245, 0.92)');
  boxGrad.addColorStop(1, 'rgba(255, 230, 235, 0.92)');
  ctx.fillStyle = boxGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  // Border
  ctx.strokeStyle = COLORS.wallColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ── Next fruit preview ──

export function drawNextFruitPreview(
  ctx: CanvasRenderingContext2D,
  level: number
): void {
  const config = FRUITS[level];
  if (!config) return;

  ctx.save();
  drawCuteBox(ctx, GAME_WIDTH - 82, 8, 74, 74);

  // Label
  ctx.fillStyle = '#D4849A';
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('NEXT \u2665', GAME_WIDTH - 45, 24);

  // Mini fruit
  const scale = Math.min(1, 22 / config.radius);
  ctx.translate(GAME_WIDTH - 45, 54);
  ctx.scale(scale, scale);
  drawFruit(ctx, 0, 0, level, 0);
  ctx.restore();
}

// ── Danger warning border effect ──

function drawDangerWarning(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  time: number
): void {
  const bodies = Matter.Composite.allBodies(engine.world);
  let minY = PLAY_AREA_HEIGHT;
  for (const body of bodies) {
    if (body.isStatic) continue;
    const fb = body as FruitBody;
    if (fb.fruitLevel !== undefined && fb.position.y < minY) {
      minY = fb.position.y;
    }
  }

  const dangerZone = DANGER_LINE_Y + 60;
  if (minY < dangerZone && minY > 0) {
    const intensity = 1 - (minY / dangerZone);
    const pulse = (Math.sin(time * 0.008) + 1) * 0.5;
    const alpha = intensity * 0.15 * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    // Red gradient from edges
    const grad = ctx.createLinearGradient(0, 0, 0, DANGER_LINE_Y + 100);
    grad.addColorStop(0, '#FF4444');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, DANGER_LINE_Y + 100);
    ctx.restore();
  }
}

// ── Fruit stages indicator ──

function drawFruitStages(ctx: CanvasRenderingContext2D): void {
  const panelY = PLAY_AREA_HEIGHT;
  const panelH = GAME_HEIGHT - PLAY_AREA_HEIGHT;

  // Panel background
  const panelGrad = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  panelGrad.addColorStop(0, '#FFF0E8');
  panelGrad.addColorStop(1, '#FFE8D8');
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, panelY, GAME_WIDTH, panelH);

  // Top border line
  ctx.strokeStyle = '#E8C4B0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, panelY);
  ctx.lineTo(GAME_WIDTH, panelY);
  ctx.stroke();

  const count = FRUITS.length; // 11
  const centerY = panelY + panelH / 2;

  // Calculate mini sizes for each fruit
  const sizes = FRUITS.map((_, i) => 10 * Math.pow(1.1, i));
  const totalDiameters = sizes.reduce((sum, s) => sum + s * 2, 0);
  const gap = 16;
  const totalW = totalDiameters + gap * (count - 1);
  let curX = (GAME_WIDTH - totalW) / 2;

  for (let i = 0; i < count; i++) {
    const miniSize = sizes[i];
    const cx = curX + miniSize;

    // Arrow between fruits
    if (i > 0) {
      ctx.fillStyle = '#D4A0B0';
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('›', curX - gap / 2, centerY + 2);
    }

    // Mini fruit — progressively larger
    ctx.save();
    const scale = miniSize / FRUITS[i].radius;
    ctx.translate(cx, centerY);
    ctx.scale(scale, scale);
    drawFruit(ctx, 0, 0, i, 0);
    ctx.restore();

    curX += miniSize * 2 + gap;
  }
}

// ── Main render frame ──

let frameTime = 0;

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  dropX: number | null,
  currentFruitLevel: number,
  nextFruitLevel: number,
  effects: MergeEffect[],
  score: number,
  highScore: number,
  isGameOver: boolean
): void {
  frameTime = Date.now();
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawBackground(ctx);

  // Draw all fruit bodies with idle wobble
  const bodies = Matter.Composite.allBodies(engine.world);
  for (const body of bodies) {
    if (body.isStatic) continue;
    const fb = body as FruitBody;
    if (fb.fruitLevel !== undefined) {
      // Idle wobble: gentle sway when nearly still
      let drawAngle = fb.angle;
      if (fb.speed < 0.3) {
        const phase = fb.id * 1.7; // unique phase per fruit
        drawAngle += Math.sin(frameTime * 0.003 + phase) * 0.025;
      }
      drawFruit(ctx, fb.position.x, fb.position.y, fb.fruitLevel, drawAngle);
    }
  }

  // Merge effects
  drawMergeEffects(ctx, effects);

  // Drop preview
  if (dropX !== null && !isGameOver) {
    drawDropPreview(ctx, dropX, 80, currentFruitLevel);
  }

  // Danger warning
  if (!isGameOver) {
    drawDangerWarning(ctx, engine, frameTime);
  }

  // Next fruit preview
  drawNextFruitPreview(ctx, nextFruitLevel);

  // Fruit stages indicator
  drawFruitStages(ctx);

  // Score box
  ctx.save();
  drawCuteBox(ctx, 8, 8, 125, 74);

  ctx.fillStyle = '#D4849A';
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('\u2605 SCORE \u2605', 20, 24);

  ctx.fillStyle = '#5A3040';
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText(`${score}`, 20, 50);

  ctx.fillStyle = '#C4A0AA';
  ctx.font = `11px ${FONT}`;
  ctx.fillText(`BEST: ${highScore}`, 20, 68);
  ctx.restore();

  // Game over overlay
  if (isGameOver) {
    ctx.save();
    // Soft purple/pink overlay
    ctx.fillStyle = 'rgba(80, 40, 60, 0.45)';
    ctx.fillRect(0, 0, GAME_WIDTH, PLAY_AREA_HEIGHT);

    // Cute box
    const boxX = GAME_WIDTH / 2 - 165;
    const boxY = PLAY_AREA_HEIGHT / 2 - 100;
    const boxW = 330;
    const boxH = 220;

    // Box shadow
    ctx.fillStyle = 'rgba(100, 50, 70, 0.2)';
    ctx.beginPath();
    ctx.roundRect(boxX + 4, boxY + 4, boxW, boxH, 24);
    ctx.fill();

    // Box bg
    const goGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    goGrad.addColorStop(0, 'rgba(255, 245, 250, 0.95)');
    goGrad.addColorStop(1, 'rgba(255, 230, 240, 0.95)');
    ctx.fillStyle = goGrad;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 24);
    ctx.fill();
    ctx.strokeStyle = '#E8B4C0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Decorative hearts around box
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#FF8FAA';
    const heartPositions = [
      [boxX + 20, boxY + 15], [boxX + boxW - 20, boxY + 15],
      [boxX + 15, boxY + boxH - 15], [boxX + boxW - 15, boxY + boxH - 15],
    ];
    for (const [hx, hy] of heartPositions) {
      drawHeart(ctx, hx, hy, 8);
    }
    ctx.globalAlpha = 1;

    // Sad fruit at top
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, boxY + 50);
    ctx.scale(0.35, 0.35);
    // Draw a small cherry with sad face manually
    const sadR = 17;
    const sadGrad = ctx.createRadialGradient(-sadR * 0.25, -sadR * 0.25, sadR * 0.1, 0, 0, sadR);
    sadGrad.addColorStop(0, '#FF6B7A');
    sadGrad.addColorStop(1, '#E84057');
    ctx.beginPath();
    ctx.arc(0, 0, sadR, 0, Math.PI * 2);
    ctx.fillStyle = sadGrad;
    ctx.fill();
    // Sad eyes
    ctx.fillStyle = '#2A1810';
    ctx.beginPath();
    ctx.arc(-sadR * 0.22, -sadR * 0.06, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sadR * 0.22, -sadR * 0.06, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Sad mouth (frown)
    ctx.strokeStyle = '#4A4040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, sadR * 0.35, sadR * 0.12, Math.PI + 0.3, -0.3);
    ctx.stroke();
    // Tear drop
    ctx.fillStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(sadR * 0.3, sadR * 0.15, 1.5, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Text
    ctx.fillStyle = '#D4506A';
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('\uAC8C\uC784 \uC624\uBC84!', GAME_WIDTH / 2, boxY + 110);

    ctx.fillStyle = '#7A4050';
    ctx.font = `22px ${FONT}`;
    ctx.fillText(`\uC810\uC218: ${score}`, GAME_WIDTH / 2, boxY + 145);

    ctx.fillStyle = '#C08090';
    ctx.font = `16px ${FONT}`;
    ctx.fillText('\uB2E4\uC2DC \uD558\uAE30 \u2665', GAME_WIDTH / 2, boxY + 185);

    ctx.restore();
  }
}
