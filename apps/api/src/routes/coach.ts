import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import { coachRateLimit } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getCoachHistory,
  streamCoachMessage,
} from '../services/aiCoachService';

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
});

router.use(authMiddleware);

router.get(
  '/history',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.sub;
    const messages = await getCoachHistory(userId, 50);
    res.json({ data: messages.reverse() });
  })
);

router.post(
  '/message',
  coachRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.sub;
    const body = messageSchema.parse(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of streamCoachMessage(userId, body.message)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coach error';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    }

    res.end();
  })
);

export default router;
