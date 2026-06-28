export type XPSourceType =
  | 'task'
  | 'habit'
  | 'streak_bonus'
  | 'ai_quest'
  | 'achievement';

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  source_type: XPSourceType;
  source_id: string | null;
  created_at: string;
}

export interface XPStats {
  level: number;
  total_xp: number;
  rank_title: string;
  progress: {
    current: number;
    required: number;
    percentage: number;
  };
}

export interface XPAwardResult {
  newTotalXP: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
}
