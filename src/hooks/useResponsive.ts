'use client';

import { useEffect, useState, type RefObject } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/constants';

export function useResponsive(containerRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const scaleByWidth = rect.width / GAME_WIDTH;
      const scaleByHeight = rect.height / GAME_HEIGHT;
      setScale(Math.min(scaleByWidth, scaleByHeight));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}
