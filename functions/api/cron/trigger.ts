import { Env, getDb, getSettings, jsonResponse, errorResponse, checkAuth } from '../../utils/storage';
import { resources } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendResourceNotification } from '../../services/notifications/sender';

const PRE_EXPIRY_DEFAULTS = [3, 1, 0];
const OVERDUE_DEFAULTS = [-1, -3, -7];

function buildReminderSchedule(reminderDays: number) {
  return new Set<number>([reminderDays, ...PRE_EXPIRY_DEFAULTS, ...OVERDUE_DEFAULTS]);
}

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;

  if (!checkAuth(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const db = getDb(env);
    const allResources = await db.select().from(resources).all();
    const settings = await getSettings(env);

    const results = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const res of allResources) {
      if (!res.expiryDate) continue;

      const targetDate = new Date(res.expiryDate);
      const today = new Date();
      targetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const resSettings = res.notificationSettings;
      const threshold = (resSettings?.useGlobal !== false && settings.reminderDays)
        ? settings.reminderDays
        : (resSettings?.reminderDays || 7);
      const reminderSchedule = buildReminderSchedule(threshold);
      const alreadyNotifiedToday = resSettings?.lastNotified === todayStr;

      if (!reminderSchedule.has(days) || alreadyNotifiedToday) {
        continue;
      }

      const result = await sendResourceNotification(env, res as any, settings, days);

      if (result.success) {
        const newSettings = {
          ...(resSettings || { enabled: true, useGlobal: true }),
          lastNotified: todayStr
        };

        await db.update(resources)
          .set({ notificationSettings: newSettings })
          .where(eq(resources.id, res.id))
          .execute();

        results.push({ id: res.id, name: res.name, days, channels: result.channels });
      }
    }

    return jsonResponse({
      success: true,
      processed: allResources.length,
      notifications_sent: results.length,
      details: results
    });
  } catch (e) {
    console.error(e);
    return errorResponse(`Cron job failed: ${String(e)}`, 500);
  }
};
