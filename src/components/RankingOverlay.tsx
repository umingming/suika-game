'use client';

import { useState, useEffect, useRef } from 'react';
import { getOrCreateClientId } from '@/lib/clientId';

interface RankingEntry {
  nickname: string;
  score: number;
  ip: string;
  clientId?: string;
}

interface RankingOverlayProps {
  score: number;
  nickname: string;
  onRestart: () => Promise<string | null>;
  onNicknameChange: (nickname: string) => Promise<string | null>;
  onSubmitScore: (score: number) => Promise<{
    ok: boolean;
    error?: string;
    updated?: boolean;
    bestScore?: number;
    alreadySubmitted?: boolean;
  }>;
  preparingGame: boolean;
}

export default function RankingOverlay({
  score,
  nickname,
  onRestart,
  onNicknameChange,
  onSubmitScore,
  preparingGame,
}: RankingOverlayProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nickname);
  const [editError, setEditError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [restartError, setRestartError] = useState('');
  const editRef = useRef<HTMLInputElement>(null);
  const clientIdRef = useRef<string | null>(null);

  useEffect(() => {
    clientIdRef.current = getOrCreateClientId();
  }, []);

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    }
  };

  const retrySubmit = async () => {
    setRetrying(true);
    setSubmitStatus('점수를 다시 등록하는 중...');
    const result = await onSubmitScore(score);
    setSubmitError(result.ok ? '' : (result.error || '점수 등록에 실패했습니다.'));
    if (result.ok) {
      setSubmitStatus(
        result.updated
          ? `최고 점수 ${result.bestScore ?? score}점으로 등록되었습니다.`
          : `기존 최고 점수 ${result.bestScore ?? score}점을 유지했습니다.`,
      );
    } else {
      setSubmitStatus('');
    }
    await fetchRankings();
    setRetrying(false);
  };

  useEffect(() => {
    (async () => {
      setSubmitStatus('점수를 등록하는 중...');
      const result = await onSubmitScore(score);
      setSubmitError(result.ok ? '' : (result.error || '점수 등록에 실패했습니다.'));
      if (result.ok) {
        setSubmitStatus(
          result.updated
            ? `최고 점수 ${result.bestScore ?? score}점으로 등록되었습니다.`
            : `기존 최고 점수 ${result.bestScore ?? score}점을 유지했습니다.`,
        );
      } else {
        setSubmitStatus('');
      }
      await fetchRankings();
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editing]);

  const handleEditSubmit = async () => {
    const trimmed = editValue.trim();
    if (trimmed.length >= 2 && trimmed.length <= 10 && /^[a-zA-Z0-9가-힣]+$/.test(trimmed)) {
      setEditError('');
      const error = await onNicknameChange(trimmed);
      if (error) {
        setEditError(error);
      } else {
        setEditing(false);
        await fetchRankings();
      }
    }
  };

  const handleRestartClick = async () => {
    setRestartError('');
    const error = await onRestart();
    if (error) {
      setRestartError(error);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') {
      setEditValue(nickname);
      setEditing(false);
    }
  };

  return (
    <div className="ranking-overlay">
      <div className="ranking-box">
        <h2 className="ranking-title">게임 오버</h2>
        <div className="ranking-score">점수: {score}</div>

        {submitError && (
          <div className="ranking-submit-error">
            {submitError}
            <button className="ranking-retry-btn" onClick={retrySubmit} disabled={retrying}>
              {retrying ? '재시도 중...' : '다시 시도'}
            </button>
          </div>
        )}
        {!submitError && submitStatus && (
          <div className="ranking-loading">{submitStatus}</div>
        )}

        <div className="ranking-table-wrap">
          {loading ? (
            <div className="ranking-loading">순위 불러오는 중...</div>
          ) : entries.length === 0 ? (
            <div className="ranking-loading">아직 기록이 없습니다</div>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>닉네임</th>
                  <th>점수</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isMe = Boolean(entry.clientId && entry.clientId === clientIdRef.current);
                  return (
                    <tr key={i} className={isMe ? 'ranking-me' : ''}>
                      <td>{i + 1}</td>
                      <td>
                        {isMe && editing ? (
                          <>
                            <input
                              ref={editRef}
                              className="ranking-edit-input"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={handleEditSubmit}
                              maxLength={10}
                            />
                            {editError && <div className="nickname-error">{editError}</div>}
                          </>
                        ) : (
                          <span
                            className={isMe ? 'ranking-nickname-me' : ''}
                            onClick={() => {
                              if (isMe) {
                                setEditValue(nickname);
                                setEditing(true);
                              }
                            }}
                          >
                            {entry.nickname}
                            {isMe && ' ✎'}
                          </span>
                        )}
                      </td>
                      <td>{entry.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {restartError && <div className="nickname-error">{restartError}</div>}
        <button className="ranking-btn" onClick={handleRestartClick} disabled={preparingGame}>
          {preparingGame ? '준비 중...' : '다시 하기'}
        </button>
      </div>
    </div>
  );
}
