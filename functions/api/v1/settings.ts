
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

  // Drizzle automatically parses the JSON text columns back to objects because of { mode: 'json' } in schema
  return jsonResponse({
    reminderDays: result.reminderDays,
    telegram: result.telegram,
    email: result.email,
    webhook: result.webhook
  });
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
    const current = currentDb ? {
      reminderDays: currentDb.reminderDays,
      telegram: currentDb.telegram,
      email: currentDb.email,
      webhook: currentDb.webhook
    } : DEFAULT_SETTINGS;
    
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
