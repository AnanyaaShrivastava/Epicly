import type { LeaderboardEntry } from '@lifequest/shared';
import { getSupabaseAdmin } from '../db/client';
import { getRedis, isRedisConfigured } from '../redis/client';
import { GLOBAL_LEADERBOARD_KEY } from './xpService';

export async function updateScore(userId: string, totalXP: number): Promise<void> {
  if (!isRedisConfigured()) return;

  const redis = getRedis();
  await redis.zadd(GLOBAL_LEADERBOARD_KEY, { score: totalXP, member: userId });
}

export async function getGlobalRank(userId: string): Promise<number | null> {
  if (!isRedisConfigured()) return null;

  const redis = getRedis();
  const rank = await redis.zrevrank(GLOBAL_LEADERBOARD_KEY, userId);
  return rank !== null ? rank + 1 : null;
}

export async function getTopN(n: number): Promise<LeaderboardEntry[]> {
  if (!isRedisConfigured()) {
    return getTopNFromDatabase(n);
  }

  const redis = getRedis();
  const results = await redis.zrange(GLOBAL_LEADERBOARD_KEY, 0, n - 1, {
    rev: true,
    withScores: true,
  });

  if (!results || (Array.isArray(results) && results.length === 0)) {
    return getTopNFromDatabase(n);
  }

  const userIds: string[] = [];
  const scores: number[] = [];

  if (Array.isArray(results)) {
    for (const item of results) {
      if (typeof item === 'object' && item !== null && 'member' in item) {
        userIds.push(String((item as { member: string; score: number }).member));
        scores.push(Number((item as { member: string; score: number }).score));
      } else if (typeof item === 'string') {
        // flat [member, score, member, score] format
        continue;
      }
    }

    if (userIds.length === 0 && results.length >= 2) {
      for (let i = 0; i < results.length; i += 2) {
        userIds.push(String(results[i]));
        scores.push(Number(results[i + 1]));
      }
    }
  }

  return enrichLeaderboardEntries(userIds, scores);
}

async function getTopNFromDatabase(n: number): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseAdmin();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, total_xp')
    .order('total_xp', { ascending: false })
    .limit(n);

  if (error || !users) return [];

  return users.map((user, index) => ({
    user_id: user.id as string,
    username: user.username as string,
    avatar_url: user.avatar_url as string | null,
    level: user.level as number,
    total_xp: user.total_xp as number,
    rank: index + 1,
  }));
}

async function enrichLeaderboardEntries(
  userIds: string[],
  scores: number[]
): Promise<LeaderboardEntry[]> {
  if (!userIds.length) return [];

  const supabase = getSupabaseAdmin();

  const { data: users } = await supabase
    .from('users')
    .select('id, username, avatar_url, level, total_xp')
    .in('id', userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id as string, u])
  );

  return userIds.map((userId, index) => {
    const user = userMap.get(userId);
    return {
      user_id: userId,
      username: (user?.username as string) ?? 'Unknown',
      avatar_url: (user?.avatar_url as string | null) ?? null,
      level: (user?.level as number) ?? 1,
      total_xp: scores[index] ?? (user?.total_xp as number) ?? 0,
      rank: index + 1,
    };
  });
}

export async function getFriendsLeaderboard(
  userId: string,
  friendIds: string[]
): Promise<LeaderboardEntry[]> {
  const allIds = [...new Set([userId, ...friendIds])];

  if (!isRedisConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data: users } = await supabase
      .from('users')
      .select('id, username, avatar_url, level, total_xp')
      .in('id', allIds)
      .order('total_xp', { ascending: false });

    return (users ?? []).map((user, index) => ({
      user_id: user.id as string,
      username: user.username as string,
      avatar_url: user.avatar_url as string | null,
      level: user.level as number,
      total_xp: user.total_xp as number,
      rank: index + 1,
    }));
  }

  const redis = getRedis();
  const pipeline = allIds.map((id) =>
    redis.zscore(GLOBAL_LEADERBOARD_KEY, id)
  );
  const scores = await Promise.all(pipeline);

  const entries = allIds
    .map((id, i) => ({ userId: id, score: scores[i] ?? 0 }))
    .sort((a, b) => (b.score as number) - (a.score as number));

  const userIds = entries.map((e) => e.userId);
  const xpScores = entries.map((e) => e.score as number);

  const enriched = await enrichLeaderboardEntries(userIds, xpScores);
  return enriched;
}

export async function syncUserToLeaderboard(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('total_xp')
    .eq('id', userId)
    .single();

  if (user) {
    await updateScore(userId, user.total_xp as number);
  }
}
