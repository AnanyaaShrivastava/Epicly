import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { API_URL } from '../constants/theme';

const TOKEN_KEY = 'epicly_access_token';
const REFRESH_KEY = 'epicly_refresh_token';

// Web-safe storage: localStorage on web, expo-secure-store on native
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.deleteItemAsync(key);
  },
};

let apiClient: AxiosInstance | null = null;

export async function getAccessToken(): Promise<string | null> {
  return storage.get(TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await storage.set(TOKEN_KEY, accessToken);
  await storage.set(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await storage.delete(TOKEN_KEY);
  await storage.delete(REFRESH_KEY);
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    apiClient.interceptors.request.use(async (config) => {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ error: string; code: string }>) => {
        if (error.response?.status === 401) {
          const refreshToken = await storage.get(REFRESH_KEY);
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
                refresh_token: refreshToken,
              });
              await setTokens(data.data.access_token, data.data.refresh_token);
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${data.data.access_token}`;
                return axios(error.config);
              }
            } catch {
              await clearTokens();
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  return apiClient;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
