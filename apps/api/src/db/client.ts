import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill in Supabase credentials.'
      );
    }

    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseAdmin;
}

export function getSupabaseAnon(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_ANON_KEY. Copy .env.example to .env and fill in Supabase credentials.'
    );
  }

  return createClient(url, key);
}

export type DatabaseUser = {
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
};

export type DatabaseTask = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  xp_reward: number;
  due_date: string | null;
  completed_at: string | null;
  is_completed: boolean;
  created_at: string;
};

export type DatabaseHabit = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  frequency: string;
  target_count: number;
  xp_reward: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
};

export type DatabaseBadge = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_bonus: number;
};

export type DatabaseCoachMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type DatabaseXPTransaction = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  source_type: string;
  source_id: string | null;
  created_at: string;
};
