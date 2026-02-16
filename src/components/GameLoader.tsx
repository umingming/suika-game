'use client';

import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex items-center justify-center" style={{ background: '#F5E6C8' }}>
      <p className="text-lg text-amber-800">Loading...</p>
    </div>
  ),
});

export default function GameLoader() {
  return <GameCanvas />;
}
