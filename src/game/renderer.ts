import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, PLAY_AREA_HEIGHT, DANGER_LINE_Y, COLORS } from './constants';
import { FRUITS } from './fruits';
import type { FruitBody, MergeEffect } from '@/types/game';

const FONT = "'Jua', sans-serif";

// ── Player image preloading ──

const playerImages: Map<number, HTMLImageElement> = new Map();

export function preloadPlayerImages(): Promise<void> {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = FRUITS.length;

    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.onload = () => {
        playerImages.set(i, img);
        loaded++;
        if (loaded === total) {
          resolve();
        }
      };
      img.onerror = () => {
        // Image failed to load — fallback will be used
        loaded++;
        if (loaded === total) {
          resolve();
        }
      };
      img.src = FRUITS[i].image;
    }
  });
}

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

// ── Background ──

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Container background
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

  // Side walls (8-bit style)
  const wallW = 8;
  ctx.fillStyle = COLORS.wallColor;
  ctx.fillRect(0, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - wallW, DANGER_LINE_Y, wallW, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Wall highlight
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);
  ctx.fillRect(GAME_WIDTH - 2, DANGER_LINE_Y, 2, PLAY_AREA_HEIGHT - DANGER_LINE_Y);

  // Floor
  ctx.fillStyle = COLORS.floorColor;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, wallW);

  // Floor highlight
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, PLAY_AREA_HEIGHT - wallW, GAME_WIDTH, 2);

  // Danger line
  ctx.fillStyle = COLORS.dangerLine;
  ctx.fillRect(wallW, DANGER_LINE_Y - 1, GAME_WIDTH - wallW * 2, 3);
}

// ── Main fruit (player) drawing ──

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

  const img = playerImages.get(level);

  // Burgundy border circle
  const borderWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(0, 0, r + borderWidth, 0, Math.PI * 2);
  ctx.fillStyle = darkenColor(config.color, 30);
  ctx.fill();

  // Clip to circle for image
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    // Draw player image centered and covering the circle
    const size = r * 2;
    ctx.drawImage(img, -r, -r, size, size);
  } else {
    // Fallback: burgundy circle with player name
    const bodyGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    bodyGrad.addColorStop(0, config.highlight);
    bodyGrad.addColorStop(0.5, config.color);
    bodyGrad.addColorStop(1, darkenColor(config.color, 15));
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    // Player name text
    ctx.fillStyle = '#FFFFFF';
    const fontSize = Math.max(8, r * 0.35);
    ctx.font = `bold ${fontSize}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.name, 0, 0);
  }

  ctx.restore(); // restore clip

  // Gloss highlight on top
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.25, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();

  ctx.restore(); // restore translate/rotate
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
  x: number, y: number, w: number, h: number
): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + 2, y + 2, w - 4, 2);
  ctx.fillRect(x + 2, y + 2, 2, h - 4);

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

// ── Fruit stages indicator (bottom panel) ──

function drawFruitStages(ctx: CanvasRenderingContext2D): void {
  const panelY = PLAY_AREA_HEIGHT;
  const panelH = GAME_HEIGHT - PLAY_AREA_HEIGHT;

  // Panel background (burgundy dark)
  ctx.fillStyle = COLORS.background;
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

  // Top border line
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, panelY, GAME_WIDTH, 2);

  ctx.fillStyle = '#404040';
  ctx.fillRect(0, panelY + 2, GAME_WIDTH, 1);

  const count = FRUITS.length; // 11
  const centerY = panelY + panelH / 2;

  const padding = 10;
  const availableW = GAME_WIDTH - padding * 2;

  // Calculate mini sizes for each fruit
  let sizes = FRUITS.map((_, i) => 11 * Math.pow(1.1, i));
  let totalDiameters = sizes.reduce((sum, s) => sum + s * 2, 0);
  const minGap = 2;
  let gap = Math.max(minGap, (availableW - totalDiameters) / (count - 1));

  // If still too wide, scale down all sizes to fit
  if (totalDiameters + minGap * (count - 1) > availableW) {
    const scaleFactor = (availableW - minGap * (count - 1)) / totalDiameters;
    sizes = sizes.map(s => s * scaleFactor);
    totalDiameters = sizes.reduce((sum, s) => sum + s * 2, 0);
    gap = minGap;
  }

  const totalW = totalDiameters + gap * (count - 1);
  let curX = (GAME_WIDTH - totalW) / 2;

  for (let i = 0; i < count; i++) {
    const miniSize = sizes[i];
    const cx = curX + miniSize;

    // Mini player
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
      let drawAngle = fb.angle;
      if (fb.speed < 0.3) {
        const phase = fb.id * 1.7;
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
  const scoreBoxW = 125;
  const scoreBoxH = 74;
  drawCuteBox(ctx, 8, 8, scoreBoxW, scoreBoxH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(8, 8, scoreBoxW, scoreBoxH);
  ctx.clip();

  ctx.fillStyle = '#000000';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 20, 22);

  ctx.fillStyle = '#000000';
  const scoreStr = `${score}`;
  const scoreFontSize = scoreStr.length > 5 ? 17 : 22;
  ctx.font = `bold ${scoreFontSize}px ${FONT}`;
  ctx.fillText(scoreStr, 20, 48);

  ctx.fillStyle = '#404040';
  ctx.font = `10px ${FONT}`;
  ctx.fillText(`BEST: ${highScore}`, 20, 66);
  ctx.restore();
  ctx.restore();

  // Game over overlay
  if (isGameOver) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, GAME_WIDTH, PLAY_AREA_HEIGHT);

    const boxW = GAME_WIDTH - 60;
    const boxX = (GAME_WIDTH - boxW) / 2;
    const boxY = PLAY_AREA_HEIGHT / 2 - 100;
    const boxH = 220;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(boxX + 3, boxY + 3, boxW - 6, 4);
    ctx.fillRect(boxX + 3, boxY + 3, 4, boxH - 6);

    ctx.fillStyle = '#808080';
    ctx.fillRect(boxX + boxW - 7, boxY + 3, 4, boxH - 6);
    ctx.fillRect(boxX + 3, boxY + boxH - 7, boxW - 6, 4);

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
