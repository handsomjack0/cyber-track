import { Env, getResources, getSettings, getDb } from './utils/storage';
import { sendResourceNotification } from './services/notifications/sender';
import { resources as resourcesTable } from './db/schema';
import { eq } from 'drizzle-orm';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateOnly(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function diffDays(from: Date, to: Date) {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.floor((end - start) / MS_PER_DAY);
}

export const onScheduled: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const db = getDb(env);

  const [settings, resources] = await Promise.all([
    getSettings(env),
    getResources(env)
  ]);

  const today = new Date();
  const todayKey = formatDateOnly(today);

  for (const resource of resources) {
    const expiry = toDateOnly(resource.expiryDate);
    if (!expiry) continue;

    const daysRemaining = diffDays(today, expiry);

    const resSettings = resource.notificationSettings;
    const isGlobal = resSettings?.useGlobal ?? true;
    const reminderDays = isGlobal
      ? settings.reminderDays
      : (resSettings?.reminderDays ?? settings.reminderDays);

    if (resSettings && resSettings.enabled === false) continue;
    if (daysRemaining > reminderDays) continue;

    const lastNotified = resSettings?.lastNotified;
    if (lastNotified === todayKey) continue;

    const result = await sendResourceNotification(env, resource, daysRemaining, settings);
    if (!result.success) continue;

    const updatedSettings = {
      ...(resSettings || {
        enabled: true,
        useGlobal: true,
        channels: { telegram: true, email: false, webhook: false }
      }),
      lastNotified: todayKey
    };

    await db
      .update(resourcesTable)
      .set({ notificationSettings: updatedSettings })
      .where(eq(resourcesTable.id, resource.id));
  }
};
