-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (one-off)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health','work','learning','social','finance','personal')),
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard','epic')) DEFAULT 'medium',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits (recurring)
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  frequency TEXT CHECK (frequency IN ('daily','weekly')) DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 30,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit completions log
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER
);

-- XP transactions (audit log)
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('task','habit','streak_bonus','ai_quest','achievement')),
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges / Achievements
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_bonus INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- AI coach conversation memory
CREATE TABLE coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly missions
CREATE TABLE weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 200,
  target_count INTEGER DEFAULT 1,
  current_count INTEGER DEFAULT 0,
  week_start DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_coach_messages_user_id ON coach_messages(user_id, created_at);

-- Seed default badges
INSERT INTO badges (key, name, description, icon, xp_bonus) VALUES
  ('first_quest', 'First Quest', 'Complete your first task', '🎯', 25),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 100),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', '⚡', 500),
  ('level_10', 'Explorer', 'Reach level 10', '🧭', 200),
  ('level_50', 'Legend', 'Reach level 50', '👑', 1000),
  ('habit_hero', 'Habit Hero', 'Complete 100 habits', '💪', 300),
  ('task_master', 'Task Master', 'Complete 50 tasks', '✅', 250);
