import { Env, getDb, getSettings, jsonResponse, errorResponse, checkAuth } from '../../utils/storage';
import { resources } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendResourceNotification } from '../../services/notifications/sender';

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  const { request, env } = context;

  // Security Check
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

      // Calculate days
      const targetDate = new Date(res.expiryDate);
      const today = new Date();
      targetDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = targetDate.getTime() - today.getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Notification Logic
      const resSettings = res.notificationSettings;
      
      // Determine threshold days
      const threshold = (resSettings?.useGlobal !== false && settings.reminderDays) 
        ? settings.reminderDays 
        : (resSettings?.reminderDays || 7);

      // Trigger conditions:
      // 1. Exact match on threshold day (e.g. 7 days left)
      // 2. Critical days: 3, 1, 0
      // 3. Overdue: -1 (Just once)
      const shouldNotify = (days === threshold) || (days === 3) || (days === 1) || (days === 0) || (days === -1);
      
      // Check if already notified today to prevent spam
      // (Simple check: if lastNotified === todayStr)
      const alreadyNotifiedToday = resSettings?.lastNotified === todayStr;

      if (shouldNotify && !alreadyNotifiedToday) {
        // Send Notification
        const result = await sendResourceNotification(env, res as any, days, settings);
        
        if (result.success) {
           // Update lastNotified in DB
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
