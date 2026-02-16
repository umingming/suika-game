'use client';

import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex items-center justify-center" style={{ background: '#0F0F1E' }}>
      <p className="text-base text-gray-600">Loading...</p>
    </div>
  ),
});

export default function GameLoader() {
  return <GameCanvas />;
}
