'use client';

import { useState, useCallback, useRef } from 'react';
import NicknameScreen from './NicknameScreen';
import RankingOverlay from './RankingOverlay';
import GameCanvas from './GameCanvas';

type Screen = 'nickname' | 'playing' | 'gameover';

export default function GameApp() {
  const [screen, setScreen] = useState<Screen>('nickname');
  const [nickname, setNickname] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;

  // Submit score to server with 1 retry, returns true on success
  const submitScore = useCallback(async (score: number): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score }),
        });
        if (res.ok) return true;
        console.error(`Score submit attempt ${attempt + 1} failed:`, res.status, await res.text());
      } catch (err) {
        console.error(`Score submit attempt ${attempt + 1} error:`, err);
      }
      // Wait briefly before retry
      if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
    }
    return false;
  }, []);

  const handleStart = useCallback((name: string) => {
    setNickname(name);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setScreen('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleNicknameChange = useCallback(async (newNickname: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname }),
      });
      if (res.status === 409) {
        const data = await res.json();
        return data.error || '이미 사용 중인 닉네임입니다.';
      }
      if (res.ok) {
        setNickname(newNickname);
        return null;
      }
    } catch {
      // Network error — allow optimistic update
    }
    setNickname(newNickname);
    return null;
  }, []);

  if (screen === 'nickname') {
    return <NicknameScreen onStart={handleStart} />;
  }

  return (
    <div className="relative w-full h-dvh">
      <GameCanvas
        key={gameKey}
        onGameOver={handleGameOver}
        isOverlayActive={screen === 'gameover'}
      />
      {screen === 'gameover' && (
        <RankingOverlay
          score={finalScore}
          nickname={nickname}
          onRestart={handleRestart}
          onNicknameChange={handleNicknameChange}
          onSubmitScore={submitScore}
        />
      )}
    </div>
  );
}
