import { getApiClient } from './api';
import type { UserProfile, Task, Habit, XPStats, LeaderboardEntry, CoachMessage } from '../types';

export const authService = {
  async register(email: string, password: string, username: string) {
    const { data } = await getApiClient().post('/api/auth/register', {
      email,
      password,
      username,
    });
    return data.data;
  },

  async login(email: string, password: string) {
    const { data } = await getApiClient().post('/api/auth/login', {
      email,
      password,
    });
    return data.data;
  },
};

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await getApiClient().get('/api/users/me');
    return data.data;
  },

  async updateProfile(updates: { username?: string; avatar_url?: string }) {
    const { data } = await getApiClient().patch('/api/users/me', updates);
    return data.data;
  },

  async saveFCMToken(token: string) {
    await getApiClient().post('/api/users/me/fcm-token', { token });
  },
};

export const taskService = {
  async list(filter: 'today' | 'upcoming' | 'completed' | 'all' = 'all'): Promise<Task[]> {
    const { data } = await getApiClient().get('/api/tasks', { params: { filter } });
    return data.data;
  },

  async create(task: {
    title: string;
    description?: string;
    category: string;
    difficulty?: string;
    due_date?: string;
  }): Promise<Task> {
    const { data } = await getApiClient().post('/api/tasks', task);
    return data.data;
  },

  async complete(id: string) {
    const { data } = await getApiClient().post(`/api/tasks/${id}/complete`);
    return data.data;
  },

  async delete(id: string) {
    await getApiClient().delete(`/api/tasks/${id}`);
  },
};

export const habitService = {
  async list(): Promise<Habit[]> {
    const { data } = await getApiClient().get('/api/habits');
    return data.data;
  },

  async create(habit: {
    title: string;
    category?: string;
    frequency?: string;
    target_count?: number;
  }): Promise<Habit> {
    const { data } = await getApiClient().post('/api/habits', habit);
    return data.data;
  },

  async complete(id: string) {
    const { data } = await getApiClient().post(`/api/habits/${id}/complete`);
    return data.data;
  },

  async delete(id: string) {
    await getApiClient().delete(`/api/habits/${id}`);
  },
};

export const xpService = {
  async getStats(): Promise<XPStats> {
    const { data } = await getApiClient().get('/api/xp/stats');
    return data.data;
  },
};

export const leaderboardService = {
  async getGlobal(limit = 50): Promise<LeaderboardEntry[]> {
    const { data } = await getApiClient().get('/api/leaderboard/global', {
      params: { limit },
    });
    return data.data;
  },

  async getFriends(friendIds: string[] = []): Promise<LeaderboardEntry[]> {
    const { data } = await getApiClient().get('/api/leaderboard/friends', {
      params: { friend_ids: friendIds.join(',') },
    });
    return data.data;
  },

  async getRank() {
    const { data } = await getApiClient().get('/api/leaderboard/rank');
    return data.data;
  },
};

export async function streamCoachMessage(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const { getAccessToken } = await import('./api');
  const token = await getAccessToken();

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/coach/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('Coach request failed');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6)) as { chunk?: string; done?: boolean; error?: string };
          if (parsed.chunk) onChunk(parsed.chunk);
          if (parsed.error) throw new Error(parsed.error);
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }
}

export const coachService = {
  async getHistory(): Promise<CoachMessage[]> {
    const { data } = await getApiClient().get('/api/coach/history');
    return data.data;
  },

  streamMessage: streamCoachMessage,
};
