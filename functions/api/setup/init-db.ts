import { Env, jsonResponse, errorResponse, checkAuth } from '../../utils/storage';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const db = env.DB;

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        ip TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at INTEGER,
        blocked_until INTEGER
      )
    `).run();

    try {
      await db.prepare('ALTER TABLE auth_logs ADD COLUMN otp_code TEXT').run();
    } catch {}

    try {
      await db.prepare('ALTER TABLE auth_logs ADD COLUMN otp_expires_at INTEGER').run();
    } catch {}

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        expiry_date TEXT,
        start_date TEXT,
        cost REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT '$',
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        auto_renew INTEGER NOT NULL DEFAULT 0,
        billing_cycle TEXT,
        notes TEXT,
        notification_settings TEXT,
        tags TEXT,
        created_at INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS resource_renewal_logs (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        previous_expiry_date TEXT,
        next_expiry_date TEXT NOT NULL,
        billing_cycle TEXT,
        previous_status TEXT,
        next_status TEXT NOT NULL DEFAULT 'Active',
        note TEXT,
        created_at INTEGER
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        reminder_days INTEGER NOT NULL DEFAULT 7,
        telegram TEXT NOT NULL,
        email TEXT NOT NULL,
        webhook TEXT NOT NULL,
        updated_at INTEGER
      )
    `).run();

    return jsonResponse({ success: true, message: 'Database initialization completed.' });
  } catch (e) {
    return errorResponse(`Initialization failed: ${String(e)}`, 500);
  }
};
