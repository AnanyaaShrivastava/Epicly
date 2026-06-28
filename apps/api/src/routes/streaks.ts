import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { updateStreak } from '../services/streakService';
import { getSupabaseAdmin } from '../db/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const supabase = getSupabaseAdmin();

    const { data: user } = await supabase
      .from('users')
      .select('current_streak, longest_streak, last_active_date')
      .eq('id', userId)
      .single();

    res.json({ data: user });
  })
);

router.post(
  '/check-in',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const result = await updateStreak(userId);
    res.json({ data: result });
  })
);

export default router;
