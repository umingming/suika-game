'use client';

import { useEffect, useEffectEvent } from 'react';

export function useGameLoop(callback: () => void) {
  const onFrame = useEffectEvent(callback);

  useEffect(() => {
    let animationId: number;

    const loop = () => {
      onFrame();
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
}
