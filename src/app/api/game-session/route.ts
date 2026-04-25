import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createGameSession, GAME_SESSION_COOKIE, GAME_SESSION_TTL_SECONDS } from '@/lib/gameSession';
import { ensurePlayer, getClientId, getClientIp } from '@/lib/leaderboard';

function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: '서버에 연결할 수 없습니다.' }, { status: 503 });
    }

    const clientId = getClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: '사용자 식별 정보가 없습니다.' }, { status: 400 });
    }

    const player = await ensurePlayer(redis, clientId, getClientIp(request));
    if (!player.nickname) {
      return NextResponse.json({ error: '닉네임을 먼저 설정해주세요.' }, { status: 400 });
    }

    const session = await createGameSession(redis, clientId);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(GAME_SESSION_COOKIE, session.sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: GAME_SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: '게임 세션을 준비하지 못했습니다.' }, { status: 500 });
  }
}
