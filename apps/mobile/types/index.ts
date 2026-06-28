export type {
  User,
  UserProfile,
  Badge,
  AuthTokens,
  Task,
  Habit,
  TaskCategory,
  TaskDifficulty,
  XPTransaction,
  XPStats,
  LeaderboardEntry,
} from '@lifequest/shared';

export {
  XP_REWARDS,
  xpForLevel,
  levelFromXP,
  xpProgressInCurrentLevel,
  getRankTitle,
  RANK_TITLES,
} from '@lifequest/shared';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CompleteQuestResult {
  task?: Task;
  xp: {
    newTotalXP: number;
    newLevel: number;
    leveledUp: boolean;
    previousLevel: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    isNewDay: boolean;
  };
}

import type { Task } from '@lifequest/shared';
