import { create } from 'zustand';
import type { UserProfile, Task, Habit, XPStats, LeaderboardEntry } from '../types';
import {
  userService,
  taskService,
  habitService,
  xpService,
  leaderboardService,
  authService,
} from '../services';
import { setTokens, clearTokens, getErrorMessage } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  profile: null,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const result = await authService.login(email, password);
      await setTokens(result.access_token, result.refresh_token);
      const profile = await userService.getProfile();
      set({ isAuthenticated: true, profile, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error));
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true });
    try {
      const result = await authService.register(email, password, username);
      if (result.session) {
        await setTokens(result.session.access_token, result.session.refresh_token);
        const profile = await userService.getProfile();
        set({ isAuthenticated: true, profile, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error));
    }
  },

  logout: async () => {
    await clearTokens();
    set({ isAuthenticated: false, profile: null });
  },

  loadProfile: async () => {
    try {
      const profile = await userService.getProfile();
      set({ isAuthenticated: true, profile });
    } catch {
      set({ isAuthenticated: false, profile: null });
    }
  },
}));

interface QuestState {
  tasks: Task[];
  habits: Habit[];
  isLoading: boolean;
  fetchTodayQuests: () => Promise<void>;
  fetchAllQuests: () => Promise<void>;
  completeTask: (id: string) => Promise<{
    xp?: { leveledUp: boolean; newLevel: number };
  }>;
  completeHabit: (id: string) => Promise<{
    xp?: { leveledUp: boolean; newLevel: number };
  }>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
  tasks: [],
  habits: [],
  isLoading: false,

  fetchTodayQuests: async () => {
    set({ isLoading: true });
    try {
      const [tasks, habits] = await Promise.all([
        taskService.list('today'),
        habitService.list(),
      ]);
      const incompleteHabits = habits.filter((h) => !h.completed_today);
      set({ tasks, habits: incompleteHabits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAllQuests: async () => {
    set({ isLoading: true });
    try {
      const [tasks, habits] = await Promise.all([
        taskService.list('all'),
        habitService.list(),
      ]);
      set({ tasks, habits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  completeTask: async (id) => {
    const result = await taskService.complete(id);
    await get().fetchTodayQuests();
    return result;
  },

  completeHabit: async (id) => {
    const result = await habitService.complete(id);
    await get().fetchTodayQuests();
    return result;
  },
}));

interface XPState {
  stats: XPStats | null;
  fetchStats: () => Promise<void>;
}

export const useXPStore = create<XPState>((set) => ({
  stats: null,
  fetchStats: async () => {
    try {
      const stats = await xpService.getStats();
      set({ stats });
    } catch {
      // silent
    }
  },
}));

interface LeaderboardState {
  global: LeaderboardEntry[];
  friends: LeaderboardEntry[];
  isLoading: boolean;
  fetchGlobal: () => Promise<void>;
  fetchFriends: (friendIds?: string[]) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  global: [],
  friends: [],
  isLoading: false,

  fetchGlobal: async () => {
    set({ isLoading: true });
    try {
      const global = await leaderboardService.getGlobal();
      set({ global, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchFriends: async (friendIds = []) => {
    set({ isLoading: true });
    try {
      const friends = await leaderboardService.getFriends(friendIds);
      set({ friends, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
