import { Router } from 'express';
import { z } from 'zod';
import { getRankTitle } from '@lifequest/shared';
import { getSupabaseAdmin, type DatabaseBadge } from '../db/client';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { saveFCMToken } from '../services/notificationService';
import { syncUserToLeaderboard } from '../services/leaderboardService';

const router = Router();

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatar_url: z.string().url().optional(),
});

const fcmTokenSchema = z.object({
  token: z.string().min(1),
});

router.use(authMiddleware);

router.get(
  '/me',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('earned_at, badges(*)')
      .eq('user_id', userId);

    const badges = (userBadges ?? []).map((ub) => {
      const badge = ub.badges as unknown as DatabaseBadge;
      return { ...badge, earned_at: ub.earned_at as string };
    });

    res.json({
      data: {
        ...user,
        rank_title: getRankTitle(user.level as number),
        badges,
      },
    });
  })
);

router.patch(
  '/me',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const body = updateProfileSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    if (body.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', body.username)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  })
);

router.post(
  '/me/fcm-token',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const body = fcmTokenSchema.parse(req.body);

    await saveFCMToken(userId, body.token);

    res.json({ data: null, message: 'FCM token saved' });
  })
);

router.post(
  '/me/sync-leaderboard',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    await syncUserToLeaderboard(userId);
    res.json({ data: null, message: 'Leaderboard synced' });
  })
);

export default router;
