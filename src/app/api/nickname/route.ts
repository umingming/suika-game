import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import {
  ensurePlayer,
  getClientId,
  getClientIp,
  getNicknameOwner,
  updatePlayerNickname,
} from '@/lib/leaderboard';

function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

function isValidNickname(nickname: string): boolean {
  if (nickname.length < 2 || nickname.length > 10) return false;
  // Allow Korean, alphanumeric, no special characters or spaces
  return /^[a-zA-Z0-9가-힣]+$/.test(nickname);
}

export async function GET(request: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ nickname: null });
    const clientId = getClientId(request);
    if (!clientId) return NextResponse.json({ nickname: null });
    const ip = getClientIp(request);
    const player = await ensurePlayer(redis, clientId, ip);
    return NextResponse.json({ nickname: player.nickname || null });
  } catch {
    return NextResponse.json({ nickname: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json();

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }

    if (!isValidNickname(nickname)) {
      return NextResponse.json(
        { error: '닉네임은 2~10자, 한글/영문/숫자만 가능합니다.' },
        { status: 400 },
      );
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: '서버에 연결할 수 없습니다.' }, { status: 503 });
    }

    const clientId = getClientId(request);
    if (!clientId) {
      return NextResponse.json({ error: '사용자 식별 정보가 없습니다.' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const player = await ensurePlayer(redis, clientId, ip);

    const ownerClientId = await getNicknameOwner(redis, nickname);
    if (ownerClientId && ownerClientId !== clientId) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 409 },
      );
    }

    const updatedPlayer = await updatePlayerNickname(redis, player, nickname);

    return NextResponse.json({ nickname: updatedPlayer.nickname });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
