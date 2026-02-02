
import { AppSettings } from '../../types';

const STORAGE_KEY = 'cloudtrack_settings';

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

export const getSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to parse settings', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
