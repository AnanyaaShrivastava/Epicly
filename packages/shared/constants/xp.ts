// XP rewards by difficulty
export const XP_REWARDS = {
  task: { easy: 25, medium: 50, hard: 100, epic: 200 },
  habit: { daily: 30, weekly: 80 },
  streak_bonus: {
    3: 50,
    7: 150,
    14: 300,
    30: 750,
    100: 2000,
  },
} as const;

// Level N requires: 100 * (N^1.8) XP total
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export function xpProgressInCurrentLevel(totalXP: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = levelFromXP(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const current = totalXP - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  return {
    current,
    required,
    percentage: Math.floor((current / required) * 100),
  };
}

export const RANK_TITLES: Record<number, string> = {
  1: 'Recruit',
  5: 'Apprentice',
  10: 'Explorer',
  20: 'Warrior',
  35: 'Champion',
  50: 'Legend',
  75: 'Mythic',
  100: 'Ascended',
};

export function getRankTitle(level: number): string {
  const thresholds = Object.keys(RANK_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) return RANK_TITLES[threshold];
  }
  return 'Recruit';
}
