
import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

// Minimal KV interface for legacy support
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete?(key: string): Promise<void>;
}

export interface Env {
  DB: D1Database; 
  CLOUDTRACK_KV?: KVNamespace; 
  API_SECRET: string;
  TELEGRAM_BOT_TOKEN?: string;
  API_KEY?: string; // Gemini API Key
  OPENAI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_APP_TITLE?: string;
  GITHUB_TOKEN?: string;
  GITHUB_MODELS_URL?: string; // Full URL to GitHub Models chat completions endpoint
  CUSTOM_AI_BASE_URL?: string; // Base URL for self-hosted OpenAI-compatible API
  CUSTOM_AI_API_KEY?: string;
  CUSTOM_AI_ENDPOINT?: string; // Full endpoint override (chat/completions or completions)
  CUSTOM_AI_ENDPOINTS?: string; // Multi-endpoint list: id|url|key|defaultModel (one per line)
  AI_DEFAULT_PROVIDER?: 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
  AI_DEFAULT_MODEL?: string;
  AI_OPENAI_MODEL?: string;
  AI_DEEPSEEK_MODEL?: string;
  AI_OPENROUTER_MODEL?: string;
  AI_GITHUB_MODEL?: string;
  AI_CUSTOM_MODEL?: string;
  AI_GEMINI_MODEL?: string;
  AI_TIMEOUT_MS?: string;
  AI_RETRIES?: string;
  AI_RETRY_DELAY_MS?: string;
  AI_MAX_TOKENS?: string;
  AI_TEMPERATURE?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  ACCESS_MODE?: 'access-code' | 'cloudflare' | 'hybrid';
  PUBLIC_SITE_URL?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
}

export type ResourceType = 'VPS' | 'DOMAIN' | 'PHONE_NUMBER' | 'ACCOUNT';

export interface ResourceNotificationSettings {
  enabled: boolean;
  useGlobal: boolean;
  reminderDays?: number;
  lastNotified?: string; // ISO Date String YYYY-MM-DD
  channels?: {
    telegram: boolean;
    email: boolean;
    webhook: boolean;
  };
}

export interface Resource {
  id: string;
  name: string;
  provider: string;
  expiryDate?: string | null;
  startDate?: string | null;
  cost: number;
  currency: string;
  type: string; 
  status: string;
  autoRenew: boolean;
  billingCycle?: string | null;
  notes?: string | null;
  notificationSettings?: ResourceNotificationSettings | null;
  tags?: string[] | null;
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

const DEFAULT_APP_SETTINGS: AppSettings = {
  reminderDays: 7,
  telegram: { enabled: false, chatId: '' },
  email: { enabled: false, email: '' },
  webhook: { enabled: false, url: '' }
};

const parseJsonField = <T>(value: unknown, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as T;
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object') {
    return { ...fallback, ...(value as Partial<T>) };
  }
  return fallback;
};

const normalizeSettingsRow = (row: any): AppSettings => ({
  reminderDays:
    typeof row?.reminderDays === 'number' && Number.isFinite(row.reminderDays)
      ? row.reminderDays
      : DEFAULT_APP_SETTINGS.reminderDays,
  telegram: parseJsonField(row?.telegram, DEFAULT_APP_SETTINGS.telegram),
  email: parseJsonField(row?.email, DEFAULT_APP_SETTINGS.email),
  webhook: parseJsonField(row?.webhook, DEFAULT_APP_SETTINGS.webhook)
});

// Helper to initialize Drizzle
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
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
  const accessMode = env.ACCESS_MODE || 'access-code';
  const accessEmail =
    request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('CF-Access-Authenticated-User-Email');
  const hasCloudflareAccess = Boolean(accessEmail);
  const apiKey = request.headers.get('x-api-key');
  const hasApiSecret = Boolean(env.API_SECRET);
  const apiKeyMatched = hasApiSecret && apiKey === env.API_SECRET;

  if (accessMode === 'cloudflare') {
    return hasCloudflareAccess;
  }

  if (accessMode === 'hybrid') {
    return hasCloudflareAccess || apiKeyMatched;
  }

  // access-code mode
  return apiKeyMatched;
}

export async function getSettings(env: Env): Promise<AppSettings> {
  const db = getDb(env);
  const result = await db.select().from(schema.settings).where(eq(schema.settings.id, 'global')).get();
  
  if (result) {
    return normalizeSettingsRow(result);
  }
  
  return DEFAULT_APP_SETTINGS;
}

export async function getResources(env: Env): Promise<Resource[]> {
  const db = getDb(env);
  const result = await db.select().from(schema.resources).all();
  return result as unknown as Resource[];
}
