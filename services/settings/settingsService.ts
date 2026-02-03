
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
  try {
    const res = await fetch('/api/v1/settings', { headers });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error('Settings fetch error:', error);
    // Fallback to local storage if API fails (offline mode support)
    const stored = localStorage.getItem('cloudtrack_settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  // Optimistic update for local fallback
  localStorage.setItem('cloudtrack_settings', JSON.stringify(settings));

  try {
    await fetch('/api/v1/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify(settings)
    });
  } catch (error) {
    console.error('Settings save error:', error);
  }
};
