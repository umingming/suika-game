'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Submit score to server
  const submitScore = useCallback(async (score: number) => {
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
    } catch {
      // Score submission failed silently
    }
  }, []);

  const handleStart = useCallback((name: string) => {
    setNickname(name);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setScreen('gameover');
    submitScore(score);
  }, [submitScore]);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleNicknameChange = useCallback(async (newNickname: string) => {
    setNickname(newNickname);
    try {
      await fetch('/api/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname }),
      });
    } catch {
      // Nickname update failed silently
    }
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
        />
      )}
    </div>
  );
}
