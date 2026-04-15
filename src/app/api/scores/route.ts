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

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  ip: string;
}

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ entries: [] });
    // Get top 10 from sorted set (highest scores first)
    const results = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true });

    // Handle both @upstash/redis return formats:
    // - Newer versions: [{value: string, score: number}, ...]
    // - Older versions: flat array [member, score, member, score, ...]
    const entries: LeaderboardEntry[] = [];

    if (results.length > 0 && typeof results[0] === 'object' && results[0] !== null && 'score' in results[0]) {
      // Object array format: [{value, score}, ...]
      for (const item of results as Array<{ value: string; score: number }>) {
        const member = String(item.value);
        const colonIdx = member.indexOf(':');
        const ip = member.substring(0, colonIdx);
        const nickname = member.substring(colonIdx + 1);
        entries.push({ nickname, score: Number(item.score), ip });
      }
    } else {
      // Flat array format: [member, score, member, score, ...]
      const flat = results as string[];
      for (let i = 0; i < flat.length; i += 2) {
        const member = flat[i];
        const score = Number(flat[i + 1]);
        const colonIdx = member.indexOf(':');
        const ip = member.substring(0, colonIdx);
        const nickname = member.substring(colonIdx + 1);
        entries.push({ nickname, score, ip });
      }
    }

    // Mask IPs for privacy in response
    const safeEntries = entries.map(({ nickname, score, ip }) => ({
      nickname,
      score,
      ip: ip.replace(/\d+$/, '***'),
    }));

    return NextResponse.json({ entries: safeEntries });
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
    const ip = getClientIp(request);
    const nickname = await redis.get<string>(`nickname:${ip}`);

    if (!nickname) {
      return NextResponse.json({ error: '닉네임을 먼저 설정해주세요.' }, { status: 400 });
    }

    // Only update if this score is higher than existing best
    const bestScore = await redis.get<number>(`bestscore:${ip}`);

    if (bestScore !== null && score <= bestScore) {
      return NextResponse.json({ updated: false, bestScore });
    }

    // Remove old entry for this IP (if any) from sorted set
    // We need to find and remove the old member
    if (bestScore !== null) {
      // Old member key format
      const oldMember = `${ip}:${nickname}`;
      await redis.zrem('leaderboard', oldMember);
    }

    // Add new score to sorted set
    const member = `${ip}:${nickname}`;
    await redis.zadd('leaderboard', { score, member });

    // Update best score
    await redis.set(`bestscore:${ip}`, score);

    return NextResponse.json({ updated: true, bestScore: score });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
