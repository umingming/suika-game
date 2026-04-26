"use client";

import { useState, useEffect, useRef } from "react";
import { getClientHeaders } from "@/lib/clientId";

interface RankingEntry {
  nickname: string;
  score: number;
  ip: string;
}

interface NicknameScreenProps {
  onStart: (nickname: string) => Promise<string | null>;
  preparingGame: boolean;
}

export default function NicknameScreen({
  onStart,
  preparingGame,
}: NicknameScreenProps) {
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nickname") ?? "";
    }
    return "";
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [rankingEntries, setRankingEntries] = useState<RankingEntry[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    const previousNickname = localStorage.getItem("nickname") ?? "";

    if (trimmed.length < 2 || trimmed.length > 10) {
      setError("닉네임은 2~10자로 입력해주세요.");
      return;
    }

    if (!/^[a-zA-Z0-9가-힣]+$/.test(trimmed)) {
      setError("한글, 영문, 숫자만 사용할 수 있습니다.");
      return;
    }

    setError("");
    setSubmitting(true);

    // Await nickname save to Redis before starting game
    try {
      const res = await fetch("/api/nickname", {
        method: "POST",
        headers: getClientHeaders(),
        body: JSON.stringify({ nickname: trimmed, previousNickname }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "닉네임 저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
    } catch {
      setError("서버 연결에 실패했습니다. 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }

    localStorage.setItem("nickname", trimmed);
    setSubmitting(false);
    const startError = await onStart(trimmed);
    if (startError) {
      setError(startError);
      return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleShowRanking = async () => {
    setShowRanking(true);
    setRankingLoading(true);
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      setRankingEntries(data.entries ?? []);
    } catch {
      setRankingEntries([]);
    } finally {
      setRankingLoading(false);
    }
  };

  return (
    <div className="nickname-screen">
      <div className="nickname-container">
        <h1 className="nickname-title">박병호 만들기</h1>
        <div className="nickname-subtitle">키움 히어로즈 수박게임</div>

        <div className="nickname-form">
          <label className="nickname-label">닉네임을 입력하세요</label>
          <input
            ref={inputRef}
            type="text"
            className="nickname-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="닉네임"
            maxLength={10}
          />
          {error && <div className="nickname-error">{error}</div>}
          <button
            className="nickname-btn"
            onClick={handleSubmit}
            disabled={submitting || preparingGame}
          >
            {submitting || preparingGame ? "접속 중..." : "시작하기"}
          </button>
          <button
            className="nickname-btn nickname-btn-ranking"
            onClick={handleShowRanking}
          >
            랭킹 보기
          </button>
        </div>
      </div>

      {showRanking && (
        <div className="ranking-overlay" onClick={() => setShowRanking(false)}>
          <div className="ranking-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="ranking-title">Top 10 랭킹</h2>

            <div className="ranking-table-wrap">
              {rankingLoading ? (
                <div className="ranking-loading">순위 불러오는 중...</div>
              ) : rankingEntries.length === 0 ? (
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
                    {rankingEntries.map((entry, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{entry.nickname}</td>
                        <td>{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button
              className="ranking-btn"
              onClick={() => setShowRanking(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
