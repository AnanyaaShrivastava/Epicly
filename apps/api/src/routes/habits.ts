import { Router } from 'express';
import { z } from 'zod';
import { XP_REWARDS } from '@lifequest/shared';
import { getSupabaseAdmin, type DatabaseHabit } from '../db/client';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { awardXP, checkAndAwardBadges } from '../services/xpService';
import { updateStreak, updateHabitStreak } from '../services/streakService';
import { sendLevelUpNotification } from '../services/notificationService';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const router = Router();

const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  target_count: z.number().int().min(1).max(10).default(1),
});

router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const habitIds = (habits ?? []).map((h) => h.id as string);

    let completionsToday: Record<string, number> = {};

    if (habitIds.length > 0) {
      const { data: completions } = await supabase
        .from('habit_completions')
        .select('habit_id')
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`);

      completionsToday = (completions ?? []).reduce<Record<string, number>>(
        (acc, c) => {
          const id = c.habit_id as string;
          acc[id] = (acc[id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    const enriched = (habits ?? []).map((habit) => {
      const count = completionsToday[habit.id as string] ?? 0;
      return {
        ...habit,
        completed_today: count >= (habit.target_count as number),
        completions_today: count,
      };
    });

    res.json({ data: enriched as DatabaseHabit[] });
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const body = createHabitSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const xpReward = XP_REWARDS.habit[body.frequency];

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        title: body.title,
        category: body.category ?? null,
        frequency: body.frequency,
        target_count: body.target_count,
        xp_reward: xpReward,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data: data as DatabaseHabit, message: 'Habit created' });
  })
);

router.post(
  '/:id/complete',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const habitId = paramId(req.params.id);
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    const { data: habit, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !habit) {
      throw new AppError(404, 'Habit not found', 'HABIT_NOT_FOUND');
    }

    const { count: todayCount } = await supabase
      .from('habit_completions')
      .select('id', { count: 'exact', head: true })
      .eq('habit_id', habitId)
      .gte('completed_at', `${today}T00:00:00`);

    if ((todayCount ?? 0) >= (habit.target_count as number)) {
      throw new AppError(400, 'Habit already completed for today', 'HABIT_ALREADY_COMPLETED');
    }

    const xpAmount = habit.xp_reward as number;

    await supabase.from('habit_completions').insert({
      habit_id: habitId,
      user_id: userId,
      xp_earned: xpAmount,
    });

    const habitStreak = await updateHabitStreak(habitId, userId);
    const userStreak = await updateStreak(userId);

    const xpResult = await awardXP(
      userId,
      xpAmount,
      `Completed habit: ${habit.title}`,
      'habit',
      habitId
    );

    const badges = await checkAndAwardBadges(userId);

    if (xpResult.leveledUp) {
      await sendLevelUpNotification(userId, xpResult.newLevel);
    }

    res.json({
      data: {
        habit_streak: habitStreak,
        user_streak: userStreak,
        xp: xpResult,
        badges,
      },
      message: `+${xpAmount} XP earned!`,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const habitId = paramId(req.params.id);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ data: null, message: 'Habit deleted' });
  })
);

export default router;
