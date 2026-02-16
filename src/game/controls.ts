import { GAME_WIDTH, DROP_Y } from './constants';
import { FRUITS } from './fruits';

export interface ControlCallbacks {
  onMove: (x: number) => void;
  onDrop: (x: number) => void;
}

export function setupControls(
  canvas: HTMLCanvasElement,
  getScale: () => number,
  getCurrentLevel: () => number,
  callbacks: ControlCallbacks
): () => void {
  const getGameX = (clientX: number): number => {
    const rect = canvas.getBoundingClientRect();
    const scale = getScale();
    const canvasDisplayWidth = GAME_WIDTH * scale;
    const offsetX = rect.left + (rect.width - canvasDisplayWidth) / 2;
    const x = (clientX - offsetX) / scale;

    const level = getCurrentLevel();
    const radius = FRUITS[level]?.radius ?? 20;
    return Math.max(radius + 8, Math.min(GAME_WIDTH - radius - 8, x));
  };

  const handleMouseMove = (e: MouseEvent) => {
    callbacks.onMove(getGameX(e.clientX));
  };

  const handleMouseUp = (e: MouseEvent) => {
    callbacks.onDrop(getGameX(e.clientX));
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      callbacks.onMove(getGameX(e.touches[0].clientX));
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      callbacks.onDrop(getGameX(e.changedTouches[0].clientX));
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      callbacks.onMove(getGameX(e.touches[0].clientX));
    }
  };

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
  };
}
