export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  rank: number;
}

export interface LeaderboardRank {
  rank: number;
  total_xp: number;
  percentile: number;
}

export interface FriendsLeaderboardRequest {
  friend_ids: string[];
}
