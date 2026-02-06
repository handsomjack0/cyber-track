
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
  TELEGRAM_AI_PROVIDER?: 'openai' | 'deepseek' | 'openrouter' | 'github' | 'custom' | 'gemini';
  TELEGRAM_AI_MODEL?: string;
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

  if ((accessMode === 'cloudflare' || accessMode === 'hybrid') && accessEmail) {
    return true;
  }

  if (accessMode === 'cloudflare') return false;

  const apiKey = request.headers.get('x-api-key');
  if (!env.API_SECRET) return true;
  return apiKey === env.API_SECRET;
}

export async function getSettings(env: Env): Promise<AppSettings> {
  const db = getDb(env);
  const result = await db.select().from(schema.settings).where(eq(schema.settings.id, 'global')).get();
  
  if (result) {
    return {
      reminderDays: result.reminderDays,
      telegram: result.telegram,
      email: result.email,
      webhook: result.webhook
    };
  }
  
  return {
    reminderDays: 7,
    telegram: { enabled: false, chatId: '' },
    email: { enabled: false, email: '' },
    webhook: { enabled: false, url: '' }
  };
}

export async function getResources(env: Env): Promise<Resource[]> {
  const db = getDb(env);
  const result = await db.select().from(schema.resources).all();
  return result as unknown as Resource[];
}
