'use client';

import { useEffect, useRef } from 'react';

export function useGameLoop(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let animationId: number;

    const loop = () => {
      callbackRef.current();
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
}
