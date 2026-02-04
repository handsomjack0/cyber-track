
import { Env, jsonResponse, errorResponse } from '../../utils/storage';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;
  
  // 1. 验证 API Secret，防止恶意操作
  let body: { secret?: string } = {};
  try {
    body = await request.json() as any;
  } catch (e) {}

  if (!env.API_SECRET || body.secret !== env.API_SECRET) {
    return errorResponse('Invalid Secret', 401);
  }

  try {
    const db = env.DB;

    // 2. 确保 auth_logs 表存在 (如果第一次部署)
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        ip TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at INTEGER,
        blocked_until INTEGER
      )
    `).run();

    // 3. 尝试添加 2FA 所需字段 (如果已存在则忽略错误)
    try {
      await db.prepare("ALTER TABLE auth_logs ADD COLUMN otp_code TEXT").run();
    } catch (e) {
      // 忽略 "column already exists" 错误
    }

    try {
      await db.prepare("ALTER TABLE auth_logs ADD COLUMN otp_expires_at INTEGER").run();
    } catch (e) {
      // 忽略 "column already exists" 错误
    }

    // 4. 确保其他核心表存在 (防止全新部署时的错误)
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
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        reminder_days INTEGER NOT NULL DEFAULT 7,
        telegram TEXT NOT NULL,
        email TEXT NOT NULL,
        webhook TEXT NOT NULL,
        updated_at INTEGER
      )
    `).run();

    return jsonResponse({ success: true, message: "数据库结构已自动修复/初始化完成！" });
  } catch (e) {
    return errorResponse(`初始化失败: ${e}`, 500);
  }
};
