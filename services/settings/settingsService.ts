
import { AppSettings } from '../../types';
import { API_CLIENT_SECRET } from '../../utils/constants';

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

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_CLIENT_SECRET
};

export const getSettings = async (): Promise<AppSettings> => {
  // 1. Try to get Local Storage first (for backup)
  const stored = localStorage.getItem('cloudtrack_settings');
  const localData = stored ? JSON.parse(stored) : null;

  try {
    const res = await fetch('/api/v1/settings', { headers });
    if (!res.ok) throw new Error('Failed to fetch settings');
    
    const apiData = await res.json();
    
    // INTELLIGENT MERGE STRATEGY:
    // If API returns "default-like" data (e.g. disabled and empty ID),
    // but LocalStorage has "configured" data, assume Backend failed to persist
    // or is in ephemeral mode, so we TRUST LOCAL STORAGE to prevent UX reset.
    const isApiDefault = !apiData.telegram.enabled && !apiData.telegram.chatId;
    const hasLocalConfig = localData && (localData.telegram.enabled || localData.telegram.chatId);

    if (isApiDefault && hasLocalConfig) {
      console.warn('API returned defaults but local config exists. Using local config.');
      // Optionally: Try to re-sync to backend here if needed
      saveSettings(localData).catch(console.error); 
      return localData;
    }

    // Otherwise, trust the API as the source of truth
    // Update local storage to match API
    localStorage.setItem('cloudtrack_settings', JSON.stringify(apiData));
    return apiData;

  } catch (error) {
    console.error('Settings fetch error:', error);
    // Fallback to local storage if API fails (offline mode support)
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
      headers,
      body: JSON.stringify(settings)
    });
    
    if (!res.ok) {
       const errData = await res.json();
       throw new Error(errData.description || 'Save failed on server');
    }
  } catch (error) {
    console.error('Settings save error:', error);
    throw error; // Propagate error so UI can show alert
  }
};
