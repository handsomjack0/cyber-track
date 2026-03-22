import { eq } from 'drizzle-orm';
import { resourceRenewalLogs, resources } from '../../../../db/schema';
import { sendResourceChangeNotification } from '../../../../services/notifications/sender';
import { checkAuth, Env, errorResponse, getDb, getSettings, jsonResponse } from '../../../../utils/storage';

const toDateOnly = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addBillingCycle = (baseDate: Date, billingCycle?: string | null) => {
  const next = new Date(baseDate);
  switch (billingCycle) {
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      return next;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return null;
  }
};

const clearLastNotified = (notificationSettings: any) => {
  if (!notificationSettings) return notificationSettings;
  const next = { ...notificationSettings };
  delete next.lastNotified;
  return next;
};

export const onRequestPost = async (context: {
  env: Env;
  request: Request;
  params: { id: string };
}) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  const id = context.params.id;
  const db = getDb(context.env);

  try {
    const existing = await db.select().from(resources).where(eq(resources.id, id)).get();
    if (!existing) {
      return errorResponse('Resource not found', 404);
    }

    if (!existing.expiryDate) {
      return errorResponse('Resource has no expiry date and cannot be renewed automatically.', 400);
    }

    if (!existing.billingCycle || existing.billingCycle === 'OneTime') {
      return errorResponse('One-time or missing billing cycle resources cannot be renewed automatically.', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentExpiry = toDateOnly(existing.expiryDate);
    if (!currentExpiry) {
      return errorResponse('Invalid expiry date on resource.', 400);
    }

    const baseDate = currentExpiry >= today ? currentExpiry : today;
    const nextExpiry = addBillingCycle(baseDate, existing.billingCycle);
    if (!nextExpiry) {
      return errorResponse('Unsupported billing cycle for renewal.', 400);
    }

    const nextExpiryDate = formatDateOnly(nextExpiry);
    const nextNotificationSettings = clearLastNotified(existing.notificationSettings);

    const updated = await db
      .update(resources)
      .set({
        expiryDate: nextExpiryDate,
        status: 'Active',
        notificationSettings: nextNotificationSettings
      })
      .where(eq(resources.id, id))
      .returning()
      .get();

    if (!updated) {
      return errorResponse('Renewal failed', 500);
    }

    await db.insert(resourceRenewalLogs).values({
      id: crypto.randomUUID(),
      resourceId: existing.id,
      previousExpiryDate: existing.expiryDate,
      nextExpiryDate,
      billingCycle: existing.billingCycle,
      previousStatus: existing.status,
      nextStatus: 'Active',
      note: existing.autoRenew ? 'Renewed for an auto-renew resource.' : 'Renewed manually from the dashboard.'
    }).execute();

    try {
      const settings = await getSettings(context.env);
      await sendResourceChangeNotification(context.env, 'updated', updated as any, settings, [
        `Renewal: ${existing.expiryDate} -> ${nextExpiryDate}`,
        existing.status !== 'Active' ? `Status: ${existing.status} -> Active` : 'Status: kept as Active',
        'Reminder state reset'
      ]);
    } catch (notifyError) {
      console.error('Renew notify failed:', notifyError);
    }

    return jsonResponse({
      success: true,
      data: updated,
      meta: {
        previousExpiryDate: existing.expiryDate,
        nextExpiryDate
      }
    });
  } catch (error) {
    return errorResponse(`Renewal failed: ${String(error)}`, 500);
  }
};
