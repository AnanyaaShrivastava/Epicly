export type TaskCategory =
  | 'health'
  | 'work'
  | 'learning'
  | 'social'
  | 'finance'
  | 'personal';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  fcm_token: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_bonus: number;
  earned_at?: string;
}

export interface UserProfile extends User {
  badges: Badge[];
  rank_title: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
