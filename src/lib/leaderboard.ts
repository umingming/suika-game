import type { NextRequest } from 'next/server';
import type { Redis } from '@upstash/redis';

export interface PlayerRecord {
  clientId: string;
  nickname: string;
  bestScore: number;
  createdAt: string;
  updatedAt: string;
  lastSeenIp: string;
  migratedFromIp?: string;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  ip: string;
  clientId?: string;
}

const PLAYER_KEY_PREFIX = 'player:';
const NICKNAME_OWNER_KEY_PREFIX = 'nickowner:v2:';
const LEADERBOARD_KEY = 'leaderboard:v2';
const LEGACY_LEADERBOARD_KEY = 'leaderboard';
const LEGACY_NICKNAME_KEY_PREFIX = 'nickname:';
const LEGACY_BEST_SCORE_KEY_PREFIX = 'bestscore:';
const LEGACY_MIGRATED_KEY_PREFIX = 'legacy-migrated:';

function playerKey(clientId: string): string {
  return `${PLAYER_KEY_PREFIX}${clientId}`;
}

function nicknameOwnerKey(nickname: string): string {
  return `${NICKNAME_OWNER_KEY_PREFIX}${nickname}`;
}

function legacyNicknameKey(ip: string): string {
  return `${LEGACY_NICKNAME_KEY_PREFIX}${ip}`;
}

function legacyBestScoreKey(ip: string): string {
  return `${LEGACY_BEST_SCORE_KEY_PREFIX}${ip}`;
}

function legacyMigratedKey(ip: string): string {
  return `${LEGACY_MIGRATED_KEY_PREFIX}${ip}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function coerceScore(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function serializePlayer(player: PlayerRecord): string {
  return JSON.stringify(player);
}

function parsePlayer(raw: string | null, clientId: string): PlayerRecord | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PlayerRecord>;
    return {
      clientId,
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      bestScore: coerceScore(parsed.bestScore),
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : nowIso(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : nowIso(),
      lastSeenIp: typeof parsed.lastSeenIp === 'string' ? parsed.lastSeenIp : 'unknown',
      migratedFromIp: typeof parsed.migratedFromIp === 'string' ? parsed.migratedFromIp : undefined,
    };
  } catch {
    return null;
  }
}

function parseLegacyMember(member: string): { ip: string; nickname: string } | null {
  const separatorIndex = member.lastIndexOf(':');
  if (separatorIndex <= 0 || separatorIndex === member.length - 1) return null;

  return {
    ip: member.substring(0, separatorIndex),
    nickname: member.substring(separatorIndex + 1),
  };
}

function maskIp(ip: string): string {
  if (ip.includes(':')) {
    const parts = ip.split(':');
    const lastPart = parts[parts.length - 1];
    parts[parts.length - 1] = lastPart ? '***' : '';
    return parts.join(':');
  }

  return ip.replace(/\d+$/, '***');
}

async function readSortedSet(
  redis: Redis,
  key: string,
  limit = 10,
): Promise<Array<{ member: string; score: number }>> {
  const results = await redis.zrange(key, 0, limit - 1, { rev: true, withScores: true });

  if (
    results.length > 0 &&
    typeof results[0] === 'object' &&
    results[0] !== null &&
    'score' in results[0]
  ) {
    return (results as Array<{ value: string; score: number }>).map(item => ({
      member: String(item.value),
      score: Number(item.score),
    }));
  }

  const flat = results as string[];
  const entries: Array<{ member: string; score: number }> = [];

  for (let i = 0; i < flat.length; i += 2) {
    entries.push({
      member: flat[i],
      score: Number(flat[i + 1]),
    });
  }

  return entries;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return '127.0.0.1';
}

export function getClientId(request: NextRequest): string | null {
  const clientId = request.headers.get('x-client-id')?.trim();
  return clientId ? clientId : null;
}

export async function loadPlayer(redis: Redis, clientId: string): Promise<PlayerRecord | null> {
  const raw = await redis.get<string>(playerKey(clientId));
  return parsePlayer(raw, clientId);
}

export async function savePlayer(redis: Redis, player: PlayerRecord): Promise<void> {
  await redis.set(playerKey(player.clientId), serializePlayer(player));
}

export async function getNicknameOwner(redis: Redis, nickname: string): Promise<string | null> {
  return await redis.get<string>(nicknameOwnerKey(nickname));
}

export async function setNicknameOwner(redis: Redis, nickname: string, clientId: string): Promise<void> {
  await redis.set(nicknameOwnerKey(nickname), clientId);
}

export async function clearNicknameOwner(redis: Redis, nickname: string): Promise<void> {
  await redis.del(nicknameOwnerKey(nickname));
}

export async function ensurePlayer(redis: Redis, clientId: string, ip: string): Promise<PlayerRecord> {
  const existing = await loadPlayer(redis, clientId);
  if (existing) {
    if (existing.lastSeenIp !== ip) {
      const updated = {
        ...existing,
        lastSeenIp: ip,
        updatedAt: nowIso(),
      };
      await savePlayer(redis, updated);
      return updated;
    }

    return existing;
  }

  const migratedClientId = await redis.get<string>(legacyMigratedKey(ip));
  if (migratedClientId && migratedClientId !== clientId) {
    const blankPlayer: PlayerRecord = {
      clientId,
      nickname: '',
      bestScore: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastSeenIp: ip,
    };
    await savePlayer(redis, blankPlayer);
    return blankPlayer;
  }

  const legacyNickname = await redis.get<string>(legacyNicknameKey(ip));
  const legacyBestScore = coerceScore(await redis.get<number>(legacyBestScoreKey(ip)));

  if (!legacyNickname && legacyBestScore === 0) {
    const blankPlayer: PlayerRecord = {
      clientId,
      nickname: '',
      bestScore: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastSeenIp: ip,
    };
    await savePlayer(redis, blankPlayer);
    return blankPlayer;
  }

  let migratedNickname = '';
  if (legacyNickname) {
    const owner = await getNicknameOwner(redis, legacyNickname);
    if (!owner || owner === clientId) {
      migratedNickname = legacyNickname;
      await setNicknameOwner(redis, legacyNickname, clientId);
    }
  }

  const migratedPlayer: PlayerRecord = {
    clientId,
    nickname: migratedNickname,
    bestScore: legacyBestScore,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastSeenIp: ip,
    migratedFromIp: ip,
  };

  await savePlayer(redis, migratedPlayer);
  await redis.set(legacyMigratedKey(ip), clientId);

  if (legacyBestScore > 0) {
    await redis.zadd(LEADERBOARD_KEY, { score: legacyBestScore, member: clientId });
  }

  if (legacyNickname) {
    await redis.zrem(LEGACY_LEADERBOARD_KEY, `${ip}:${legacyNickname}`);
  }

  return migratedPlayer;
}

export async function updatePlayerNickname(
  redis: Redis,
  player: PlayerRecord,
  nickname: string,
): Promise<PlayerRecord> {
  if (player.nickname && player.nickname !== nickname) {
    await clearNicknameOwner(redis, player.nickname);
  }

  await setNicknameOwner(redis, nickname, player.clientId);

  const updatedPlayer: PlayerRecord = {
    ...player,
    nickname,
    updatedAt: nowIso(),
  };

  await savePlayer(redis, updatedPlayer);

  if (updatedPlayer.bestScore > 0) {
    await redis.zadd(LEADERBOARD_KEY, { score: updatedPlayer.bestScore, member: updatedPlayer.clientId });
  }

  return updatedPlayer;
}

export async function recordScore(
  redis: Redis,
  player: PlayerRecord,
  score: number,
): Promise<{ updated: boolean; bestScore: number; player: PlayerRecord }> {
  if (score <= player.bestScore) {
    return {
      updated: false,
      bestScore: player.bestScore,
      player,
    };
  }

  const updatedPlayer: PlayerRecord = {
    ...player,
    bestScore: score,
    updatedAt: nowIso(),
  };

  await savePlayer(redis, updatedPlayer);
  await redis.zadd(LEADERBOARD_KEY, { score, member: player.clientId });

  return {
    updated: true,
    bestScore: score,
    player: updatedPlayer,
  };
}

export async function getLeaderboardEntries(redis: Redis, limit = 10): Promise<LeaderboardEntry[]> {
  const currentEntries = await readSortedSet(redis, LEADERBOARD_KEY, limit);
  const entries: LeaderboardEntry[] = [];

  for (const entry of currentEntries) {
    const player = await loadPlayer(redis, entry.member);
    if (!player || !player.nickname) continue;

    entries.push({
      nickname: player.nickname,
      score: entry.score,
      ip: maskIp(player.lastSeenIp),
      clientId: player.clientId,
    });
  }

  const legacyEntries = await readSortedSet(redis, LEGACY_LEADERBOARD_KEY, limit);
  for (const entry of legacyEntries) {
    const parsed = parseLegacyMember(entry.member);
    if (!parsed) continue;

    const migrated = await redis.get<string>(legacyMigratedKey(parsed.ip));
    if (migrated) continue;

    entries.push({
      nickname: parsed.nickname,
      score: entry.score,
      ip: maskIp(parsed.ip),
    });
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
}
