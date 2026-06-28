export const Colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252542',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  accent: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  streak: '#F97316',
  xp: '#8B5CF6',
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const CATEGORIES = [
  { id: 'health', label: 'Health', icon: '💪', color: '#10B981' },
  { id: 'work', label: 'Work', icon: '💼', color: '#3B82F6' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#8B5CF6' },
  { id: 'social', label: 'Social', icon: '👥', color: '#EC4899' },
  { id: 'finance', label: 'Finance', icon: '💰', color: '#F59E0B' },
  { id: 'personal', label: 'Personal', icon: '✨', color: '#06B6D4' },
] as const;

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', xp: 25, color: '#10B981' },
  { id: 'medium', label: 'Medium', xp: 50, color: '#3B82F6' },
  { id: 'hard', label: 'Hard', xp: 100, color: '#F59E0B' },
  { id: 'epic', label: 'Epic', xp: 200, color: '#EF4444' },
] as const;

export const QUICK_PROMPTS = [
  'Make me a plan',
  "I'm feeling burned out",
  'What should I focus on today?',
] as const;
