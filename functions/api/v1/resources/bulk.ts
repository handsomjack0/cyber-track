
import { Env, getDb, jsonResponse, errorResponse, checkAuth, Resource, getSettings } from '../../../utils/storage';
import { resources } from '../../../db/schema';
import { sql } from 'drizzle-orm';
import { sendResourceChangeNotification } from '../../../services/notifications/sender';

const normalizeCost = (input: unknown): number => {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  const rounded = Math.round(parsed * 100) / 100;
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

export const onRequestPost = async (context: { env: Env, request: Request }) => {
  if (!checkAuth(context.request, context.env)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await context.request.json() as { resources: any[], mode: 'overwrite' | 'merge' };
    const { resources: importList, mode } = body;

    if (!Array.isArray(importList)) {
      return errorResponse('Invalid data format: resources must be an array');
    }

    const db = getDb(context.env);

    const allowedTypes = new Set(['VPS', 'DOMAIN', 'PHONE_NUMBER', 'ACCOUNT']);
    const isValidDate = (value: any) => {
      if (!value) return true;
      if (typeof value !== 'string') return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    };

    // Sanitize and map data to schema structure
    const validResources = importList
      .filter(r => r && r.name && r.type && allowedTypes.has(String(r.type)) && isValidDate(r.expiryDate) && isValidDate(r.startDate))
      .map(r => ({
        id: r.id || '',
        name: String(r.name),
        provider: r.provider ? String(r.provider) : 'Unknown',
        expiryDate: r.expiryDate || null,
        startDate: r.startDate || null,
        cost: normalizeCost(r.cost),
        currency: r.currency ? String(r.currency) : '$',
        type: String(r.type),
        billingCycle: r.billingCycle || null,
        status: r.status || 'Active',
        autoRenew: !!r.autoRenew,
        notes: r.notes || null,
        notificationSettings: r.notificationSettings || null,
        tags: Array.isArray(r.tags) ? r.tags : []
      }));

    if (validResources.length === 0) {
      return jsonResponse({ success: true, count: 0, message: "No valid resources to import" });
    }

    // For 'overwrite', delete all first
    if (mode === 'overwrite') {
      await db.delete(resources).execute();
    }

    // For 'merge', try to match by name+type+provider when id is missing
    if (mode === 'merge') {
      const existing = await db.select().from(resources).all();
      const keyOf = (r: any) => `${r.name}||${r.type}||${r.provider}`;
      const map = new Map<string, string>();
      existing.forEach(r => map.set(keyOf(r), r.id));
      for (const res of validResources) {
        if (!res.id) {
          const key = keyOf(res);
          const found = map.get(key);
          if (found) {
            res.id = found;
          } else {
            res.id = crypto.randomUUID();
          }
        }
      }
    }

    if (mode === 'overwrite') {
      validResources.forEach(r => {
        if (!r.id) r.id = crypto.randomUUID();
      });
    }

    // D1 batch insert
    await db.insert(resources).values(validResources).onConflictDoUpdate({
      target: resources.id,
      set: {
        name: sql`excluded.name`,
        provider: sql`excluded.provider`,
        expiryDate: sql`excluded.expiry_date`,
        startDate: sql`excluded.start_date`,
        cost: sql`excluded.cost`,
        currency: sql`excluded.currency`,
        type: sql`excluded.type`,
        status: sql`excluded.status`,
        autoRenew: sql`excluded.auto_renew`,
        billingCycle: sql`excluded.billing_cycle`,
        notes: sql`excluded.notes`,
        notificationSettings: sql`excluded.notification_settings`,
        tags: sql`excluded.tags`
      }
    }).execute();

    try {
      const settings = await getSettings(context.env);
      const sample = validResources.slice(0, 3).map(r => `${r.name} (${r.type})`);
      const summary = `批量导入完成：${validResources.length} 条${mode === 'overwrite' ? '（覆盖模式）' : ''}`;
      const summaryResource = {
        id: 'bulk-import',
        name: '批量导入',
        provider: 'system',
        expiryDate: null,
        startDate: null,
        cost: 0,
        currency: '',
        type: 'SYSTEM',
        status: 'Active',
        autoRenew: false,
        notes: null,
        notificationSettings: { enabled: true, useGlobal: true }
      } as any;

      await sendResourceChangeNotification(
        context.env,
        'updated',
        summaryResource,
        settings,
        [
          summary,
          sample.length ? `示例: ${sample.join(', ')}` : '示例: -'
        ]
      );
    } catch (notifyError) {
      console.error('Bulk import summary notify failed:', notifyError);
    }

    return jsonResponse({ 
      success: true, 
      count: validResources.length, 
      message: `Successfully imported ${validResources.length} resources.` 
    });
  } catch (e) {
    console.error(e);
    return errorResponse(`Server Error during bulk import: ${String(e)}`, 500);
  }
};
