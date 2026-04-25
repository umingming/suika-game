import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import {
  GAME_SESSION_COOKIE,
  getGameDurationMs,
  loadGameSession,
  MIN_GAME_DURATION_MS,
  saveGameSession,
} from '@/lib/gameSession';
import {
  ensurePlayer,
  getClientId,
  getClientIp,
  getLeaderboardEntries,
  recordScore,
} from '@/lib/leaderboard';

function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ entries: [] });

    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 500) : 10;

    const entries = await getLeaderboardEntries(redis, limit);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { score } = await request.json();

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: '유효하지 않은 점수입니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) return NextResponse.json({ error: '서버에 연결할 수 없습니다.' }, { status: 503 });

    const clientId = getClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: '사용자 식별 정보가 없습니다.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const player = await ensurePlayer(redis, clientId, ip);
    const sessionId = request.cookies.get(GAME_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: '게임 세션이 없습니다. 새 게임을 시작해주세요.' }, { status: 400 });
    }

    const session = await loadGameSession(redis, sessionId);
    if (!session || session.clientId !== clientId) {
      return NextResponse.json({ error: '유효하지 않은 게임 세션입니다. 다시 시작해주세요.' }, { status: 400 });
    }

    if (!player.nickname) {
      return NextResponse.json({ error: '닉네임을 먼저 설정해주세요.' }, { status: 400 });
    }

    if (session.submittedAt) {
      if (session.submittedScore === score) {
        const result = await recordScore(redis, player, score);
        return NextResponse.json({
          updated: result.updated,
          bestScore: result.bestScore,
          alreadySubmitted: true,
        });
      }

      return NextResponse.json({ error: '이미 점수가 제출된 게임입니다.' }, { status: 409 });
    }

    if (getGameDurationMs(session) < MIN_GAME_DURATION_MS) {
      return NextResponse.json(
        { error: '게임 시간이 너무 짧아 점수를 등록할 수 없습니다. 다시 시도해주세요.' },
        { status: 400 },
      );
    }

    const result = await recordScore(redis, player, score);
    await saveGameSession(redis, {
      ...session,
      submittedAt: new Date().toISOString(),
      submittedScore: score,
    });

    return NextResponse.json({ updated: result.updated, bestScore: result.bestScore });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
