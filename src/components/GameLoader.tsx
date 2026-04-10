'use client';

import dynamic from 'next/dynamic';

const GameApp = dynamic(() => import('@/components/GameApp'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex items-center justify-center" style={{ background: '#2D0A1B' }}>
      <p className="text-base text-gray-600">Loading...</p>
    </div>
  ),
});

export default function GameLoader() {
  return <GameApp />;
}
