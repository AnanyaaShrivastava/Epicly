import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import habitRoutes from './routes/habits';
import xpRoutes from './routes/xp';
import leaderboardRoutes from './routes/leaderboard';
import coachRoutes from './routes/coach';
import streakRoutes from './routes/streaks';
import userRoutes from './routes/users';
import { globalRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalRateLimit);

app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', service: 'epicly-api' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`⚔️  Epicly API running on http://localhost:${PORT}`);
});

export default app;
