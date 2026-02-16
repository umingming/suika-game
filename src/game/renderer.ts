import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, DANGER_LINE_Y, COLORS } from './constants';
import { FRUITS } from './fruits';
import type { FruitBody, MergeEffect, DecoType } from '@/types/game';

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
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.05, 0, 0, r * 0.7);
  ctx.stroke();
  // Horizontal line
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

  // Curved horizontal lines
  for (let i = -2; i <= 2; i++) {
    const y = i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, y);
    ctx.quadraticCurveTo(0, y + r * 0.08, r * 0.8, y);
    ctx.stroke();
  }
  // Curved vertical lines
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

// ── Cute face drawing ──

function drawCuteFace(ctx: CanvasRenderingContext2D, r: number, level: number): void {
  const eyeOffsetX = r * 0.22;
  const eyeOffsetY = -r * 0.06;
  const eyeRadius = Math.max(2.5, r * 0.1);

  // Eyes - big round with larger highlight
  ctx.fillStyle = '#2C2C2C';
  ctx.beginPath();
  ctx.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights (bigger, more sparkly)
  const hlR = Math.max(1.2, eyeRadius * 0.5);
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(-eyeOffsetX - hlR * 0.3, eyeOffsetY - hlR * 0.4, hlR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX - hlR * 0.3, eyeOffsetY - hlR * 0.4, hlR, 0, Math.PI * 2);
  ctx.fill();
  // Small secondary highlight
  const hlR2 = Math.max(0.6, hlR * 0.35);
  ctx.beginPath();
  ctx.arc(-eyeOffsetX + hlR * 0.4, eyeOffsetY + hlR * 0.3, hlR2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX + hlR * 0.4, eyeOffsetY + hlR * 0.3, hlR2, 0, Math.PI * 2);
  ctx.fill();

  // Mouth - varies by level for personality
  ctx.strokeStyle = '#2C2C2C';
  ctx.fillStyle = '#2C2C2C';
  ctx.lineWidth = Math.max(1.2, r * 0.035);
  ctx.lineCap = 'round';

  const mouthY = r * 0.2;
  if (level <= 2) {
    // Small fruits: cat mouth (ω shape)
    const mw = r * 0.15;
    ctx.beginPath();
    ctx.moveTo(-mw, mouthY);
    ctx.quadraticCurveTo(-mw * 0.5, mouthY + r * 0.08, 0, mouthY);
    ctx.quadraticCurveTo(mw * 0.5, mouthY + r * 0.08, mw, mouthY);
    ctx.stroke();
  } else if (level <= 6) {
    // Medium fruits: open smile
    ctx.beginPath();
    ctx.arc(0, mouthY - r * 0.02, r * 0.1, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    // Big fruits: wide happy grin
    const mw = r * 0.13;
    ctx.beginPath();
    ctx.arc(0, mouthY - r * 0.03, mw, 0, Math.PI);
    ctx.fillStyle = '#D35A5A';
    ctx.fill();
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.stroke();
  }

  // Cheeks - softer, rounder blush
  ctx.globalAlpha = 0.3;
  const cheekR = Math.max(3, r * 0.13);
  const gradient1 = ctx.createRadialGradient(
    -r * 0.36, r * 0.14, 0, -r * 0.36, r * 0.14, cheekR
  );
  gradient1.addColorStop(0, '#FF8FAA');
  gradient1.addColorStop(1, 'rgba(255,143,170,0)');
  ctx.fillStyle = gradient1;
  ctx.beginPath();
  ctx.arc(-r * 0.36, r * 0.14, cheekR, 0, Math.PI * 2);
  ctx.fill();

  const gradient2 = ctx.createRadialGradient(
    r * 0.36, r * 0.14, 0, r * 0.36, r * 0.14, cheekR
  );
  gradient2.addColorStop(0, '#FF8FAA');
  gradient2.addColorStop(1, 'rgba(255,143,170,0)');
  ctx.fillStyle = gradient2;
  ctx.beginPath();
  ctx.arc(r * 0.36, r * 0.14, cheekR, 0, Math.PI * 2);
  ctx.fill();
}

// ── Background ──

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Container background
  ctx.fillStyle = COLORS.containerBg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Side walls with wood-like feel
  const wallW = 8;
  ctx.fillStyle = COLORS.wallColor;
  ctx.fillRect(0, DANGER_LINE_Y, wallW, GAME_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW, DANGER_LINE_Y, wallW, GAME_HEIGHT - DANGER_LINE_Y);

  // Wall highlight stripe
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(2, DANGER_LINE_Y, 2, GAME_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW + 4, DANGER_LINE_Y, 2, GAME_HEIGHT - DANGER_LINE_Y);

  // Floor
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(0, GAME_HEIGHT - wallW, GAME_WIDTH, wallW);
  // Floor highlight
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, GAME_HEIGHT - wallW, GAME_WIDTH, 2);

  // Rounded corners where walls meet floor
  ctx.fillStyle = COLORS.containerBg;
  const cornerR = 6;
  // Bottom-left
  ctx.save();
  ctx.beginPath();
  ctx.rect(wallW, GAME_HEIGHT - wallW - cornerR, cornerR, cornerR);
  ctx.clip();
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(wallW, GAME_HEIGHT - wallW - cornerR, cornerR, cornerR);
  ctx.fillStyle = COLORS.containerBg;
  ctx.beginPath();
  ctx.arc(wallW + cornerR, GAME_HEIGHT - wallW, cornerR, Math.PI, Math.PI * 1.5);
  ctx.lineTo(wallW, GAME_HEIGHT - wallW);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Danger line - soft dashed
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = COLORS.dangerLine;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(wallW, DANGER_LINE_Y);
  ctx.lineTo(GAME_WIDTH - wallW, DANGER_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);
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

  // Soft shadow
  ctx.beginPath();
  ctx.arc(1.5, 2, r + 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fill();

  // Body with gradient
  const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
  bodyGrad.addColorStop(0, config.highlight);
  bodyGrad.addColorStop(0.6, config.color);
  bodyGrad.addColorStop(1, config.color);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Soft outline
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Decorations (behind face, textures/patterns)
  drawDecorations(ctx, r, config.decorations, config.decoColor ?? '#4A9E3F');

  // Highlight (3D gloss)
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.22, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
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
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + config.radius);
  ctx.lineTo(x, GAME_HEIGHT - 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Preview fruit (semi-transparent)
  drawFruit(ctx, x, y, level, 0, 0.45);
}

// ── Merge effects ──

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

    // Inner sparkle glow
    ctx.globalAlpha = effect.alpha * 0.3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = effect.color;
    ctx.fill();

    ctx.restore();
  }
}

// ── Next fruit preview ──

export function drawNextFruitPreview(
  ctx: CanvasRenderingContext2D,
  level: number
): void {
  const config = FRUITS[level];
  if (!config) return;

  // Preview box with softer style
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.strokeStyle = COLORS.wallColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(GAME_WIDTH - 80, 10, 70, 70, 12);
  ctx.fill();
  ctx.stroke();

  // Label
  ctx.fillStyle = '#999';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', GAME_WIDTH - 45, 24);

  // Mini fruit
  const scale = Math.min(1, 22 / config.radius);
  ctx.translate(GAME_WIDTH - 45, 52);
  ctx.scale(scale, scale);
  drawFruit(ctx, 0, 0, level, 0);
  ctx.restore();
}

// ── Main render frame ──

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
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawBackground(ctx);

  // Draw all fruit bodies
  const bodies = Matter.Composite.allBodies(engine.world);
  for (const body of bodies) {
    if (body.isStatic) continue;
    const fb = body as FruitBody;
    if (fb.fruitLevel !== undefined) {
      drawFruit(ctx, fb.position.x, fb.position.y, fb.fruitLevel, fb.angle);
    }
  }

  // Draw merge effects
  drawMergeEffects(ctx, effects);

  // Draw drop preview
  if (dropX !== null && !isGameOver) {
    drawDropPreview(ctx, dropX, 80, currentFruitLevel);
  }

  // Draw next fruit preview
  drawNextFruitPreview(ctx, nextFruitLevel);

  // Draw score with softer style
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.strokeStyle = COLORS.wallColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(10, 10, 120, 70, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#999';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 22, 24);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${score}`, 22, 48);

  ctx.fillStyle = '#BBB';
  ctx.font = '10px sans-serif';
  ctx.fillText(`BEST: ${highScore}`, 22, 66);
  ctx.restore();

  // Game over overlay
  if (isGameOver) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Rounded box for game over text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 80, 320, 180, 20);
    ctx.fill();

    ctx.fillStyle = '#E84057';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    ctx.fillStyle = '#666';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);

    ctx.fillStyle = '#999';
    ctx.font = '15px sans-serif';
    ctx.fillText('Tap to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    ctx.restore();
  }
}
