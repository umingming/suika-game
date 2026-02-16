import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS, PHYSICS } from './constants';
import { FRUITS } from './fruits';
import type { FruitBody } from '@/types/game';

const { Engine, Composite, Bodies, Body } = Matter;

export function createGameEngine(): Matter.Engine {
  const engine = Engine.create({
    gravity: { x: 0, y: 1.5, scale: 0.001 },
  });

  const wallOptions: Matter.IChamferableBodyDefinition = {
    isStatic: true,
    friction: 0.3,
    render: { visible: false },
  };

  const leftWall = Bodies.rectangle(
    -WALL_THICKNESS / 2,
    GAME_HEIGHT / 2,
    WALL_THICKNESS,
    GAME_HEIGHT,
    wallOptions
  );

  const rightWall = Bodies.rectangle(
    GAME_WIDTH + WALL_THICKNESS / 2,
    GAME_HEIGHT / 2,
    WALL_THICKNESS,
    GAME_HEIGHT,
    wallOptions
  );

  const floor = Bodies.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT + WALL_THICKNESS / 2,
    GAME_WIDTH + WALL_THICKNESS * 2,
    WALL_THICKNESS,
    wallOptions
  );

  Composite.add(engine.world, [leftWall, rightWall, floor]);

  return engine;
}

export function createFruitBody(
  x: number,
  y: number,
  level: number,
  isStatic = false
): FruitBody {
  const config = FRUITS[level];
  const body = Bodies.circle(x, y, config.radius, {
    friction: PHYSICS.friction,
    frictionStatic: PHYSICS.frictionStatic,
    frictionAir: PHYSICS.frictionAir,
    restitution: PHYSICS.restitution,
    isStatic,
    ...(isStatic && { collisionFilter: { group: -1, mask: 0 } }),
  }) as FruitBody;

  body.fruitLevel = level;
  body.isMerging = false;

  return body;
}

export function dropFruit(engine: Matter.Engine, body: FruitBody): void {
  Body.setStatic(body, false);
  body.collisionFilter = { group: 0, category: 0x0001, mask: 0xFFFF };
  Composite.add(engine.world, body);
}

export function removeFruitBody(engine: Matter.Engine, body: Matter.Body): void {
  Composite.remove(engine.world, body);
}
