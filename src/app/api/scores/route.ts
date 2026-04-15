import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
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

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ entries: [] });
    const entries = await getLeaderboardEntries(redis);
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

    if (!player.nickname) {
      return NextResponse.json({ error: '닉네임을 먼저 설정해주세요.' }, { status: 400 });
    }

    const result = await recordScore(redis, player, score);

    return NextResponse.json({ updated: result.updated, bestScore: result.bestScore });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
