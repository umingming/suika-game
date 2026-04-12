'use client';

import { useState, useEffect, useRef } from 'react';

interface RankingEntry {
  nickname: string;
  score: number;
  ip: string;
}

interface RankingOverlayProps {
  score: number;
  nickname: string;
  onRestart: () => void;
  onNicknameChange: (nickname: string) => Promise<string | null>;
  onSubmitScore: (score: number) => Promise<void>;
}

export default function RankingOverlay({
  score,
  nickname,
  onRestart,
  onNicknameChange,
  onSubmitScore,
}: RankingOverlayProps) {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(nickname);
  const [editError, setEditError] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        await onSubmitScore(score);
      } catch {
        // Score submission failed — still show rankings
      }
      try {
        const res = await fetch('/api/scores');
        const data = await res.json();
        setEntries(data.entries ?? []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
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
      }
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
                  const isMe = entry.nickname === nickname;
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

        <button className="ranking-btn" onClick={onRestart}>
          다시 하기
        </button>
      </div>
    </div>
  );
}
