'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, DROP_Y, DROP_COOLDOWN_MS } from '@/game/constants';
import { createFruitBody } from '@/game/engine';
import { renderFrame } from '@/game/renderer';
import { setupCollisionHandler } from '@/game/collision';
import { setupControls } from '@/game/controls';
import {
  createInitialState,
  advanceToNextFruit,
  addScore,
  setGameOver,
  setDropping,
} from '@/game/gameState';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { GamePhase } from '@/types/game';
import type { GameState, MergeEffect } from '@/types/game';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { engineRef, runnerRef } = useGameEngine();
  const scale = useResponsive(containerRef);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const [highScore, setHighScore] = useLocalStorage('suika-high-score', 0);

  const gameStateRef = useRef<GameState>(createInitialState());
  const dropXRef = useRef<number | null>(GAME_WIDTH / 2);
  const effectsRef = useRef<MergeEffect[]>([]);
  const lastDropTimeRef = useRef(0);
  const collisionCleanupRef = useRef<(() => void) | null>(null);
  const controlsCleanupRef = useRef<(() => void) | null>(null);
  const [, forceRender] = useState(0);

  const resetGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    // Remove all non-static bodies
    const bodies = Matter.Composite.allBodies(engine.world);
    const toRemove = bodies.filter(b => !b.isStatic);
    Matter.Composite.remove(engine.world, toRemove);

    // Reset state
    gameStateRef.current = createInitialState();
    dropXRef.current = GAME_WIDTH / 2;
    effectsRef.current = [];
    lastDropTimeRef.current = 0;
    forceRender(n => n + 1);
  }, [engineRef]);

  const handleDrop = useCallback((x: number) => {
    const engine = engineRef.current;
    const state = gameStateRef.current;

    if (!engine) return;

    // Handle game over click → restart
    if (state.phase === GamePhase.GAME_OVER) {
      resetGame();
      return;
    }

    if (state.phase !== GamePhase.READY) return;

    // Cooldown check
    const now = Date.now();
    if (now - lastDropTimeRef.current < DROP_COOLDOWN_MS) return;
    lastDropTimeRef.current = now;

    // Create and drop fruit
    gameStateRef.current = setDropping(state);
    const fruit = createFruitBody(x, DROP_Y, state.currentFruitLevel);
    Matter.Composite.add(engine.world, fruit);

    // Advance to next fruit after cooldown
    setTimeout(() => {
      gameStateRef.current = advanceToNextFruit(gameStateRef.current);
      forceRender(n => n + 1);
    }, DROP_COOLDOWN_MS);
  }, [engineRef, resetGame]);

  const handleMove = useCallback((x: number) => {
    dropXRef.current = x;
  }, []);

  // Setup collision handler
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const cleanup = setupCollisionHandler(engine, {
      onScore: (points) => {
        gameStateRef.current = addScore(gameStateRef.current, points);
        const newScore = gameStateRef.current.score;
        if (newScore > highScore) {
          setHighScore(newScore);
        }
        forceRender(n => n + 1);
      },
      onGameOver: () => {
        if (gameStateRef.current.phase === GamePhase.GAME_OVER) return;
        gameStateRef.current = setGameOver(gameStateRef.current);
        forceRender(n => n + 1);
      },
      onMergeEffect: (effect) => {
        effectsRef.current.push(effect);
      },
    });

    collisionCleanupRef.current = cleanup;
    return cleanup;
  }, [engineRef, highScore, setHighScore]);

  // Setup controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = setupControls(
      canvas,
      () => scaleRef.current,
      () => gameStateRef.current.currentFruitLevel,
      { onMove: handleMove, onDrop: handleDrop }
    );

    controlsCleanupRef.current = cleanup;
    return cleanup;
  }, [handleMove, handleDrop]);

  // Game render loop
  useGameLoop(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const engine = engineRef.current;
    if (!ctx || !engine) return;

    // Update merge effects
    effectsRef.current = effectsRef.current
      .map(e => ({
        ...e,
        radius: e.radius + 3,
        alpha: e.alpha - 0.03,
      }))
      .filter(e => e.alpha > 0 && e.radius < e.maxRadius);

    const state = gameStateRef.current;
    renderFrame(
      ctx,
      engine,
      state.phase === GamePhase.READY ? dropXRef.current : null,
      state.currentFruitLevel,
      state.nextFruitLevel,
      effectsRef.current,
      state.score,
      highScore,
      state.phase === GamePhase.GAME_OVER
    );
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-dvh flex items-start justify-center overflow-hidden"
      style={{ background: '#0F0F1E' }}
    >
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          touchAction: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
