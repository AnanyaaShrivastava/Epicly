import { useEffect, useCallback } from 'react';
import { useAuthStore, useQuestStore, useXPStore } from '../store';

export function useHomeData() {
  const profile = useAuthStore((s) => s.profile);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const { tasks, habits, isLoading, fetchTodayQuests, completeTask, completeHabit } =
    useQuestStore();
  const { stats, fetchStats } = useXPStore();

  const refresh = useCallback(async () => {
    await Promise.all([loadProfile(), fetchTodayQuests(), fetchStats()]);
  }, [loadProfile, fetchTodayQuests, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    profile,
    tasks,
    habits,
    stats,
    isLoading,
    refresh,
    completeTask,
    completeHabit,
  };
}

export function useAuthGuard() {
  const { isAuthenticated, loadProfile } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { isAuthenticated };
}
