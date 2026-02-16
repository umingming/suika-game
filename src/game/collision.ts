import Matter from 'matter-js';
import { FRUITS } from './fruits';
import { createFruitBody, removeFruitBody } from './engine';
import { DANGER_LINE_Y } from './constants';
import type { FruitBody, MergeEffect } from '@/types/game';

const { Composite, Events } = Matter;

export interface CollisionCallbacks {
  onScore: (points: number) => void;
  onGameOver: () => void;
  onMergeEffect: (effect: MergeEffect) => void;
}

export function setupCollisionHandler(
  engine: Matter.Engine,
  callbacks: CollisionCallbacks
): () => void {
  let gameOverCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  const handler = (event: Matter.IEventCollision<Matter.Engine>) => {
    const pairs = event.pairs;

    for (const pair of pairs) {
      const bodyA = pair.bodyA as FruitBody;
      const bodyB = pair.bodyB as FruitBody;

      // Skip walls/floor
      if (bodyA.isStatic || bodyB.isStatic) continue;

      // Skip if not fruits
      if (bodyA.fruitLevel === undefined || bodyB.fruitLevel === undefined) continue;

      // Skip if different levels
      if (bodyA.fruitLevel !== bodyB.fruitLevel) continue;

      // Skip if already merging
      if (bodyA.isMerging || bodyB.isMerging) continue;

      // Skip if max level (watermelon)
      if (bodyA.fruitLevel >= 10) continue;

      // Mark as merging to prevent double processing
      bodyA.isMerging = true;
      bodyB.isMerging = true;

      const midX = (bodyA.position.x + bodyB.position.x) / 2;
      const midY = (bodyA.position.y + bodyB.position.y) / 2;
      const newLevel = bodyA.fruitLevel + 1;

      // Remove both fruits
      removeFruitBody(engine, bodyA);
      removeFruitBody(engine, bodyB);

      // Create merged fruit
      const newFruit = createFruitBody(midX, midY, newLevel);
      Composite.add(engine.world, newFruit);

      // Score
      callbacks.onScore(FRUITS[newLevel].scoreValue);

      // Merge effect
      callbacks.onMergeEffect({
        x: midX,
        y: midY,
        radius: 5,
        maxRadius: FRUITS[newLevel].radius * 1.5,
        color: FRUITS[newLevel].color,
        alpha: 0.8,
      });
    }
  };

  // Game over check: runs periodically
  const checkGameOver = () => {
    const bodies = Composite.allBodies(engine.world);
    for (const body of bodies) {
      if (body.isStatic) continue;
      const fb = body as FruitBody;
      if (fb.fruitLevel === undefined) continue;
      if (fb.isMerging) continue;

      // Check if fruit is above danger line and has settled (low velocity)
      const speed = Math.sqrt(fb.velocity.x ** 2 + fb.velocity.y ** 2);
      if (fb.position.y - FRUITS[fb.fruitLevel].radius < DANGER_LINE_Y && speed < 1) {
        callbacks.onGameOver();
        return;
      }
    }
  };

  Events.on(engine, 'collisionStart', handler);

  // Start periodic game over check (after initial delay)
  const startDelay = setTimeout(() => {
    gameOverCheckTimeout = setInterval(checkGameOver, 1000) as unknown as ReturnType<typeof setTimeout>;
  }, 2000);

  return () => {
    Events.off(engine, 'collisionStart', handler);
    if (gameOverCheckTimeout) clearInterval(gameOverCheckTimeout);
    clearTimeout(startDelay);
  };
}
