'use client';

import { useRef, useEffect } from 'react';
import Matter from 'matter-js';
import { createGameEngine } from '@/game/engine';

export function useGameEngine() {
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  useEffect(() => {
    const engine = createGameEngine();
    engineRef.current = engine;

    const runner = Matter.Runner.create({ delta: 1000 / 60 });
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    return () => {
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        Matter.Composite.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return { engineRef, runnerRef };
}
