
import { AppSettings } from '../../types';
import { requestJson } from '../../utils/apiClient';

// Fallback default in case API fails or loading
const DEFAULT_SETTINGS: AppSettings = {
  reminderDays: 7,
  telegram: {
    enabled: false,
    chatId: '',
  },
  email: {
    enabled: false,
    email: '',
  },
  webhook: {
    enabled: false,
    url: '',
  },
};

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const readLocalSettings = (): AppSettings | null => {
  const stored = localStorage.getItem('cloudtrack_settings');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AppSettings;
  } catch {
    localStorage.removeItem('cloudtrack_settings');
    return null;
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  // 1. Try to get Local Storage first (for backup)
  const localData = readLocalSettings();

  try {
    const res = await requestJson<AppSettings>('/api/v1/settings', {
      headers: getHeaders(),
      throwOnError: false,
      timeoutMs: 10000
    });

    if (res.status === 401) {
       // Silent fail on auth for settings, maybe just return default
       console.warn('Unauthorized fetch settings');
       return localData || DEFAULT_SETTINGS;
    }

    if (!res.ok || !res.data) throw new Error('Failed to fetch settings');
    
    const apiData = res.data;
    
    // INTELLIGENT MERGE STRATEGY
    const isApiDefault = !apiData.telegram.enabled && !apiData.telegram.chatId;
    const hasLocalConfig = localData && (localData.telegram.enabled || localData.telegram.chatId);

    if (isApiDefault && hasLocalConfig) {
      console.warn('API returned defaults but local config exists. Using local config.');
      saveSettings(localData).catch(console.error); 
      return localData;
    }

    localStorage.setItem('cloudtrack_settings', JSON.stringify(apiData));
    return apiData;

  } catch (error) {
    console.error('Settings fetch error:', error);
    return localData || DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  // 1. Optimistic update for local fallback
  localStorage.setItem('cloudtrack_settings', JSON.stringify(settings));

  // 2. Send to Backend
  try {
    const res = await requestJson<{ error?: string }>('/api/v1/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings),
      throwOnError: false,
      timeoutMs: 10000
    });
    
    if (!res.ok) {
       throw new Error(res.data?.error || 'Save failed on server');
    }
  } catch (error) {
    console.error('Settings save error:', error);
    throw error; 
  }
};
