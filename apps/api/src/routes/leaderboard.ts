import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getTopN,
  getGlobalRank,
  getFriendsLeaderboard,
} from '../services/leaderboardService';

const router = Router();

const friendsSchema = z.object({
  friend_ids: z.array(z.string().uuid()).default([]),
});

router.use(authMiddleware);

router.get(
  '/global',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const entries = await getTopN(limit);
    res.json({ data: entries });
  })
);

router.get(
  '/friends',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const friendIds = req.query.friend_ids
      ? String(req.query.friend_ids).split(',').filter(Boolean)
      : [];

    const entries = await getFriendsLeaderboard(userId, friendIds);
    res.json({ data: entries });
  })
);

router.post(
  '/friends',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const body = friendsSchema.parse(req.body);
    const entries = await getFriendsLeaderboard(userId, body.friend_ids);
    res.json({ data: entries });
  })
);

router.get(
  '/rank',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const rank = await getGlobalRank(userId);
    res.json({
      data: {
        rank,
        percentile: rank ? Math.max(0, 100 - rank) : null,
      },
    });
  })
);

export default router;
