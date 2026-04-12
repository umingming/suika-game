'use client';

import dynamic from 'next/dynamic';

const GameApp = dynamic(() => import('@/components/GameApp'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-dvh flex flex-col items-center justify-center gap-4" style={{ background: '#2D0A1B' }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid #5a2040',
          borderTop: '3px solid #B8446A',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p className="text-base text-gray-400" style={{ fontFamily: "'Jua', sans-serif" }}>선수 입장 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  ),
});

export default function GameLoader() {
  return <GameApp />;
}
