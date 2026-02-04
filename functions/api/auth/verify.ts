
import { Env, jsonResponse, errorResponse, getSettings, getDb } from '../../utils/storage';
import { checkRateLimit, registerAttempt } from '../../services/auth/rateLimiter';
import { sendMessage } from '../../services/telegram/client';
import { authLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // 1. Rate Limiting (防暴力破解检查)
  try {
    const status = await checkRateLimit(env, ip);
    if (status.blocked) {
      return errorResponse(status.message || 'Access Denied', 429);
    }
  } catch (e) {
    return errorResponse('Security Service Error', 500);
  }

  // 2. Parse Request
  const apiKey = request.headers.get('x-api-key');
  const secret = env.API_SECRET;
  
  // 人为延迟 (防止计时攻击)
  await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 800) + 200));

  // 3. Validate Basic Secret (基础密码检查)
  if (!secret || apiKey !== secret) {
    await registerAttempt(env, ip, false);
    return errorResponse('Invalid Access Code', 401);
  }

  // 4. Handle 2FA Logic (双重验证逻辑)
  let body: { otp?: string } = {};
  try {
    body = await request.json() as any;
  } catch (e) {} // Body might be empty

  const db = getDb(env);
  const settings = await getSettings(env);
  
  // 只有当 Telegram 启用、配置了 ChatID 且后端有 Token 时才启用 2FA
  const is2FaEnabled = settings.telegram.enabled && settings.telegram.chatId && env.TELEGRAM_BOT_TOKEN;

  if (is2FaEnabled) {
    // 情况 A: 用户提交了验证码
    if (body.otp) {
      const log = await db.select().from(authLogs).where(eq(authLogs.ip, ip)).get();
      
      const now = new Date();
      // 验证 OTP 是否匹配且未过期
      if (log && log.otpCode === body.otp && log.otpExpiresAt && new Date(log.otpExpiresAt) > now) {
        // 成功: 清除 OTP 并重置尝试次数
        await db.update(authLogs).set({ otpCode: null, otpExpiresAt: null, attempts: 0 }).where(eq(authLogs.ip, ip)).execute();
        return jsonResponse({ success: true, message: 'Authorized' });
      } else {
        // 失败: 记录失败尝试
        await registerAttempt(env, ip, false);
        return errorResponse('验证码无效或已过期', 401);
      }
    } 
    
    // 情况 B: 用户仅提交了密码，还没有 OTP -> 生成并发送 OTP
    else {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

      // 更新数据库
      await db.insert(authLogs)
        .values({ ip, attempts: 0, otpCode: otp, otpExpiresAt: expiresAt })
        .onConflictDoUpdate({
          target: authLogs.ip,
          set: { otpCode: otp, otpExpiresAt: expiresAt }
        })
        .execute();

      // 发送到 Telegram
      try {
        await sendMessage(env.TELEGRAM_BOT_TOKEN!, {
          chat_id: settings.telegram.chatId,
          text: `🔐 <b>登录验证码</b>\n\n您的验证码是: <code>${otp}</code>\n有效期 5 分钟。如果这不是您本人的操作，请立即检查后台安全。`,
          parse_mode: 'HTML'
        });
        
        // 返回 202 状态码，告诉前端需要输入验证码
        return jsonResponse({ success: false, require2fa: true, message: 'OTP Sent' }, 202);
      } catch (e) {
        console.error('Failed to send OTP', e);
        return errorResponse('无法发送验证码，请检查 Telegram Bot 配置。', 500);
      }
    }
  }

  // 如果未开启 2FA，密码正确直接通过
  await registerAttempt(env, ip, true);
  return jsonResponse({ success: true, message: 'Authorized' });
};
