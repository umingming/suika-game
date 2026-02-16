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
  gazeX = 0, color = '#2A1A1A',
): void {
  // Simple bean eye in fruit outline color
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + gazeX, cy, er * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function drawHappyEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number
): void {
  ctx.save();
  ctx.strokeStyle = '#5A4A4A';
  ctx.lineWidth = Math.max(2, er * 0.25);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, er * 0.65, Math.PI + 0.3, -0.3);
  ctx.stroke();
  ctx.restore();
}

function drawStarEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
  gazeX = 0,
): void {
  // Simple emoji style: solid black circle + star
  ctx.fillStyle = '#2A1A1A';
  ctx.beginPath();
  ctx.arc(cx + gazeX, cy, er, 0, Math.PI * 2);
  ctx.fill();
  // Star sparkle
  ctx.fillStyle = '#FFE860';
  drawStar(ctx, cx + gazeX, cy, er * 0.7, 5);
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
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
  color = '#2A1A1A',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, er * 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.85, cy);
  ctx.quadraticCurveTo(cx, cy + er * 0.4, cx + er * 0.85, cy);
  ctx.stroke();
  ctx.restore();
}

function drawWinkEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
  color = '#2A1A1A',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, er * 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.6, cy - er * 0.45);
  ctx.lineTo(cx + er * 0.08, cy + er * 0.05);
  ctx.lineTo(cx - er * 0.6, cy + er * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawLineEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
  color = '#2A1A1A',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.5, er * 0.35);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - er * 0.6, cy);
  ctx.lineTo(cx + er * 0.6, cy);
  ctx.stroke();
  ctx.restore();
}

function drawXEye(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, er: number,
  direction: '>' | '<' = '>',
): void {
  ctx.save();
  ctx.strokeStyle = '#2A1A1A';
  ctx.lineWidth = Math.max(2, er * 0.35);
  ctx.lineCap = 'round';
  const s = direction === '>' ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx - s * er * 0.5, cy - er * 0.5);
  ctx.lineTo(cx + s * er * 0.3, cy);
  ctx.lineTo(cx - s * er * 0.5, cy + er * 0.5);
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
  const cheekR = Math.max(5, r * 0.24);
  const cheekY = r * 0.18;

  ctx.save();
  ctx.globalAlpha = 0.6;

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
  ctx.strokeStyle = '#5A4A4A';
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
  const exX = r * 0.32;  // eye X offset (wider apart)
  const eyY = -r * 0.05; // eye Y offset
  const er = Math.max(3, r * 0.13); // eye radius — small cute bean
  const mouthY = r * 0.25;
  ctx.lineCap = 'round';

  // Gaze: subtle shared eye drift
  const gazeX = Math.sin(frameTime * 0.0008) * Math.max(0.5, er * 0.1);

  // Mouth breath animation for open mouths
  const breathScale = 1 + Math.sin(frameTime * 0.003) * 0.02;

  switch (level) {
    case 0: {
      // Cherry: surprised — big round eyes + small 'o' mouth
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // 'o' mouth
      ctx.strokeStyle = '#5A4A4A';
      ctx.lineWidth = Math.max(1.5, r * 0.05);
      ctx.beginPath();
      ctx.arc(0, mouthY, r * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 1: {
      // Strawberry: round eyes + ω mouth
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // ω cat mouth
      ctx.strokeStyle = '#5A4A4A';
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
      ctx.strokeStyle = '#5A4A4A';
      ctx.lineWidth = Math.max(1.5, r * 0.04);
      ctx.beginPath();
      ctx.arc(0, mouthY - r * 0.02, r * 0.1, 0.15, Math.PI - 0.15);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 3: {
      // Tangerine: wink (left) + round eye (right) + tongue out
      drawWinkEye(ctx, -exX, eyY, er);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // Tongue out mouth
      ctx.strokeStyle = '#5A4A4A';
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
      ctx.strokeStyle = '#5A4A4A';
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
      // Apple: excited — big round eyes + wide open smile
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // Big smile with teeth (breathing)
      const mw = r * 0.2 * breathScale;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#5A4A4A';
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
      // Pear: round eyes + wide smile
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // Wide happy smile (breathing)
      const mw = r * 0.18 * breathScale;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#5A4A4A';
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
      // Peach: round eyes + heart cheeks
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // Wide grin (breathing)
      const mw = r * 0.2 * breathScale;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#E05070';
      ctx.fill();
      ctx.strokeStyle = '#5A4A4A';
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
      // Pineapple: round eyes + cool smirk
      drawRoundEye(ctx, -exX, eyY, er, gazeX);
      drawRoundEye(ctx, exX, eyY, er, gazeX);
      // Cool smirk
      ctx.strokeStyle = '#5A4A4A';
      ctx.lineWidth = Math.max(2, r * 0.04);
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, mouthY);
      ctx.quadraticCurveTo(r * 0.05, mouthY + r * 0.08, r * 0.15, mouthY - r * 0.02);
      ctx.stroke();
      drawCheeks(ctx, r, level);
      break;
    }
    case 9: {
      // Melon: >< eyes + wide laugh
      const xEyeR = Math.max(4, r * 0.18);
      drawXEye(ctx, -exX, eyY, xEyeR, '>');
      drawXEye(ctx, exX, eyY, xEyeR, '<');
      // Big laugh (breathing)
      const mw = r * 0.22 * breathScale;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#D35A5A';
      ctx.fill();
      ctx.strokeStyle = '#5A4A4A';
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
      // Watermelon: big sunglasses + biggest grin
      const glassR = Math.max(8, r * 0.22);
      ctx.strokeStyle = '#2A2A3E';
      ctx.lineWidth = Math.max(2.5, r * 0.03);
      ctx.beginPath();
      ctx.moveTo(-exX + glassR * 1.05, eyY);
      ctx.lineTo(exX - glassR * 1.05, eyY);
      ctx.stroke();
      drawSunglassesEye(ctx, -exX, eyY, glassR);
      drawSunglassesEye(ctx, exX, eyY, glassR);
      // Mega grin (breathing)
      const mw = r * 0.24 * breathScale;
      ctx.beginPath();
      ctx.arc(0, mouthY, mw, 0, Math.PI);
      ctx.fillStyle = '#E05070';
      ctx.fill();
      ctx.strokeStyle = '#5A4A4A';
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
  // Container background (retro bright gray)
  ctx.fillStyle = COLORS.containerBg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 8-bit scanline effect
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  for (let y = DANGER_LINE_Y; y < PLAY_AREA_HEIGHT; y += 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  // Side walls (8-bit style - sharp edges)
  const wallW = 8;
  ctx.fillStyle = COLORS.wallColor;
  ctx.fillRect(0, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Wall highlight (retro style)
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - 2, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Floor (8-bit style)
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, wallW);

  // Floor highlight
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, 2);

  // Danger line — 8-bit style (solid red)
  ctx.fillStyle = COLORS.dangerLine;
  ctx.fillRect(wallW, DANGER_LINE_Y - 1, GAME_WIDTH - wallW * 2, 3);
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

    // Outer ring
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner glow
    ctx.globalAlpha = effect.alpha * 0.2;
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

    ctx.restore();
  }
}

// ── Cute UI box helper ──

function drawCuteBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius = 0
): void {
  // Background (retro bright)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);

  // Border (retro pixel style - thick black)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  
  // Inner highlight (retro 3D effect)
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + 2, y + 2, w - 4, 2);
  ctx.fillRect(x + 2, y + 2, 2, h - 4);
  
  // Inner shadow
  ctx.fillStyle = '#808080';
  ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
  ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
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

  // Label (retro style)
  ctx.fillStyle = '#000000';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', GAME_WIDTH - 45, 22);

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
    const alpha = intensity * 0.1 * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, GAME_WIDTH, DANGER_LINE_Y + 100);
    ctx.restore();
  }
}

// ── Fruit stages indicator ──

function drawFruitStages(ctx: CanvasRenderingContext2D): void {
  const panelY = PLAY_AREA_HEIGHT;
  const panelH = GAME_HEIGHT - PLAY_AREA_HEIGHT;

  // Panel background (retro dark)
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, panelY, GAME_WIDTH, panelH);

  // Retro scanline effect
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  for (let y = panelY; y < GAME_HEIGHT; y += 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  // Top border line (retro style)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, panelY, GAME_WIDTH, 2);
  
  // Highlight line
  ctx.fillStyle = '#404040';
  ctx.fillRect(0, panelY + 2, GAME_WIDTH, 1);

  const count = FRUITS.length; // 11
  const centerY = panelY + panelH / 2;

  // Calculate mini sizes for each fruit
  const sizes = FRUITS.map((_, i) => 10 * Math.pow(1.1, i));
  const totalDiameters = sizes.reduce((sum, s) => sum + s * 2, 0);
  const gap = 20;
  const totalW = totalDiameters + gap * (count - 1);
  let curX = (GAME_WIDTH - totalW) / 2;

  for (let i = 0; i < count; i++) {
    const miniSize = sizes[i];
    const cx = curX + miniSize;

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

  ctx.fillStyle = '#000000';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 20, 22);

  ctx.fillStyle = '#000000';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText(`${score}`, 20, 48);

  ctx.fillStyle = '#404040';
  ctx.font = `10px ${FONT}`;
  ctx.fillText(`BEST: ${highScore}`, 20, 66);
  ctx.restore();

  // Game over overlay
  if (isGameOver) {
    ctx.save();
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, GAME_WIDTH, PLAY_AREA_HEIGHT);

    // Box
    const boxX = GAME_WIDTH / 2 - 165;
    const boxY = PLAY_AREA_HEIGHT / 2 - 100;
    const boxW = 330;
    const boxH = 220;

    // Box bg (retro style - sharp corners)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    // Inner highlight (retro 3D effect)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(boxX + 3, boxY + 3, boxW - 6, 4);
    ctx.fillRect(boxX + 3, boxY + 3, 4, boxH - 6);
    
    // Inner shadow
    ctx.fillStyle = '#808080';
    ctx.fillRect(boxX + boxW - 7, boxY + 3, 4, boxH - 6);
    ctx.fillRect(boxX + 3, boxY + boxH - 7, boxW - 6, 4);

    // Text (retro style)
    ctx.fillStyle = '#000000';
    ctx.font = `bold 32px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', GAME_WIDTH / 2, boxY + 100);

    ctx.fillStyle = '#000000';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(`점수: ${score}`, GAME_WIDTH / 2, boxY + 140);

    ctx.fillStyle = '#404040';
    ctx.font = `14px ${FONT}`;
    ctx.fillText('다시 하기', GAME_WIDTH / 2, boxY + 180);

    ctx.restore();
  }
}
