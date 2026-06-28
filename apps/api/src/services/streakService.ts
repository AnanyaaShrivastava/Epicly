import { XP_REWARDS } from '@lifequest/shared';
import { getSupabaseAdmin } from '../db/client';
import { awardXP } from './xpService';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
}

export async function updateStreak(userId: string): Promise<StreakUpdateResult> {
  const supabase = getSupabaseAdmin();
  const today = todayDateString();
  const yesterday = yesterdayDateString();

  const { data: user, error } = await supabase
    .from('users')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error(`User not found: ${userId}`);
  }

  const lastActive = user.last_active_date as string | null;
  let currentStreak = user.current_streak as number;
  let longestStreak = user.longest_streak as number;
  let isNewDay = false;

  if (lastActive === today) {
    return { currentStreak, longestStreak, isNewDay: false };
  }

  isNewDay = true;

  if (lastActive === yesterday) {
    currentStreak += 1;
  } else if (lastActive === null) {
    currentStreak = 1;
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  if (isNewDay) {
    await checkStreakMilestones(userId, currentStreak);
  }

  return { currentStreak, longestStreak, isNewDay };
}

const awardedMilestones = new Set<string>();

export async function checkStreakMilestones(
  userId: string,
  streak: number
): Promise<void> {
  const milestones = Object.keys(XP_REWARDS.streak_bonus).map(Number);

  for (const milestone of milestones) {
    if (streak !== milestone) continue;

    const cacheKey = `${userId}:${milestone}`;
    if (awardedMilestones.has(cacheKey)) continue;

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('xp_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', 'streak_bonus')
      .eq('reason', `${milestone}-day streak bonus`)
      .maybeSingle();

    if (existing) {
      awardedMilestones.add(cacheKey);
      continue;
    }

    const bonus = XP_REWARDS.streak_bonus[milestone as keyof typeof XP_REWARDS.streak_bonus];
    await awardXP(userId, bonus, `${milestone}-day streak bonus`, 'streak_bonus');
    awardedMilestones.add(cacheKey);
  }
}

export async function updateHabitStreak(
  habitId: string,
  userId: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  const supabase = getSupabaseAdmin();
  const today = todayDateString();
  const yesterday = yesterdayDateString();

  const { data: habit, error } = await supabase
    .from('habits')
    .select('current_streak, longest_streak, last_completed_date')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single();

  if (error || !habit) {
    throw new Error(`Habit not found: ${habitId}`);
  }

  const lastCompleted = habit.last_completed_date as string | null;
  let currentStreak = habit.current_streak as number;
  let longestStreak = habit.longest_streak as number;

  if (lastCompleted === today) {
    return { currentStreak, longestStreak };
  }

  if (lastCompleted === yesterday) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const { error: updateError } = await supabase
    .from('habits')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: today,
    })
    .eq('id', habitId);

  if (updateError) throw updateError;

  return { currentStreak, longestStreak };
}
