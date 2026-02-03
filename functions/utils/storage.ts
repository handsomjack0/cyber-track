
// Define minimal KVNamespace interface to avoid type errors when global types are missing
export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream'; cacheTtl?: number }): Promise<string | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: { expiration?: number; expirationTtl?: number; metadata?: any }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  CLOUDTRACK_KV: KVNamespace;
  API_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  API_KEY?: string;
}

export interface ResourceNotificationSettings {
  enabled: boolean;
  useGlobal: boolean;
  reminderDays?: number;
  channels?: {
    telegram: boolean;
    email: boolean;
    webhook: boolean;
  };
}

export type ResourceType = 'VPS' | 'DOMAIN' | 'PHONE_NUMBER' | 'ACCOUNT';

export interface Resource {
  id: string;
  name: string;
  provider: string;
  expiryDate?: string;
  cost: number;
  currency: string;
  type: ResourceType;
  status: string;
  autoRenew: boolean;
  startDate?: string;
  billingCycle?: 'Monthly' | 'Yearly' | 'OneTime' | 'Quarterly';
  notes?: string;
  notificationSettings?: ResourceNotificationSettings;
}

export interface AppSettings {
  reminderDays: number;
  telegram: {
    enabled: boolean;
    chatId: string;
  };
  email: {
    enabled: boolean;
    email: string;
  };
  webhook: {
    enabled: boolean;
    url: string;
  };
}

const DB_KEY = 'resources_data';
const SETTINGS_KEY = 'app_settings';

// Empty initial data
const INITIAL_DATA: Resource[] = [];
const DEFAULT_SETTINGS: AppSettings = {
  reminderDays: 7,
  telegram: { enabled: false, chatId: '' },
  email: { enabled: false, email: '' },
  webhook: { enabled: false, url: '' }
};

export async function getResources(env: Env): Promise<Resource[]> {
  if (!env.CLOUDTRACK_KV) return INITIAL_DATA;
  const data = await env.CLOUDTRACK_KV.get(DB_KEY);
  if (!data) return INITIAL_DATA;
  return JSON.parse(data);
}

export async function saveResources(env: Env, resources: Resource[]): Promise<void> {
  if (!env.CLOUDTRACK_KV) return;
  await env.CLOUDTRACK_KV.put(DB_KEY, JSON.stringify(resources));
}

export async function getSettings(env: Env): Promise<AppSettings> {
  if (!env.CLOUDTRACK_KV) return DEFAULT_SETTINGS;
  const data = await env.CLOUDTRACK_KV.get(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  // Merge with default to ensure new fields exist
  return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
}

export async function saveSettings(env: Env, settings: AppSettings): Promise<void> {
  if (!env.CLOUDTRACK_KV) return;
  await env.CLOUDTRACK_KV.put(SETTINGS_KEY, JSON.stringify(settings));
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message, success: false }, status);
}

export function checkAuth(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('x-api-key');
  if (!env.API_SECRET) return true; 
  return apiKey === env.API_SECRET;
}
