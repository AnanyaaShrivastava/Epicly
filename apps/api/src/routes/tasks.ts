import { Router } from 'express';
import { z } from 'zod';
import { XP_REWARDS } from '@lifequest/shared';
import { getSupabaseAdmin, type DatabaseTask } from '../db/client';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { awardXP, checkAndAwardBadges } from '../services/xpService';
import { updateStreak } from '../services/streakService';
import { sendLevelUpNotification } from '../services/notificationService';

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['health', 'work', 'learning', 'social', 'finance', 'personal']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'epic']).default('medium'),
  due_date: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

function computeXPReward(difficulty: string): number {
  return XP_REWARDS.task[difficulty as keyof typeof XP_REWARDS.task] ?? 50;
}

router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const filter = (req.query.filter as string) ?? 'all';
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    let query = supabase.from('tasks').select('*').eq('user_id', userId);

    switch (filter) {
      case 'today':
        query = query
          .eq('is_completed', false)
          .or(`due_date.eq.${today},due_date.is.null`);
        break;
      case 'upcoming':
        query = query.eq('is_completed', false).gt('due_date', today);
        break;
      case 'completed':
        query = query.eq('is_completed', true);
        break;
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data: data as DatabaseTask[] });
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const body = createTaskSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const xpReward = computeXPReward(body.difficulty);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: body.title,
        description: body.description ?? null,
        category: body.category,
        difficulty: body.difficulty,
        xp_reward: xpReward,
        due_date: body.due_date ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data: data as DatabaseTask, message: 'Quest created' });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const taskId = paramId(req.params.id);
    const body = updateTaskSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const updates: Record<string, unknown> = { ...body };
    if (body.difficulty) {
      updates.xp_reward = computeXPReward(body.difficulty);
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    res.json({ data: data as DatabaseTask });
  })
);

router.post(
  '/:id/complete',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const taskId = paramId(req.params.id);
    const supabase = getSupabaseAdmin();

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !task) {
      throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    if (task.is_completed) {
      throw new AppError(400, 'Task already completed', 'TASK_ALREADY_COMPLETED');
    }

    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    const streakResult = await updateStreak(userId);
    const xpResult = await awardXP(
      userId,
      task.xp_reward as number,
      `Completed quest: ${task.title}`,
      'task',
      taskId
    );

    const badges = await checkAndAwardBadges(userId);

    if (xpResult.leveledUp) {
      await sendLevelUpNotification(userId, xpResult.newLevel);
    }

    res.json({
      data: {
        task: updated as DatabaseTask,
        xp: xpResult,
        streak: streakResult,
        badges,
      },
      message: `+${task.xp_reward} XP earned!`,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const taskId = paramId(req.params.id);
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ data: null, message: 'Task deleted' });
  })
);

export default router;
