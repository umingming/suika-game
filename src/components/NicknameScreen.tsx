'use client';

import { useState, useEffect, useRef } from 'react';

interface NicknameScreenProps {
  onStart: (nickname: string) => void;
}

export default function NicknameScreen({ onStart }: NicknameScreenProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load existing nickname on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/nickname');
        const data = await res.json();
        if (data.nickname) {
          setNickname(data.nickname);
        }
      } catch {
        // Ignore fetch errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();

    if (trimmed.length < 2 || trimmed.length > 10) {
      setError('닉네임은 2~10자로 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]+$/.test(trimmed)) {
      setError('한글, 영문, 숫자만 사용할 수 있습니다.');
      return;
    }

    setError('');

    // Save nickname but don't block game start on failure
    try {
      await fetch('/api/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      });
    } catch {
      // Continue even if save fails - allow offline play
    }

    onStart(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="nickname-screen">
      <div className="nickname-container">
        <h1 className="nickname-title">김하성 만들기</h1>
        <div className="nickname-subtitle">키움 히어로즈 수박게임</div>

        <div className="nickname-form">
          <label className="nickname-label">닉네임을 입력하세요</label>
          <input
            ref={inputRef}
            type="text"
            className="nickname-input"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? '불러오는 중...' : '닉네임'}
            maxLength={10}
            disabled={loading}
          />
          {error && <div className="nickname-error">{error}</div>}
          <button
            className="nickname-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
