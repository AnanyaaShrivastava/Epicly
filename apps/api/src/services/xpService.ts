import {
  levelFromXP,
  XPSourceType,
  type XPAwardResult,
} from '@lifequest/shared';
import { getSupabaseAdmin, type DatabaseBadge } from '../db/client';

const GLOBAL_LEADERBOARD_KEY = 'leaderboard:global';

export async function emitXPAwardedEvent(
  userId: string,
  payload: {
    amount: number;
    newTotalXP: number;
    newLevel: number;
    leveledUp: boolean;
    reason: string;
  }
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const channel = supabase.channel(`user:${userId}`);

    await channel.send({
      type: 'broadcast',
      event: 'xp:awarded',
      payload,
    });

    await supabase.removeChannel(channel);
  } catch (error) {
    console.warn('[xpService] Failed to emit realtime event:', error);
  }
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  sourceType: XPSourceType,
  sourceId?: string
): Promise<XPAwardResult> {
  const supabase = getSupabaseAdmin();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_xp, level')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  const previousLevel = user.level as number;
  const newTotalXP = (user.total_xp as number) + amount;
  const newLevel = levelFromXP(newTotalXP);
  const leveledUp = newLevel > previousLevel;

  const { error: txError } = await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    reason,
    source_type: sourceType,
    source_id: sourceId ?? null,
  });

  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('users')
    .update({ total_xp: newTotalXP, level: newLevel })
    .eq('id', userId);

  if (updateError) throw updateError;

  await emitXPAwardedEvent(userId, {
    amount,
    newTotalXP,
    newLevel,
    leveledUp,
    reason,
  });

  try {
    const { updateScore } = await import('./leaderboardService');
    await updateScore(userId, newTotalXP);
  } catch {
    // Leaderboard optional until Redis is configured
  }

  return { newTotalXP, newLevel, leveledUp, previousLevel };
}

interface BadgeCondition {
  key: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalTasks: number;
  totalHabits: number;
  level: number;
  currentStreak: number;
}

async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = getSupabaseAdmin();

  const [userResult, tasksResult, habitsResult] = await Promise.all([
    supabase.from('users').select('level, current_streak').eq('id', userId).single(),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true),
    supabase
      .from('habit_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  return {
    level: (userResult.data?.level as number) ?? 1,
    currentStreak: (userResult.data?.current_streak as number) ?? 0,
    totalTasks: tasksResult.count ?? 0,
    totalHabits: habitsResult.count ?? 0,
  };
}

const BADGE_CONDITIONS: BadgeCondition[] = [
  { key: 'first_quest', check: (s) => s.totalTasks >= 1 },
  { key: 'streak_7', check: (s) => s.currentStreak >= 7 },
  { key: 'streak_30', check: (s) => s.currentStreak >= 30 },
  { key: 'level_10', check: (s) => s.level >= 10 },
  { key: 'level_50', check: (s) => s.level >= 50 },
  { key: 'habit_hero', check: (s) => s.totalHabits >= 100 },
  { key: 'task_master', check: (s) => s.totalTasks >= 50 },
];

export async function checkAndAwardBadges(userId: string): Promise<DatabaseBadge[]> {
  const supabase = getSupabaseAdmin();
  const stats = await getUserStats(userId);
  const awarded: DatabaseBadge[] = [];

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id, badges(*)')
    .eq('user_id', userId);

  const earnedKeys = new Set(
    (existingBadges ?? []).map((ub) => {
      const badge = ub.badges as unknown as DatabaseBadge;
      return badge?.key;
    })
  );

  for (const condition of BADGE_CONDITIONS) {
    if (earnedKeys.has(condition.key) || !condition.check(stats)) continue;

    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('key', condition.key)
      .single();

    if (!badge) continue;

    const { error } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badge.id,
    });

    if (error) continue;

    awarded.push(badge as DatabaseBadge);

    if (badge.xp_bonus > 0) {
      await awardXP(
        userId,
        badge.xp_bonus as number,
        `Badge earned: ${badge.name}`,
        'achievement',
        badge.id as string
      );
    }
  }

  return awarded;
}

export { GLOBAL_LEADERBOARD_KEY };
