
import { AppSettings } from '../../types';

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

const getHeaders = () => {
  const token = localStorage.getItem('cloudtrack_access_token') || '';
  return {
    'Content-Type': 'application/json',
    'x-api-key': token
  };
};

export const getSettings = async (): Promise<AppSettings> => {
  // 1. Try to get Local Storage first (for backup)
  const stored = localStorage.getItem('cloudtrack_settings');
  const localData = stored ? JSON.parse(stored) : null;

  try {
    const res = await fetch('/api/v1/settings', { headers: getHeaders() });
    
    if (res.status === 401) {
       // Silent fail on auth for settings, maybe just return default
       console.warn('Unauthorized fetch settings');
       return localData || DEFAULT_SETTINGS;
    }

    if (!res.ok) throw new Error('Failed to fetch settings');
    
    const apiData = await res.json();
    
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
    const res = await fetch('/api/v1/settings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!res.ok) {
       const errData = await res.json();
       throw new Error(errData.description || 'Save failed on server');
    }
  } catch (error) {
    console.error('Settings save error:', error);
    throw error; 
  }
};
