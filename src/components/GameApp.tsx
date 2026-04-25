'use client';

import { useState, useCallback } from 'react';
import NicknameScreen from './NicknameScreen';
import RankingOverlay from './RankingOverlay';
import GameCanvas from './GameCanvas';
import { getClientHeaders } from '@/lib/clientId';

type Screen = 'nickname' | 'playing' | 'gameover';
type SubmitScoreResult = {
  ok: boolean;
  error?: string;
  updated?: boolean;
  bestScore?: number;
  alreadySubmitted?: boolean;
};

export default function GameApp() {
  const [screen, setScreen] = useState<Screen>('nickname');
  const [nickname, setNickname] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [preparingGame, setPreparingGame] = useState(false);

  const initializeGameSession = useCallback(async (): Promise<string | null> => {
    setPreparingGame(true);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/game-session', {
          method: 'POST',
          headers: getClientHeaders(),
        });

        const data = await res.json().catch(() => null);
        if (res.ok) {
          setPreparingGame(false);
          return null;
        }

        const error = data?.error || '게임 준비에 실패했습니다.';
        if (res.status < 500) {
          setPreparingGame(false);
          return error;
        }
      } catch {
        // Retry once on transient network errors.
      }

      if (attempt === 0) await new Promise(r => setTimeout(r, 700));
    }

    setPreparingGame(false);
    return '게임 준비 중 네트워크 문제가 발생했습니다.';
  }, []);

  // Submit score to server with 1 retry, returns true on success
  const submitScore = useCallback(async (score: number): Promise<SubmitScoreResult> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: getClientHeaders(),
          body: JSON.stringify({ score }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          return {
            ok: true,
            updated: data?.updated,
            bestScore: data?.bestScore,
            alreadySubmitted: data?.alreadySubmitted,
          };
        }

        const error = data?.error || '점수를 저장하지 못했습니다.';
        console.error(`Score submit attempt ${attempt + 1} failed:`, res.status, error);

        if (res.status < 500) {
          return { ok: false, error };
        }
      } catch (err) {
        console.error(`Score submit attempt ${attempt + 1} error:`, err);
      }
      // Wait briefly before retry
      if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
    }

    return { ok: false, error: '점수 저장 중 네트워크 문제가 발생했습니다.' };
  }, []);

  const handleStart = useCallback(async (name: string): Promise<string | null> => {
    const error = await initializeGameSession();
    if (error) return error;

    setNickname(name);
    setScreen('playing');
    return null;
  }, [initializeGameSession]);

  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setScreen('gameover');
  }, []);

  const handleRestart = useCallback(async (): Promise<string | null> => {
    const error = await initializeGameSession();
    if (error) return error;

    setGameKey(k => k + 1);
    setScreen('playing');
    return null;
  }, [initializeGameSession]);

  const handleNicknameChange = useCallback(async (newNickname: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/nickname', {
        method: 'POST',
        headers: getClientHeaders(),
        body: JSON.stringify({ nickname: newNickname }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) return data?.error || '닉네임을 변경하지 못했습니다.';

      if (res.ok) {
        setNickname(newNickname);
        localStorage.setItem('nickname', newNickname);
        return null;
      }
    } catch {
      return '닉네임 변경 중 네트워크 문제가 발생했습니다.';
    }

    return '닉네임을 변경하지 못했습니다.';
  }, []);

  if (screen === 'nickname') {
    return <NicknameScreen onStart={handleStart} preparingGame={preparingGame} />;
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
          preparingGame={preparingGame}
        />
      )}
    </div>
  );
}
