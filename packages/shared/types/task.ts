import type { TaskCategory, TaskDifficulty } from './user';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  xp_reward: number;
  due_date: string | null;
  completed_at: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  frequency: 'daily' | 'weekly';
  target_count: number;
  xp_reward: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  completed_today?: boolean;
  completions_today?: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  xp_earned: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty?: TaskDifficulty;
  due_date?: string;
}

export interface CreateHabitRequest {
  title: string;
  category?: string;
  frequency?: 'daily' | 'weekly';
  target_count?: number;
}

export type TaskFilter = 'today' | 'upcoming' | 'completed' | 'all';
