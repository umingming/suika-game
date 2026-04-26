import type { Redis } from '@upstash/redis';

export interface GameSessionRecord {
  sessionId: string;
  clientId: string;
  createdAt: string;
  submittedAt?: string;
  submittedScore?: number;
}

const GAME_SESSION_KEY_PREFIX = 'game-session:';
export const GAME_SESSION_COOKIE = 'suika-game-session';
export const GAME_SESSION_TTL_SECONDS = 60 * 60 * 6;
export const MIN_GAME_DURATION_MS = 5_000;

function sessionKey(sessionId: string): string {
  return `${GAME_SESSION_KEY_PREFIX}${sessionId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseGameSession(raw: unknown): GameSessionRecord | null {
  if (!raw) return null;

  try {
    const parsed = typeof raw === 'string'
      ? (JSON.parse(raw) as Partial<GameSessionRecord>)
      : (raw as Partial<GameSessionRecord>);
    if (typeof parsed.sessionId !== 'string' || typeof parsed.clientId !== 'string') {
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      clientId: parsed.clientId,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : nowIso(),
      submittedAt: typeof parsed.submittedAt === 'string' ? parsed.submittedAt : undefined,
      submittedScore: typeof parsed.submittedScore === 'number' ? parsed.submittedScore : undefined,
    };
  } catch {
    return null;
  }
}

export async function createGameSession(redis: Redis, clientId: string): Promise<GameSessionRecord> {
  const session: GameSessionRecord = {
    sessionId: crypto.randomUUID(),
    clientId,
    createdAt: nowIso(),
  };

  await redis.set(sessionKey(session.sessionId), JSON.stringify(session), {
    ex: GAME_SESSION_TTL_SECONDS,
  });

  return session;
}

export async function loadGameSession(redis: Redis, sessionId: string): Promise<GameSessionRecord | null> {
  const raw = await redis.get<string>(sessionKey(sessionId));
  return parseGameSession(raw);
}

export async function saveGameSession(redis: Redis, session: GameSessionRecord): Promise<void> {
  await redis.set(sessionKey(session.sessionId), JSON.stringify(session), {
    ex: GAME_SESSION_TTL_SECONDS,
  });
}

export function getGameDurationMs(session: GameSessionRecord): number {
  const startedAt = Date.parse(session.createdAt);
  if (!Number.isFinite(startedAt)) return 0;
  return Date.now() - startedAt;
}
