
import { Env, getDb, jsonResponse, errorResponse, checkAuth, AppSettings } from '../../utils/storage';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';

const GLOBAL_ID = 'global';

const DEFAULT_SETTINGS: AppSettings = {
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

const normalizeFromDb = (row: any): AppSettings => ({
  reminderDays:
    typeof row?.reminderDays === 'number' && Number.isFinite(row.reminderDays)
      ? row.reminderDays
      : DEFAULT_SETTINGS.reminderDays,
  telegram: parseJsonField(row?.telegram, DEFAULT_SETTINGS.telegram),
  email: parseJsonField(row?.email, DEFAULT_SETTINGS.email),
  webhook: parseJsonField(row?.webhook, DEFAULT_SETTINGS.webhook)
});

export const onRequestGet = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }
  
  const db = getDb(context.env);
  const result = await db.select().from(settings).where(eq(settings.id, GLOBAL_ID)).get();

  // If no settings exist in DB, return defaults
  if (!result) {
    return jsonResponse(DEFAULT_SETTINGS);
  }

  return jsonResponse(normalizeFromDb(result));
};

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as Partial<AppSettings>;
    const db = getDb(context.env);

    // Get current to merge, or use default
    const currentDb = await db.select().from(settings).where(eq(settings.id, GLOBAL_ID)).get();
    const current = currentDb ? normalizeFromDb(currentDb) : DEFAULT_SETTINGS;
    
    const newSettings = {
      id: GLOBAL_ID,
      reminderDays: body.reminderDays ?? current.reminderDays,
      telegram: { ...current.telegram, ...(body.telegram || {}) },
      email: { ...current.email, ...(body.email || {}) },
      webhook: { ...current.webhook, ...(body.webhook || {}) },
      updatedAt: new Date()
    };

    // Upsert (Insert or Update if exists)
    await db.insert(settings)
      .values(newSettings)
      .onConflictDoUpdate({
        target: settings.id,
        set: newSettings
      })
      .execute();

    return jsonResponse({ success: true, data: newSettings });
  } catch (e) {
    console.error(e);
    return errorResponse(`Failed to save settings: ${String(e)}`);
  }
};
