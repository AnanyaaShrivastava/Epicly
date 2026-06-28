import { Router } from 'express';
import { getRankTitle, xpProgressInCurrentLevel } from '@lifequest/shared';
import { getSupabaseAdmin, type DatabaseXPTransaction } from '../db/client';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.get(
  '/history',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const offset = (page - 1) * limit;
    const supabase = getSupabaseAdmin();

    const { data, error, count } = await supabase
      .from('xp_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      data: {
        transactions: data as DatabaseXPTransaction[],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / limit),
        },
      },
    });
  })
);

router.get(
  '/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from('users')
      .select('level, total_xp')
      .eq('id', userId)
      .single();

    if (error || !user) throw error;

    const totalXP = user.total_xp as number;
    const level = user.level as number;

    res.json({
      data: {
        level,
        total_xp: totalXP,
        rank_title: getRankTitle(level),
        progress: xpProgressInCurrentLevel(totalXP),
      },
    });
  })
);

export default router;
