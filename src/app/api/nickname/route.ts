import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
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
    const ip = getClientIp(request);
    const nickname = await redis.get<string>(`nickname:${ip}`);
    return NextResponse.json({ nickname: nickname ?? null });
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
    if (!redis) return NextResponse.json({ nickname });
    const ip = getClientIp(request);
    await redis.set(`nickname:${ip}`, nickname);

    return NextResponse.json({ nickname });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
