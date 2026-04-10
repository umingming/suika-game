'use client';

import { useState, useEffect, useRef } from 'react';

interface NicknameScreenProps {
  onStart: (nickname: string) => void;
}

export default function NicknameScreen({ onStart }: NicknameScreenProps) {
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nickname') ?? '';
    }
    return '';
  });
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

    // Save to localStorage for instant recall next time
    localStorage.setItem('nickname', trimmed);

    // Fire-and-forget: save to server without blocking game start
    fetch('/api/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: trimmed }),
    }).catch(() => {});

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
            placeholder="닉네임"
            maxLength={10}
          />
          {error && <div className="nickname-error">{error}</div>}
          <button
            className="nickname-btn"
            onClick={handleSubmit}
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
